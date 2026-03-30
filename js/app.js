/**
 * Application entry point.
 */
(async function () {
    // Initialize auth
    await AuthManager.init();

    // Initialize game engine and board
    const engine = new GameEngine();
    GameBoard.init(engine);

    // Try to load saved progress
    try {
        const progress = await ApiClient.loadProgress();
        if (progress.state_json && progress.state_json.status === 'playing') {
            Object.assign(engine.state, progress.state_json);
            GameBoard.render();
        }
    } catch (e) {
        // No saved progress, start fresh
    }
})();
