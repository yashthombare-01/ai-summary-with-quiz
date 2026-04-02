// State Variables
let currentMode = 'text';
let latestSummary = '';

// DOM Elements
const modeBtns = document.querySelectorAll('.mode-btn');
const uiPanels = {
    text: document.getElementById('panel-text'),
    pdf: document.getElementById('panel-pdf'),
    youtube: document.getElementById('panel-youtube')
};
const summarizeBtn = document.getElementById('summarize-btn');
const summaryContent = document.getElementById('summary-content');
const quizSection = document.getElementById('quiz-section');
const quizContent = document.getElementById('quiz-content');

// --- 3D Hover Effect ---
document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Calculate max rotation bounds (e.g. 10 degrees)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = ((y - centerY) / centerY) * -8; // Pitch
        const rotateY = ((x - centerX) / centerX) * 8;   // Yaw
        
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1200px) rotateX(0deg) rotateY(0deg)`;
        card.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
    });
    
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'none'; // Lock transition to mouse perfectly
    });
});

// --- UI Mode Switching ---
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Reset active
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        
        // Toggle input panels
        Object.values(uiPanels).forEach(panel => panel.classList.add('hidden'));
        uiPanels[currentMode].classList.remove('hidden');
        
        // Beautiful crossfade
        uiPanels[currentMode].style.animation = 'fadeInDown 0.4s ease';
    });
});

// PDF Upload Interactivity
const pdfUploadArea = document.getElementById('pdf-upload-area');
const pdfFileName = document.getElementById('pdf-file-name');
const pdfInput = document.getElementById('pdf-input');

pdfUploadArea.addEventListener('click', () => pdfInput.click());
pdfInput.addEventListener('change', () => {
    if (pdfInput.files[0]) {
        pdfFileName.innerHTML = `<i class="fas fa-file-pdf" style="color:var(--accent-3);"></i> Selected: <b>${pdfInput.files[0].name}</b>`;
        pdfFileName.style.color = "var(--text-main)";
    }
});

// --- API Interactions ---

document.getElementById('action-summarize').addEventListener('click', async () => {
    const btn = document.getElementById('action-summarize');
    
    // Validate
    let data;
    let url = `/summarize/${currentMode}`;
    
    if (currentMode === 'text') {
        const textArea = document.getElementById('src-text').value.trim();
        if(!textArea) return alert("Please enter text.");
        data = { text: textArea };
    } else if (currentMode === 'pdf') {
        const file = pdfInput.files[0];
        if(!file) return alert("Please upload a PDF.");
        data = new FormData();
        data.append('file', file);
    } else if (currentMode === 'youtube') {
        const yt = document.getElementById('src-yt').value.trim();
        if(!yt) return alert("Please specify a YouTube URL.");
        data = { url: yt };
    }
    
    // UI Loading State
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Analyzing...`;
    btn.disabled = true;
    summaryContent.innerHTML = `<div style="text-align:center; color: var(--accent-1); font-size: 32px; padding: 40px;"><i class="fas fa-atom fa-spin"></i></div>`;
    
    try {
        const isFormData = data instanceof FormData;
        const res = await fetch(url, {
            method: 'POST',
            body: isFormData ? data : JSON.stringify(data),
            headers: isFormData ? {} : { 'Content-Type': 'application/json' }
        });
        
        const result = await res.json();
        
        if (!res.ok || result.error) throw new Error(result.error || "Generation failed.");
        
        latestSummary = result.summary;
        
        summaryContent.innerHTML = `
            <div class="status-pill pop-out"><i class="fas fa-check-circle"></i> Success</div>
            <p class="summary-text pop-out">${latestSummary}</p>
        `;
        quizSection.classList.remove('hidden');
        quizSection.style.animation = 'fadeInDown 0.6s ease';
        quizContent.innerHTML = `<p style="color:var(--text-muted)">Summary analyzed successfully. Click below to generate questions.</p>`;
        
    } catch(err) {
        summaryContent.innerHTML = `<div style="color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 20px; border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.3)"><b>Error:</b> ${err.message}</div>`;
        quizSection.classList.add('hidden');
    } finally {
        btn.innerHTML = `<i class="fas fa-magic"></i> Generate Intelligence`;
        btn.disabled = false;
    }
});

document.getElementById('action-quiz').addEventListener('click', async () => {
    const btn = document.getElementById('action-quiz');
    btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Generating Quiz...`;
    btn.disabled = true;
    
    quizContent.innerHTML = `<div style="text-align:center; color: var(--accent-2); font-size: 32px; padding: 20px;"><i class="fas fa-brain fa-pulse"></i></div>`;

    try {
        const res = await fetch("/quiz/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: latestSummary })
        });
        const result = await res.json();
        if (!res.ok || result.error) throw new Error(result.error || "Quiz failed.");
        
        const qList = (result.questions || []).map((q, i) => `
            <div class="quiz-item pop-out">
                <div class="quiz-num">Q${i+1}</div>
                <div style="font-weight: 500">${q}</div>
            </div>
        `).join('');
        
        quizContent.innerHTML = `<div class="status-pill pop-out" style="margin-bottom: 16px;"><i class="fas fa-check-circle"></i> Quiz Ready</div>${qList}`;
    } catch (err) {
        quizContent.innerHTML = `<div style="color: #ef4444;"><b>Error:</b> ${err.message}</div>`;
    } finally {
        btn.innerHTML = `<i class="fas fa-list-ol"></i> Generate 10 Questions`;
        btn.disabled = false;
    }
});

function copyResult() {
    if(!latestSummary) return;
    navigator.clipboard.writeText(latestSummary);
    alert("Copied to clipboard!");
}
