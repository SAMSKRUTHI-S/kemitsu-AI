/**
 * Demon Slayer (Kimetsu no Yaiba) - OpenAI-style Interactive Chat Controller
 * v2.0 - Enhanced with Rich Anime Breathing Animations, Screen Shakes, Image Gen Fix
 */

let currentConversationId = null;
let currentBreathingStyle = 'Water';
let isGenerating = false;

const TECHNIQUE_METADATA = {
    Water: {
        kanji: '生生流転',
        title: 'Water Breathing • Tenth Form',
        sub: 'Constant Flux (Mizu no Kokyu)',
        className: 'style-water'
    },
    Flame: {
        kanji: '煉獄',
        title: 'Flame Breathing • Ninth Form',
        sub: 'Rengoku (Set Your Heart Ablaze!)',
        className: 'style-flame'
    },
    Thunder: {
        kanji: '霹靂一閃',
        title: 'Thunder Breathing • First Form',
        sub: 'Thunderclap and Flash: Sixfold',
        className: 'style-thunder'
    },
    Sun: {
        kanji: '日暈の龍',
        title: 'Hinokami Kagura • Sun Breathing',
        sub: 'Solar Halo Dragon Dance',
        className: 'style-sun'
    },
    Beast: {
        kanji: '狂い裂き',
        title: 'Beast Breathing • Fifth Fang',
        sub: 'Crazy Cutting (Kedamono no Kokyu)',
        className: 'style-beast'
    }
};

// Configure Marked.js for safe, clean markdown
if (window.marked) {
    marked.setOptions({
        breaks: true,
        gfm: true
    });
}

// -------------------------------------------------------------
// Initialization on Page Load
// -------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
    loadConversations();
    updateSoundIcon();
    attachButtonSoundEffects();
    attachRippleEffects();

    // Auto-focus input
    const input = document.getElementById('user-input');
    if (input) input.focus();

    // Animate welcome screen elements with stagger
    animateWelcomeCards();
});

// -------------------------------------------------------------
// Ripple Click Effects on All Buttons
// -------------------------------------------------------------
function attachRippleEffects() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('button, .btn, .breathing-chip, .starter-card, .history-item');
        if (!btn) return;
        createRipple(btn, e);
    });
}

function createRipple(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: radial-gradient(circle, var(--theme-primary) 0%, transparent 70%);
        opacity: 0.4;
        position: absolute;
        border-radius: 50%;
        transform: scale(0);
        animation: rippleAnim 0.6s linear;
        pointer-events: none;
    `;
    
    // Make sure element has relative position
    const oldPosition = getComputedStyle(element).position;
    if (oldPosition === 'static') element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
}

// -------------------------------------------------------------
// Welcome Screen Stagger Animation
// -------------------------------------------------------------
function animateWelcomeCards() {
    const cards = document.querySelectorAll('.starter-card');
    cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 300 + i * 120);
    });
}

function attachButtonSoundEffects() {
    // Breathing chips
    document.querySelectorAll('.breathing-chip').forEach(chip => {
        chip.addEventListener('mouseenter', () => {
            const style = chip.dataset.style ? chip.dataset.style.toLowerCase() : 'default';
            SoundManager.playHover(style);
        });
    });

    // New chat button
    const newChatBtn = document.querySelector('.btn-new-chat');
    if (newChatBtn) {
        newChatBtn.addEventListener('mouseenter', () => SoundManager.playHover('scroll'));
    }

    // Art button
    const artBtn = document.querySelector('.btn-art-trigger');
    if (artBtn) {
        artBtn.addEventListener('mouseenter', () => SoundManager.playHover('art'));
    }

    // Send button
    const sendBtn = document.getElementById('btn-send');
    if (sendBtn) {
        sendBtn.addEventListener('mouseenter', () => SoundManager.playHover('sword'));
    }

    // Starter cards
    document.querySelectorAll('.starter-card').forEach((card, idx) => {
        const types = ['water', 'thunder', 'flame', 'art'];
        card.addEventListener('mouseenter', () => SoundManager.playHover(types[idx % types.length]));
    });
}

// -------------------------------------------------------------
// Sound Controls
// -------------------------------------------------------------
function toggleSound() {
    const unmuted = SoundManager.toggle();
    updateSoundIcon();
    if (unmuted) SoundManager.playClick();
}

function updateSoundIcon() {
    const soundIcon = document.getElementById('sound-icon');
    if (soundIcon) {
        soundIcon.textContent = SoundManager.isMuted() ? '🔇' : '🔊';
    }
}

// -------------------------------------------------------------
// Mobile Sidebar Toggle
// -------------------------------------------------------------
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
        SoundManager.playClick();
    }
}

// -------------------------------------------------------------
// Breathing Style & Theme Controller
// -------------------------------------------------------------
function setBreathingStyle(style) {
    currentBreathingStyle = style;
    SoundManager.playBreathing(style);

    // 1. Update body theme class
    const body = document.getElementById('app-body');
    if (body) {
        body.className = `app-body breathing-${style.toLowerCase()}`;
    }

    // 2. Update Canvas Particles Engine
    if (window.particleCanvas) {
        window.particleCanvas.setStyle(style);
    }

    // 3. Update Chips UI with shimmer effect
    document.querySelectorAll('.breathing-chip').forEach(chip => {
        if (chip.dataset.style === style) {
            chip.classList.add('active');
            chip.classList.add('chip-pulse');
            setTimeout(() => chip.classList.remove('chip-pulse'), 600);
        } else {
            chip.classList.remove('active');
        }
    });

    // 4. Update Header Indicator Badge
    const badgeText = document.getElementById('breathing-badge-text');
    if (badgeText) {
        badgeText.textContent = `${style} Breathing Active`;
    }

    // 5. Show Epic Anime Technique Title Splash Banner
    showTechniqueBanner(style);

    // 6. Trigger Nichirin Blade Slash & Screen Shake
    triggerSlashEffect(style);

    // 7. Burst particle effect on theme change
    spawnParticleBurst(style);
}

// -------------------------------------------------------------
// Particle Burst on Theme Switch
// -------------------------------------------------------------
function spawnParticleBurst(style) {
    const colors = {
        Water: ['#00d2ff', '#3a7bd5', '#00bfff'],
        Flame: ['#ff4500', '#ff8c00', '#ff6347'],
        Thunder: ['#fcee21', '#f7931e', '#fff700'],
        Sun: ['#ff1744', '#ff9100', '#ffcc00'],
        Beast: ['#10b981', '#06b6d4', '#34d399']
    };
    const palette = colors[style] || colors.Water;
    const container = document.querySelector('.main-content') || document.body;
    
    for (let i = 0; i < 20; i++) {
        const spark = document.createElement('div');
        spark.className = 'spark-particle';
        const angle = Math.random() * 360;
        const distance = 60 + Math.random() * 200;
        const size = 4 + Math.random() * 8;
        const color = palette[Math.floor(Math.random() * palette.length)];
        
        spark.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 ${size * 2}px ${color};
            left: 50%;
            top: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: sparkFly 0.8s ease-out forwards;
            --tx: ${Math.cos(angle * Math.PI/180) * distance}px;
            --ty: ${Math.sin(angle * Math.PI/180) * distance}px;
        `;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 900);
    }
}

// -------------------------------------------------------------
// Anime Technique Title Splash Banner
// -------------------------------------------------------------
let techniqueBannerTimeout = null;
function showTechniqueBanner(style) {
    const banner = document.getElementById('technique-banner');
    const kanjiEl = document.getElementById('technique-kanji');
    const titleEl = document.getElementById('technique-title');
    const subEl = document.getElementById('technique-sub');
    if (!banner || !kanjiEl || !titleEl || !subEl) return;

    const data = TECHNIQUE_METADATA[style] || TECHNIQUE_METADATA.Water;
    kanjiEl.textContent = data.kanji;
    titleEl.textContent = data.title;
    subEl.textContent = data.sub;

    banner.classList.remove('hidden');
    triggerScreenShake();

    if (techniqueBannerTimeout) clearTimeout(techniqueBannerTimeout);
    techniqueBannerTimeout = setTimeout(() => {
        banner.classList.add('hidden');
    }, 1400);
}

// -------------------------------------------------------------
// Screen Shake Visual Effect
// -------------------------------------------------------------
function triggerScreenShake() {
    const main = document.querySelector('.main-content');
    if (!main) return;
    main.classList.remove('screen-shake');
    void main.offsetWidth;
    main.classList.add('screen-shake');
    setTimeout(() => {
        main.classList.remove('screen-shake');
    }, 360);
}

// -------------------------------------------------------------
// Nichirin Blade Slash Visual Effect Trigger
// -------------------------------------------------------------
function triggerSlashEffect(style = currentBreathingStyle) {
    const overlay = document.getElementById('slash-overlay');
    if (!overlay) return;

    overlay.className = 'slash-overlay';
    void overlay.offsetWidth;

    const data = TECHNIQUE_METADATA[style] || TECHNIQUE_METADATA.Water;
    overlay.classList.add('active', data.className);

    triggerScreenShake();

    setTimeout(() => {
        overlay.classList.remove('active', data.className);
    }, 380);
}

// -------------------------------------------------------------
// Conversation History Management
// -------------------------------------------------------------
async function loadConversations() {
    const listEl = document.getElementById('chat-history-list');
    const countEl = document.getElementById('scroll-count');

    try {
        const res = await fetch('/api/conversations');
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const data = await res.json();
        const convs = data.conversations || [];

        if (countEl) countEl.textContent = convs.length;

        if (convs.length === 0) {
            listEl.innerHTML = `<div class="history-empty" style="padding: 12px; color: var(--text-muted); font-size: 0.8rem; text-align: center;">No scrolls found. Begin a new mission!</div>`;
            return;
        }

        listEl.innerHTML = '';
        convs.forEach((c, idx) => {
            const item = document.createElement('div');
            item.className = `history-item ${c.id === currentConversationId ? 'active' : ''}`;
            item.id = `history-item-${c.id}`;
            item.style.animationDelay = `${idx * 40}ms`;
            item.onclick = () => selectConversation(c.id);

            item.innerHTML = `
                <div class="history-title" title="${escapeHtml(c.title)}">
                    <span>📜</span>
                    <span>${escapeHtml(c.title)}</span>
                </div>
                <button class="history-delete-btn" onclick="deleteConversation(event, ${c.id})" title="Burn Scroll (Delete)">
                    ✕
                </button>
            `;
            listEl.appendChild(item);
        });
    } catch (err) {
        console.error('Error loading scrolls:', err);
    }
}

async function selectConversation(id) {
    if (id === currentConversationId) return;
    SoundManager.playClick();
    currentConversationId = id;

    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`history-item-${id}`);
    if (activeEl) activeEl.classList.add('active');

    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }

    try {
        const res = await fetch(`/api/conversations/${id}`);
        if (res.status === 401) {
            window.location.href = '/login';
            return;
        }
        const data = await res.json();
        
        if (data.conversation) {
            document.getElementById('active-chat-title').textContent = data.conversation.title;
        }

        const messagesThread = document.getElementById('messages-thread');
        const welcomeScreen = document.getElementById('welcome-screen');
        
        messagesThread.innerHTML = '';
        welcomeScreen.classList.add('hidden');

        if (data.messages && data.messages.length > 0) {
            data.messages.forEach(msg => {
                appendMessage(msg.sender, msg.content, msg.message_type === 'image', msg.image_url, false);
            });
            scrollToBottom();
        } else {
            welcomeScreen.classList.remove('hidden');
        }
    } catch (err) {
        console.error('Error loading conversation:', err);
    }
}

function startNewChat() {
    SoundManager.playBreathing(currentBreathingStyle);
    triggerSlashEffect(currentBreathingStyle);
    currentConversationId = null;
    document.getElementById('active-chat-title').textContent = 'New Mission Scroll';
    document.getElementById('messages-thread').innerHTML = '';
    const ws = document.getElementById('welcome-screen');
    ws.classList.remove('hidden');
    animateWelcomeCards();
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    
    const input = document.getElementById('user-input');
    if (input) {
        input.value = '';
        autoResizeTextarea(input);
        input.focus();
    }
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
}

async function deleteConversation(e, id) {
    e.stopPropagation();
    if (!confirm('Are you certain you want to incinerate this mission scroll?')) return;

    SoundManager.playFlame();
    triggerSlashEffect('Flame');
    try {
        await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
        if (currentConversationId === id) {
            startNewChat();
        }
        loadConversations();
    } catch (err) {
        console.error('Error deleting scroll:', err);
    }
}

// -------------------------------------------------------------
// Message Sending & Groq Handling
// -------------------------------------------------------------
async function sendMessage() {
    if (isGenerating) return;

    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    SoundManager.playBreathing(currentBreathingStyle);
    triggerSlashEffect(currentBreathingStyle);

    // Animate send button
    const sendBtn = document.getElementById('btn-send');
    if (sendBtn) {
        sendBtn.classList.add('sending');
        setTimeout(() => sendBtn.classList.remove('sending'), 600);
    }

    input.value = '';
    autoResizeTextarea(input);

    document.getElementById('welcome-screen').classList.add('hidden');

    appendMessage('user', text);
    scrollToBottom();

    // Check if it's a direct image command
    if (text.startsWith('/image ') || text.startsWith('/imagine ')) {
        const prompt = text.replace(/^\/(image|imagine)\s+/, '').trim();
        generateImageDirect(prompt);
        return;
    }

    isGenerating = true;
    showTypingIndicator(true);

    const modelSelect = document.getElementById('model-select');
    const model = modelSelect ? modelSelect.value : 'groq/compound-mini';

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                conversation_id: currentConversationId,
                breathing_mode: currentBreathingStyle,
                model: model
            })
        });

        if (res.status === 401) {
            showTypingIndicator(false);
            isGenerating = false;
            appendMessage('assistant', '⚠️ **Session Expired:** Your warrior scroll has ended. Redirecting to headquarters login...');
            setTimeout(() => { window.location.href = '/login'; }, 1500);
            return;
        }

        const data = await res.json();
        showTypingIndicator(false);
        isGenerating = false;

        if (data.conversation_id && currentConversationId !== data.conversation_id) {
            currentConversationId = data.conversation_id;
            loadConversations();
        }

        if (data.is_image) {
            SoundManager.playChime();
            appendMessage('assistant', data.reply, true, data.image_url);
        } else if (data.is_error) {
            SoundManager.playFlame();
            const safeText = escapeHtml(text).replace(/"/g, '&quot;');
            appendMessage('assistant', (data.reply || '⚠️ An error occurred.') + `\n\n<button class="btn-retry-mission" onclick="retryLastMessage('${safeText}')">🔄 Retry Technique</button>`);
        } else {
            SoundManager.playChime();
            appendMessage('assistant', data.reply || 'No response from the Corps.');
        }

        scrollToBottom();
    } catch (err) {
        console.error('Transmission error:', err);
        showTypingIndicator(false);
        isGenerating = false;
        const safeText = escapeHtml(text).replace(/"/g, '&quot;');
        appendMessage('assistant', `⚠️ **Kasugai Crow Dispatch:** Could not reach the Corps server. Please verify your server is active or try again!\n\n<button class="btn-retry-mission" onclick="retryLastMessage('${safeText}')">🔄 Retry Technique</button>`);
        scrollToBottom();
    }
}

function retryLastMessage(text) {
    const input = document.getElementById('user-input');
    if (input) {
        input.value = text;
        autoResizeTextarea(input);
        sendMessage();
    }
}

// -------------------------------------------------------------
// UI Message Rendering
// -------------------------------------------------------------
function appendMessage(sender, content, isImage = false, imageUrl = '', shouldAnimate = true) {
    const thread = document.getElementById('messages-thread');
    const row = document.createElement('div');
    row.className = `message-row ${sender === 'user' ? 'user-row' : 'assistant-row'}`;
    if (shouldAnimate) {
        row.style.opacity = '0';
        row.style.transform = sender === 'user' ? 'translateX(20px)' : 'translateX(-20px)';
    }

    const avatarHtml = sender === 'user' 
        ? `<div class="message-avatar user-avatar-icon">⚔️</div>`
        : `<div class="message-avatar"><span class="avatar-kanji">滅</span></div>`;

    let bodyHtml = '';
    if (isImage && imageUrl) {
        bodyHtml = buildImageMessageHtml(content, imageUrl);
    } else if (sender === 'user') {
        bodyHtml = `<div class="message-content">${escapeHtml(content).replace(/\n/g, '<br>')}</div>`;
    } else {
        const rawHtml = marked.parse(content || '');
        bodyHtml = `<div class="message-content">${rawHtml}</div>`;
    }

    row.innerHTML = avatarHtml + bodyHtml;
    thread.appendChild(row);

    // Code blocks styling & copy
    if (sender === 'assistant' && !isImage) {
        row.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
            wrapCodeBlock(block);
        });
    }

    // Animate in
    if (shouldAnimate) {
        requestAnimationFrame(() => {
            row.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateX(0)';
        });
        scrollToBottom();
    }
    
    return row;
}

// -------------------------------------------------------------
// Image Message HTML Builder with Loading State
// -------------------------------------------------------------
function buildImageMessageHtml(content, imageUrl) {
    const safeUrl = escapeHtml(imageUrl);
    const safeContent = escapeHtml(content);
    return `
        <div class="message-content">
            <p>${marked.parse(content || '')}</p>
            <div class="generated-image-card">
                <div class="image-preview-container" onclick="openZoomModal('${safeUrl}')">
                    <div class="image-loading-skeleton" id="img-skeleton-${Date.now()}">
                        <div class="skeleton-shimmer"></div>
                        <div class="skeleton-text">🎨 Forging Nichirin Canvas...</div>
                    </div>
                    <img 
                        src="${safeUrl}" 
                        alt="Nichirin Generated Art" 
                        loading="lazy"
                        onload="handleImageLoaded(this)"
                        onerror="handleImageError(this, '${safeUrl}')"
                        style="display:none; width:100%; border-radius: 12px; cursor:zoom-in;"
                    >
                    <span class="image-overlay-badge">🎨 Nichirin Canvas</span>
                </div>
                <div class="image-card-footer">
                    <span class="image-prompt-caption">${safeContent.replace(/Behold!.*?of\s+\*\*(.+?)\*\*.*/, '$1').replace(/The Nichirin Canvas.*?of\s+\*\*(.+?)\*\*.*/, '$1')}</span>
                    <div class="image-card-actions">
                        <button class="btn-image-action" onclick="openZoomModal('${safeUrl}')">🔍 Zoom</button>
                        <a href="${safeUrl}" target="_blank" class="btn-image-action">🔗 Open</a>
                        <a href="${safeUrl}" target="_blank" download="nichirin_canvas.jpg" class="btn-image-action">⬇️ Save</a>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Handle image load success
function handleImageLoaded(img) {
    const container = img.closest('.image-preview-container');
    const skeleton = container.querySelector('.image-loading-skeleton');
    if (skeleton) skeleton.remove();
    img.style.display = 'block';
    img.style.animation = 'imageReveal 0.6s ease forwards';
    
    // Play success sound and celebrate
    SoundManager.playChime();
    triggerImageSuccessEffect(container);
}

// Handle image load error - try regenerating URL
function handleImageError(img, originalUrl) {
    const container = img.closest('.image-preview-container');
    const skeleton = container.querySelector('.image-loading-skeleton');
    
    // Try with a different seed as fallback
    const url = new URL(originalUrl);
    const newSeed = Math.floor(Math.random() * 999999);
    url.searchParams.set('seed', newSeed);
    const newUrl = url.toString();
    
    if (!img.dataset.retried) {
        img.dataset.retried = '1';
        if (skeleton) skeleton.querySelector('.skeleton-text').textContent = '🔄 Retrying with new seed...';
        img.src = newUrl;
    } else {
        // Final failure state
        if (skeleton) {
            skeleton.innerHTML = `
                <div style="text-align:center; padding: 20px; color: var(--text-secondary);">
                    <div style="font-size: 2rem; margin-bottom: 8px;">🎌</div>
                    <p style="margin: 0; font-size: 0.85rem;">Image still loading...</p>
                    <a href="${originalUrl}" target="_blank" style="color: var(--theme-primary); font-size: 0.8rem; display:block; margin-top:8px;">Open directly in browser →</a>
                </div>
            `;
        }
        img.style.display = 'none';
    }
}

// Celebration particles on image success
function triggerImageSuccessEffect(container) {
    const rect = container.getBoundingClientRect();
    const colors = ['#ff1744', '#ff9100', '#00d2ff', '#fcee21', '#10b981'];
    for (let i = 0; i < 30; i++) {
        const spark = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 5 + Math.random() * 8;
        const angle = Math.random() * 360;
        const distance = 50 + Math.random() * 150;
        
        spark.style.cssText = `
            position: fixed;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: ${color};
            box-shadow: 0 0 ${size * 3}px ${color};
            left: ${rect.left + rect.width / 2}px;
            top: ${rect.top + rect.height / 2}px;
            pointer-events: none;
            z-index: 9999;
            animation: sparkFly 1s ease-out forwards;
            --tx: ${Math.cos(angle * Math.PI/180) * distance}px;
            --ty: ${Math.sin(angle * Math.PI/180) * distance}px;
        `;
        document.body.appendChild(spark);
        setTimeout(() => spark.remove(), 1100);
    }
}

function wrapCodeBlock(codeEl) {
    const pre = codeEl.parentNode;
    if (pre.parentNode.classList.contains('code-block-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    let lang = 'code';
    codeEl.classList.forEach(c => {
        if (c.startsWith('language-')) lang = c.replace('language-', '');
    });

    const header = document.createElement('div');
    header.className = 'code-header';
    header.innerHTML = `
        <span>${lang.toUpperCase()}</span>
        <button class="copy-code-btn" onclick="copyCode(this)">📋 Copy</button>
    `;

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(header);
    wrapper.appendChild(pre);
}

function copyCode(btn) {
    const pre = btn.closest('.code-block-wrapper').querySelector('pre');
    const code = pre.querySelector('code').innerText;

    navigator.clipboard.writeText(code).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.color = '#10b981';
        SoundManager.playClick();
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.color = '';
        }, 2000);
    });
}

function showTypingIndicator(show) {
    const indicator = document.getElementById('typing-indicator');
    const textEl = document.getElementById('typing-text');
    if (!indicator) return;

    if (show) {
        textEl.textContent = `Channeling Total Concentration ${currentBreathingStyle} Breathing...`;
        indicator.classList.remove('hidden');
        scrollToBottom();
    } else {
        indicator.classList.add('hidden');
    }
}

function scrollToBottom() {
    const container = document.getElementById('chat-container');
    if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
}

// -------------------------------------------------------------
// Image Generation ("Nichirin Canvas") Modal & API
// -------------------------------------------------------------
function openArtModal() {
    SoundManager.playClick();
    const modal = document.getElementById('art-modal');
    modal.classList.remove('hidden');
    modal.classList.add('modal-enter');
    setTimeout(() => modal.classList.remove('modal-enter'), 400);
    const promptInput = document.getElementById('art-prompt-input');
    if (promptInput) {
        promptInput.value = '';
        promptInput.focus();
    }
}

function closeArtModal() {
    SoundManager.playClick();
    const modal = document.getElementById('art-modal');
    modal.classList.add('hidden');
}

async function submitArtModal() {
    const prompt = document.getElementById('art-prompt-input').value.trim();
    const style = document.getElementById('art-style-select').value;
    if (!prompt) {
        // Shake the input instead of alert
        const input = document.getElementById('art-prompt-input');
        input.classList.add('input-shake');
        setTimeout(() => input.classList.remove('input-shake'), 500);
        return;
    }

    closeArtModal();
    generateImageDirect(prompt, style);
}

async function generateImageDirect(prompt, style = 'demon_slayer') {
    SoundManager.playSun();
    triggerSlashEffect('Sun');

    document.getElementById('welcome-screen').classList.add('hidden');
    appendMessage('user', `🎨 [Nichirin Canvas] Summon: ${prompt}`);
    scrollToBottom();

    isGenerating = true;
    showTypingIndicator(true);
    document.getElementById('typing-text').textContent = `Forging Nichirin Canvas Artwork... ✨`;

    try {
        const res = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: prompt,
                conversation_id: currentConversationId,
                style: style
            })
        });

        if (res.status === 401) {
            showTypingIndicator(false);
            isGenerating = false;
            appendMessage('assistant', '⚠️ **Session Expired:** Please enter headquarters to forge art. Redirecting to login...');
            setTimeout(() => { window.location.href = '/login'; }, 1500);
            return;
        }

        const data = await res.json();
        showTypingIndicator(false);
        isGenerating = false;

        if (data.conversation_id && currentConversationId !== data.conversation_id) {
            currentConversationId = data.conversation_id;
            loadConversations();
        }

        if (data.image_url) {
            // Don't play chime here - it'll play when image loads
            appendMessage('assistant', `The Nichirin Canvas has manifested your vision of **${prompt}**!`, true, data.image_url);
        } else {
            appendMessage('assistant', data.error || '⚠️ Could not generate the requested artwork. Please try again.');
        }
        scrollToBottom();
    } catch (err) {
        showTypingIndicator(false);
        isGenerating = false;
        appendMessage('assistant', '⚠️ Error contacting the Nichirin art synthesis engine. Please try again.');
        scrollToBottom();
    }
}

// Starter Card helpers
function useStarterPrompt(prompt) {
    const input = document.getElementById('user-input');
    if (input) {
        input.value = prompt;
        sendMessage();
    }
}

function triggerArtGenerationStarter(prompt) {
    generateImageDirect(prompt, 'demon_slayer');
}

// -------------------------------------------------------------
// Image Zoom Lightbox
// -------------------------------------------------------------
function openZoomModal(src) {
    SoundManager.playClick();
    const zoomImg = document.getElementById('zoom-image');
    const zoomDownload = document.getElementById('zoom-download');
    const modal = document.getElementById('zoom-modal');
    
    // Show loading state in zoom modal
    zoomImg.style.opacity = '0';
    zoomImg.src = src;
    zoomDownload.href = src;
    modal.classList.remove('hidden');
    
    zoomImg.onload = () => {
        zoomImg.style.transition = 'opacity 0.4s ease';
        zoomImg.style.opacity = '1';
    };
}

function closeZoomModal() {
    document.getElementById('zoom-modal').classList.add('hidden');
    document.getElementById('zoom-image').src = '';
}

// Close zoom on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const zoomModal = document.getElementById('zoom-modal');
        const artModal = document.getElementById('art-modal');
        if (zoomModal && !zoomModal.classList.contains('hidden')) closeZoomModal();
        else if (artModal && !artModal.classList.contains('hidden')) closeArtModal();
    }
});

// -------------------------------------------------------------
// Input Utilities
// -------------------------------------------------------------
function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + 'px';
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function onModelChange() {
    SoundManager.playClick();
    const select = document.getElementById('model-select');
    if (!select) return;
    // Flash the select
    select.style.outline = '2px solid var(--theme-primary)';
    setTimeout(() => select.style.outline = '', 500);
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
