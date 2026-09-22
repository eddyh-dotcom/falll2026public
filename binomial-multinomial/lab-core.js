/* ==========================================================================
 * Study Lab Core — shared engine for the Fall 2026 course study apps.
 *
 * Load order in index.html:   lab-core.js  →  content.js  →  visualizers.js
 *
 * content.js must define:
 *   LabConfig      { name, shortName, storageKey, defaultReference,
 *                    modules: { [tabId]: { title, desc } } }
 *   ReferenceData  { [refId]: { title, sections: [ { heading, text, formula, bullets, note } ] } }
 *   QuizGenerators { [topicKey]: [ () => question, ... ] }
 *   QuizModes      { [modeId]: { label, kind: 'topics' | 'custom', build?: () => void } }
 *   (optional) MatchingQuestions, SetupQuestions, ConceptPairs, FinalBlueprint
 *
 * visualizers.js must define:
 *   Visualizers    { [tabId]: { init(), resize?(), onSubTab?(sub, group) } }
 *
 * A question object looks like:
 *   { topic, questionText (HTML + $inline$), mathText (LaTeX or ''), options: [...],
 *     answerIndex, isTextOptions (options are HTML w/ $inline$ instead of raw LaTeX),
 *     explanation (HTML + $inline$ / $$display$$), hideSetup? }
 * ========================================================================== */

/* --------------------------------------------------------------------------
 * 1. Application state & storage
 * -------------------------------------------------------------------------- */
const AppState = {
    currentTab: 'dashboard',
    currentSub: {},
    theme: 'dark',
    stats: { solved: 0, correct: 0, history: [] }
};

function labKey(suffix) {
    const base = (typeof LabConfig !== 'undefined' && LabConfig.storageKey) ? LabConfig.storageKey : 'study_lab';
    return `${base}_${suffix}`;
}

function loadStats() {
    try {
        const saved = localStorage.getItem(labKey('stats'));
        if (saved) AppState.stats = JSON.parse(saved);
    } catch (e) { /* ignore */ }
}

function saveStats() {
    try { localStorage.setItem(labKey('stats'), JSON.stringify(AppState.stats)); } catch (e) { /* ignore */ }
}

/* --------------------------------------------------------------------------
 * 2. Navigation
 * -------------------------------------------------------------------------- */
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    const view = document.getElementById(`view-${tabId}`);
    const btn = document.querySelector(`.nav-btn[data-tab="${tabId}"]`);
    if (!view) return;
    view.classList.add('active');
    if (btn) btn.classList.add('active');
    AppState.currentTab = tabId;
    updateHeader(tabId);
    setTimeout(() => activateModule(tabId), 50);
}

function updateHeader(tabId) {
    const titleEl = document.getElementById('current-module-title');
    const descEl = document.getElementById('current-module-desc');
    const mod = (typeof LabConfig !== 'undefined' && LabConfig.modules) ? LabConfig.modules[tabId] : null;
    if (titleEl) titleEl.innerText = mod ? mod.title : tabId;
    if (descEl) descEl.innerText = mod ? (mod.desc || '') : '';
}

function activateModule(tabId) {
    if (typeof Visualizers === 'undefined') return;
    const mod = Visualizers[tabId];
    if (!mod) return;
    try {
        if (!mod._inited && typeof mod.init === 'function') {
            mod.init();
            mod._inited = true;
        } else if (typeof mod.resize === 'function') {
            mod.resize();
        } else if (typeof mod.init === 'function') {
            mod.init();
        }
    } catch (e) {
        console.error(`Visualizer "${tabId}" failed:`, e);
    }
}

function initSubTabs() {
    document.querySelectorAll('.sub-tabs').forEach(group => {
        const groupName = group.getAttribute('data-group') || 'default';
        const view = group.closest('.tab-view');
        group.querySelectorAll('.sub-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                group.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const sub = btn.getAttribute('data-sub');
                const scope = view || document;
                scope.querySelectorAll(`.sub-panel[data-group="${groupName}"]`).forEach(p => {
                    p.classList.toggle('hidden', p.getAttribute('data-sub') !== sub);
                });
                AppState.currentSub[groupName] = sub;
                const tabId = view ? view.id.replace(/^view-/, '') : AppState.currentTab;
                const mod = (typeof Visualizers !== 'undefined') ? Visualizers[tabId] : null;
                if (mod && typeof mod.onSubTab === 'function') {
                    try { mod.onSubTab(sub, groupName); } catch (e) { console.error(e); }
                }
            });
        });
        // Ensure the initially-active sub-panel is the only visible one
        const activeBtn = group.querySelector('.sub-tab-btn.active') || group.querySelector('.sub-tab-btn');
        if (activeBtn) {
            const sub = activeBtn.getAttribute('data-sub');
            AppState.currentSub[groupName] = sub;
            const scope = view || document;
            scope.querySelectorAll(`.sub-panel[data-group="${groupName}"]`).forEach(p => {
                p.classList.toggle('hidden', p.getAttribute('data-sub') !== sub);
            });
        }
    });
}

function currentSub(groupName) {
    return AppState.currentSub[groupName || 'default'];
}

/* --------------------------------------------------------------------------
 * 3. Reference hub (KaTeX-rendered chapter sheets)
 * -------------------------------------------------------------------------- */
function displayReference(refId) {
    const container = document.getElementById('lecture-doc-card');
    if (!container || typeof ReferenceData === 'undefined') return;
    const data = ReferenceData[refId];
    if (!data) return;

    let html = `<h3 class="lecture-ref-title">${data.title}</h3>`;
    if (data.intro) html += `<p class="ref-intro">${parseInlineMath(data.intro)}</p>`;
    data.sections.forEach((sec, idx) => {
        html += `<div class="lecture-ref-block">`;
        if (sec.heading) html += `<h4>${sec.heading}</h4>`;
        if (sec.text) html += `<p>${parseInlineMath(sec.text)}</p>`;
        if (sec.bullets && sec.bullets.length) {
            html += `<ul>${sec.bullets.map(b => `<li>${parseInlineMath(b)}</li>`).join('')}</ul>`;
        }
        const formulas = Array.isArray(sec.formula) ? sec.formula : (sec.formula ? [sec.formula] : []);
        formulas.forEach((f, j) => {
            html += `<div class="math-latex-container" id="ref-formula-${refId}-${idx}-${j}"></div>`;
        });
        if (sec.note) html += `<p class="text-muted">${parseInlineMath(sec.note)}</p>`;
        html += `</div>`;
    });
    container.innerHTML = html;

    data.sections.forEach((sec, idx) => {
        const formulas = Array.isArray(sec.formula) ? sec.formula : (sec.formula ? [sec.formula] : []);
        formulas.forEach((f, j) => {
            const el = document.getElementById(`ref-formula-${refId}-${idx}-${j}`);
            if (!el) return;
            try {
                katex.render(f, el, { displayMode: true, throwOnError: false });
            } catch (e) { el.innerText = f; }
        });
    });
}

function initReferenceTabs() {
    document.querySelectorAll('.lecture-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lecture-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            displayReference(btn.getAttribute('data-lec'));
        });
    });
}

/* Inline $...$ → KaTeX (leaves everything else untouched). */
function parseInlineMath(text) {
    if (text == null) return '';
    return String(text).replace(/\$\$([\s\S]*?)\$\$/g, (m, math) => {
        try { return katex.renderToString(math, { displayMode: true, throwOnError: false }); }
        catch (e) { return m; }
    }).replace(/\$([^$\n]+?)\$/g, (m, math) => {
        try { return katex.renderToString(math, { displayMode: false, throwOnError: false }); }
        catch (e) { return m; }
    });
}

/* Render a LaTeX string into an element (display mode by default). */
function renderLatex(elOrId, latex, display = true) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    try { katex.render(latex, el, { displayMode: display, throwOnError: false }); }
    catch (e) { el.innerText = latex; }
}

/* Set innerHTML with $...$ parsed. */
function setMathHTML(elOrId, html) {
    const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
    if (!el) return;
    el.innerHTML = parseInlineMath(html);
}

/* --------------------------------------------------------------------------
 * 4. Small UI builders used by visualizer result panels
 * -------------------------------------------------------------------------- */
const LabUI = {
    kv(items) {
        return `<div class="kv-grid">${items.map(it =>
            `<div class="kv-item ${it.cls || ''}"><div class="kv-label">${it.label}</div><div class="kv-value">${it.value}</div></div>`
        ).join('')}</div>`;
    },
    table(headers, rows, opts = {}) {
        const cls = opts.tableClass || 'data-table';
        const maxH = opts.maxHeight ? `style="max-height:${opts.maxHeight}px"` : '';
        return `<div class="table-responsive" ${maxH}><table class="${cls}"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${
            rows.map(r => `<tr>${r.map(c => {
                if (c && typeof c === 'object' && 'v' in c) return `<td class="${c.cls || ''}">${c.v}</td>`;
                return `<td>${c}</td>`;
            }).join('')}</tr>`).join('')
        }</tbody></table></div>`;
    },
    steps(steps) {
        return `<div class="step-list">${steps.map((s, i) =>
            `<div class="step-item ${s.active ? 'active' : ''}">${s.title ? `<div class="step-title">${s.title}</div>` : ''}${parseInlineMath(s.body || '')}</div>`
        ).join('')}</div>`;
    },
    pill(text, cls = '') { return `<span class="pill ${cls}">${text}</span>`; },
    /* After injecting HTML that contains raw LaTeX in $...$ / $$...$$, call this. */
    typeset(elOrId) {
        const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
        if (!el || typeof renderMathInElement !== 'function') return;
        try {
            renderMathInElement(el, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        } catch (e) { /* ignore */ }
    }
};

/* --------------------------------------------------------------------------
 * 5. Theme manager
 * -------------------------------------------------------------------------- */
function initTheme() {
    const themeBtn = document.getElementById('toggle-theme-btn');
    const saved = localStorage.getItem(labKey('theme')) || 'dark';
    setTheme(saved);
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const cur = document.body.classList.contains('light-theme') ? 'light' : 'dark';
            setTheme(cur === 'dark' ? 'light' : 'dark');
        });
    }
}

function setTheme(theme) {
    const themeBtn = document.getElementById('toggle-theme-btn');
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        if (themeBtn) themeBtn.innerHTML = '<i data-lucide="moon"></i>';
        AppState.theme = 'light';
    } else {
        document.body.classList.remove('light-theme');
        if (themeBtn) themeBtn.innerHTML = '<i data-lucide="sun"></i>';
        AppState.theme = 'dark';
    }
    localStorage.setItem(labKey('theme'), theme);
    if (window.lucide) lucide.createIcons();
    // Redraw whatever visualizer is on screen
    if (typeof Visualizers !== 'undefined') {
        const mod = Visualizers[AppState.currentTab];
        if (mod && mod._inited) {
            try { (mod.redraw || mod.resize || mod.init).call(mod); } catch (e) { /* ignore */ }
        }
    }
}

/* Colours that visualizers can use, resolved from the live CSS variables. */
function themePalette() {
    const css = getComputedStyle(document.body);
    const accentRgb = (css.getPropertyValue('--accent-rgb') || '45,212,191').trim();
    const dark = AppState.theme !== 'light';
    return {
        dark,
        accent: `rgb(${accentRgb})`,
        accentRgb,
        accentA: (a) => `rgba(${accentRgb}, ${a})`,
        primary: css.getPropertyValue('--primary').trim() || '#0d9488',
        text: dark ? '#f3f4f6' : '#0f172a',
        muted: dark ? '#9ca3af' : '#475569',
        faint: dark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.10)',
        axis: dark ? 'rgba(255,255,255,0.28)' : 'rgba(15,23,42,0.30)',
        grid: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        blue: '#60a5fa',
        purple: '#a78bfa',
        pink: '#f472b6',
        orange: '#fb923c',
        series: ['#f59e0b', '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#e879f9']
    };
}

/* --------------------------------------------------------------------------
 * 6. Math helpers
 * -------------------------------------------------------------------------- */

/* Compile a human-typed expression ("2x^2 + sin(x)y", "-x^2 + 4", "n!/2^n") into a JS
 * function of the given variable names.  Safe (no eval), supports implicit multiplication,
 * right-associative ^, unary minus with the usual math precedence (-x^2 = -(x^2)),
 * postfix factorial, and the functions listed in EXPR_FUNCS.  Returns null on error. */
const EXPR_FUNCS = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => 1 / Math.tan(x),
    sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, exp: Math.exp, ln: Math.log, log: Math.log, log10: Math.log10, log2: Math.log2,
    floor: Math.floor, ceil: Math.ceil, round: Math.round, sign: Math.sign,
    fact: (n) => labFact(n), factorial: (n) => labFact(n), gamma: (x) => labGamma(x),
    max: Math.max, min: Math.min, atan2: Math.atan2, pow: Math.pow, mod: (a, b) => ((a % b) + b) % b,
    binom: (n, k) => labBinom(n, k), choose: (n, k) => labBinom(n, k), hypot: Math.hypot,
    step: (x) => (x >= 0 ? 1 : 0), heaviside: (x) => (x >= 0 ? 1 : 0), u: (x) => (x >= 0 ? 1 : 0)
};
const EXPR_CONSTS = { pi: Math.PI, e: Math.E, inf: Infinity, infinity: Infinity };

function labFact(n) {
    if (!isFinite(n)) return NaN;
    if (Number.isInteger(n)) {
        if (n < 0) return NaN;
        if (n > 170) return Infinity;
        let r = 1; for (let i = 2; i <= n; i++) r *= i; return r;
    }
    return labGamma(n + 1);
}
function labGamma(x) { // Lanczos approximation
    if (x < 0.5) return Math.PI / (Math.sin(Math.PI * x) * labGamma(1 - x));
    x -= 1;
    const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    let a = c[0]; const t = x + g + 0.5;
    for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
    return Math.sqrt(2 * Math.PI) * Math.pow(t, x + 0.5) * Math.exp(-t) * a;
}
function labBinom(n, k) {
    if (!isFinite(n) || !isFinite(k)) return NaN;
    if (Number.isInteger(k) && k < 0) return 0;
    if (Number.isInteger(n) && Number.isInteger(k)) {
        if (n >= 0 && k > n) return 0;
        let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r);
    }
    return labGamma(n + 1) / (labGamma(k + 1) * labGamma(n - k + 1));
}

function compileExpr(expression, vars = ['x']) {
    try {
        const src = String(expression == null ? '' : expression).replace(/\*\*/g, '^').trim();
        if (!src) return null;
        const known = new Set([...Object.keys(EXPR_FUNCS), ...Object.keys(EXPR_CONSTS), ...vars]);
        // ---- tokenize ----
        const toks = [];
        let i = 0;
        while (i < src.length) {
            const c = src[i];
            if (/\s/.test(c)) { i++; continue; }
            if (/[0-9.]/.test(c)) {
                let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
                if ((src[j] === 'e' || src[j] === 'E') && /[0-9]/.test(src[j + 1] || '')) { j += 2; while (j < src.length && /[0-9]/.test(src[j])) j++; }
                else if ((src[j] === 'e' || src[j] === 'E') && /[+\-]/.test(src[j + 1] || '') && /[0-9]/.test(src[j + 2] || '')) { j += 3; while (j < src.length && /[0-9]/.test(src[j])) j++; }
                const v = parseFloat(src.slice(i, j)); if (!isFinite(v)) return null;
                toks.push({ t: 'num', v }); i = j; continue;
            }
            if (/[A-Za-z_]/.test(c)) {
                let j = i; while (j < src.length && /[A-Za-z_0-9]/.test(src[j])) j++;
                let word = src.slice(i, j); i = j;
                // split into known names (greedy longest match), so "xsin(x)" → x sin(x), "xy" → x y
                let p = 0;
                while (p < word.length) {
                    let best = null;
                    for (let L = word.length - p; L >= 1; L--) {
                        const cand = word.slice(p, p + L);
                        const lc = cand.toLowerCase();
                        if (known.has(cand)) { best = cand; break; }
                        if (known.has(lc)) { best = lc; break; }
                    }
                    if (!best) return null; // unknown identifier
                    toks.push({ t: 'id', v: best }); p += best.length;
                }
                continue;
            }
            if ('+-*/^(),!%'.includes(c)) { toks.push({ t: c }); i++; continue; }
            if (c === '×' || c === '·') { toks.push({ t: '*' }); i++; continue; }
            if (c === '÷') { toks.push({ t: '/' }); i++; continue; }
            if (c === '−') { toks.push({ t: '-' }); i++; continue; }
            if (c === 'π') { toks.push({ t: 'id', v: 'pi' }); i++; continue; }
            if (c === '[' ) { toks.push({ t: '(' }); i++; continue; }
            if (c === ']' ) { toks.push({ t: ')' }); i++; continue; }
            return null;
        }
        // ---- parse (precedence climbing → closure tree) ----
        let pos = 0;
        const peek = () => toks[pos];
        const next = () => toks[pos++];
        const startsAtom = (tk) => tk && (tk.t === 'num' || tk.t === 'id' || tk.t === '(');
        function parseAdd() {
            let left = parseMul();
            while (peek() && (peek().t === '+' || peek().t === '-')) {
                const op = next().t; const right = parseMul();
                const l = left, r = right;
                left = op === '+' ? (env) => l(env) + r(env) : (env) => l(env) - r(env);
            }
            return left;
        }
        function parseMul() {
            let left = parseUnary();
            for (;;) {
                const tk = peek();
                if (!tk) break;
                if (tk.t === '*' || tk.t === '/' || tk.t === '%') {
                    next(); const right = parseUnary(); const l = left, r = right;
                    left = tk.t === '*' ? (env) => l(env) * r(env) : tk.t === '/' ? (env) => l(env) / r(env) : (env) => l(env) % r(env);
                } else if (startsAtom(tk)) { // implicit multiplication
                    const right = parseUnary(); const l = left, r = right;
                    left = (env) => l(env) * r(env);
                } else break;
            }
            return left;
        }
        function parseUnary() {
            const tk = peek();
            if (tk && tk.t === '-') { next(); const r = parseUnary(); return (env) => -r(env); }
            if (tk && tk.t === '+') { next(); return parseUnary(); }
            return parsePow();
        }
        function parsePow() {
            const base = parsePostfix();
            if (peek() && peek().t === '^') {
                next(); const ex = parseUnary(); // right-assoc, allows x^-2
                return (env) => Math.pow(base(env), ex(env));
            }
            return base;
        }
        function parsePostfix() {
            let a = parseAtom();
            while (peek() && peek().t === '!') { next(); const b = a; a = (env) => labFact(b(env)); }
            return a;
        }
        function parseAtom() {
            const tk = next();
            if (!tk) throw new Error('unexpected end');
            if (tk.t === 'num') { const v = tk.v; return () => v; }
            if (tk.t === '(') {
                const e = parseAdd();
                if (!peek() || peek().t !== ')') throw new Error('missing )');
                next(); return e;
            }
            if (tk.t === 'id') {
                const name = tk.v;
                if (EXPR_FUNCS[name] && !vars.includes(name)) {
                    const fn = EXPR_FUNCS[name];
                    if (peek() && peek().t === '(') {
                        next();
                        const args = [];
                        if (peek() && peek().t !== ')') {
                            args.push(parseAdd());
                            while (peek() && peek().t === ',') { next(); args.push(parseAdd()); }
                        }
                        if (!peek() || peek().t !== ')') throw new Error('missing )');
                        next();
                        if (args.length === 1) { const a0 = args[0]; return (env) => fn(a0(env)); }
                        return (env) => fn(...args.map(a => a(env)));
                    }
                    // function applied without parentheses: sin x, sqrt x^2 → applies to the next power-term
                    const arg = parseUnary();
                    return (env) => fn(arg(env));
                }
                const vi = vars.indexOf(name);
                if (vi >= 0) return (env) => env[vi];
                if (name in EXPR_CONSTS) { const v = EXPR_CONSTS[name]; return () => v; }
                throw new Error('unknown ' + name);
            }
            throw new Error('unexpected token ' + tk.t);
        }
        const tree = parseAdd();
        if (pos !== toks.length) return null;
        const f = (...args) => { const v = tree(args); return (typeof v === 'number') ? v : NaN; };
        f(...vars.map(() => 0.5)); // smoke test
        return f;
    } catch (e) {
        return null;
    }
}

/* Backwards-compatible evaluators (safe: NaN → 0 like the Calc II lab). */
function evaluateMath(expression, x) {
    const fn = compileExpr(expression, ['x']);
    if (!fn) return NaN;
    try { const v = fn(x); return (typeof v === 'number') ? v : NaN; } catch (e) { return NaN; }
}
function evaluateMath2(expression, x, y) {
    const fn = compileExpr(expression, ['x', 'y']);
    if (!fn) return NaN;
    try { const v = fn(x, y); return (typeof v === 'number') ? v : NaN; } catch (e) { return NaN; }
}

/* Composite Simpson's rule */
function numIntegrate(fn, a, b, n = 200) {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let sum = fn(a) + fn(b);
    for (let i = 1; i < n; i++) {
        const v = fn(a + i * h);
        if (!isFinite(v)) continue;
        sum += (i % 2 === 0 ? 2 : 4) * v;
    }
    return sum * h / 3;
}
const integrate = numIntegrate;

/* Numeric derivative (central difference) */
function numDeriv(fn, x, h = 1e-5) { return (fn(x + h) - fn(x - h)) / (2 * h); }

/* Small numeric utilities */
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function fmt(v, d = 4) {
    if (v === undefined || v === null || Number.isNaN(v)) return '—';
    if (!isFinite(v)) return v > 0 ? '∞' : '−∞';
    if (Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-4 && v !== 0)) return v.toExponential(Math.max(1, d - 1));
    const s = Number(v.toFixed(d));
    return String(s);
}
function fmtSci(v, d = 3) {
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    return v.toExponential(d);
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); return b ? gcd(b, a % b) : a; }
function fracLatex(num, den) {
    if (den === 0) return '\\text{undefined}';
    if (den < 0) { num = -num; den = -den; }
    const g = gcd(num, den) || 1;
    const n = num / g, d = den / g;
    if (d === 1) return `${n}`;
    return `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}`;
}
function formatFracOrDec(num, den) { return fracLatex(num, den); }
function formatVal(v) { return Number.isInteger(v) ? `${v}` : `${v.toFixed(2)}`; }
function randInt(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
/* Build a multiple-choice question from a correct answer + distractors (dedupes) */
function makeOptions(correct, distractors, count = 4) {
    const seen = new Set([String(correct)]);
    const opts = [correct];
    for (const d of distractors) {
        if (opts.length >= count) break;
        if (seen.has(String(d))) continue;
        seen.add(String(d));
        opts.push(d);
    }
    shuffleArray(opts);
    return { options: opts, answerIndex: opts.indexOf(correct) };
}

/* --------------------------------------------------------------------------
 * 7. Chart2D — hi-DPI canvas with math↔screen mapping
 * -------------------------------------------------------------------------- */
class Chart2D {
    constructor(canvas, xMin, xMax, yMin, yMax) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.xMin = xMin; this.xMax = xMax; this.yMin = yMin; this.yMax = yMax;
        this.padding = 40;
        this.padLeft = null; // optional override
    }
    resize() {
        const rect = this.canvas.parentNode.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
        this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(dpr, dpr);
    }
    get width()  { return this.canvas.width  / (window.devicePixelRatio || 1); }
    get height() { return this.canvas.height / (window.devicePixelRatio || 1); }
    get plotW()  { return this.width - 2 * this.padding; }
    get plotH()  { return this.height - 2 * this.padding; }
    setBounds(xMin, xMax, yMin, yMax) { this.xMin = xMin; this.xMax = xMax; this.yMin = yMin; this.yMax = yMax; }
    /* Keep x and y scales equal (aspect ratio 1) around the current bounds' centre */
    squareAspect() {
        const w = this.plotW, h = this.plotH;
        if (w <= 0 || h <= 0) return;
        const xr = this.xMax - this.xMin, yr = this.yMax - this.yMin;
        const scale = Math.max(xr / w, yr / h);
        const cx = (this.xMin + this.xMax) / 2, cy = (this.yMin + this.yMax) / 2;
        this.xMin = cx - scale * w / 2; this.xMax = cx + scale * w / 2;
        this.yMin = cy - scale * h / 2; this.yMax = cy + scale * h / 2;
    }
    clear() { this.ctx.clearRect(0, 0, this.width, this.height); }
    toScreenX(x) { return this.padding + ((x - this.xMin) / (this.xMax - this.xMin)) * this.plotW; }
    toScreenY(y) { return this.height - this.padding - ((y - this.yMin) / (this.yMax - this.yMin)) * this.plotH; }
    toMathX(sx) { return this.xMin + ((sx - this.padding) / this.plotW) * (this.xMax - this.xMin); }
    toMathY(sy) { return this.yMin + ((this.height - this.padding - sy) / this.plotH) * (this.yMax - this.yMin); }
    /* Nice tick step for a range */
    static niceStep(range, targetTicks = 6) {
        const raw = range / targetTicks;
        const mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const norm = raw / mag;
        let step;
        if (norm < 1.5) step = 1; else if (norm < 3) step = 2; else if (norm < 7) step = 5; else step = 10;
        return step * mag;
    }
    drawGrid(pal) {
        pal = pal || themePalette();
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = pal.grid;
        ctx.lineWidth = 1;
        const xs = Chart2D.niceStep(this.xMax - this.xMin);
        const ys = Chart2D.niceStep(this.yMax - this.yMin);
        for (let x = Math.ceil(this.xMin / xs) * xs; x <= this.xMax + 1e-9; x += xs) {
            const sx = this.toScreenX(x);
            ctx.beginPath(); ctx.moveTo(sx, this.padding); ctx.lineTo(sx, this.height - this.padding); ctx.stroke();
        }
        for (let y = Math.ceil(this.yMin / ys) * ys; y <= this.yMax + 1e-9; y += ys) {
            const sy = this.toScreenY(y);
            ctx.beginPath(); ctx.moveTo(this.padding, sy); ctx.lineTo(this.width - this.padding, sy); ctx.stroke();
        }
        ctx.restore();
    }
    drawAxes(themeOrPal, opts = {}) {
        const pal = (themeOrPal && typeof themeOrPal === 'object') ? themeOrPal : themePalette();
        const ctx = this.ctx;
        ctx.save();
        ctx.strokeStyle = pal.axis;
        ctx.fillStyle = pal.muted;
        ctx.lineWidth = 1;
        ctx.font = '10px "Fira Code", monospace';
        const xs = opts.xStep || Chart2D.niceStep(this.xMax - this.xMin);
        const ys = opts.yStep || Chart2D.niceStep(this.yMax - this.yMin);
        // Axis positions: through 0 if visible, else at the edge
        const cx = clamp(this.toScreenX(0), this.padding, this.width - this.padding);
        const cy = clamp(this.toScreenY(0), this.padding, this.height - this.padding);
        ctx.beginPath(); ctx.moveTo(this.padding, cy); ctx.lineTo(this.width - this.padding, cy); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, this.padding); ctx.lineTo(cx, this.height - this.padding); ctx.stroke();
        const dec = (step) => Math.max(0, Math.min(6, -Math.floor(Math.log10(step)) + (step < 1 ? 0 : 0)));
        const xd = dec(xs), yd = dec(ys);
        for (let x = Math.ceil(this.xMin / xs) * xs; x <= this.xMax + 1e-9; x += xs) {
            if (Math.abs(x) < 1e-9 && opts.skipZero !== false) continue;
            const sx = this.toScreenX(x);
            ctx.beginPath(); ctx.moveTo(sx, cy - 3); ctx.lineTo(sx, cy + 3); ctx.stroke();
            ctx.fillText(Number(x.toFixed(xd)).toString(), sx - 8, cy + 14);
        }
        for (let y = Math.ceil(this.yMin / ys) * ys; y <= this.yMax + 1e-9; y += ys) {
            if (Math.abs(y) < 1e-9 && opts.skipZero !== false) continue;
            const sy = this.toScreenY(y);
            ctx.beginPath(); ctx.moveTo(cx - 3, sy); ctx.lineTo(cx + 3, sy); ctx.stroke();
            ctx.fillText(Number(y.toFixed(yd)).toString(), cx + 6, sy + 3);
        }
        if (opts.xLabel) { ctx.fillStyle = pal.text; ctx.font = '11px Outfit, sans-serif'; ctx.fillText(opts.xLabel, this.width - this.padding - 8, cy - 8); }
        if (opts.yLabel) { ctx.fillStyle = pal.text; ctx.font = '11px Outfit, sans-serif'; ctx.fillText(opts.yLabel, cx + 8, this.padding + 4); }
        ctx.restore();
    }
    /* Plot y = f(x) over the visible x-range */
    plotFunction(fn, color, opts = {}) {
        const ctx = this.ctx;
        const n = opts.samples || 400;
        const a = opts.xMin != null ? opts.xMin : this.xMin;
        const b = opts.xMax != null ? opts.xMax : this.xMax;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = opts.lineWidth || 2.2;
        if (opts.dash) ctx.setLineDash(opts.dash);
        ctx.beginPath();
        let started = false;
        let prevY = null;
        for (let i = 0; i <= n; i++) {
            const x = a + (b - a) * i / n;
            let y;
            try { y = fn(x); } catch (e) { y = NaN; }
            if (!isFinite(y) || Math.abs(y) > 1e6) { started = false; prevY = null; continue; }
            const sx = this.toScreenX(x), sy = this.toScreenY(y);
            // break the path on huge jumps (asymptotes)
            if (prevY !== null && Math.abs(y - prevY) > (this.yMax - this.yMin) * 2) started = false;
            if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
            prevY = y;
        }
        ctx.stroke();
        ctx.restore();
    }
    plotPoints(points, color, opts = {}) {
        const ctx = this.ctx;
        ctx.save();
        const r = opts.radius || 3.5;
        if (opts.line) {
            ctx.strokeStyle = color; ctx.lineWidth = opts.lineWidth || 2;
            if (opts.dash) ctx.setLineDash(opts.dash);
            ctx.beginPath();
            points.forEach((p, i) => { const sx = this.toScreenX(p.x ?? p[0]), sy = this.toScreenY(p.y ?? p[1]); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
            ctx.stroke();
            ctx.setLineDash([]);
        }
        if (opts.dots !== false) {
            ctx.fillStyle = color;
            points.forEach(p => { ctx.beginPath(); ctx.arc(this.toScreenX(p.x ?? p[0]), this.toScreenY(p.y ?? p[1]), r, 0, Math.PI * 2); ctx.fill(); });
        }
        ctx.restore();
    }
    drawArrow(x0, y0, x1, y1, color, opts = {}) {
        const ctx = this.ctx;
        const sx0 = this.toScreenX(x0), sy0 = this.toScreenY(y0);
        const sx1 = this.toScreenX(x1), sy1 = this.toScreenY(y1);
        const dx = sx1 - sx0, dy = sy1 - sy0;
        const len = Math.hypot(dx, dy);
        if (len < 0.5) return;
        const head = opts.head || Math.min(10, len * 0.4);
        const ang = Math.atan2(dy, dx);
        ctx.save();
        ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = opts.lineWidth || 2;
        ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx1 - head * Math.cos(ang - Math.PI / 6), sy1 - head * Math.sin(ang - Math.PI / 6));
        ctx.lineTo(sx1 - head * Math.cos(ang + Math.PI / 6), sy1 - head * Math.sin(ang + Math.PI / 6));
        ctx.closePath(); ctx.fill();
        ctx.restore();
    }
    text(str, x, y, color, opts = {}) {
        const ctx = this.ctx;
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = opts.font || '12px Outfit, sans-serif';
        ctx.textAlign = opts.align || 'left';
        ctx.textBaseline = opts.baseline || 'alphabetic';
        const sx = opts.screen ? x : this.toScreenX(x);
        const sy = opts.screen ? y : this.toScreenY(y);
        ctx.fillText(str, sx + (opts.dx || 0), sy + (opts.dy || 0));
        ctx.restore();
    }
    /* Attach drag-to-move for a set of handles: handles = [{get:()=>({x,y}), set:(x,y)=>{}}] */
    enableDrag(handles, onChange, radiusPx = 14) {
        const canvas = this.canvas;
        let active = null;
        const pos = (ev) => {
            const r = canvas.getBoundingClientRect();
            const p = ev.touches ? ev.touches[0] : ev;
            return { sx: p.clientX - r.left, sy: p.clientY - r.top };
        };
        const down = (ev) => {
            const { sx, sy } = pos(ev);
            for (const h of handles) {
                const p = h.get();
                if (Math.hypot(this.toScreenX(p.x) - sx, this.toScreenY(p.y) - sy) <= radiusPx) { active = h; ev.preventDefault(); return; }
            }
        };
        const move = (ev) => {
            if (!active) return;
            const { sx, sy } = pos(ev);
            active.set(this.toMathX(sx), this.toMathY(sy));
            ev.preventDefault();
            onChange && onChange();
        };
        const up = () => { active = null; };
        canvas.addEventListener('mousedown', down);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', up);
        canvas.addEventListener('touchstart', down, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', up);
    }
}

/* Simple 3D → 2D orthographic/perspective projector for surface & vector plots */
class Projector3D {
    constructor(yaw = -0.7, pitch = 0.45, scale = 60) { this.yaw = yaw; this.pitch = pitch; this.scale = scale; this.cx = 0; this.cy = 0; }
    project(x, y, z) {
        const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw);
        const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
        const x1 = x * cy - y * sy;
        const y1 = x * sy + y * cy;
        const z1 = z;
        const y2 = y1 * cp - z1 * sp;
        const z2 = y1 * sp + z1 * cp;
        return { sx: this.cx + x1 * this.scale, sy: this.cy - z2 * this.scale, depth: y2 };
    }
    attachDrag(canvas, onChange) {
        let dragging = false, lx = 0, ly = 0;
        const start = (x, y) => { dragging = true; lx = x; ly = y; };
        const move = (x, y) => {
            if (!dragging) return;
            this.yaw += (x - lx) * 0.01; this.pitch = clamp(this.pitch + (y - ly) * 0.01, -1.4, 1.4);
            lx = x; ly = y; onChange && onChange();
        };
        canvas.addEventListener('mousedown', e => start(e.clientX, e.clientY));
        window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
        window.addEventListener('mouseup', () => dragging = false);
        canvas.addEventListener('touchstart', e => { const t = e.touches[0]; start(t.clientX, t.clientY); }, { passive: true });
        canvas.addEventListener('touchmove', e => { const t = e.touches[0]; move(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
        window.addEventListener('touchend', () => dragging = false);
    }
}

/* Colour map (viridis-like) for heat maps: t in [0,1] → css colour */
function heatColor(t, alpha = 1) {
    t = clamp(t, 0, 1);
    const stops = [
        [68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37]
    ];
    const i = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
    const f = t * (stops.length - 1) - i;
    const c = stops[i].map((v, k) => Math.round(v + (stops[i + 1][k] - v) * f));
    return `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
}
/* Diverging colour map: -1 → blue, 0 → neutral, +1 → red */
function divergingColor(t, alpha = 1) {
    t = clamp(t, -1, 1);
    if (t < 0) { const f = -t; return `rgba(${Math.round(96 + (30 - 96) * f)},${Math.round(165 + (64 - 165) * f)},${Math.round(250)},${alpha})`; }
    const f = t; return `rgba(${Math.round(250)},${Math.round(113 + (40 - 113) * f)},${Math.round(133 + (40 - 133) * f)},${alpha})`;
}

/* --------------------------------------------------------------------------
 * 8. Slider label auto-binding
 *   <input type="range" id="foo" class="slider" data-suffix=" m" data-fmt="pct">
 *   <span id="foo-val"></span>
 * -------------------------------------------------------------------------- */
const SliderFormatters = {
    pct: (v) => `${Math.round(v * 100)}%`,
    deg: (v) => `${v}°`,
    int: (v) => `${Math.round(v)}`,
    two: (v) => Number(v).toFixed(2),
    three: (v) => Number(v).toFixed(3),
    exp: (v) => `10^${v}`,
    pow2: (v) => `${Math.pow(2, v)}`,
    sci: (v) => Number(v).toExponential(1)
};
function bindSliderLabels(root = document) {
    root.querySelectorAll('input[type="range"]').forEach(el => {
        const valEl = document.getElementById(`${el.id}-val`);
        if (!valEl) return;
        const suffix = el.getAttribute('data-suffix') || '';
        const fmtName = el.getAttribute('data-fmt');
        const update = () => {
            const f = fmtName && SliderFormatters[fmtName];
            valEl.innerText = (f ? f(parseFloat(el.value)) : el.value) + suffix;
        };
        el.addEventListener('input', update);
        el.addEventListener('change', update);
        update();
    });
}
const bindSliderLabelUpdates = bindSliderLabels;

/* Convenience: attach the same handler to many inputs by id, for 'input' and 'change' */
function onInputs(ids, handler) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('input', handler);
        el.addEventListener('change', handler);
    });
}
function numVal(id, fallback = 0) {
    const el = document.getElementById(id);
    if (!el) return fallback;
    const v = parseFloat(el.value);
    return isFinite(v) ? v : fallback;
}
function strVal(id, fallback = '') { const el = document.getElementById(id); return el ? el.value : fallback; }
function isChecked(id) { const el = document.getElementById(id); return !!(el && el.checked); }

/* --------------------------------------------------------------------------
 * 9. Quiz engine
 * -------------------------------------------------------------------------- */
const QuizState = { active: false, questions: [], currentIndex: 0, selectedOption: null, score: 0, topicsSelected: [] };

/* Generic builders that content.js can call from a mode's build() */
function generateMatchingQuiz(source, topicLabel = 'Formula Matching', count = 10) {
    const out = [];
    const pool = shuffleArray([...source]);
    for (let i = 0; i < Math.min(count, pool.length); i++) {
        const item = pool[i];
        const inverted = Math.random() < 0.5;
        if (inverted) {
            const others = shuffleArray(source.filter(x => x.desc !== item.desc).map(x => x.desc));
            const options = shuffleArray([item.desc, others[0], others[1], others[2]].filter(Boolean));
            out.push({
                topic: topicLabel,
                questionText: item.invertedPrompt || 'Identify the concept associated with this formula or statement:',
                mathText: item.formula,
                options, answerIndex: options.indexOf(item.desc), isTextOptions: true,
                explanation: item.exp
            });
        } else {
            const others = shuffleArray(source.filter(x => x.formula !== item.formula).map(x => x.formula));
            const options = shuffleArray([item.formula, others[0], others[1], others[2]].filter(Boolean));
            out.push({
                topic: topicLabel,
                questionText: `Identify the correct formula or statement for:<br><br><strong>${item.desc}</strong>`,
                mathText: '', options, answerIndex: options.indexOf(item.formula),
                isTextOptions: !!item.textFormula,
                explanation: item.exp
            });
        }
    }
    return out;
}

function generateSetupQuiz(source, topicLabel = 'Setup & Word Problems', count = 10) {
    const out = [];
    const pool = shuffleArray([...source]);
    for (let i = 0; i < Math.min(count, pool.length); i++) {
        const item = pool[i];
        const options = shuffleArray([...item.options]);
        out.push({
            topic: item.topic || topicLabel,
            questionText: (item.situation ? `<strong>Situation:</strong> ${item.situation}<br><br>` : '') + `<strong>Question:</strong> ${item.q}`,
            mathText: item.mathText || '',
            options, answerIndex: options.indexOf(item.options[item.correctIdx]),
            isTextOptions: item.isTextOptions !== false,
            explanation: item.exp
        });
    }
    return out;
}

/* Concept pairs: [{ name, condition, conclusion, exp }] → "which theorem/test has this hypothesis" etc. */
function generateConceptQuiz(source, topicLabel = 'Concept ↔ Statement', count = 10) {
    const out = [];
    const pool = shuffleArray([...source]);
    for (let i = 0; i < Math.min(count, pool.length); i++) {
        const item = pool[i];
        const kind = Math.random();
        if (kind < 0.5) {
            const others = shuffleArray(source.filter(x => x.name !== item.name).map(x => x.name));
            const options = shuffleArray([item.name, others[0], others[1], others[2]].filter(Boolean));
            out.push({
                topic: topicLabel,
                questionText: item.conditionPrompt || 'Which named result / test has this hypothesis or condition?',
                mathText: item.condition,
                options, answerIndex: options.indexOf(item.name), isTextOptions: true,
                explanation: item.exp
            });
        } else {
            const others = shuffleArray(source.filter(x => x.conclusion !== item.conclusion).map(x => x.conclusion));
            const options = shuffleArray([item.conclusion, others[0], others[1], others[2]].filter(Boolean));
            out.push({
                topic: topicLabel,
                questionText: `What does <strong>${item.name}</strong> allow you to conclude?`,
                mathText: item.condition,
                options, answerIndex: options.indexOf(item.conclusion), isTextOptions: !!item.textConclusion,
                explanation: item.exp
            });
        }
    }
    return out;
}

/* Blueprint: array of arrays of topic keys → one question per slot */
function generateBlueprintQuiz(blueprint) {
    const out = [];
    blueprint.forEach(choices => {
        const t = pickRandom(choices);
        const pool = QuizGenerators[t];
        if (!pool || !pool.length) return;
        try { out.push(pickRandom(pool)()); } catch (e) { console.error('Generator failed for', t, e); }
    });
    return out;
}

function generateTopicQuiz(topics, count = 10) {
    const out = [];
    let lastGen = null;
    let guard = 0;
    while (out.length < count && guard++ < count * 6) {
        const t = pickRandom(topics);
        const pool = QuizGenerators[t];
        if (!pool || !pool.length) continue;
        let gen = pickRandom(pool);
        if (pool.length > 1 && gen === lastGen) gen = pickRandom(pool);
        lastGen = gen;
        try {
            const q = gen();
            if (q && q.options && q.options.length >= 2) out.push(q);
        } catch (e) { console.error('Generator failed for', t, e); }
    }
    return out;
}

function initQuizEvents() {
    const startBtn = document.getElementById('btn-quiz-start');
    if (!startBtn) return;
    startBtn.addEventListener('click', startNewQuiz);
    document.getElementById('btn-quiz-submit').addEventListener('click', submitAnswer);
    document.getElementById('btn-quiz-skip').addEventListener('click', skipQuestion);
    document.getElementById('btn-quiz-next').addEventListener('click', nextQuestion);

    const modeSelect = document.getElementById('quiz-mode');
    if (modeSelect) {
        // Populate from QuizModes if the select is empty
        if (typeof QuizModes !== 'undefined' && modeSelect.options.length === 0) {
            Object.entries(QuizModes).forEach(([id, m]) => {
                const o = document.createElement('option'); o.value = id; o.textContent = m.label; modeSelect.appendChild(o);
            });
        }
        modeSelect.addEventListener('change', () => {
            const cbGroup = document.getElementById('quiz-topics-checkboxes');
            const mode = (typeof QuizModes !== 'undefined') ? QuizModes[modeSelect.value] : null;
            const usesTopics = !mode || mode.kind === 'topics';
            if (cbGroup) cbGroup.classList.toggle('hidden', !usesTopics);
            document.querySelectorAll('[data-quiz-guide]').forEach(g => {
                const forModes = g.getAttribute('data-quiz-guide').split(',').map(s => s.trim());
                g.classList.toggle('hidden', !forModes.includes(modeSelect.value));
            });
        });
        setTimeout(() => modeSelect.dispatchEvent(new Event('change')), 30);
    }
}

function startNewQuiz() {
    const modeSelect = document.getElementById('quiz-mode');
    const modeId = modeSelect ? modeSelect.value : 'standard';
    const mode = (typeof QuizModes !== 'undefined') ? QuizModes[modeId] : null;

    QuizState.active = true;
    QuizState.currentIndex = 0;
    QuizState.score = 0;
    QuizState.questions = [];

    if (mode && mode.kind === 'custom' && typeof mode.build === 'function') {
        QuizState.questions = mode.build() || [];
    } else {
        const topics = Array.from(document.querySelectorAll('.quiz-topic-check:checked')).map(cb => cb.getAttribute('data-topic'));
        if (topics.length === 0) { alert('Please select at least one topic to practice!'); return; }
        QuizState.topicsSelected = topics;
        QuizState.questions = generateTopicQuiz(topics, (mode && mode.count) || 10);
    }
    if (!QuizState.questions.length) { alert('No questions could be generated for that selection.'); return; }

    document.querySelector('.quiz-intro').classList.add('hidden');
    document.querySelector('.quiz-active-state').classList.remove('hidden');
    document.querySelector('.quiz-layout').classList.add('quiz-running');
    showQuestion();
}

function scrollQuestionIntoViewOnMobile() {
    if (!window.matchMedia('(max-width: 992px)').matches) return;
    const anchor = document.querySelector('.quiz-active-state .quiz-header');
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showQuestion() {
    const q = QuizState.questions[QuizState.currentIndex];
    document.getElementById('quiz-q-num').innerText = `Question ${QuizState.currentIndex + 1} of ${QuizState.questions.length}`;
    document.getElementById('quiz-q-topic').innerText = q.topic || '';
    document.getElementById('quiz-q-text').innerHTML = parseInlineMath(q.questionText || '');

    const mathEl = document.getElementById('quiz-q-math');
    if (q.mathText) {
        mathEl.classList.remove('hidden');
        if (q.hideSetup) {
            mathEl.innerHTML = `<div style="text-align:center;margin:10px 0;"><button class="btn btn-secondary btn-sm" id="btn-reveal-setup"><i data-lucide="eye" style="width:14px;height:14px;"></i><span>Reveal Setup / Hint</span></button></div>`;
            if (window.lucide) lucide.createIcons();
            document.getElementById('btn-reveal-setup').addEventListener('click', () => renderLatex(mathEl, q.mathText, true));
        } else if (q.mathIsHtml) {
            mathEl.innerHTML = parseInlineMath(q.mathText);
        } else {
            renderLatex(mathEl, q.mathText, true);
        }
    } else {
        mathEl.classList.add('hidden');
    }

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    q.options.forEach((opt, idx) => {
        const button = document.createElement('button');
        button.className = 'quiz-opt-btn';
        button.innerHTML = `<span class="quiz-opt-index">${String.fromCharCode(65 + idx)}</span><span class="quiz-opt-text" id="opt-text-${idx}"></span>`;
        button.addEventListener('click', () => selectOption(idx));
        optionsContainer.appendChild(button);
        const optEl = document.getElementById(`opt-text-${idx}`);
        if (q.isTextOptions) optEl.innerHTML = parseInlineMath(opt);
        else renderLatex(optEl, opt, false);
    });

    QuizState.selectedOption = null;
    document.getElementById('btn-quiz-submit').disabled = true;
    document.getElementById('btn-quiz-submit').classList.remove('hidden');
    document.getElementById('btn-quiz-skip').classList.remove('hidden');
    document.getElementById('quiz-explanation').classList.add('hidden');
    scrollQuestionIntoViewOnMobile();
}

function selectOption(idx) {
    if (!document.getElementById('quiz-explanation').classList.contains('hidden')) return;
    QuizState.selectedOption = idx;
    document.querySelectorAll('.quiz-opt-btn').forEach((btn, i) => btn.classList.toggle('selected', i === idx));
    document.getElementById('btn-quiz-submit').disabled = false;
}

function submitAnswer() {
    const q = QuizState.questions[QuizState.currentIndex];
    const isCorrect = QuizState.selectedOption === q.answerIndex;
    const mathEl = document.getElementById('quiz-q-math');
    if (q.mathText && q.hideSetup && document.getElementById('btn-reveal-setup')) renderLatex(mathEl, q.mathText, true);

    AppState.stats.solved += 1;
    if (isCorrect) { AppState.stats.correct += 1; QuizState.score += 1; }
    AppState.stats.history.push({ topic: q.topic, correct: isCorrect, date: Date.now() });
    if (AppState.stats.history.length > 500) AppState.stats.history.shift();
    saveStats();

    document.querySelectorAll('.quiz-opt-btn').forEach((btn, idx) => {
        btn.classList.remove('selected');
        if (idx === q.answerIndex) btn.classList.add('correct');
        else if (idx === QuizState.selectedOption && !isCorrect) btn.classList.add('incorrect');
    });

    const expBox = document.getElementById('quiz-explanation');
    const resultStatus = document.getElementById('quiz-result-status');
    const expText = document.getElementById('quiz-explanation-text');
    expBox.classList.remove('hidden');
    if (isCorrect) {
        expBox.className = 'quiz-explanation-box card-glass correct-box';
        resultStatus.className = 'explanation-status status-success';
        resultStatus.innerHTML = '<i data-lucide="check-circle" class="status-icon icon-success"></i> <span>Correct!</span>';
    } else {
        expBox.className = 'quiz-explanation-box card-glass incorrect-box';
        resultStatus.className = 'explanation-status status-error';
        resultStatus.innerHTML = `<i data-lucide="x-circle" class="status-icon icon-error"></i> <span>${QuizState.selectedOption === -1 ? 'Skipped' : 'Incorrect'}</span>`;
    }
    expText.innerHTML = q.explanation || '';
    LabUI.typeset(expText);
    if (window.lucide) lucide.createIcons();
    document.getElementById('btn-quiz-submit').classList.add('hidden');
    document.getElementById('btn-quiz-skip').classList.add('hidden');
}

function skipQuestion() { QuizState.selectedOption = -1; submitAnswer(); }

function nextQuestion() {
    QuizState.currentIndex += 1;
    if (QuizState.currentIndex < QuizState.questions.length) showQuestion();
    else showQuizResults();
}

function showQuizResults() {
    document.querySelector('.quiz-active-state').classList.add('hidden');
    document.querySelector('.quiz-layout').classList.remove('quiz-running');
    const intro = document.querySelector('.quiz-intro');
    intro.classList.remove('hidden');
    const n = QuizState.questions.length || 1;
    intro.innerHTML = `
        <i data-lucide="award" class="quiz-large-icon"></i>
        <h3>Quiz Completed!</h3>
        <p>You scored <strong>${QuizState.score} out of ${QuizState.questions.length}</strong> correct (${Math.round(QuizState.score / n * 100)}%).</p>
        <div class="welcome-actions">
            <button class="btn btn-primary" onclick="startNewQuiz()"><span>Practice Again</span><i data-lucide="rotate-ccw"></i></button>
        </div>`;
    if (window.lucide) lucide.createIcons();
}

/* --------------------------------------------------------------------------
 * 10. Bootstrap
 * -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    initTheme();
    loadStats();

    // Nav
    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab'))));
    initSubTabs();
    initReferenceTabs();

    // Reference default
    const defaultRef = (typeof LabConfig !== 'undefined' && LabConfig.defaultReference) || (document.querySelector('.lecture-tab-btn') && document.querySelector('.lecture-tab-btn').getAttribute('data-lec'));
    if (defaultRef) {
        displayReference(defaultRef);
        const b = document.querySelector(`.lecture-tab-btn[data-lec="${defaultRef}"]`);
        if (b) { document.querySelectorAll('.lecture-tab-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); }
    }

    initQuizEvents();
    bindSliderLabels();

    // Header for the initial tab
    updateHeader(AppState.currentTab);

    // Mobile drawer
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');
    const closeMenu = () => { sidebar && sidebar.classList.remove('open'); overlay && overlay.classList.remove('open'); };
    if (toggleBtn) toggleBtn.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('open'); });
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);
    document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', closeMenu));

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (typeof Visualizers === 'undefined') return;
            const mod = Visualizers[AppState.currentTab];
            if (mod && mod._inited) { try { (mod.resize || mod.redraw || mod.init).call(mod); } catch (e) { /* ignore */ } }
        }, 120);
    });

    // Typeset any static math in the page (guides, notes)
    document.querySelectorAll('[data-typeset]').forEach(el => LabUI.typeset(el));
});
