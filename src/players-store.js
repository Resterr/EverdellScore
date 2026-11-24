// Player count and names shared by both modes, persisted in localStorage.
// A name of null means "use the default label in the current language" (e.g. "Gracz 2" / "Player 2").

const PLAYERS_KEY = 'everdellscore.players.v1';
const MIN_PLAYERS = 1;
const MAX_PLAYERS = 6;
const MAX_NAME_LENGTH = 20;

const PlayersStore = {
    defaults() {
        return { version: 1, playerCount: 4, names: Array(MAX_PLAYERS).fill(null) };
    },

    load() {
        const data = this.defaults();
        try {
            const saved = JSON.parse(localStorage.getItem(PLAYERS_KEY));
            if (saved && saved.version === 1) {
                data.playerCount = this.clampCount(saved.playerCount);
                if (Array.isArray(saved.names)) {
                    for (let i = 0; i < MAX_PLAYERS; i++) {
                        data.names[i] = this.normalizeName(saved.names[i]);
                    }
                }
            }
        } catch (e) {
            // corrupted or unavailable storage: start with defaults
        }
        return data;
    },

    save(data) {
        try {
            localStorage.setItem(PLAYERS_KEY, JSON.stringify(data));
        } catch (e) {
            // private mode / quota: the app keeps working without persistence
        }
    },

    clampCount(value) {
        const n = parseInt(value, 10);
        if (isNaN(n)) return 4;
        return Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, n));
    },

    // Accepts any Unicode letters (Polish diacritics, English names, etc.).
    // Only trims, unifies the Unicode form and limits the length.
    normalizeName(value) {
        if (typeof value !== 'string') return null;
        const name = value.normalize('NFC').trim().slice(0, MAX_NAME_LENGTH);
        return name.length ? name : null;
    },

    // Label shown in the UI: own name, or the translated default.
    displayName(data, index) {
        return data.names[index] || i18next.t('gen.player', { number: index + 1 }).trim();
    }
};

if (typeof module !== 'undefined') module.exports = { PlayersStore, MAX_PLAYERS };
