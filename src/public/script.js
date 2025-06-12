const loading = document.getElementById('loading');
const resultText = document.getElementById('resultText');
const results = document.getElementById('results');
const submitBtn = document.getElementById('submitBtn');

// Create a more robust logging container
const liveLogContainer = document.createElement('div');
liveLogContainer.style.marginBottom = '20px';
liveLogContainer.style.fontSize = '14px';
liveLogContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
liveLogContainer.style.background = '#f8fafc';
liveLogContainer.style.border = '1px solid #e2e8f0';
liveLogContainer.style.borderRadius = '12px';
liveLogContainer.style.padding = '16px';
liveLogContainer.style.maxHeight = '400px';
liveLogContainer.style.overflowY = 'auto';
liveLogContainer.style.lineHeight = '1.5';

const liveLogTitle = document.createElement('h3');
liveLogTitle.textContent = '📊 Processing Status';
liveLogTitle.style.margin = '0 0 12px 0';
liveLogTitle.style.fontSize = '16px';
liveLogTitle.style.fontWeight = '600';
liveLogTitle.style.color = '#1e293b';

const liveLogContent = document.createElement('div');
liveLogContent.style.wordWrap = 'break-word';
liveLogContent.style.overflowWrap = 'break-word';

liveLogContainer.appendChild(liveLogTitle);
liveLogContainer.appendChild(liveLogContent);
loading.insertBefore(liveLogContainer, loading.querySelector('.spinner'));

// Container for run summaries
const runSummaryContainer = document.createElement('div');
runSummaryContainer.style.marginBottom = '20px';
runSummaryContainer.style.display = 'none';

// Container for raw overviews
const rawOverviewSection = document.createElement('div');
rawOverviewSection.style.marginBottom = '20px';
results.insertBefore(runSummaryContainer, resultText);
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
    liveLogContent.innerHTML = '';
    rawOverviewSection.innerHTML = '';
    runSummaryContainer.innerHTML = '';
    runSummaryContainer.style.display = 'none';
    resultText.textContent = '';

    try {
        const resp = await fetch(window.location.href, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyword, iterations, gl })
        });
        
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || 'Request failed');

        // Parse and display logs progressively
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

        // Display logs progressively with stacking
        for (let i = 0; i < grouped.length; i++) {
            const group = grouped[i];
            const runDiv = document.createElement('div');
            runDiv.style.marginBottom = '8px';
            runDiv.style.padding = '8px';
            runDiv.style.background = i % 2 === 0 ? '#ffffff' : '#f1f5f9';
            runDiv.style.borderRadius = '6px';
            runDiv.style.border = '1px solid #e2e8f0';
            
            const runContent = group.join('\n');
            runDiv.innerHTML = runContent.replace(/\n/g, '<br>');
            
            liveLogContent.appendChild(runDiv);
            
            // Scroll to bottom of log container
            liveLogContainer.scrollTop = liveLogContainer.scrollHeight;
            
            await new Promise(r => setTimeout(r, 500)); // Slower reveal for better UX
        }

        // Create run summary section
        const summaryTitle = document.createElement('h3');
        summaryTitle.textContent = '🔍 Run Summary';
        summaryTitle.style.margin = '0 0 16px 0';
        summaryTitle.style.fontSize = '18px';
        summaryTitle.style.fontWeight = '600';
        summaryTitle.style.color = '#1e293b';
        runSummaryContainer.appendChild(summaryTitle);

        // Display run summaries with proper formatting
        for (let snap of data.snapshots || []) {
            const runCard = document.createElement('div');
            runCard.style.marginBottom = '12px';
            runCard.style.padding = '16px';
            runCard.style.border = '1px solid #e2e8f0';
            runCard.style.borderRadius = '8px';
            runCard.style.background = '#ffffff';
            runCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            runCard.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            runCard.style.wordWrap = 'break-word';
            runCard.style.overflowWrap = 'break-word';
            runCard.style.maxWidth = '100%';

            const runHeader = document.createElement('div');
            runHeader.style.marginBottom = '12px';
            runHeader.style.fontSize = '14px';
            runHeader.style.fontWeight = '600';
            
            if (snap.text?.trim()) {
                runHeader.innerHTML = `✅ Run ${snap.run}: AI Overview Found (${snap.length} characters)`;
                runHeader.style.color = '#059669';
                
                const content = document.createElement('div');
                content.style.fontSize = '14px';
                content.style.lineHeight = '1.6';
                content.style.color = '#374151';
                content.style.marginTop = '8px';
                content.innerHTML = snap.text.replace(/\n/g, '<br>');
                
                runCard.appendChild(runHeader);
                runCard.appendChild(content);
            } else {
                runHeader.innerHTML = `❌ Run ${snap.run}: No AI Overview Found`;
                runHeader.style.color = '#dc2626';
                runCard.appendChild(runHeader);
                
                const explanation = document.createElement('div');
                explanation.style.fontSize = '13px';
                explanation.style.color = '#6b7280';
                explanation.style.marginTop = '4px';
                explanation.textContent = 'This search did not return an AI Overview from Google.';
                runCard.appendChild(explanation);
            }
            
            runSummaryContainer.appendChild(runCard);
        }

        // Show the run summary
        runSummaryContainer.style.display = 'block';

        // Final result section
        const finalResultTitle = document.createElement('h3');
        finalResultTitle.textContent = '🎯 Ideal Answer';
        finalResultTitle.style.margin = '0 0 12px 0';
        finalResultTitle.style.fontSize = '18px';
        finalResultTitle.style.fontWeight = '600';
        finalResultTitle.style.color = '#1e293b';
        
        const finalResultContainer = document.createElement('div');
        finalResultContainer.style.padding = '20px';
        finalResultContainer.style.background = '#f0f9ff';
        finalResultContainer.style.border = '1px solid #0ea5e9';
        finalResultContainer.style.borderRadius = '12px';
        finalResultContainer.style.fontSize = '15px';
        finalResultContainer.style.lineHeight = '1.6';
        finalResultContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        finalResultContainer.style.wordWrap = 'break-word';
        finalResultContainer.style.overflowWrap = 'break-word';

        // Check if we have any AI overviews
        const hasOverviews = data.snapshots?.some(snap => snap.text?.trim());
        
        if (hasOverviews && data.openai_rewrite) {
            const consolidationNote = document.createElement('div');
            consolidationNote.style.fontSize = '13px';
            consolidationNote.style.color = '#0369a1';
            consolidationNote.style.marginBottom = '12px';
            consolidationNote.style.fontStyle = 'italic';
            consolidationNote.textContent = '✨ Consolidated from detected AI Overviews';
            finalResultContainer.appendChild(consolidationNote);
        } else {
            const generationNote = document.createElement('div');
            generationNote.style.fontSize = '13px';
            generationNote.style.color = '#0369a1';
            generationNote.style.marginBottom = '12px';
            generationNote.style.fontStyle = 'italic';
            generationNote.textContent = '🤖 Generated ideal answer (no AI Overviews detected)';
            finalResultContainer.appendChild(generationNote);
        }

        const finalAnswer = document.createElement('div');
        finalAnswer.style.color = '#1e293b';
        finalAnswer.textContent = data.openai_rewrite || 'No answer could be generated.';
        finalResultContainer.appendChild(finalAnswer);

        // Clear and rebuild result text area
        resultText.innerHTML = '';
        resultText.appendChild(finalResultTitle);
        resultText.appendChild(finalResultContainer);
        
        results.style.display = 'block';

    } catch (err) {
        // Better error display
        const errorDiv = document.createElement('div');
        errorDiv.style.padding = '16px';
        errorDiv.style.background = '#fef2f2';
        errorDiv.style.border = '1px solid #fca5a5';
        errorDiv.style.borderRadius = '8px';
        errorDiv.style.color = '#dc2626';
        errorDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        errorDiv.innerHTML = `<strong>❌ Error:</strong> ${err.message}`;
        
        liveLogContent.appendChild(errorDiv);
        results.style.display = 'block';
    } finally {
        loading.style.display = 'none';
        submitBtn.disabled = false;
    }
});