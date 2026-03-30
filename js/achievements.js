/**
 * Achievements page logic.
 */
(async function () {
    const icons = { trophy: '🏆', star: '⭐', brain: '🧠', medal: '🏅', lightning: '⚡' };

    try {
        const data = await ApiClient.getAchievements();
        document.getElementById('achProgress').textContent =
            `${data.unlocked_count} / ${data.total} 已解锁`;

        const grid = document.getElementById('achGrid');
        grid.innerHTML = data.items.map(a => {
            const cls = a.unlocked ? 'unlocked' : 'locked';
            const icon = icons[a.icon] || '🎯';
            const time = a.unlocked_at
                ? `<div class="ach-time">${new Date(a.unlocked_at).toLocaleDateString('zh-CN')}</div>`
                : '';
            return `<div class="ach-item ${cls}" data-testid="ach-${a.id}">
                <div class="ach-icon">${icon}</div>
                <div class="ach-name">${a.name}</div>
                <div class="ach-desc">${a.description}</div>
                ${time}
            </div>`;
        }).join('');
    } catch (e) {
        document.getElementById('achGrid').innerHTML = '<p>加载失败，请先开始游戏</p>';
    }
})();
