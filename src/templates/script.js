
const loading = document.getElementById('loading');
const resultText = document.getElementById('resultText').textContent = data.openai_rewrite || 'No overview returned.';
const results = document.getElementById('results');
const submitBtn = document.getElementById('submitBtn');

const liveLog = document.createElement('pre');
liveLog.style.marginBottom = '10px';
liveLog.style.fontSize = '13px';
liveLog.style.background = '#f0f4f8';
liveLog.style.padding = '10px';
liveLog.style.borderRadius = '8px';
liveLog.style.whiteSpace = 'pre-wrap';
loading.insertBefore(liveLog, loading.querySelector('.spinner'));

const rawOverviewSection = document.createElement('div');
rawOverviewSection.style.marginBottom = '20px';
results.insertBefore(rawOverviewSection, resultText);

document.getElementById('aiForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const keyword = document.getElementById('keyword').value.trim();
    const iterations = parseInt(document.getElementById('iterations').value, 10) || 1;
    const gl = document.getElementById('gl').value.trim() || 'us';

    // Reset state
    loading.style.display = 'block';
    results.style.display = 'none';
    submitBtn.disabled = true;
    liveLog.textContent = '';
    rawOverviewSection.innerHTML = '';
    resultText.textContent = '';

    try {
        const resp = await fetch(window.location.href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, iterations, gl })
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Request failed');

        // Parse log stream into chunks by run
        const logs = data.logs || [];
        const grouped = [];
        let buffer = [];
        for (let line of logs) {
            if (line.includes('🔍 Run')) {
                if (buffer.length) grouped.push(buffer);
                buffer = [line];
            } else {
                buffer.push(line);
            }
        }
        if (buffer.length) grouped.push(buffer);

        // Show logs as they come in
        for (let group of grouped) {
            liveLog.textContent = group.join('\n');
            await new Promise(r => setTimeout(r, 300)); // ~real-time feel
        }

        // Show raw overviews (if any)
        for (let snap of data.snapshots || []) {
            if (snap.text?.trim()) {
                    const title = document.createElement('strong');
                    title.textContent = \`📍 Run \${snap.run} Overview\`;

                    const content = document.createElement('div');
                    content.innerHTML = snap.text.replace(/\\n/g, '<br>');

                    const box = document.createElement('div');
                    box.className = 'result-content';
                    box.style.marginBottom = '10px';
                    box.appendChild(title);
                    box.appendChild(document.createElement('br'));
                    box.appendChild(document.createElement('br'));
                    box.appendChild(content);                    rawOverviewSection.appendChild(box);
            }
        }

        resultText.textContent = data.openai_rewrite || 'No consolidated overview.';
        results.style.display = 'block';
    } catch (err) {
        alert('Error: ' + err.message);
    } finally {
        loading.style.display = 'none';
        submitBtn.disabled = false;
    }
});
