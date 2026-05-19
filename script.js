// ============================================================
// 1. THEME TOGGLE (dark/light)
// ============================================================
(function () {
    const storageKey = 'kawaii-resume-theme';
    const toggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

    const setTheme = (theme, persist = false) => {
        document.body.setAttribute('data-theme', theme);
        if (toggle) {
            toggle.checked = theme === 'dark';
        }
        if (persist) {
            try {
                localStorage.setItem(storageKey, theme);
            } catch (error) {
                console.warn('Unable to persist theme:', error);
            }
        }
    };

    let storedTheme;
    try {
        storedTheme = localStorage.getItem(storageKey);
    } catch (error) {
        storedTheme = null;
    }

    if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme);
    } else {
        setTheme(prefersDark.matches ? 'dark' : 'light');
    }

    toggle?.addEventListener('change', () => {
        const newTheme = toggle.checked ? 'dark' : 'light';
        setTheme(newTheme, true);
        playThemeChime(newTheme);
    });

    prefersDark.addEventListener('change', (event) => {
        let persistedTheme = null;
        try {
            persistedTheme = localStorage.getItem(storageKey);
        } catch (error) {
            persistedTheme = null;
        }
        if (persistedTheme) return;
        setTheme(event.matches ? 'dark' : 'light');
    });
})();

// ============================================================
// 2. AMBIENT TOGGLE SOUND (Web Audio API)
// ============================================================
function playThemeChime(theme) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        const baseFreq = theme === 'dark' ? 523.25 : 659.25;
        const secondFreq = theme === 'dark' ? 659.25 : 783.99;

        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(baseFreq, now);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(secondFreq, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.06);
        osc1.stop(now + 0.3);
        osc2.stop(now + 0.35);

        osc1.onended = () => ctx.close();
    } catch (e) {
        // Audio not available
    }
}

// ============================================================
// 3. DRAG-TO-REVEAL THEME TOGGLE
// ============================================================
(function () {
    const slider = document.querySelector('.slider');
    const toggle = document.getElementById('theme-toggle');
    if (!slider || !toggle) return;

    const progress = document.createElement('div');
    progress.className = 'theme-drag-progress';
    slider.appendChild(progress);

    let isDragging = false;
    let hasMoved = false;
    let startX = 0;
    let startChecked = false;
    const threshold = 0.4;
    const MIN_DRAG_PX = 4; // must move at least this many px before it counts as a drag

    const onPointerDown = (e) => {
        isDragging = true;
        hasMoved = false;
        startX = e.clientX;
        startChecked = toggle.checked;
        slider.classList.add('dragging');
        slider.setPointerCapture(e.pointerId);
        // Don't preventDefault — let the label/checkbox native click still work if no drag happens
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        if (Math.abs(deltaX) < MIN_DRAG_PX) return;

        hasMoved = true;
        const rect = slider.getBoundingClientRect();
        const ratio = Math.abs(deltaX) / rect.width;
        progress.style.width = `${Math.min(ratio, 1) * 100}%`;

        if (ratio >= threshold) {
            const newChecked = deltaX > 0;
            if (newChecked !== toggle.checked) {
                toggle.checked = newChecked;
                document.body.setAttribute('data-theme', newChecked ? 'dark' : 'light');
            }
        } else if (toggle.checked !== startChecked) {
            toggle.checked = startChecked;
            document.body.setAttribute('data-theme', startChecked ? 'dark' : 'light');
        }
    };

    const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('dragging');
        progress.style.width = '0%';

        if (!hasMoved) {
            // Was a click, not a drag — let the normal label/checkbox
            // interaction handle the toggle. Do nothing here.
            return;
        }

        const rect = slider.getBoundingClientRect();
        const deltaX = e.clientX - startX;
        const ratio = Math.abs(deltaX) / rect.width;

        let finalChecked;
        if (ratio >= threshold) {
            finalChecked = deltaX > 0;
        } else {
            finalChecked = startChecked;
        }

        if (finalChecked !== toggle.checked) {
            toggle.checked = finalChecked;
        }
        document.body.setAttribute('data-theme', finalChecked ? 'dark' : 'light');
        try {
            localStorage.setItem('kawaii-resume-theme', finalChecked ? 'dark' : 'light');
        } catch (_) {}

        if (finalChecked !== startChecked) {
            playThemeChime(finalChecked ? 'dark' : 'light');
        }
    };

    const onPointerCancel = () => {
        if (!isDragging) return;
        isDragging = false;
        slider.classList.remove('dragging');
        progress.style.width = '0%';
    };

    slider.addEventListener('pointerdown', onPointerDown);
    slider.addEventListener('pointermove', onPointerMove);
    slider.addEventListener('pointerup', onPointerUp);
    slider.addEventListener('pointercancel', onPointerCancel);
})();

// ============================================================
// 4. CAT IDLE SLEEP — sleeps when cursor is outside <main>
//    for 3 seconds, or when the page tab is hidden.
//    Wakes instantly when cursor re-enters <main>.
// ============================================================
(function () {
    const avatar = document.querySelector('.cat-avatar');
    const main = document.querySelector('main');
    if (!avatar || !main) return;

    const SLEEP_DELAY = 3000; // ms — wait this long before sleeping
    let isSleeping = false;
    let sleepTimer = null;

    const cancelSleep = () => {
        if (sleepTimer) {
            clearTimeout(sleepTimer);
            sleepTimer = null;
        }
    };

    const goToSleep = () => {
        if (isSleeping) return;
        avatar.classList.add('sleeping');
        isSleeping = true;
        cancelSleep();
    };

    const wakeUp = () => {
        cancelSleep();
        if (!isSleeping) return;
        avatar.classList.remove('sleeping');
        isSleeping = false;
    };

    // Check if cursor is inside <main> bounding rect (with generous padding)
    const isInsideMain = (x, y) => {
        const r = main.getBoundingClientRect();
        const pad = 20;
        return x >= r.left - pad && x <= r.right + pad && y >= r.top - pad && y <= r.bottom + pad;
    };

    document.addEventListener('mousemove', (e) => {
        if (isInsideMain(e.clientX, e.clientY)) {
            // Cursor is inside main — wake up and cancel any pending sleep
            wakeUp();
        } else if (!isSleeping && !sleepTimer) {
            // Cursor outside — start sleep countdown
            sleepTimer = setTimeout(goToSleep, SLEEP_DELAY);
        }
    });

    // When mouse leaves the window entirely, start sleep countdown
    document.addEventListener('mouseleave', () => {
        if (!isSleeping && !sleepTimer) {
            sleepTimer = setTimeout(goToSleep, SLEEP_DELAY);
        }
    });

    // On scroll, wake up immediately (user is actively reading)
    document.addEventListener('scroll', wakeUp, { passive: true });

    // Tab visibility — sleep/wake instantly (no delay for tab switch)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelSleep();
            goToSleep();
        } else {
            wakeUp();
        }
    });
})();

// ============================================================
// 5. CAT CLICK REACTION — 27 reactions + angry mode
//    (angry if clicked >5 times in 1 second)
// ============================================================
(function () {
    const avatar = document.querySelector('.cat-avatar');
    if (!avatar) return;

    const cuteReactions = [
        'Nyaa~☆',
        'Purrr~♡',
        'Meow!',
        '♥',
        '✧',
        '=^._.^=',
        'nya?',
        '☆*:.｡.o(≧▽≦)o.｡.:*☆',
        '(◕‿◕✿)',
        'ฅ^•ﻌ•^ฅ',
        '~(=^‥^)ﾉ',
        '✧･ﾟ: *✧･ﾟ:*',
        'rawr x3',
        '*nuzzles*',
        'meow meow!',
        '(｡♥‿♥｡)',
        '✿✧✿',
        '♥(✿ฺ´∀`✿ฺ)ﾉ',
        'paw~',
        'nya~n',
        'purr purr~',
        '✩°｡⋆',
        'mew!',
        '⊂(◉‿◉)つ',
        '〜(꒪꒳꒪)〜',
        '(=^･ω･^=)',
        '✧*。',
    ];

    const angryReactions = ['😾!!', '＞︿＜', 'HISS!', '💢', '¯\\_(ツ)_/¯', 'grrr...', '⚠(⇀‸↼)⚠', '(╯°□°)╯', 'mrrrow!', '(◣_◢)', '✧\_╭◜◝⊂◛__', 'chomp! 🐾'];

    const clickTimes = [];
    const ANGRY_THRESHOLD = 5;
    const ANGRY_WINDOW = 1000; // 1 second
    let isAngry = false;
    let angryTimer = null;

    const expireAnger = () => {
        isAngry = false;
        avatar.classList.remove('angry');
    };

    avatar.addEventListener('click', () => {
        const now = Date.now();
        clickTimes.push(now);

        // Keep only clicks within the last second
        while (clickTimes.length > 0 && clickTimes[0] < now - ANGRY_WINDOW) {
            clickTimes.shift();
        }

        const recentClicks = clickTimes.length;

        // Check if we should be angry
        if (recentClicks > ANGRY_THRESHOLD && !isAngry) {
            isAngry = true;
            avatar.classList.add('angry');
            clearTimeout(angryTimer);
            angryTimer = setTimeout(expireAnger, 2500);
        }

        // Pick reaction text
        const pool = isAngry ? angryReactions : cuteReactions;
        const bubble = avatar.querySelector('.click-nyaa');
        if (bubble) {
            bubble.textContent = pool[Math.floor(Math.random() * pool.length)];
        }

        avatar.classList.remove('clicked');
        void avatar.offsetWidth;
        avatar.classList.add('clicked');

        setTimeout(() => {
            avatar.classList.remove('clicked');
            // Reset click count a bit after anger subsides
            if (!isAngry) {
                clickTimes.length = 0;
            }
        }, 400);
    });
})();

// ============================================================
// 6. SCROLL-TRIGGERED FADE-IN
// ============================================================
(function () {
    const sections = document.querySelectorAll('.fade-section');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    sections.forEach((section) => observer.observe(section));
})();

// ============================================================
// 7. COLLAPSIBLE SECTIONS — click h2 title to expand/collapse
//    By default, collapse all except the first card.
// ============================================================
(function () {
    const cards = document.querySelectorAll('.section-card');
    cards.forEach((card, idx) => {
        const h2 = card.querySelector('h2.section-title');
        if (!h2) return;

        // Wrap everything after the h2 into a .section-body
        const body = document.createElement('div');
        body.className = 'section-body';
        let next = h2.nextElementSibling;
        while (next) {
            const toMove = next;
            next = next.nextElementSibling;
            body.appendChild(toMove);
        }
        card.appendChild(body);

        // Collapse all except the first section
        if (idx > 0) {
            card.classList.add('collapsed');
        }

        h2.addEventListener('click', () => {
            card.classList.toggle('collapsed');
        });
    });
})();

// ============================================================
// 8. SPARKLE PARTICLE CURSOR TRAIL
// ============================================================
(function () {
    const sparkleChars = ['✦', '✧', '⋆', '✶', '·', '☆', '⟡', '⁕'];
    let lastSpawn = 0;
    const THROTTLE_MS = 40;

    document.addEventListener('mousemove', (e) => {
        const now = performance.now();
        if (now - lastSpawn < THROTTLE_MS) return;
        lastSpawn = now;

        const particle = document.createElement('span');
        particle.className = 'sparkle-particle';
        particle.textContent = sparkleChars[Math.floor(Math.random() * sparkleChars.length)];

        const dx = (Math.random() - 0.5) * 40;
        const dy = -Math.random() * 35 - 5;

        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;
        particle.style.setProperty('--dx', `${dx}px`);
        particle.style.setProperty('--dy', `${dy}px`);
        particle.style.color = `hsl(${Math.random() * 360}, 80%, 70%)`;

        document.body.appendChild(particle);
        setTimeout(() => {
            if (particle.parentNode) particle.remove();
        }, 800);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            document.querySelectorAll('.sparkle-particle').forEach((el) => el.remove());
        }
    });

    // --- Bongo Cat Cursor ---
    let cursorEl = null;
    let defaultCursorEl = null;

    // Create default cursor (rotated cursor.png)
    const initDefaultCursor = () => {
        if (document.getElementById('default-cursor')) return;
        const el = document.createElement('div');
        el.id = 'default-cursor';
        document.body.appendChild(el);
        return el;
    };
    defaultCursorEl = initDefaultCursor();

    // Create bongocat cursor
    const initCursor = () => {
        if (document.getElementById('bongocat-cursor')) return;
        const cursor = document.createElement('div');
        cursor.id = 'bongocat-cursor';
        document.body.appendChild(cursor);
        return cursor;
    };
    cursorEl = initCursor();

    const updateCursor = (e) => {
        if (!cursorEl) cursorEl = document.getElementById('bongocat-cursor');
        if (!defaultCursorEl) defaultCursorEl = document.getElementById('default-cursor');
        if (!cursorEl) return;

        const x = e.clientX,
            y = e.clientY;

        // Always position both cursors
        cursorEl.style.left = `${x}px`;
        cursorEl.style.top = `${y}px`;
        defaultCursorEl.style.left = `${x}px`;
        defaultCursorEl.style.top = `${y}px`;

        const isInteractive = e.target.closest('a, .chip, button, .contact-item, .cat-avatar, h2.section-title');

        if (isInteractive) {
            document.body.classList.add('custom-cursor-active');
            defaultCursorEl.style.display = 'none';
            cursorEl.style.display = 'block';
            cursorEl.classList.add('rainbow');
        } else {
            document.body.classList.remove('custom-cursor-active');
            defaultCursorEl.style.display = '';
            cursorEl.style.display = 'none';
            cursorEl.classList.remove('rainbow');
        }
    };
    document.addEventListener('mousemove', updateCursor);
    document.addEventListener('mouseleave', () => {
        if (cursorEl) cursorEl.style.display = 'none';
        if (defaultCursorEl) defaultCursorEl.style.display = 'none';
    });
})();

// ============================================================
// 10. CAT EYE CURSOR TRACKING
// ============================================================
(function () {
    const leftPupil = document.querySelector('.cat-eye.left .cat-sparkle');
    const rightPupil = document.querySelector('.cat-eye.right .cat-sparkle');

    if (!leftPupil || !rightPupil) return;

    function moveEyes(event) {
        const { clientX: mouseX, clientY: mouseY } = event;

        const leftEye = leftPupil.closest('.cat-eye');
        const rightEye = rightPupil.closest('.cat-eye');

        const leftEyeRect = leftEye.getBoundingClientRect();
        const rightEyeRect = rightEye.getBoundingClientRect();

        const leftEyeCenterX = leftEyeRect.left + leftEyeRect.width / 2;
        const leftEyeCenterY = leftEyeRect.top + leftEyeRect.height / 2;
        const rightEyeCenterX = rightEyeRect.left + rightEyeRect.width / 2;
        const rightEyeCenterY = rightEyeRect.top + rightEyeRect.height / 2;

        const leftAngle = Math.atan2(mouseY - leftEyeCenterY, mouseX - leftEyeCenterX);
        const rightAngle = Math.atan2(mouseY - rightEyeCenterY, mouseX - rightEyeCenterX);

        const maxMove = 6;

        leftPupil.style.setProperty('--pupil-x', `${Math.cos(leftAngle) * maxMove}px`);
        leftPupil.style.setProperty('--pupil-y', `${Math.sin(leftAngle) * maxMove}px`);
        rightPupil.style.setProperty('--pupil-x', `${Math.cos(rightAngle) * maxMove}px`);
        rightPupil.style.setProperty('--pupil-y', `${Math.sin(rightAngle) * maxMove}px`);
    }

    document.addEventListener('mousemove', moveEyes);

    document.addEventListener('mouseleave', () => {
        leftPupil.style.setProperty('--pupil-x', '0px');
        leftPupil.style.setProperty('--pupil-y', '0px');
        rightPupil.style.setProperty('--pupil-x', '0px');
        rightPupil.style.setProperty('--pupil-y', '0px');
    });
})();
