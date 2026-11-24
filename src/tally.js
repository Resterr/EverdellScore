// "Categories x players" scoring mode.
// Pure logic (categories, parsing, totals, ranking) first, UI below.

const TALLY_KEY = 'everdellscore.tally.v1';
const TALLY_EXPANSIONS = ['bellfaire', 'pearlbrook', 'spirecrest', 'newleaf'];
const SCORE_MIN = -99;
const SCORE_MAX = 999;

// label: i18n key, icon: file in img/, expansion: required switch,
// hidden: extra hide rule, multiplier: points per entered unit, negative: shows the ± button
const CATEGORIES = [
    { id: 'traveler', label: 'types.traveler', icon: 'traveler', group: 'cards', negative: true },
    { id: 'production', label: 'types.production', icon: 'production', group: 'cards' },
    { id: 'destination', label: 'types.destination', icon: 'destination', group: 'cards' },
    { id: 'governance', label: 'types.governance', icon: 'governance', group: 'cards' },
    { id: 'prosperity', label: 'types.prosperity', icon: 'prosperity', group: 'cards' },
    { id: 'prosperityBonus', label: 'tally.cat_prosperityBonus', icon: 'prosperity' },
    { id: 'tokens', label: 'tally.cat_tokens' },
    { id: 'journey', label: 'gen.journey', icon: 'journey' },
    // Same rule as the card mode (deck.js available_npearlbrook)
    { id: 'basicEvents', label: 'gen.basicevent', icon: 'basicevent', hidden: (exp) => exp.pearlbrook },
    { id: 'specialEvents', label: 'gen.specialevent', icon: 'specialevent' },
    { id: 'garland', label: 'gen.garlandaward', icon: 'garlandaward', expansion: 'bellfaire' },
    { id: 'pearls', label: 'tally.cat_pearls', expansion: 'pearlbrook', multiplier: 2 },
    { id: 'wonders', label: 'gen.wonders', icon: 'wonder25', expansion: 'pearlbrook' },
    { id: 'adornments', label: 'gen.adornments', icon: 'adornments', expansion: 'pearlbrook' },
    { id: 'expeditions', label: 'gen.expeditions', icon: 'expeditions', expansion: 'spirecrest' },
    { id: 'discoveries', label: 'gen.discoveries', icon: 'discoveries', expansion: 'spirecrest' },
    { id: 'visitors', label: 'gen.visitors', icon: 'visitors', expansion: 'newleaf' },
    { id: 'other', label: 'tally.cat_other', negative: true }
];

function visibleCategories(expansions) {
    return CATEGORIES.filter((cat) =>
        (!cat.expansion || expansions[cat.expansion]) && !(cat.hidden && cat.hidden(expansions)));
}

// Returns { value, valid }. Empty / lone minus = null (counts as 0) and valid.
function parseScore(text) {
    const s = String(text).trim().replace(/[−–]/g, '-').replace(/^\+/, '');
    if (s === '' || s === '-') return { value: null, valid: true };
    if (!/^-?\d{1,3}$/.test(s)) return { value: null, valid: false };
    const n = parseInt(s, 10);
    if (n < SCORE_MIN || n > SCORE_MAX) return { value: null, valid: false };
    return { value: n, valid: true };
}

function categoryPoints(cat, value) {
    return (value || 0) * (cat.multiplier || 1);
}

function computeTotals(scores, categories, playerCount) {
    const totals = Array(playerCount).fill(0);
    for (const cat of categories) {
        const row = scores[cat.id] || [];
        for (let p = 0; p < playerCount; p++) totals[p] += categoryPoints(cat, row[p]);
    }
    return totals;
}

// Standard competition ranking: 10, 10, 7 -> 1, 1, 3
function computeRanks(totals) {
    return totals.map((t) => 1 + totals.filter((o) => o > t).length);
}

function hasAnyScore(scores, categories, playerCount) {
    return categories.some((cat) => (scores[cat.id] || []).slice(0, playerCount).some((v) => v !== null && v !== undefined));
}

if (typeof module !== 'undefined') {
    module.exports = { CATEGORIES, visibleCategories, parseScore, categoryPoints, computeTotals, computeRanks, hasAnyScore };
}

// ---------------------------------------------------------------- UI

// Small DOM helper. Text always goes through textContent, so user names can't inject HTML.
function h(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
        if (value === null || value === undefined || value === false) continue;
        if (key === 'text') el.textContent = value;
        else if (key === 'class') el.className = value;
        else if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
        else el.setAttribute(key, value === true ? '' : value);
    }
    for (const child of [].concat(children)) {
        if (child) el.append(child);
    }
    return el;
}

class TallyApp {
    constructor() {
        this.players = PlayersStore.load();
        this.state = this.loadState();
        this.saveTimer = null;
        this.lastFocused = {}; // category id -> last focused input in that row

        this.bindStatic();
        this.render();
    }

    // ---------- state

    defaultState() {
        const expansions = {};
        TALLY_EXPANSIONS.forEach((e) => expansions[e] = false);
        return { version: 1, expansions: expansions, scores: {} };
    }

    loadState() {
        const state = this.defaultState();
        try {
            const saved = JSON.parse(localStorage.getItem(TALLY_KEY));
            if (saved && saved.version === 1) {
                TALLY_EXPANSIONS.forEach((e) => state.expansions[e] = !!(saved.expansions || {})[e]);
                for (const cat of CATEGORIES) {
                    const row = (saved.scores || {})[cat.id];
                    if (Array.isArray(row)) {
                        state.scores[cat.id] = Array.from({ length: MAX_PLAYERS }, (_, i) =>
                            Number.isInteger(row[i]) ? row[i] : null);
                    }
                }
            }
        } catch (e) {
            // corrupted storage: start fresh
        }
        return state;
    }

    saveState() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            this.state.updatedAt = new Date().toISOString();
            try {
                localStorage.setItem(TALLY_KEY, JSON.stringify(this.state));
            } catch (e) { /* storage unavailable */ }
        }, 200);
    }

    flushSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
            this.saveTimer = null;
            try {
                localStorage.setItem(TALLY_KEY, JSON.stringify(this.state));
            } catch (e) { /* storage unavailable */ }
        }
    }

    getRow(catId) {
        if (!this.state.scores[catId]) this.state.scores[catId] = Array(MAX_PLAYERS).fill(null);
        return this.state.scores[catId];
    }

    get count() { return this.players.playerCount; }

    get categories() { return visibleCategories(this.state.expansions); }

    // ---------- static parts of the page

    bindStatic() {
        const langSelect = document.getElementById('lang-select');
        langSelect.value = SUPPORTED_LANGUAGES.includes(i18next.language) ? i18next.language : 'en';
        langSelect.addEventListener('change', () => {
            i18next.changeLanguage(langSelect.value, () => {
                document.documentElement.lang = i18next.language;
                this.render();
            });
        });

        document.getElementById('btn-newgame').addEventListener('click', () => this.newGame());
        document.getElementById('btn-results').addEventListener('click', () => this.showResults());
        window.addEventListener('pagehide', () => this.flushSave());

        const settings = document.getElementById('tally-settings');
        settings.open = !hasAnyScore(this.state.scores, this.categories, this.count);
    }

    localizeStatic() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = i18next.t(el.getAttribute('data-i18n'));
        });
        document.querySelectorAll('[data-i18n-title]').forEach((el) => {
            el.title = i18next.t(el.getAttribute('data-i18n-title'));
        });
    }

    // ---------- rendering

    render() {
        this.localizeStatic();
        document.getElementById('tally').style.setProperty('--n', this.count);
        this.renderSettings();
        this.renderHead();
        this.renderBody();
        this.updateTotals();
    }

    renderSettings() {
        // player count
        const countGroup = document.getElementById('player-count');
        countGroup.replaceChildren();
        for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n++) {
            const id = 'pc' + n;
            countGroup.append(
                h('input', {
                    type: 'radio', class: 'btn-check', name: 'playercount', id: id, value: n,
                    checked: n === this.count, autocomplete: 'off',
                    onchange: () => this.setPlayerCount(n)
                }),
                h('label', { class: 'btn btn-outline-dark', for: id, text: String(n) })
            );
        }

        // names
        const names = document.getElementById('player-names');
        names.replaceChildren();
        for (let p = 0; p < this.count; p++) {
            const input = h('input', {
                type: 'text', class: 'form-control', id: 'name' + p,
                maxlength: MAX_NAME_LENGTH, autocomplete: 'off', autocapitalize: 'words',
                spellcheck: 'false', enterkeyhint: p < this.count - 1 ? 'next' : 'done',
                placeholder: i18next.t('gen.player', { number: p + 1 }).trim(),
                'aria-label': i18next.t('gen.player', { number: p + 1 }).trim(),
                oninput: (e) => this.setName(p, e.target.value),
                onchange: (e) => { e.target.value = this.players.names[p] || ''; },
                onkeydown: (e) => this.onEnter(e, '#player-names input')
            });
            input.value = this.players.names[p] || '';
            names.append(input);
        }

        // expansions
        const exp = document.getElementById('tally-expansions');
        exp.replaceChildren();
        for (const e of TALLY_EXPANSIONS) {
            const id = 'exp-' + e;
            exp.append(h('div', { class: 'form-check form-switch' }, [
                h('input', {
                    class: 'form-check-input', type: 'checkbox', id: id, checked: this.state.expansions[e],
                    onchange: (ev) => this.setExpansion(e, ev.target.checked)
                }),
                h('label', { class: 'form-check-label', for: id, text: i18next.t('expansion.' + e) })
            ]));
        }
    }

    renderHead() {
        const head = document.getElementById('tally-head');
        head.replaceChildren();
        for (let p = 0; p < this.count; p++) {
            const name = PlayersStore.displayName(this.players, p);
            head.append(h('div', { class: 'head-cell', id: 'head' + p }, [
                h('div', { class: 'head-name', title: name, text: name }),
                h('div', { class: 'head-total', id: 'total' + p, text: '0' }),
                h('div', { class: 'head-place', id: 'place' + p })
            ]));
        }
    }

    renderBody() {
        const body = document.getElementById('tally-body');
        body.replaceChildren();
        let lastGroup = null;
        for (const cat of this.categories) {
            if (cat.group && cat.group !== lastGroup) {
                body.append(h('h3', { class: 'tally-group', text: i18next.t('tally.group_' + cat.group) }));
            }
            lastGroup = cat.group || null;
            body.append(this.renderCategory(cat));
        }
    }

    renderCategory(cat) {
        const label = i18next.t(cat.label);
        const header = h('div', { class: 'cat-header' }, [
            cat.icon ? h('img', { src: 'img/' + cat.icon + '.png', alt: '', width: 24, height: 24 }) : h('span', { class: 'cat-noicon' }),
            h('span', { class: 'cat-label', text: label })
        ]);
        if (cat.negative) {
            header.append(h('button', {
                type: 'button', class: 'btn btn-sm btn-outline-dark cat-sign',
                text: '±', title: i18next.t('tally.toggle_sign'), 'aria-label': i18next.t('tally.toggle_sign'),
                // pointerdown + preventDefault keeps the keyboard open on phones
                onpointerdown: (e) => e.preventDefault(),
                onclick: () => this.toggleSign(cat)
            }));
        }

        const row = this.getRow(cat.id);
        const grid = h('div', { class: 'tally-grid' });
        for (let p = 0; p < this.count; p++) {
            const input = h('input', {
                type: 'text', class: 'form-control score-input', inputmode: 'numeric',
                pattern: '-?[0-9]*', autocomplete: 'off', enterkeyhint: 'next', placeholder: '0',
                'data-cat': cat.id, 'data-player': p,
                'aria-label': label + ' - ' + PlayersStore.displayName(this.players, p),
                oninput: (e) => this.onScoreInput(cat, p, e.target, false),
                onblur: (e) => this.onScoreInput(cat, p, e.target, true),
                onfocus: (e) => this.onScoreFocus(cat, p, e.target),
                onkeydown: (e) => this.onEnter(e, '.score-input')
            });
            input.value = row[p] === null || row[p] === undefined ? '' : String(row[p]);
            grid.append(input);
        }

        return h('section', { class: 'cat', id: 'cat-' + cat.id }, [header, grid]);
    }

    // ---------- interactions

    onScoreFocus(cat, player, input) {
        this.lastFocused[cat.id] = input;
        document.querySelectorAll('.head-cell').forEach((el, i) => el.classList.toggle('focus-col', i === player));
        // iOS needs the delay to keep the selection
        setTimeout(() => input.select(), 0);
    }

    onScoreInput(cat, player, input, final) {
        const parsed = parseScore(input.value);
        this.getRow(cat.id)[player] = parsed.value;
        input.classList.toggle('is-invalid', !parsed.valid && (final || input.value.trim().length > 4));
        if (final) {
            if (parsed.valid) input.value = parsed.value === null ? '' : String(parsed.value);
            document.querySelectorAll('.head-cell').forEach((el) => el.classList.remove('focus-col'));
        }
        this.updateTotals();
        this.saveState();
    }

    onEnter(e, selector) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll(selector));
        const next = inputs[inputs.indexOf(e.target) + 1];
        if (next) next.focus();
        else e.target.blur();
    }

    toggleSign(cat) {
        const active = document.activeElement;
        const input = active && active.dataset && active.dataset.cat === cat.id ? active : this.lastFocused[cat.id];
        if (!input || !input.isConnected) return;
        const parsed = parseScore(input.value);
        if (parsed.value === null) {
            input.value = input.value.trim().startsWith('-') ? '' : '-';
        } else {
            input.value = String(-parsed.value);
        }
        this.onScoreInput(cat, parseInt(input.dataset.player, 10), input, false);
        input.focus();
    }

    updateTotals() {
        const cats = this.categories;
        const totals = computeTotals(this.state.scores, cats, this.count);
        const ranks = computeRanks(totals);
        const any = hasAnyScore(this.state.scores, cats, this.count);
        for (let p = 0; p < this.count; p++) {
            document.getElementById('total' + p).textContent = totals[p];
            document.getElementById('place' + p).textContent = any ? ranks[p] + '.' : '';
            document.getElementById('head' + p).classList.toggle('winner', any && ranks[p] === 1);
        }
    }

    setName(index, value) {
        this.players.names[index] = PlayersStore.normalizeName(value);
        PlayersStore.save(this.players);
        const name = PlayersStore.displayName(this.players, index);
        const cell = document.querySelector('#head' + index + ' .head-name');
        cell.textContent = name;
        cell.title = name;
    }

    setPlayerCount(n) {
        this.players.playerCount = PlayersStore.clampCount(n);
        PlayersStore.save(this.players);
        this.render();
    }

    setExpansion(name, enabled) {
        this.state.expansions[name] = enabled;
        this.saveState();
        this.render();
    }

    newGame() {
        if (hasAnyScore(this.state.scores, CATEGORIES, MAX_PLAYERS) && !window.confirm(i18next.t('tally.newgame_confirm'))) return;
        this.state.scores = {};
        this.saveState();
        this.render();
        window.scrollTo(0, 0);
    }

    // ---------- results

    showResults() {
        const cats = this.categories;
        const totals = computeTotals(this.state.scores, cats, this.count);
        const ranks = computeRanks(totals);
        const any = hasAnyScore(this.state.scores, cats, this.count);
        const names = Array.from({ length: this.count }, (_, p) => PlayersStore.displayName(this.players, p));

        const winners = names.filter((_, p) => ranks[p] === 1);
        let headline;
        if (!any) headline = i18next.t('tally.noscores');
        // Names are concatenated (not interpolated) so i18next never HTML-escapes them
        else headline = i18next.t(winners.length > 1 ? 'tally.tie' : 'tally.winner') + ': ' + winners.join(', ');
        document.getElementById('results-headline').textContent = headline;

        const winnerClass = (p) => any && ranks[p] === 1 ? 'winner' : null;
        const thead = h('thead', {}, h('tr', {}, [
            h('th', { scope: 'col', text: i18next.t('tally.category') }),
            ...names.map((n, p) => h('th', { scope: 'col', class: winnerClass(p), text: n }))
        ]));
        const tbody = h('tbody', {}, cats.map((cat) => {
            const row = this.state.scores[cat.id] || [];
            return h('tr', {}, [
                h('th', { scope: 'row', text: i18next.t(cat.label) }),
                ...names.map((_, p) => h('td', { class: winnerClass(p), text: String(categoryPoints(cat, row[p])) }))
            ]);
        }));
        const tfoot = h('tfoot', {}, [
            h('tr', {}, [h('th', { scope: 'row', text: i18next.t('tally.total') }),
            ...totals.map((t, p) => h('td', { class: winnerClass(p), text: String(t) }))]),
            h('tr', {}, [h('th', { scope: 'row', text: i18next.t('tally.place') }),
            ...ranks.map((r, p) => h('td', { class: winnerClass(p), text: any ? r + '.' : '' }))])
        ]);

        document.getElementById('results-table').replaceChildren(thead, tbody, tfoot);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('results-modal')).show();
    }
}

if (typeof document !== 'undefined') {
    initI18n(() => { window.tally = new TallyApp(); });
}
