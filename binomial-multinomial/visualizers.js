/* ==========================================================================
 * Binomial & Multinomial Lab — visualizers
 *   pascal : Pascal's triangle with identity highlighting + lattice paths
 *   expand : (ax + by)^n expansion, term picker, coefficient bars, checks
 *   multi  : trinomial coefficient layer, word arrangements, coefficient finder
 * ========================================================================== */

const vzSet = (id, html) => { const el = document.getElementById(id); if (el) { el.innerHTML = html; LabUI.typeset(el); } };
const vzCanvasSize = (canvas, minH = 300) => {
    const rect = canvas.parentNode.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(200, rect.width), h = Math.max(minH, rect.height || minH);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
    return { ctx, w, h };
};
const vzMouse = (canvas, ev) => {
    const r = canvas.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
};
const vzBig = (v) => fmtBig(v, false);

const Visualizers = {
    /* ====================================================================
     * 1. Pascal's triangle & lattice paths
     * ==================================================================== */
    pascal: {
        cells: [], hover: null, latticeHover: null, path: null,
        init() {
            this.pascal = [];
            for (let n = 0; n <= 24; n++) {
                const row = [];
                for (let k = 0; k <= n; k++) row.push(bigBinom(n, k));
                this.pascal.push(row);
            }
            onInputs(['pt-rows', 'pt-n', 'pt-k', 'pt-identity', 'pt-values', 'lp-a', 'lp-b', 'lp-check', 'lp-c', 'lp-d'], () => this.redraw());
            const run = document.getElementById('btn-pt-run'); if (run) run.addEventListener('click', () => this.redraw());
            const rnd = document.getElementById('btn-lp-random'); if (rnd) rnd.addEventListener('click', () => { this.randomPath(); this.redraw(); });
            const clr = document.getElementById('btn-lp-clear'); if (clr) clr.addEventListener('click', () => { this.path = null; this.redraw(); });
            const c1 = document.getElementById('canvas-pascal');
            if (c1) {
                const mv = (ev) => { const m = vzMouse(c1, ev); const hit = this.cells.find(c => Math.hypot(c.x - m.x, c.y - m.y) <= c.r); const key = hit ? `${hit.n},${hit.k}` : null; if (key !== (this.hover && `${this.hover.n},${this.hover.k}`)) { this.hover = hit || null; this.drawTriangle(); } };
                c1.addEventListener('mousemove', mv); c1.addEventListener('touchstart', mv, { passive: true });
                c1.addEventListener('mouseleave', () => { this.hover = null; this.drawTriangle(); });
                c1.addEventListener('click', (ev) => { const m = vzMouse(c1, ev); const hit = this.cells.find(c => Math.hypot(c.x - m.x, c.y - m.y) <= c.r); if (hit) { const nEl = document.getElementById('pt-n'), kEl = document.getElementById('pt-k'); if (nEl) nEl.value = hit.n; if (kEl) kEl.value = hit.k; bindSliderLabels(); this.redraw(); } });
            }
            this.redraw();
        },
        resize() { this.redraw(); },
        onSubTab() { this.redraw(); },
        redraw() {
            const sub = currentSub('pt') || 'tri';
            if (sub === 'tri') this.drawTriangle(); else this.drawLattice();
        },
        /* ---------- (a) triangle ---------- */
        identityInfo(n, k, id) {
            const P = this.pascal, inTri = (a, b) => a >= 0 && a <= 24 && b >= 0 && b <= a;
            const hl = new Map(); // "n,k" -> 'src' | 'dst'
            let text = '', eq = '';
            const C = inTri(n, k) ? P[n][k] : 0n;
            switch (id) {
                case 'pascal':
                    if (inTri(n - 1, k - 1)) hl.set(`${n - 1},${k - 1}`, 'src'); if (inTri(n - 1, k)) hl.set(`${n - 1},${k}`, 'src'); hl.set(`${n},${k}`, 'dst');
                    eq = `\\binom{${n}}{${k}} = \\binom{${n - 1}}{${k - 1}} + \\binom{${n - 1}}{${k}} = ${B(inTri(n - 1, k - 1) ? P[n - 1][k - 1] : 0n)} + ${B(inTri(n - 1, k) ? P[n - 1][k] : 0n)} = ${B(C)}`;
                    text = `Pascal's rule: a $${k}$-subset of $\\{1,\\dots,${n}\\}$ either contains $${n}$ (choose $${k - 1}$ more from $${n - 1}$) or not (choose $${k}$ from $${n - 1}$). In the triangle the cell is the sum of the two above it.`;
                    break;
                case 'symmetry':
                    hl.set(`${n},${k}`, 'dst'); hl.set(`${n},${n - k}`, 'src');
                    eq = `\\binom{${n}}{${k}} = \\binom{${n}}{${n - k}} = ${B(C)}`;
                    text = `Symmetry: choosing $${k}$ to keep is choosing $${n - k}$ to leave out. Each row reads the same backwards.`;
                    break;
                case 'rowsum': {
                    for (let j = 0; j <= n; j++) hl.set(`${n},${j}`, 'src');
                    eq = `\\sum_{j=0}^{${n}}\\binom{${n}}{j} = 2^{${n}} = ${B(bigPow(2, n))}`;
                    text = `Row sum: put $x = y = 1$ in $(x+y)^{${n}}$, or count all subsets of a $${n}$-set by size.`;
                    break;
                }
                case 'altsum': {
                    for (let j = 0; j <= n; j++) hl.set(`${n},${j}`, j % 2 ? 'dst' : 'src');
                    eq = `\\sum_{j=0}^{${n}}(-1)^j\\binom{${n}}{j} = (1-1)^{${n}} = ${n === 0 ? 1 : 0}, \\qquad \\sum_{j\\text{ even}} = \\sum_{j\\text{ odd}} = 2^{${Math.max(n - 1, 0)}}${n >= 1 ? ` = ${B(bigPow(2, n - 1))}` : ''}`;
                    text = `Alternating sum: put $x = 1$, $y = -1$. Blue cells (even $j$) and pink cells (odd $j$) add to the same total.`;
                    break;
                }
                case 'hockey': {
                    for (let j = k; j <= n; j++) if (inTri(j, k)) hl.set(`${j},${k}`, 'src');
                    if (inTri(n + 1, k + 1)) hl.set(`${n + 1},${k + 1}`, 'dst');
                    const parts = []; let s = 0n; for (let j = k; j <= n; j++) { parts.push(B(P[j][k])); s += P[j][k]; }
                    eq = `\\sum_{j=${k}}^{${n}}\\binom{j}{${k}} = ${parts.join(' + ')} = ${B(s)} = \\binom{${n + 1}}{${k + 1}}`;
                    text = `Hockey stick: the blue column $\\binom{${k}}{${k}}, \\dots, \\binom{${n}}{${k}}$ adds to the pink cell one row down and one column right. Classify $(${k + 1})$-subsets of $\\{1,\\dots,${n + 1}\\}$ by their largest element.`;
                    break;
                }
                case 'absorb': {
                    hl.set(`${n},${k}`, 'dst'); if (inTri(n - 1, k - 1)) hl.set(`${n - 1},${k - 1}`, 'src');
                    const L = BigInt(k) * C, R = BigInt(n) * (inTri(n - 1, k - 1) ? P[n - 1][k - 1] : 0n);
                    eq = `${k}\\binom{${n}}{${k}} = ${n}\\binom{${n - 1}}{${k - 1}} \\quad\\Longrightarrow\\quad ${k}\\cdot${B(C)} = ${n}\\cdot${B(inTri(n - 1, k - 1) ? P[n - 1][k - 1] : 0n)} = ${B(L)}`;
                    text = `Absorption: (committee of $${k}$, chair) pairs from $${n}$ people, counted committee-first or chair-first.${L === R ? '' : ' (Needs $k \\ge 1$.)'}`;
                    break;
                }
                case 'squares': {
                    for (let j = 0; j <= n; j++) hl.set(`${n},${j}`, 'src');
                    if (inTri(2 * n, n)) hl.set(`${2 * n},${n}`, 'dst');
                    let s = 0n; const parts = []; for (let j = 0; j <= n; j++) { s += P[n][j] * P[n][j]; parts.push(`${B(P[n][j])}^2`); }
                    eq = `\\sum_{j=0}^{${n}}\\binom{${n}}{j}^2 = ${parts.join(' + ')} = ${B(s)} = \\binom{${2 * n}}{${n}}`;
                    text = `Sum of squares of row $${n}$ equals the central entry of row $${2 * n}$ (Vandermonde with $m = n = r$).${2 * n > 24 ? ' Row ' + (2 * n) + ' is below the drawn triangle.' : ''}`;
                    break;
                }
                default:
                    hl.set(`${n},${k}`, 'dst');
                    eq = `\\binom{${n}}{${k}} = \\frac{${n}!}{${k}!\\,${n - k}!} = ${B(C)}`;
                    text = `Hover any cell for its value; click a cell to select it. Choose an identity to see it as a pattern of cells.`;
            }
            return { hl, eq, text, C };
        },
        drawTriangle() {
            const canvas = document.getElementById('canvas-pascal'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 360);
            const pal = themePalette();
            const rows = Math.round(numVal('pt-rows', 12));
            let n = Math.round(numVal('pt-n', 6)); let k = Math.round(numVal('pt-k', 2));
            n = clamp(n, 0, rows); k = clamp(k, 0, n);
            const id = strVal('pt-identity', 'none');
            const showVals = isChecked('pt-values');
            const info = this.identityInfo(n, k, id);
            ctx.clearRect(0, 0, w, h);
            const pad = 14;
            const cellW = Math.min((w - 2 * pad) / (rows + 1), 64);
            const cellH = Math.min((h - 2 * pad) / (rows + 1), cellW * 0.95);
            const r = Math.min(cellW, cellH) * 0.44;
            const cx0 = w / 2, y0 = pad + cellH / 2;
            this.cells = [];
            const maxV = Number(this.pascal[rows][Math.floor(rows / 2)]);
            const fontPx = Math.max(7, Math.min(13, r * 0.7));
            for (let row = 0; row <= rows; row++) {
                for (let j = 0; j <= row; j++) {
                    const x = cx0 + (j - row / 2) * cellW, y = y0 + row * cellH;
                    const v = this.pascal[row][j];
                    const t = Math.log(Number(v) + 1) / Math.log(maxV + 1);
                    const key = `${row},${j}`;
                    const tag = info.hl.get(key);
                    let fill = pal.dark ? `rgba(${pal.accentRgb},${0.08 + 0.55 * t})` : `rgba(${pal.accentRgb},${0.10 + 0.6 * t})`;
                    if (tag === 'src') fill = pal.blue; if (tag === 'dst') fill = pal.pink;
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
                    if (this.hover && this.hover.n === row && this.hover.k === j) { ctx.lineWidth = 2.5; ctx.strokeStyle = pal.text; ctx.stroke(); }
                    else if (tag) { ctx.lineWidth = 1.5; ctx.strokeStyle = pal.text; ctx.stroke(); }
                    if (showVals && r >= 9) {
                        const s = v.toString();
                        ctx.fillStyle = (tag || t > 0.55) ? '#0b1020' : pal.text;
                        ctx.font = `${s.length > 4 ? fontPx * 0.72 : s.length > 3 ? fontPx * 0.85 : fontPx}px "Fira Code", monospace`;
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                        ctx.fillText(s, x, y + 0.5);
                    }
                    this.cells.push({ n: row, k: j, x, y, r });
                }
            }
            // row labels
            ctx.fillStyle = pal.muted; ctx.font = '10px "Fira Code", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            for (let row = 0; row <= rows; row += (rows > 14 ? 2 : 1)) ctx.fillText(`n=${row}`, 2, y0 + row * cellH);
            if (this.hover) {
                const hv = this.pascal[this.hover.n][this.hover.k];
                const s = `C(${this.hover.n}, ${this.hover.k}) = ${vzBig(hv)}`;
                ctx.font = '12px Outfit, sans-serif'; const tw = ctx.measureText(s).width + 14;
                let bx = this.hover.x + 12, by = this.hover.y - 30; if (bx + tw > w) bx = this.hover.x - tw - 12; if (by < 4) by = this.hover.y + 14;
                ctx.fillStyle = pal.dark ? 'rgba(10,14,24,0.92)' : 'rgba(255,255,255,0.95)'; ctx.strokeStyle = pal.axis;
                ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, tw, 22, 6) : ctx.rect(bx, by, tw, 22); ctx.fill(); ctx.stroke();
                ctx.fillStyle = pal.text; ctx.textAlign = 'left'; ctx.fillText(s, bx + 7, by + 11);
            }
            // results
            const steps = [
                { title: `C(${n}, ${k})`, body: `$$${info.eq}$$` },
                { title: 'Why', body: info.text }
            ];
            const rowSum = bigPow(2, n);
            vzSet('pt-results', LabUI.kv([
                { label: 'Selected cell', value: `C(${n}, ${k}) = ${vzBig(info.C)}` },
                { label: `Row ${n} sum`, value: `2^${n} = ${vzBig(rowSum)}` },
                { label: `Largest in row ${n}`, value: vzBig(this.pascal[n][Math.floor(n / 2)]) },
                { label: 'Cells drawn', value: `${(rows + 1) * (rows + 2) / 2} (rows 0–${rows})` }
            ]) + LabUI.steps(steps));
        },
        /* ---------- (b) lattice paths ---------- */
        randomPath() {
            const a = Math.round(numVal('lp-a', 5)), b = Math.round(numVal('lp-b', 4));
            const steps = shuffleArray(Array(a).fill('R').concat(Array(b).fill('U')));
            this.path = steps;
        },
        drawLattice() {
            const canvas = document.getElementById('canvas-lattice'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 360);
            const pal = themePalette();
            const a = Math.round(numVal('lp-a', 5)), b = Math.round(numVal('lp-b', 4));
            const useCk = isChecked('lp-check');
            const c = clamp(Math.round(numVal('lp-c', 2)), 0, a), d = clamp(Math.round(numVal('lp-d', 1)), 0, b);
            ctx.clearRect(0, 0, w, h);
            const pad = 34;
            const sx = (w - 2 * pad) / Math.max(a, 1), sy = (h - 2 * pad) / Math.max(b, 1);
            const s = Math.min(sx, sy, 90);
            const ox = (w - a * s) / 2, oy = h - (h - b * s) / 2;
            const X = (i) => ox + i * s, Y = (j) => oy - j * s;
            // counts: number of paths from origin to (i,j) = C(i+j, i); if checkpoint, only through (c,d)
            const count = (i, j) => {
                if (!useCk) return bigBinom(i + j, i);
                if (i <= c && j <= d) return bigBinom(i + j, i); // before checkpoint: all paths
                if (i >= c && j >= d) return bigBinom(c + d, c) * bigBinom(i - c + j - d, i - c);
                return 0n;
            };
            // grid
            ctx.strokeStyle = pal.grid; ctx.lineWidth = 1;
            for (let i = 0; i <= a; i++) { ctx.beginPath(); ctx.moveTo(X(i), Y(0)); ctx.lineTo(X(i), Y(b)); ctx.stroke(); }
            for (let j = 0; j <= b; j++) { ctx.beginPath(); ctx.moveTo(X(0), Y(j)); ctx.lineTo(X(a), Y(j)); ctx.stroke(); }
            // path
            if (this.path && this.path.length === a + b) {
                ctx.strokeStyle = pal.warning; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
                ctx.beginPath(); let i = 0, j = 0; ctx.moveTo(X(0), Y(0));
                for (const st of this.path) { if (st === 'R') i++; else j++; ctx.lineTo(X(i), Y(j)); }
                ctx.stroke();
            }
            // nodes with counts
            const total = count(a, b);
            for (let i = 0; i <= a; i++) for (let j = 0; j <= b; j++) {
                const v = count(i, j);
                const isCk = useCk && i === c && j === d, isEnd = i === a && j === b;
                ctx.beginPath(); ctx.arc(X(i), Y(j), isEnd || isCk ? 7 : 4, 0, Math.PI * 2);
                ctx.fillStyle = isEnd ? pal.pink : isCk ? pal.purple : v === 0n ? pal.faint : pal.accent; ctx.fill();
                if (s >= 34) {
                    ctx.fillStyle = v === 0n ? pal.muted : pal.text; ctx.font = `${s >= 60 ? 12 : 10}px "Fira Code", monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
                    ctx.fillText(vzBig(v), X(i) + 6, Y(j) - 5);
                }
            }
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(`(0,0)`, X(0), Y(0) + 8); ctx.fillText(`(${a},${b})`, X(a), Y(b) + 8);
            const kv = [
                { label: `Paths to (${a},${b})`, value: vzBig(bigBinom(a + b, a)) },
                { label: 'Formula', value: `C(${a + b}, ${a}) = C(${a + b}, ${b})` }
            ];
            if (useCk) kv.push({ label: `Through (${c},${d})`, value: `${vzBig(bigBinom(c + d, c))} × ${vzBig(bigBinom(a - c + b - d, a - c))} = ${vzBig(total)}` });
            const body = [
                { title: 'Why a binomial coefficient', body: `A path is a word with $${a}$ R's and $${b}$ U's, e.g. ${this.path ? `<code>${this.path.join('')}</code>` : '<code>' + 'R'.repeat(a) + 'U'.repeat(b) + '</code>'}. Choosing the positions of the R's gives $\\binom{${a + b}}{${a}} = ${B(bigBinom(a + b, a))}$.` },
                { title: "Pascal's rule on the grid", body: `The count at a node is the sum of the counts at its left and lower neighbours: the last step was R or U. So the node labels are Pascal's triangle rotated 45°.` }
            ];
            if (useCk) body.push({ title: 'Checkpoint', body: `Paths through $(${c},${d})$: $\\binom{${c + d}}{${c}}\\binom{${a - c + b - d}}{${a - c}} = ${B(bigBinom(c + d, c))}\\cdot${B(bigBinom(a - c + b - d, a - c))} = ${B(total)}$. Nodes that cannot lie on such a path are greyed out.` });
            vzSet('lp-results', LabUI.kv(kv) + LabUI.steps(body));
        }
    },

    /* ====================================================================
     * 2. Binomial expansion tool
     * ==================================================================== */
    expand: {
        init() {
            onInputs(['ex-a', 'ex-b', 'ex-n', 'ex-k', 'ex-check', 'ex-preset'], () => this.redraw());
            const pre = document.getElementById('ex-preset');
            if (pre) pre.addEventListener('change', () => {
                const v = pre.value; const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
                if (v === 'xy') { set('ex-a', 1); set('ex-b', 1); }
                if (v === 'xmy') { set('ex-a', 1); set('ex-b', -1); }
                if (v === '2xm1') { set('ex-a', 2); set('ex-b', -1); set('ex-n', 5); }
                if (v === '3x2y') { set('ex-a', 3); set('ex-b', 2); set('ex-n', 4); }
                if (v === '1px') { set('ex-a', 0); set('ex-b', 1); }
                bindSliderLabels(); this.redraw();
            });
            const run = document.getElementById('btn-ex-run'); if (run) run.addEventListener('click', () => this.redraw());
            this.redraw();
        },
        resize() { this.redraw(); },
        terms(a, b, n) {
            const out = [];
            for (let k = 0; k <= n; k++) {
                const coef = bigBinom(n, k) * bigPow(a, n - k) * bigPow(b, k);
                out.push({ k, coef, binom: bigBinom(n, k) });
            }
            return out;
        },
        redraw() {
            const canvas = document.getElementById('canvas-expand'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 300);
            const pal = themePalette();
            let a = Math.round(numVal('ex-a', 1)), b = Math.round(numVal('ex-b', 1));
            const n = clamp(Math.round(numVal('ex-n', 5)), 0, 20);
            const k = clamp(Math.round(numVal('ex-k', 2)), 0, n);
            const check = strVal('ex-check', 'one');
            const xName = a === 0 ? '1' : 'x';
            const T = this.terms(a, b, n);
            // ---- canvas: signed coefficient bars ----
            ctx.clearRect(0, 0, w, h);
            const pad = 36, bw = (w - 2 * pad) / (n + 1);
            const maxAbs = T.reduce((m, t) => { const v = t.coef < 0n ? -t.coef : t.coef; return v > m ? v : m; }, 0n);
            const scale = (v) => { const num = Number(v), M = Number(maxAbs) || 1; return Math.log(Math.abs(num) + 1) / Math.log(M + 1) * Math.sign(num); };
            const hasNeg = T.some(t => t.coef < 0n);
            const zeroY = hasNeg ? h / 2 : h - pad;
            const amp = hasNeg ? (h / 2 - pad) : (h - 2 * pad);
            ctx.strokeStyle = pal.axis; ctx.beginPath(); ctx.moveTo(pad, zeroY); ctx.lineTo(w - pad, zeroY); ctx.stroke();
            T.forEach((t, i) => {
                const s = scale(t.coef);
                const x = pad + i * bw + bw * 0.15, bwid = bw * 0.7;
                const y = zeroY - s * amp;
                ctx.fillStyle = i === k ? pal.pink : (t.coef < 0n ? pal.blue : pal.accent);
                ctx.fillRect(x, Math.min(y, zeroY), bwid, Math.abs(zeroY - y) || 1);
                ctx.fillStyle = pal.muted; ctx.font = '10px "Fira Code", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
                ctx.fillText(`k=${t.k}`, x + bwid / 2, (hasNeg ? h - pad + 4 : zeroY + 4));
                if (bw >= 26) {
                    // negative bars: label above the axis (the column above it is empty), positive: above the bar
                    const lbl = vzBig(t.coef); ctx.fillStyle = pal.text; ctx.font = `${bw >= 48 ? 11 : 9}px "Fira Code", monospace`; ctx.textBaseline = 'bottom';
                    ctx.fillText(lbl.length > 9 ? lbl.slice(0, 7) + '…' : lbl, x + bwid / 2, t.coef < 0n ? zeroY - 3 : y - 3);
                }
            });
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(`coefficients of (${a === 0 ? '' : (a === 1 ? '' : a === -1 ? '-' : a) + 'x'}${a === 0 ? '1' : ''} ${b < 0 ? '-' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}y)^${n}  (log scale, pink = selected term)`, pad, 6);
            // ---- expansion LaTeX ----
            const aStr = a === 1 ? '' : a === -1 ? '-' : String(a);
            const bStr = Math.abs(b) === 1 ? '' : String(Math.abs(b));
            const base = a === 0 ? `(1 ${b < 0 ? '-' : '+'} ${bStr}y)` : `(${aStr}x ${b < 0 ? '-' : '+'} ${bStr}y)`;
            const monomial = (t) => {
                const xs = a === 0 ? '' : powLatex('x', n - t.k); const ys = powLatex('y', t.k); return (xs + ys) || '';
            };
            const termStr = (t, first) => {
                const c = t.coef; const mon = monomial(t);
                if (c === 0n) return '';
                const sign = c < 0n ? '-' : (first ? '' : '+');
                const mag = c < 0n ? -c : c;
                const magStr = (mag === 1n && mon) ? '' : B(mag);
                return `${sign}${magStr}${mon || (magStr ? '' : '1')}`;
            };
            let first = true; const pieces = [];
            T.forEach(t => { const s = termStr(t, first); if (s) { pieces.push(s); first = false; } });
            let expansion = pieces.join('') || '0';
            if (n > 8) { // wrap into lines of ~5 terms for readability
                const lines = []; for (let i = 0; i < pieces.length; i += 5) lines.push(pieces.slice(i, i + 5).join(''));
                expansion = `\\begin{aligned}&${lines.join('\\\\&')}\\end{aligned}`;
            }
            const sel = T[k];
            const gen = `T_{${k + 1}} = \\binom{${n}}{${k}}(${aStr || ''}${a === 0 ? '1' : 'x'})^{${n - k}}(${b < 0 ? '-' : ''}${bStr}y)^{${k}} = ${B(sel.binom)}\\cdot${a === 0 ? `1` : `(${a})^{${n - k}}`}\\cdot(${b})^{${k}}\\,${monomial(sel) || '1'} = ${B(sel.coef)}${monomial(sel)}`;
            // ---- checks ----
            let checkTitle = '', checkBody = '';
            const sumAll = T.reduce((s, t) => s + t.coef, 0n);
            const sumAlt = T.reduce((s, t) => s + (t.k % 2 ? -t.coef : t.coef), 0n);
            if (check === 'one') { checkTitle = 'Check: x = y = 1'; checkBody = `Coefficient sum $= ${B(sumAll)}$; and $(${a === 0 ? 1 : a} + ${b})^{${n}} = (${(a === 0 ? 1 : a) + b})^{${n}} = ${B(bigPow((a === 0 ? 1 : a) + b, n))}$. ${sumAll === bigPow((a === 0 ? 1 : a) + b, n) ? '✓' : '✗'}`; }
            else if (check === 'alt') { checkTitle = 'Check: x = 1, y = −1'; checkBody = `Alternating coefficient sum $= ${B(sumAlt)}$; and $(${a === 0 ? 1 : a} - ${b})^{${n}} = (${(a === 0 ? 1 : a) - b})^{${n}} = ${B(bigPow((a === 0 ? 1 : a) - b, n))}$. ${sumAlt === bigPow((a === 0 ? 1 : a) - b, n) ? '✓' : '✗'}`; }
            else { const sum2 = T.reduce((s, t) => s + t.coef * bigPow(2, t.k), 0n); checkTitle = 'Check: x = 1, y = 2'; checkBody = `$\\sum_k c_k 2^k = ${B(sum2)}$; and $(${a === 0 ? 1 : a} + 2\\cdot${b})^{${n}} = (${(a === 0 ? 1 : a) + 2 * b})^{${n}} = ${B(bigPow((a === 0 ? 1 : a) + 2 * b, n))}$. ${sum2 === bigPow((a === 0 ? 1 : a) + 2 * b, n) ? '✓' : '✗'}`; }
            const binomSum = bigPow(2, n);
            vzSet('ex-results', LabUI.kv([
                { label: 'Terms', value: `${n + 1}` },
                { label: `Selected term (k = ${k})`, value: `${vzBig(sel.coef)} · ${(monomial(sel) || '1').replace(/\^\{(\d+)\}/g, '^$1')}` },
                { label: 'Row sum of binomials', value: `2^${n} = ${vzBig(binomSum)}` },
                { label: 'Largest |coefficient|', value: vzBig(maxAbs) }
            ]) + LabUI.steps([
                { title: 'Expansion', body: `$$${base}^{${n}} = ${expansion}$$` },
                { title: 'General term', body: `$$${gen}$$ The scalar on $x$ is raised to $n-k = ${n - k}$ and the scalar on $y$ to $k = ${k}$; the sign is the sign of $(${b})^{${k}}$${a < 0 ? ` times the sign of $(${a})^{${n - k}}$` : ''}.` },
                { title: checkTitle, body: checkBody }
            ]));
        }
    },

    /* ====================================================================
     * 3. Multinomial explorer
     * ==================================================================== */
    multi: {
        cells: [], hover: null,
        init() {
            onInputs(['mn-n', 'mn-values', 'mw-word', 'mc-n', 'mc-a', 'mc-b', 'mc-c', 'mc-alpha', 'mc-beta', 'mc-gamma'], () => this.redraw());
            const run = document.getElementById('btn-mn-run'); if (run) run.addEventListener('click', () => this.redraw());
            const run2 = document.getElementById('btn-mc-run'); if (run2) run2.addEventListener('click', () => this.redraw());
            const pre = document.getElementById('mw-preset');
            if (pre) pre.addEventListener('change', () => { const el = document.getElementById('mw-word'); if (el && pre.value) el.value = pre.value; this.redraw(); });
            const c = document.getElementById('canvas-multi');
            if (c) {
                const mv = (ev) => { const m = vzMouse(c, ev); const hit = this.cells.find(x => Math.hypot(x.x - m.x, x.y - m.y) <= x.r); const key = hit ? hit.key : null; if (key !== (this.hover && this.hover.key)) { this.hover = hit || null; this.drawLayer(); } };
                c.addEventListener('mousemove', mv); c.addEventListener('touchstart', mv, { passive: true });
                c.addEventListener('mouseleave', () => { this.hover = null; this.drawLayer(); });
            }
            this.redraw();
        },
        resize() { this.redraw(); },
        onSubTab() { this.redraw(); },
        redraw() {
            const sub = currentSub('mn') || 'layer';
            if (sub === 'layer') this.drawLayer(); else if (sub === 'word') this.drawWord(); else this.drawFinder();
        },
        /* ---------- (a) trinomial layer ---------- */
        drawLayer() {
            const canvas = document.getElementById('canvas-multi'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 360);
            const pal = themePalette();
            const n = clamp(Math.round(numVal('mn-n', 4)), 0, 14);
            const showVals = isChecked('mn-values');
            ctx.clearRect(0, 0, w, h);
            // cells: a = exponent of x (rows top→bottom decreasing? use a from n down to 0), row index i = n - a, within row b from (n-a) down to 0, c = n - a - b
            const rows = n + 1;
            const pad = 16;
            const cellW = Math.min((w - 2 * pad) / rows, 70), cellH = Math.min((h - 2 * pad) / rows, cellW * 0.95);
            const r = Math.min(cellW, cellH) * 0.44;
            const cx0 = w / 2, y0 = pad + cellH / 2;
            this.cells = [];
            let maxV = 1n; const vals = [];
            for (let a = n; a >= 0; a--) for (let b = n - a; b >= 0; b--) { const c = n - a - b; const v = bigMultinom([a, b, c]); vals.push({ a, b, c, v }); if (v > maxV) maxV = v; }
            let sum = 0n;
            vals.forEach(({ a, b, c, v }) => {
                sum += v;
                const row = n - a, j = (n - a) - b; // j from 0..row
                const x = cx0 + (j - row / 2) * cellW, y = y0 + row * cellH;
                const t = Math.log(Number(v) + 1) / Math.log(Number(maxV) + 1);
                const key = `${a},${b},${c}`;
                const isHover = this.hover && this.hover.key === key;
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${pal.accentRgb},${0.08 + 0.6 * t})`; ctx.fill();
                if (isHover) { ctx.lineWidth = 2.5; ctx.strokeStyle = pal.text; ctx.stroke(); }
                if (showVals && r >= 9) {
                    const s = v.toString(); const fontPx = Math.max(7, Math.min(13, r * 0.7));
                    ctx.fillStyle = t > 0.55 ? '#0b1020' : pal.text; ctx.font = `${s.length > 4 ? fontPx * 0.72 : s.length > 3 ? fontPx * 0.85 : fontPx}px "Fira Code", monospace`;
                    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y + 0.5);
                }
                this.cells.push({ key, a, b, c, v, x, y, r });
            });
            // corner labels
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            if (n > 0) { ctx.fillText(`x^${n}`, cx0, 1); ctx.textBaseline = 'bottom'; ctx.fillText(`y^${n}`, cx0 - (n / 2) * cellW, y0 + n * cellH + r + 12); ctx.fillText(`z^${n}`, cx0 + (n / 2) * cellW, y0 + n * cellH + r + 12); }
            if (this.hover) {
                const hv = this.hover; const mono = `${powLatex('x', hv.a)}${powLatex('y', hv.b)}${powLatex('z', hv.c)}`.replace(/\^\{(\d+)\}/g, '^$1') || '1';
                const s = `${vzBig(hv.v)} · ${mono}   [${hv.a},${hv.b},${hv.c}]`;
                ctx.font = '12px Outfit, sans-serif'; const tw = ctx.measureText(s).width + 14;
                let bx = hv.x + 12, by = hv.y - 30; if (bx + tw > w) bx = hv.x - tw - 12; if (by < 4) by = hv.y + 14;
                ctx.fillStyle = pal.dark ? 'rgba(10,14,24,0.92)' : 'rgba(255,255,255,0.95)'; ctx.strokeStyle = pal.axis;
                ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, tw, 22, 6) : ctx.rect(bx, by, tw, 22); ctx.fill(); ctx.stroke();
                ctx.fillStyle = pal.text; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(s, bx + 7, by + 11);
            }
            const nTerms = bigBinom(n + 2, 2);
            const hov = this.hover;
            vzSet('mn-results', LabUI.kv([
                { label: 'Degree n', value: `${n}` },
                { label: 'Distinct terms', value: `C(${n + 2}, 2) = ${vzBig(nTerms)}` },
                { label: 'Sum of coefficients', value: `3^${n} = ${vzBig(sum)}` },
                { label: 'Largest coefficient', value: vzBig(maxV) }
            ]) + LabUI.steps([
                { title: 'What you see', body: `Layer $${n}$ of Pascal's pyramid: each cell is $\\binom{${n}}{a,b,c}$, the coefficient of $x^ay^bz^c$ in $(x+y+z)^{${n}}$, with $a$ decreasing down the rows, $b$ decreasing left to right. Hover a cell for its monomial. The three edges are ordinary binomial rows (one exponent is $0$).` },
                { title: hov ? `Cell [${hov.a}, ${hov.b}, ${hov.c}]` : 'Addition rule', body: hov ? `$$\\binom{${n}}{${hov.a},${hov.b},${hov.c}} = \\frac{${n}!}{${hov.a}!\\,${hov.b}!\\,${hov.c}!} = ${B(hov.v)}$$ Also $\\binom{${n}}{${hov.a}}\\binom{${n - hov.a}}{${hov.b}} = ${B(bigBinom(n, hov.a))}\\cdot${B(bigBinom(n - hov.a, hov.b))} = ${B(hov.v)}$.` : `Each cell is the sum of the (up to) three cells above it in the previous layer: $\\binom{n}{a,b,c} = \\binom{n-1}{a-1,b,c}+\\binom{n-1}{a,b-1,c}+\\binom{n-1}{a,b,c-1}$.` },
                { title: 'Two checks', body: `Number of terms $= \\binom{${n}+3-1}{3-1} = \\binom{${n + 2}}{2} = ${B(nTerms)}$ (stars and bars). Sum of coefficients $= 3^{${n}} = ${B(sum)}$ (put $x=y=z=1$).` }
            ]));
        },
        /* ---------- (b) word arrangements ---------- */
        drawWord() {
            const canvas = document.getElementById('canvas-word'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 300);
            const pal = themePalette();
            ctx.clearRect(0, 0, w, h);
            const raw = strVal('mw-word', 'MISSISSIPPI').toUpperCase().replace(/[^A-Z0-9]/g, '');
            const word = raw.slice(0, 20);
            if (!word.length) { vzSet('mw-results', '<p class="text-muted">Type a word (letters and digits, up to 20 characters).</p>'); return; }
            const counts = {}; for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
            const letters = Object.keys(counts).sort((p, q) => counts[q] - counts[p] || p.localeCompare(q));
            const parts = letters.map(l => counts[l]);
            const n = word.length;
            const total = bigMultinom(parts);
            // bars of multiplicities
            const pad = 30, bw = (w - 2 * pad) / letters.length, maxC = Math.max(...parts);
            const baseY = h - pad;
            letters.forEach((l, i) => {
                const c = counts[l]; const bh = (h - 2 * pad - 20) * c / maxC;
                const x = pad + i * bw + bw * 0.2;
                ctx.fillStyle = pal.series[i % pal.series.length]; ctx.fillRect(x, baseY - bh, bw * 0.6, bh);
                ctx.fillStyle = pal.text; ctx.font = '13px Outfit, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(l, x + bw * 0.3, baseY + 6);
                ctx.font = '11px "Fira Code", monospace'; ctx.textBaseline = 'bottom'; ctx.fillText(`${c}! = ${nfact(c)}`, x + bw * 0.3, baseY - bh - 4);
            });
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(`letter multiplicities of ${word} (bar labels are the denominator factorials)`, pad, 6);
            const denom = parts.map(p => `${p}!`).join('\\,');
            const denomVal = parts.reduce((acc, p) => acc * bigFact(p), 1n);
            const prod = []; let rem = n; letters.forEach((l, i) => { prod.push(`\\binom{${rem}}{${counts[l]}}`); rem -= counts[l]; });
            const prodVals = []; rem = n; letters.forEach(l => { prodVals.push(B(bigBinom(rem, counts[l]))); rem -= counts[l]; });
            const allDistinct = parts.every(p => p === 1);
            vzSet('mw-results', LabUI.kv([
                { label: 'Length n', value: `${n}` },
                { label: 'Distinct letters', value: `${letters.length}` },
                { label: 'Arrangements', value: vzBig(total) },
                { label: 'If all letters were distinct', value: `${n}! = ${vzBig(bigFact(n))}` }
            ]) + LabUI.steps([
                { title: 'Multinomial coefficient', body: `$$\\binom{${n}}{${parts.join(',')}} = \\frac{${n}!}{${denom}} = \\frac{${B(bigFact(n))}}{${B(denomVal)}} = ${B(total)}$$ ${allDistinct ? 'Every letter is distinct, so this is just $n!$.' : `Permuting the identical copies of a letter (${letters.filter(l => counts[l] > 1).map(l => `${l}: ${counts[l]}!$ ways$`).join(', ').replace(/\$ ways\$/g, ' ways')}) does not change the string, so divide by each multiplicity factorial.`}` },
                { title: 'As a product of binomials', body: `Place the letters one type at a time: $$${prod.join('')} = ${prodVals.join('\\cdot')} = ${B(total)}.$$` },
                { title: 'Multinomial theorem link', body: `$${B(total)}$ is also the coefficient of $${letters.map(l => powLatex(l.toLowerCase().replace(/[^a-z]/g, 'w'), counts[l])).join('')}$ in $(${letters.map(l => l.toLowerCase().replace(/[^a-z]/g, 'w')).join('+')})^{${n}}$.` }
            ]));
        },
        /* ---------- (c) coefficient finder ---------- */
        drawFinder() {
            const n = clamp(Math.round(numVal('mc-n', 6)), 0, 30);
            const a = Math.max(0, Math.round(numVal('mc-a', 2))), b = Math.max(0, Math.round(numVal('mc-b', 3))), c = Math.max(0, Math.round(numVal('mc-c', 1)));
            const al = Math.round(numVal('mc-alpha', 1)), be = Math.round(numVal('mc-beta', 2)), ga = Math.round(numVal('mc-gamma', -1));
            const sc = (v, name) => (v === 1 ? name : v === -1 ? `-${name}` : `${v}${name}`);
            const inner = `${sc(al, 'x')} ${be < 0 ? '-' : '+'} ${sc(Math.abs(be), 'y')} ${ga < 0 ? '-' : '+'} ${sc(Math.abs(ga), 'z')}`;
            const mono = `${powLatex('x', a)}${powLatex('y', b)}${powLatex('z', c)}` || '1';
            if (a + b + c !== n) {
                vzSet('mc-results', LabUI.kv([{ label: 'Exponent sum', value: `${a} + ${b} + ${c} = ${a + b + c} ≠ ${n}` }, { label: 'Coefficient', value: '0' }]) + LabUI.steps([
                    { title: 'No such term', body: `Every term of $(${inner})^{${n}}$ has total degree $${n}$, and $${a}+${b}+${c} = ${a + b + c}$. The coefficient of $${mono}$ is $0$. Adjust the exponents so they add to $${n}$ (or change $n$).` }
                ]));
                return;
            }
            const M = bigMultinom([a, b, c]);
            const scal = bigPow(al, a) * bigPow(be, b) * bigPow(ga, c);
            const coef = M * scal;
            vzSet('mc-results', LabUI.kv([
                { label: 'Exponent check', value: `${a} + ${b} + ${c} = ${n} ✓` },
                { label: 'Multinomial coefficient', value: vzBig(M) },
                { label: 'Scalar factor', value: vzBig(scal) },
                { label: 'Coefficient', value: vzBig(coef) }
            ]) + LabUI.steps([
                { title: 'Step 1: the multinomial coefficient', body: `$$\\binom{${n}}{${a},${b},${c}} = \\frac{${n}!}{${a}!\\,${b}!\\,${c}!} = \\frac{${B(bigFact(n))}}{${B(bigFact(a))}\\cdot${B(bigFact(b))}\\cdot${B(bigFact(c))}} = ${B(M)}$$` },
                { title: 'Step 2: the scalars', body: `Each scalar is raised to the exponent of its own variable: $(${al})^{${a}}\\,(${be})^{${b}}\\,(${ga})^{${c}} = ${B(bigPow(al, a))}\\cdot${B(bigPow(be, b))}\\cdot${B(bigPow(ga, c))} = ${B(scal)}$.` },
                { title: 'Result', body: `$$[${mono}]\\,(${inner})^{${n}} = ${B(M)}\\cdot${B(scal)} = ${B(coef)}$$ The term is $${B(coef)}${mono}$.` },
                { title: 'Sanity checks', body: `The expansion has $\\binom{${n + 2}}{2} = ${B(bigBinom(n + 2, 2))}$ terms and its coefficients add to $(${al}+${be}+${ga})^{${n}} = (${al + be + ga})^{${n}} = ${B(bigPow(al + be + ga, n))}$.` }
            ]));
        }
    }
};
