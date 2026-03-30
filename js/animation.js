/**
 * Animation controller for game transitions.
 */
const AnimationController = {
    isAnimating: false,

    /** Play cross-river animation sequence */
    async playCrossAnimation(boatEl, direction) {
        this.isAnimating = true;
        boatEl.classList.add('boat--moving');
        boatEl.classList.remove('boat--left', 'boat--right');
        boatEl.classList.add(direction === 'right' ? 'boat--right' : 'boat--left');

        await this._wait(800);
        boatEl.classList.remove('boat--moving');
        this.isAnimating = false;
    },

    /** Play character boarding animation */
    async playBoardAnimation(charEl) {
        charEl.classList.add('character--boarding');
        await this._wait(300);
        charEl.classList.remove('character--boarding');
    },

    /** Play victory animation on all characters */
    async playVictoryAnimation(characterEls) {
        characterEls.forEach(el => el.classList.add('character--victory'));
        await this._wait(2000);
        characterEls.forEach(el => el.classList.remove('character--victory'));
    },

    /** Play danger flash animation */
    async playDangerAnimation(characterEls) {
        characterEls.forEach(el => el.classList.add('character--danger'));
        await this._wait(1200);
        characterEls.forEach(el => el.classList.remove('character--danger'));
    },

    /** Show achievement toast */
    showAchievementToast(name) {
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.textContent = `🏆 成就解锁: ${name}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    },

    _wait(ms) { return new Promise(r => setTimeout(r, ms)); },
};
