(function () {
    const storageKey = 'kawaii-resume-theme';
    const toggle = document.getElementById('theme-toggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const transitionDuration = 450; // ms — must match --theme-transition-duration

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
        setTheme(toggle.checked ? 'dark' : 'light', true);
    });

    prefersDark.addEventListener('change', (event) => {
        let persistedTheme = null;
        try {
            persistedTheme = localStorage.getItem(storageKey);
        } catch (error) {
            persistedTheme = null;
        }
        if (persistedTheme) {
            return;
        }
        setTheme(event.matches ? 'dark' : 'light');
    });
})();

// Cat eye cursor tracking
(function () {
    const leftPupil = document.querySelector('.cat-eye.left .cat-sparkle');
    const rightPupil = document.querySelector('.cat-eye.right .cat-sparkle');

    if (!leftPupil || !rightPupil) return;

    function moveEyes(event) {
        const { clientX: mouseX, clientY: mouseY } = event;

        // Get eye positions (using parent eye containers for accurate positioning)
        const leftEye = leftPupil.closest('.cat-eye');
        const rightEye = rightPupil.closest('.cat-eye');

        const leftEyeRect = leftEye.getBoundingClientRect();
        const rightEyeRect = rightEye.getBoundingClientRect();

        const leftEyeCenterX = leftEyeRect.left + leftEyeRect.width / 2;
        const leftEyeCenterY = leftEyeRect.top + leftEyeRect.height / 2;
        const rightEyeCenterX = rightEyeRect.left + rightEyeRect.width / 2;
        const rightEyeCenterY = rightEyeRect.top + rightEyeRect.height / 2;

        // Calculate angles
        const leftAngle = Math.atan2(mouseY - leftEyeCenterY, mouseX - leftEyeCenterX);
        const rightAngle = Math.atan2(mouseY - rightEyeCenterY, mouseX - rightEyeCenterX);

        // Maximum movement distance (in pixels) - smaller for more subtle effect
        const maxMove = 6;

        // Calculate movement based on angle
        const leftMoveX = Math.cos(leftAngle) * maxMove;
        const leftMoveY = Math.sin(leftAngle) * maxMove;
        const rightMoveX = Math.cos(rightAngle) * maxMove;
        const rightMoveY = Math.sin(rightAngle) * maxMove;

        // Apply movement with CSS custom properties
        leftPupil.style.setProperty('--pupil-x', `${leftMoveX}px`);
        leftPupil.style.setProperty('--pupil-y', `${leftMoveY}px`);
        rightPupil.style.setProperty('--pupil-x', `${rightMoveX}px`);
        rightPupil.style.setProperty('--pupil-y', `${rightMoveY}px`);
    }

    // Real-time mouse movement - no throttling for smooth eye tracking
    document.addEventListener('mousemove', moveEyes);

    // Reset eyes when mouse leaves the page
    document.addEventListener('mouseleave', () => {
        leftPupil.style.setProperty('--pupil-x', '0px');
        leftPupil.style.setProperty('--pupil-y', '0px');
        rightPupil.style.setProperty('--pupil-x', '0px');
        rightPupil.style.setProperty('--pupil-y', '0px');
    });
})();
