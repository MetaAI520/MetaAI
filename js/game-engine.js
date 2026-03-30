/**
 * Core game engine - state management, rules, BFS solver.
 */
class GameEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.state = {
            leftBank: ['wolf', 'sheep', 'cabbage'],
            rightBank: [],
            boatSide: 'left',
            boatPassenger: null,
            steps: 0,
            timeElapsed: 0,
            history: [],
            status: 'playing',
            hintCount: 0,
            usedHints: false,
            failReason: null,
        };
    }

    getState() { return { ...this.state }; }

    /** Load a character onto the boat */
    loadItem(characterId) {
        if (this.state.status !== 'playing') return false;
        const bank = this.state.boatSide === 'left' ? 'leftBank' : 'rightBank';
        if (!this.state[bank].includes(characterId)) return false;

        if (this.state.boatPassenger) {
            this.state[bank].push(this.state.boatPassenger);
        }
        this.state[bank] = this.state[bank].filter(c => c !== characterId);
        this.state.boatPassenger = characterId;
        return true;
    }

    /** Unload character from boat to current bank */
    unloadItem() {
        if (!this.state.boatPassenger) return false;
        const bank = this.state.boatSide === 'left' ? 'leftBank' : 'rightBank';
        this.state[bank].push(this.state.boatPassenger);
        this.state.boatPassenger = null;
        return true;
    }

    /** Cross the river */
    crossRiver() {
        if (this.state.status !== 'playing') return null;

        // Save state for undo
        this.state.history.push({
            stepNumber: this.state.steps + 1,
            passenger: this.state.boatPassenger,
            from: this.state.boatSide,
            to: this.state.boatSide === 'left' ? 'right' : 'left',
            snapshot: JSON.parse(JSON.stringify({
                leftBank: this.state.leftBank,
                rightBank: this.state.rightBank,
                boatSide: this.state.boatSide,
                boatPassenger: this.state.boatPassenger,
            })),
        });

        // Move boat and passenger
        const from = this.state.boatSide === 'left' ? 'leftBank' : 'rightBank';
        const to = this.state.boatSide === 'left' ? 'rightBank' : 'leftBank';

        if (this.state.boatPassenger) {
            this.state[to].push(this.state.boatPassenger);
            this.state.boatPassenger = null;
        }

        this.state.boatSide = this.state.boatSide === 'left' ? 'right' : 'left';
        this.state.steps++;

        // Check danger
        const danger = this._checkDanger();
        if (danger) {
            this.state.status = 'lose';
            this.state.failReason = danger;
            return { status: 'lose', reason: danger };
        }

        // Check victory
        if (this._checkVictory()) {
            this.state.status = 'win';
            return { status: 'win' };
        }

        return { status: 'playing' };
    }

    _checkDanger() {
        // Check the bank where farmer is NOT
        const unsupervisedBank = this.state.boatSide === 'left'
            ? this.state.rightBank : this.state.leftBank;

        const hasWolf = unsupervisedBank.includes('wolf');
        const hasSheep = unsupervisedBank.includes('sheep');
        const hasCabbage = unsupervisedBank.includes('cabbage');

        if (hasWolf && hasSheep) return '狼吃了羊！';
        if (hasSheep && hasCabbage) return '羊吃了白菜！';
        return null;
    }

    _checkVictory() {
        return this.state.rightBank.length === 3
            && this.state.boatSide === 'right'
            && this.state.leftBank.length === 0;
    }

    /** Undo last move */
    undo() {
        if (this.state.history.length === 0) return false;
        const last = this.state.history.pop();
        this.state.leftBank = last.snapshot.leftBank;
        this.state.rightBank = last.snapshot.rightBank;
        this.state.boatSide = last.snapshot.boatSide;
        this.state.boatPassenger = last.snapshot.boatPassenger;
        this.state.steps--;
        this.state.status = 'playing';
        this.state.failReason = null;
        return true;
    }

    /** BFS to find optimal next step from current state */
    getHint() {
        const path = this._solveBFS();
        if (!path || path.length === 0) return null;
        this.state.hintCount++;
        this.state.usedHints = true;
        return { nextStep: path[0], fullPath: path };
    }

    getOptimalPath() { return this._solveBFS(); }

    _solveBFS() {
        const initial = {
            left: new Set(this.state.leftBank),
            right: new Set(this.state.rightBank),
            boat: this.state.boatSide,
        };
        const goal = (s) => s.left.size === 0 && s.boat === 'right';
        const stateKey = (s) => [...s.left].sort().join(',') + '|' + [...s.right].sort().join(',') + '|' + s.boat;
        const isDangerous = (bank) => {
            return (bank.has('wolf') && bank.has('sheep')) || (bank.has('sheep') && bank.has('cabbage'));
        };

        const queue = [{ state: initial, path: [] }];
        const visited = new Set([stateKey(initial)]);
        const items = ['wolf', 'sheep', 'cabbage'];

        while (queue.length > 0) {
            const { state: cur, path } = queue.shift();
            const fromBank = cur.boat === 'left' ? cur.left : cur.right;
            const toBank = cur.boat === 'left' ? cur.right : cur.left;
            const nextBoat = cur.boat === 'left' ? 'right' : 'left';

            // Try moving with each item or empty
            const candidates = [null, ...items.filter(i => fromBank.has(i))];
            for (const item of candidates) {
                const newLeft = new Set(cur.left);
                const newRight = new Set(cur.right);

                if (item) {
                    if (cur.boat === 'left') { newLeft.delete(item); newRight.add(item); }
                    else { newRight.delete(item); newLeft.add(item); }
                }

                // Check danger on the bank farmer is leaving
                const unsupervised = nextBoat === 'right' ? newLeft : newRight;
                if (isDangerous(unsupervised)) continue;

                const next = { left: newLeft, right: newRight, boat: nextBoat };
                const key = stateKey(next);
                if (visited.has(key)) continue;
                visited.add(key);

                const step = { passenger: item, from: cur.boat, to: nextBoat };
                const newPath = [...path, step];

                if (goal(next)) return newPath;
                queue.push({ state: next, path: newPath });
            }
        }
        return null;
    }
}
