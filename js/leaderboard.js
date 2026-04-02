/**
 * Leaderboard page logic.
 */
(async function () {
    let currentPage = 1;

    async function loadLeaderboard(page) {
        try {
            const data = await ApiClient.getLeaderboard(page);
            const tbody = document.getElementById('lbBody');
            tbody.innerHTML = data.items.map(item => {
                const rankClass = item.rank <= 3 ? `rank-${item.rank}` : '';
                return `<tr>
                    <td class="${rankClass}">#${item.rank}</td>
                    <td>${Utils.escapeHTML(item.player)}</td>
                    <td>${item.steps}</td>
                    <td>${Utils.formatTime(item.time_seconds)}</td>
                </tr>`;
            }).join('');

            // Pagination
            const totalPages = Math.ceil(data.total / data.page_size);
            const pagEl = document.getElementById('pagination');
            pagEl.innerHTML = '';
            for (let i = 1; i <= Math.min(totalPages, 10); i++) {
                const btn = document.createElement('button');
                btn.className = `btn btn--small${i === page ? ' btn--primary' : ''}`;
                btn.textContent = i;
                btn.onclick = () => { currentPage = i; loadLeaderboard(i); };
                pagEl.appendChild(btn);
            }
        } catch (e) {
            document.getElementById('lbBody').innerHTML = '<tr><td colspan="4">加载失败</td></tr>';
        }
    }

    async function loadPersonalBest() {
        try {
            const data = await ApiClient.getPersonalBest();
            const el = document.getElementById('personalBest');
            el.innerHTML = `<h3>个人记录</h3>
                <p>总游戏: ${data.total_games} 次 | 胜率: ${data.win_rate}%</p>
                ${data.best_steps ? `<p>最少步数: ${data.best_steps.steps} 步</p>` : ''}
                ${data.best_time ? `<p>最快用时: ${Utils.formatTime(data.best_time.time_seconds)}</p>` : ''}`;
        } catch (e) {
            // Not logged in or no records
        }
    }

    await loadLeaderboard(1);
    await loadPersonalBest();
})();
