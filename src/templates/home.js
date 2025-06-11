// src/templates/home.js
export function getHomePage() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Overview Multi-Tool</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 300;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        .form-container {
            padding: 40px;
        }
        .form-group {
            margin-bottom: 25px;
        }
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
        }
        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus {
            outline: none;
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        .form-row {
            display: flex;
            gap: 20px;
        }
        .form-row .form-group {
            flex: 1;
        }
        .submit-btn {
            background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 8px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            width: 100%;
        }
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(52, 152, 219, 0.3);
        }
        .submit-btn:active {
            transform: translateY(0);
        }
        .submit-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .loading {
            display: none;
            text-align: center;
            padding: 20px;
            background: #e3f2fd;
            border-radius: 8px;
            margin: 20px 0;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .results {
            display: none;
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .results h3 {
            color: #2c3e50;
            margin-bottom: 15px;
        }
        .result-content {
            background: #ffffff;
            padding: 15px;
            border-radius: 4px;
            border-left: 3px solid #3498db;
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.5;
        }
        @media (max-width: 600px) {
            .form-row {
                flex-direction: column;
                gap: 0;
            }
            .header h1 {
                font-size: 2em;
            }
            .form-container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI Overview Multi-Tool</h1>
            <p>Fetch, consolidate, and rewrite Google AI Overviews</p>
        </div>
        <div class="form-container">
            <form id="aiForm">
                <div class="form-group">
                    <label for="keyword">Keyword</label>
                    <input type="text" id="keyword" name="keyword" placeholder="Enter a keyword" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="iterations">Iterations</label>
                        <input type="number" id="iterations" name="iterations" value="3" min="1" max="10">
                    </div>
                    <div class="form-group">
                        <label for="gl">Location (e.g. us, uk, ca)</label>
                        <input type="text" id="gl" name="gl" value="us" maxlength="2">
                    </div>
                </div>
                <button type="submit" class="submit-btn" id="submitBtn">Run</button>
            </form>
            <div id="loading" class="loading">
                <div class="spinner"></div>
                <p>Processing...</p>
            </div>
            <div id="results" class="results">
                <h3>Consolidated AI Overview</h3>
                <div id="resultText" class="result-content"></div>
            </div>
        </div>
    </div>
<script>
    const loading = document.getElementById('loading');
    const resultText = document.getElementById('resultText');
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
                    const box = document.createElement('div');
                    box.className = 'result-content';
                    box.style.marginBottom = '10px';
                    box.innerHTML = '<strong>📍 Run ' + snap.run + ' Overview</strong><br><br>' + snap.text.replace(/\n/g, '<br>');


                    rawOverviewSection.appendChild(box);
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
</script>
</body>
</html>
    `.trim();
}
