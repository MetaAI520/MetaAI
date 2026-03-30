/**
 * Share manager for generating share cards and links.
 */
const ShareManager = {
    async share(recordId) {
        if (!recordId) return;
        try {
            const data = await ApiClient.generateShareCard(recordId);
            const shareUrl = `${window.location.origin}/index.html?share=${data.share_token}`;
            const text = `我在农夫过河游戏中用${data.steps}步、${Utils.formatTime(data.time_seconds)}完成了挑战！来试试吧：${shareUrl}`;

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                alert('分享链接已复制到剪贴板！');
            } else {
                prompt('复制以下内容分享：', text);
            }
        } catch (e) {
            console.error('Share failed:', e);
            alert('分享失败，请稍后重试');
        }
    },
};
