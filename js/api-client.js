/**
 * API client for backend communication.
 */
const API_BASE = '/api';

const ApiClient = {
    async _fetch(path, options = {}) {
        const url = `${API_BASE}${path}`;
        const defaults = {
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
        };

        // Add CSRF token for non-GET requests
        if (options.method && options.method !== 'GET') {
            const csrfToken = Utils.getCookie('csrftoken');
            if (csrfToken) {
                defaults.headers['X-CSRFToken'] = csrfToken;
            }
        }

        try {
            const resp = await fetch(url, { ...defaults, ...options });
            const data = await resp.json();
            if (!resp.ok) throw { status: resp.status, ...data };
            return data;
        } catch (err) {
            if (err.status) throw err;
            console.error('API error:', err);
            throw { error: '网络连接失败', code: 'NETWORK_ERROR' };
        }
    },

    // Auth
    register: (username, password) =>
        ApiClient._fetch('/accounts/register/', { method: 'POST', body: JSON.stringify({ username, password }) }),
    login: (username, password) =>
        ApiClient._fetch('/accounts/login/', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () =>
        ApiClient._fetch('/accounts/logout/', { method: 'POST' }),
    getProfile: () =>
        ApiClient._fetch('/accounts/profile/'),
    upgradeGuest: (username, password) =>
        ApiClient._fetch('/accounts/upgrade/', { method: 'POST', body: JSON.stringify({ username, password }) }),

    // Game
    saveRecord: (record) =>
        ApiClient._fetch('/game/records/create/', { method: 'POST', body: JSON.stringify(record) }),
    getRecords: (page = 1, pageSize = 20) =>
        ApiClient._fetch(`/game/records/?page=${page}&page_size=${pageSize}`),
    saveProgress: (stateJson) =>
        ApiClient._fetch('/game/progress/save/', { method: 'POST', body: JSON.stringify({ state_json: stateJson }) }),
    loadProgress: () =>
        ApiClient._fetch('/game/progress/'),

    // Leaderboard
    getLeaderboard: (page = 1, pageSize = 20) =>
        ApiClient._fetch(`/leaderboard/?page=${page}&page_size=${pageSize}`),
    getPersonalBest: () =>
        ApiClient._fetch('/leaderboard/personal/'),

    // Achievements
    getAchievements: () =>
        ApiClient._fetch('/achievements/'),
    checkAchievements: (recordId) =>
        ApiClient._fetch('/achievements/check/', { method: 'POST', body: JSON.stringify({ record_id: recordId }) }),

    // Sharing
    generateShareCard: (recordId) =>
        ApiClient._fetch('/sharing/card/', { method: 'POST', body: JSON.stringify({ record_id: recordId }) }),
    getShareData: (token) =>
        ApiClient._fetch(`/sharing/${token}/`),
};
