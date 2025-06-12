import { getHomePage } from './templates/home.js';
const scriptModule = require('./public/script.js');
const DEFAULT_TIMEOUT = 15_000;
const logBuf = [];

function log(...args) {
  const line = args.map(String).join(' ');
  console.log(line);
  logBuf.push(line);
}

async function safeJson(res, label) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const txt = await res.text();
    throw new Error(`${label} returned non-JSON (${ct}): ${txt.slice(0,120)}…`);
  }
  return res.json();
}

function blocksToText(blocks) {
  if (!Array.isArray(blocks)) return '';

  const grab = o =>
    ['snippet', 'text', 'title', 'content'].find(k => typeof o[k] === 'string') &&
    o[['snippet', 'text', 'title', 'content'].find(k => typeof o[k] === 'string')];

  const out = [];

  for (const b of blocks) {
    if (b.type === 'paragraph') {
      const t = grab(b);
      if (t) out.push(t);
    } else if (b.type === 'list' && Array.isArray(b.list)) {
      b.list.forEach(it => {
        const t = grab(it);
        if (t) out.push(`• ${t}`);
      });
    } else if (b.type === 'table' && b.table?.rows) {
      b.table.rows.forEach(r => {
        const line = (r.cells || []).map(c => grab(c) || '').join(' | ').trim();
        if (line) out.push(line);
      });
    }
  }

  return out
    .map(t =>
      t
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
    )
    .join('\n')
    .trim();
}

async function fetchAiOverviewOnce(keyword, gl, env, run) {
  log(`🔍 Run ${run}: Fetching AI Overview for "${keyword}" (gl=${gl})`);
  try {
    const baseParams = new URLSearchParams({
      engine: 'google',
      q: keyword,
      api_key: env.SERPAPI_KEY,
      hl: 'en',
      gl,
      no_cache: 'true'
    });

    log(`🔗 Request URL: https://serpapi.com/search?${baseParams}`);

    const res = await fetch(`https://serpapi.com/search?${baseParams}`, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    });
    log(`✅ SerpAPI status ${res.status} (run ${run})`);
    if (!res.ok) throw new Error(`SerpAPI ${res.status}`);

    const data = await safeJson(res, 'SerpAPI');
    const aio = data.ai_overview;
    if (!aio) {
      log(`⚠️  Run ${run}: no ai_overview field`);
      return null;
    }

    if (Array.isArray(aio.text_blocks)) return blocksToText(aio.text_blocks);

    if (!aio.page_token) {
      log(`⚠️  Run ${run}: no page_token`);
      return null;
    }

    const streamParams = new URLSearchParams({
      engine: 'google_ai_overview',
      page_token: aio.page_token,
      api_key: env.SERPAPI_KEY,
      no_cache: 'true'
    });

    log(`🔗 Stream URL: https://serpapi.com/search?${streamParams}`);

    const streamRes = await fetch(`https://serpapi.com/search?${streamParams}`, {
      signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
    });
    log(`✅ Stream status ${streamRes.status} (run ${run})`);
    if (!streamRes.ok) throw new Error(`SerpAPI stream ${streamRes.status}`);

    const full = await safeJson(streamRes, 'SerpAPI-stream');
    const blocks =
      full.ai_overview && Array.isArray(full.ai_overview.text_blocks)
        ? full.ai_overview.text_blocks
        : [];
    return blocks.length ? blocksToText(blocks) : null;
  } catch (e) {
    log(`❌ Run ${run}: ${e.message}`);
    return null;
  }
}

const reduceSnapshots = arr =>
  arr.length
    ? arr.reduce((a, b) => (b.length > a.length ? b : a))
    : '';

const buildPrompt = txt =>
  `Rewrite the following Google AI Overview in a fresh, human voice. Keep all key facts, avoid plagiarism, limit to 1-3 short paragraphs.\n\nAI Overview:\n${txt}\n\nRewritten version:`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'GET') {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return new Response(getHomePage(), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      return fetch(url.toString(), request);
    }

    if (request.method === 'POST') {
      logBuf.length = 0;

      try {
        const body = await request.json();
        const keyword    = body.keyword?.trim();
        const iterations = Number(body.iterations) || 3;
        const gl         = (body.gl || 'us').toLowerCase();

        if (!keyword) return new Response('Missing "keyword"', { status: 400 });

        log(`🚀 Starting runs (${iterations}) for "${keyword}", gl=${gl}`);

        const snapshots = [];
        for (let i = 1; i <= iterations; i++) {
          const txt = await fetchAiOverviewOnce(keyword, gl, env, i);
          snapshots.push({ run: i, length: txt ? txt.length : 0, text: txt });
        }

        const consensus = reduceSnapshots(
          snapshots.map(s => s.text).filter(Boolean)
        );

        if (!consensus) {
          log('⚠️  No AI Overview in any snapshot.');
          return new Response(
            JSON.stringify(
              { keyword, snapshots, consensus: '', openai_rewrite: '', logs: logBuf },
              null,
              2
            ),
            { headers: { 'Content-Type': 'application/json' } }
          );
        }

        log('📌 Consensus obtained:', consensus.slice(0, 120), '…');

        const completion = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: buildPrompt(consensus) }],
            max_tokens: 1000,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(DEFAULT_TIMEOUT)
        });

        const compData = await safeJson(completion, 'OpenAI');
        const openai_rewrite = compData.choices?.[0]?.message?.content.trim() || '';
        log('✨ OpenAI rewrite received:', openai_rewrite.slice(0, 120), '…');

        return new Response(
          JSON.stringify(
            { keyword, snapshots, consensus, openai_rewrite, logs: logBuf },
            null,
            2
          ),
          { headers: { 'Content-Type': 'application/json' } }
        );
      } catch (err) {
        log('❌ Fatal:', err.message);
        return new Response(
          JSON.stringify({ error: err.message, logs: logBuf }, null, 2),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response('Method Not Allowed', { status: 405 });
  }
}
