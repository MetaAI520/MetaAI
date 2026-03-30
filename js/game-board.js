/**
 * Game board renderer - DOM manipulation and event handling.
 */
const GameBoard = {
    engine: null,
    timerInterval: null,
    startTime: null,
    lastRecordId: null,

    init(engine) {
        this.engine = engine;
        this._bindEvents();
        this.render();
    },

    _bindEvents() {
        document.getElementById('leftBank').addEventListener('click', (e) => this._onBankClick(e));
        document.getElementById('rightBank').addEventListener('click', (e) => this._onBankClick(e));
        document.getElementById('boatPassenger').addEventListener('click', () => this._onBoatPassengerClick());
        document.getElementById('crossBtn').addEventListener('click', () => this._onCross());
        document.getElementById('undoBtn').addEventListener('click', () => this._onUndo());
        document.getElementById('hintBtn').addEventListener('click', () => this._onHint());
        document.getElementById('restartBtn').addEventListener('click', () => this._onRestart());
        document.getElementById('playAgainBtn').addEventListener('click', () => this._onRestart());
        document.getElementById('shareBtn').addEventListener('click', () => ShareManager.share(this.lastRecordId));
        document.getElementById('historyToggle').addEventListener('click', () => this._toggleHistory());
    },

    _onBankClick(e) {
        const charEl = e.target.closest('.character');
        if (!charEl || AnimationController.isAnimating) return;
        const id = charEl.dataset.character;
        if (this.engine.loadItem(id)) {
            this._startTimerIfNeeded();
            this.render();
        }
    },

    _onBoatPassengerClick() {
        if (AnimationController.isAnimating) return;
        if (this.engine.unloadItem()) this.render();
    },

    async _onCross() {
        if (AnimationController.isAnimating) return;
        this._startTimerIfNeeded();

        const state = this.engine.getState();
        const direction = state.boatSide === 'left' ? 'right' : 'left';

        const result = this.engine.crossRiver();
        if (!result) return;

        const boatEl = document.getElementById('boat');
        await AnimationController.playCrossAnimation(boatEl, direction);
        this.render();

        if (result.status === 'lose') {
            this._stopTimer();
            await AnimationController.playDangerAnimation(
                document.querySelectorAll('.character--sheep')
            );
            this._showResult('失败', result.reason, false);
        } else if (result.status === 'win') {
            this._stopTimer();
            await AnimationController.playVictoryAnimation(
                document.querySelectorAll('.bank--right .character')
            );
            await this._saveAndCheckAchievements();
            this._showResult('恭喜通关！', '', true);
        }

        this._autoSaveProgress();
    },

    _onUndo() {
        if (this.engine.undo()) this.render();
    },

    _onHint() {
        const hint = this.engine.getHint();
        if (!hint) return;
        this._startTimerIfNeeded();

        // Highlight the suggested character
        const step = hint.nextStep;
        if (step.passenger) {
            const charEls = document.querySelectorAll(`[data-character="${step.passenger}"]`);
            charEls.forEach(el => {
                el.classList.add('character--highlight');
                setTimeout(() => el.classList.remove('character--highlight'), 2000);
            });
        }
        this.render();
    },

    _onRestart() {
        this._stopTimer();
        this.startTime = null;
        this.engine.reset();
        document.getElementById('resultModal').style.display = 'none';
        this.render();
    },

    render() {
        const state = this.engine.getState();

        // Update step counter and timer
        document.getElementById('stepCount').textContent = state.steps;

        // Render banks
        this._renderBank('leftCharacters', state.leftBank);
        this._renderBank('rightCharacters', state.rightBank);

        // Render boat passenger
        const passengerEl = document.getElementById('boatPassenger');
        passengerEl.innerHTML = state.boatPassenger
            ? this._createCharacterHTML(state.boatPassenger) : '';

        // Boat position
        const boatEl = document.getElementById('boat');
        boatEl.classList.remove('boat--left', 'boat--right');
        boatEl.classList.add(`boat--${state.boatSide}`);

        // Button states
        document.getElementById('undoBtn').disabled = state.history.length === 0;
        document.getElementById('crossBtn').disabled = state.status !== 'playing';

        // History
        this._renderHistory(state.history);
    },

    _renderBank(containerId, characters) {
        const container = document.getElementById(containerId);
        container.innerHTML = characters.map(c => this._createCharacterHTML(c)).join('');
    },

    _createCharacterHTML(id) {
        return `<div class="character character--${id}" data-character="${id}" data-testid="character-${id}"></div>`;
    },

    _renderHistory(history) {
        const list = document.getElementById('historyList');
        const names = { wolf: '狼', sheep: '羊', cabbage: '白菜' };
        const sides = { left: '左岸', right: '右岸' };
        list.innerHTML = history.map(h => {
            const cargo = h.passenger ? `带${names[h.passenger]}` : '空船';
            return `<li>第${h.stepNumber}步: 农夫${cargo}从${sides[h.from]}到${sides[h.to]}</li>`;
        }).join('');
    },

    _toggleHistory() {
        const list = document.getElementById('historyList');
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
    },

    _startTimerIfNeeded() {
        if (this.startTime) return;
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.engine.state.timeElapsed = elapsed;
            document.getElementById('timer').textContent = Utils.formatTime(elapsed);
        }, 1000);
    },

    _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    },

    async _saveAndCheckAchievements() {
        const state = this.engine.getState();
        try {
            const record = await ApiClient.saveRecord({
                steps: state.steps,
                time_seconds: state.timeElapsed,
                result: state.status,
                used_hints: state.usedHints,
                hint_count: state.hintCount,
            });
            this.lastRecordId = record.id;

            const achievements = await ApiClient.checkAchievements(record.id);
            if (achievements.newly_unlocked) {
                achievements.newly_unlocked.forEach(a => {
                    AnimationController.showAchievementToast(a.name);
                });
            }
        } catch (err) {
            console.error('Save failed:', err);
        }
    },

    _autoSaveProgress: Utils.debounce(async function () {
        const state = GameBoard.engine.getState();
        if (state.status === 'playing') {
            try { await ApiClient.saveProgress(state); } catch (e) { /* silent */ }
        }
    }, 2000),

    _showResult(title, message, isWin) {
        const state = this.engine.getState();
        document.getElementById('resultTitle').textContent = title;
        document.getElementById('resultMessage').textContent = message;
        document.getElementById('resultStats').innerHTML = isWin
            ? `<p>步数: ${state.steps} (最优: 7步)</p>
               <p>用时: ${Utils.formatTime(state.timeElapsed)}</p>
               <p>提示: ${state.usedHints ? state.hintCount + '次' : '未使用'}</p>`
            : '';
        document.getElementById('shareBtn').style.display = isWin ? 'inline-block' : 'none';
        document.getElementById('resultModal').style.display = 'flex';
    },
};
