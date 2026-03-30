/**
 * Authentication manager.
 */
const AuthManager = {
    currentUser: null,

    async init() {
        try {
            this.currentUser = await ApiClient.getProfile();
        } catch (e) {
            this.currentUser = null;
        }
        this._updateUI();
    },

    _updateUI() {
        const statusEl = document.querySelector('[data-testid="user-status"]');
        const authBtn = document.getElementById('authBtn');

        if (this.currentUser) {
            if (this.currentUser.is_guest) {
                statusEl.textContent = '游客模式';
                authBtn.textContent = '注册';
                authBtn.onclick = () => this._showAuthForm('register');
            } else {
                statusEl.textContent = this.currentUser.username;
                authBtn.textContent = '登出';
                authBtn.onclick = () => this._logout();
            }
        } else {
            statusEl.textContent = '';
            authBtn.textContent = '登录';
            authBtn.onclick = () => { window.location.href = 'login.html'; };
        }
    },

    _showAuthForm(mode) {
        window.location.href = `login.html?mode=${mode}`;
    },

    async _logout() {
        try {
            await ApiClient.logout();
            this.currentUser = null;
            this._updateUI();
            window.location.reload();
        } catch (e) {
            console.error('Logout failed:', e);
        }
    },
};
