/* ==========================================================================
 * Fields & Vector Spaces Lab — visualizers
 *   fieldlab : Z_n addition/multiplication tables + numeric axiom checker
 *   subcheck : subspace test on subsets of R^2 / R^3 with drawn witnesses
 *   spanlab  : span / independence / membership in R^3 and in P_3
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
const parseVec = (s, n) => {
    const parts = String(s || '').split(/[,\s;]+/).filter(x => x !== '').map(Number);
    if (parts.length !== n || parts.some(x => !isFinite(x))) return null;
    return parts;
};
const fmtV = (v) => `(${v.map(x => (Number.isInteger(x) ? x : Math.round(x * 100) / 100)).join(', ')})`;
const near = (a, b) => Math.abs(a - b) < 1e-9;

const Visualizers = {
    /* ====================================================================
     * 1. Fields & axiom checker
     * ==================================================================== */
    fieldlab: {
        init() {
            onInputs(['fl-n', 'fl-op', 'ax-preset'], () => this.redraw());
            const b = document.getElementById('btn-ax-run'); if (b) b.addEventListener('click', () => this.redraw());
            this.redraw();
        },
        resize() { this.redraw(); },
        onSubTab() { this.redraw(); },
        redraw() { const sub = currentSub('fl') || 'zn'; if (sub === 'zn') this.drawZn(); else this.drawAxioms(); },
        drawZn() {
            const canvas = document.getElementById('canvas-zn'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 340);
            const pal = themePalette();
            const n = clamp(Math.round(numVal('fl-n', 7)), 2, 13);
            const op = strVal('fl-op', 'mul');
            ctx.clearRect(0, 0, w, h);
            const size = Math.min(w, h) - 30, cell = size / (n + 1), ox = (w - size) / 2, oy = 20;
            ctx.font = `${Math.max(9, Math.min(14, cell * 0.45))}px "Fira Code", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const f = (a, b) => (op === 'mul' ? (a * b) % n : (a + b) % n);
            for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) {
                const x = ox + j * cell, y = oy + i * cell;
                if (i === 0 && j === 0) { ctx.fillStyle = pal.muted; ctx.fillText(op === 'mul' ? '×' : '+', x + cell / 2, y + cell / 2); continue; }
                if (i === 0 || j === 0) { ctx.fillStyle = pal.text; ctx.fillText(String(i === 0 ? j - 1 : i - 1), x + cell / 2, y + cell / 2); continue; }
                const a = i - 1, b = j - 1, v = f(a, b);
                let fill = `rgba(${pal.accentRgb},${0.10 + 0.55 * v / Math.max(1, n - 1)})`;
                if (op === 'mul' && v === 1) fill = pal.success;
                if (op === 'mul' && v === 0 && a !== 0 && b !== 0) fill = pal.error;
                if (op === 'add' && v === 0) fill = pal.success;
                ctx.fillStyle = fill; ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
                ctx.fillStyle = (op === 'mul' && (v === 1 || (v === 0 && a && b))) || (op === 'add' && v === 0) ? '#0b1020' : pal.text;
                ctx.fillText(String(v), x + cell / 2, y + cell / 2);
            }
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            ctx.fillText(op === 'mul' ? `Z_${n} multiplication: green = product 1 (inverse pairs), red = zero divisors` : `Z_${n} addition: green = sum 0 (additive inverse pairs)`, 8, 3);
            const prime = isPrime(n);
            const invs = []; const zd = new Set();
            for (let a = 1; a < n; a++) { const inv = modInv(a, n); invs.push(inv === null ? `${a}: none` : `${a}⁻¹ = ${inv}`); for (let b = 1; b < n; b++) if ((a * b) % n === 0) zd.add(a); }
            let char = n;
            vzSet('fl-results', LabUI.kv([
                { label: `Is Z_${n} a field?`, value: prime ? 'Yes (n prime)' : 'No (n composite)' },
                { label: 'Units (invertible)', value: `${invs.filter(s => !s.includes('none')).length} of ${n - 1}` },
                { label: 'Zero divisors', value: zd.size ? [...zd].sort((a, b) => a - b).join(', ') : 'none' },
                { label: 'Characteristic', value: String(char) }
            ]) + LabUI.steps([
                { title: 'Inverses', body: `<code>${invs.join(' · ')}</code>` },
                { title: prime ? `Why Z_${n} is a field` : `Why Z_${n} is not a field`, body: prime ? `$${n}$ is prime, so for $a\\not\\equiv 0$, $\\gcd(a, ${n}) = 1$ and Bézout gives $ax + ${n}y = 1$, i.e. $ax\\equiv 1$. Every row of the multiplication table (except row $0$) is a permutation of $\\mathbb Z_{${n}}$ and contains exactly one $1$.` : `$${n} = ${(() => { let d = 2; while (n % d) d++; return `${d}\\cdot${n / d}`; })()}$, so the red cells show products of non-zero elements equal to $0$. A zero divisor $a$ cannot have an inverse: $ab = 0$ with $b\\neq 0$ would give $b = a^{-1}ab = 0$. The other field axioms (commutativity, associativity, identities, distributivity) all hold in every $\\mathbb Z_n$; only (M5) fails.` },
                { title: 'Reading the table', body: 'Multiplication in a field: every non-zero row is a rearrangement of the elements (the map $x\\mapsto ax$ is a bijection). In a non-field some rows repeat values and miss $1$.' }
            ]));
        },
        /* numeric axiom checker on R^2 with user-selected operations */
        AXIOM_PRESETS: {
            usual: { name: 'Usual operations on R²', add: (u, v) => [u[0] + v[0], u[1] + v[1]], smul: (a, v) => [a * v[0], a * v[1]], zero: [0, 0] },
            smulFirst: { name: 'a⊙(x,y) = (ax, y)', add: (u, v) => [u[0] + v[0], u[1] + v[1]], smul: (a, v) => [a * v[0], v[1]], zero: [0, 0] },
            smulZero: { name: 'a⊙(x,y) = (ax, 0)', add: (u, v) => [u[0] + v[0], u[1] + v[1]], smul: (a, v) => [a * v[0], 0], zero: [0, 0] },
            smulSq: { name: 'a⊙(x,y) = (a²x, a²y)', add: (u, v) => [u[0] + v[0], u[1] + v[1]], smul: (a, v) => [a * a * v[0], a * a * v[1]], zero: [0, 0] },
            addSwap: { name: '(x₁,y₁)⊕(x₂,y₂) = (x₁+y₂, x₂+y₁)', add: (u, v) => [u[0] + v[1], v[0] + u[1]], smul: (a, v) => [a * v[0], a * v[1]], zero: [0, 0] },
            addZeroY: { name: '(x₁,y₁)⊕(x₂,y₂) = (x₁+x₂, 0)', add: (u, v) => [u[0] + v[0], 0], smul: (a, v) => [a * v[0], a * v[1]], zero: null },
            shifted: { name: '(x₁,y₁)⊕(x₂,y₂) = (x₁+x₂−1, y₁+y₂), a⊙(x,y) = (ax−a+1, ay)', add: (u, v) => [u[0] + v[0] - 1, u[1] + v[1]], smul: (a, v) => [a * v[0] - a + 1, a * v[1]], zero: [1, 0] },
            positive: { name: 'R₊² with u⊕v = (u₁v₁, u₂v₂), a⊙v = (v₁ᵃ, v₂ᵃ)', add: (u, v) => [u[0] * v[0], u[1] * v[1]], smul: (a, v) => [Math.pow(v[0], a), Math.pow(v[1], a)], zero: [1, 1], sample: () => [0.5 + Math.random() * 3, 0.5 + Math.random() * 3] },
            addMax: { name: '(x₁,y₁)⊕(x₂,y₂) = (max(x₁,x₂), y₁+y₂)', add: (u, v) => [Math.max(u[0], v[0]), u[1] + v[1]], smul: (a, v) => [a * v[0], a * v[1]], zero: null }
        },
        drawAxioms() {
            const key = strVal('ax-preset', 'smulFirst');
            const P = this.AXIOM_PRESETS[key] || this.AXIOM_PRESETS.usual;
            const rnd = P.sample || (() => [randInt(-3, 3) + Math.random(), randInt(-3, 3) + Math.random()]);
            const eq = (u, v) => near(u[0], v[0]) && near(u[1], v[1]);
            const scalars = [-2, -1, 0.5, 1, 2, 3];
            const results = [];
            const test = (label, formula, fn) => {
                let witness = null;
                for (let t = 0; t < 200 && !witness; t++) { const r = fn(); if (r) witness = r; }
                results.push({ label, formula, ok: !witness, witness });
            };
            // (V1)
            test('(V1) u ⊕ v = v ⊕ u', 'u\\oplus v = v\\oplus u', () => { const u = rnd(), v = rnd(); return eq(P.add(u, v), P.add(v, u)) ? null : `u = ${fmtV(u)}, v = ${fmtV(v)}: ${fmtV(P.add(u, v))} ≠ ${fmtV(P.add(v, u))}`; });
            test('(V2) associativity', '(u\\oplus v)\\oplus w = u\\oplus(v\\oplus w)', () => { const u = rnd(), v = rnd(), w = rnd(); return eq(P.add(P.add(u, v), w), P.add(u, P.add(v, w))) ? null : `u = ${fmtV(u)}, v = ${fmtV(v)}, w = ${fmtV(w)}`; });
            // (V3) zero vector: search a grid for z with u ⊕ z = u for random u
            let zero = P.zero;
            if (!zero) { const cands = []; for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) cands.push([a, b]); const us = [rnd(), rnd(), rnd()]; zero = cands.find(z => us.every(u => eq(P.add(u, z), u))) || null; }
            results.push({ label: '(V3) zero vector', formula: '\\exists\\,\\mathbf 0: v\\oplus\\mathbf 0 = v', ok: !!zero && (() => { for (let t = 0; t < 50; t++) { const u = rnd(); if (!eq(P.add(u, zero), u)) return false; } return true; })(), witness: zero ? (`candidate 0 = ${fmtV(zero)}`) : 'no vector z with u ⊕ z = u for all sampled u (searched integer points in [−3,3]²)' });
            if (zero) {
                test('(V4) inverses', '\\forall v\\ \\exists(-v): v\\oplus(-v) = \\mathbf 0', () => { const v = rnd(); const cands = [P.smul(-1, v), [-v[0], -v[1]], [2 * zero[0] - v[0], 2 * zero[1] - v[1]], [1 / v[0], 1 / v[1]]]; return cands.some(c => c.every(isFinite) && eq(P.add(v, c), zero)) ? null : `v = ${fmtV(v)}: none of the natural candidates gives 0`; });
            } else results.push({ label: '(V4) inverses', formula: 'v\\oplus(-v) = \\mathbf 0', ok: false, witness: 'no zero vector, so inverses cannot exist' });
            test('(V5) a⊙(u ⊕ v) = a⊙u ⊕ a⊙v', 'a\\odot(u\\oplus v) = a\\odot u\\oplus a\\odot v', () => { const u = rnd(), v = rnd(), a = pickRandom(scalars); return eq(P.smul(a, P.add(u, v)), P.add(P.smul(a, u), P.smul(a, v))) ? null : `a = ${a}, u = ${fmtV(u)}, v = ${fmtV(v)}: ${fmtV(P.smul(a, P.add(u, v)))} ≠ ${fmtV(P.add(P.smul(a, u), P.smul(a, v)))}`; });
            test('(V6) (a+b)⊙v = a⊙v ⊕ b⊙v', '(a+b)\\odot v = a\\odot v\\oplus b\\odot v', () => { const v = rnd(), a = pickRandom(scalars), b = pickRandom(scalars); return eq(P.smul(a + b, v), P.add(P.smul(a, v), P.smul(b, v))) ? null : `a = ${a}, b = ${b}, v = ${fmtV(v)}: ${fmtV(P.smul(a + b, v))} ≠ ${fmtV(P.add(P.smul(a, v), P.smul(b, v)))}`; });
            test('(V7) (ab)⊙v = a⊙(b⊙v)', '(ab)\\odot v = a\\odot(b\\odot v)', () => { const v = rnd(), a = pickRandom(scalars), b = pickRandom(scalars); return eq(P.smul(a * b, v), P.smul(a, P.smul(b, v))) ? null : `a = ${a}, b = ${b}, v = ${fmtV(v)}: ${fmtV(P.smul(a * b, v))} ≠ ${fmtV(P.smul(a, P.smul(b, v)))}`; });
            test('(V8) 1⊙v = v', '1\\odot v = v', () => { const v = rnd(); return eq(P.smul(1, v), v) ? null : `v = ${fmtV(v)}: 1⊙v = ${fmtV(P.smul(1, v))}`; });
            const fails = results.filter(r => !r.ok);
            const rows = results.map(r => [r.label, { v: r.ok ? '✓ holds (200 random trials)' : '✗ fails', cls: r.ok ? 'text-success' : 'text-error' }, r.witness ? r.witness : '—']);
            vzSet('ax-results', LabUI.kv([
                { label: 'Structure', value: P.name },
                { label: 'Verdict', value: fails.length ? `Not a vector space (${fails.length} axiom${fails.length > 1 ? 's' : ''} fail)` : 'Passes every numeric test' },
                { label: 'Zero vector', value: zero ? fmtV(zero) : 'none found' }
            ]) + LabUI.table(['Axiom', 'Result', 'Witness / note'], rows) + LabUI.steps([
                { title: 'How to read this', body: 'A random numeric test can <em>disprove</em> an axiom (one witness is a proof of failure) but only <em>suggests</em> that it holds. To prove a structure is a vector space, verify each axiom with general symbols. Closure (V0) is assumed here: every preset lands in $\\mathbb R^2$ (or $\\mathbb R_{>0}^2$).' },
                { title: 'Typical pattern', body: 'Changing scalar multiplication usually breaks (V6) or (V8); changing addition usually breaks (V1), (V3) or (V4). The "shifted" and "positive" presets are genuine vector spaces in disguise: they are $\\mathbb R^2$ under the bijections $(x,y)\\mapsto(x-1,y)$ and $(x,y)\\mapsto(\\ln x, \\ln y)$.' }
            ]));
        }
    },

    /* ====================================================================
     * 2. Subspace checker
     * ==================================================================== */
    subcheck: {
        SETS: {
            line0: { name: 'Line y = 2x', dim: 2, has: (v) => near(v[1], 2 * v[0]), sample: () => { const t = randInt(-3, 3) || 1; return [t, 2 * t]; }, draw: 'line', a: 2, b: 0, formula: '\\{(x,y): y = 2x\\}' },
            line1: { name: 'Line y = 2x + 1', dim: 2, has: (v) => near(v[1], 2 * v[0] + 1), sample: () => { const t = randInt(-3, 3); return [t, 2 * t + 1]; }, draw: 'line', a: 2, b: 1, formula: '\\{(x,y): y = 2x + 1\\}' },
            axes: { name: 'Union of the axes, xy = 0', dim: 2, has: (v) => near(v[0] * v[1], 0), sample: () => (Math.random() < 0.5 ? [randInt(-3, 3) || 1, 0] : [0, randInt(-3, 3) || 1]), draw: 'axes', formula: '\\{(x,y): xy = 0\\}' },
            quadrant: { name: 'First quadrant, x ≥ 0 and y ≥ 0', dim: 2, has: (v) => v[0] >= -1e-9 && v[1] >= -1e-9, sample: () => [randInt(0, 3), randInt(0, 3)], draw: 'quadrant', formula: '\\{(x,y): x\\ge 0,\\ y\\ge 0\\}' },
            disc: { name: 'Unit disc, x² + y² ≤ 1', dim: 2, has: (v) => v[0] * v[0] + v[1] * v[1] <= 1 + 1e-9, sample: () => { const t = Math.random() * 2 * Math.PI, r = Math.random(); return [Math.round(r * Math.cos(t) * 10) / 10, Math.round(r * Math.sin(t) * 10) / 10]; }, draw: 'disc', formula: '\\{(x,y): x^2+y^2\\le 1\\}' },
            parabola: { name: 'Parabola y = x²', dim: 2, has: (v) => near(v[1], v[0] * v[0]), sample: () => { const t = randInt(-2, 2); return [t, t * t]; }, draw: 'parabola', formula: '\\{(x,y): y = x^2\\}' },
            lattice: { name: 'Integer lattice Z²', dim: 2, has: (v) => Number.isInteger(Math.round(v[0] * 1e6) / 1e6) && Number.isInteger(Math.round(v[1] * 1e6) / 1e6), sample: () => [randInt(-3, 3), randInt(-3, 3)], draw: 'lattice', formula: '\\mathbb Z^2 = \\{(x,y): x,y\\in\\mathbb Z\\}' },
            absline: { name: 'Pair of lines y = |x|', dim: 2, has: (v) => near(v[1], Math.abs(v[0])), sample: () => { const t = randInt(-3, 3) || 1; return [t, Math.abs(t)]; }, draw: 'abs', formula: '\\{(x,y): y = |x|\\}' },
            cross: { name: 'Pair of lines y = ±x', dim: 2, has: (v) => near(v[1], v[0]) || near(v[1], -v[0]), sample: () => { const t = randInt(-3, 3) || 1; return [t, Math.random() < 0.5 ? t : -t]; }, draw: 'cross', formula: '\\{(x,y): y = x \\text{ or } y = -x\\}' },
            all: { name: 'All of R²', dim: 2, has: () => true, sample: () => [randInt(-3, 3), randInt(-3, 3)], draw: 'all', formula: '\\mathbb R^2' },
            zero: { name: 'Just the origin {0}', dim: 2, has: (v) => near(v[0], 0) && near(v[1], 0), sample: () => [0, 0], draw: 'zero', formula: '\\{(0,0)\\}' },
            plane0: { name: 'Plane x + y + z = 0', dim: 3, has: (v) => near(v[0] + v[1] + v[2], 0), sample: () => { const a = randInt(-2, 2), b = randInt(-2, 2); return [a, b, -a - b]; }, draw: 'plane', d: 0, formula: '\\{(x,y,z): x+y+z = 0\\}' },
            plane1: { name: 'Plane x + y + z = 1', dim: 3, has: (v) => near(v[0] + v[1] + v[2], 1), sample: () => { const a = randInt(-2, 2), b = randInt(-2, 2); return [a, b, 1 - a - b]; }, draw: 'plane', d: 1, formula: '\\{(x,y,z): x+y+z = 1\\}' },
            line3: { name: 'Line t(1, 2, 1)', dim: 3, has: (v) => near(v[1], 2 * v[0]) && near(v[2], v[0]), sample: () => { const t = randInt(-2, 2) || 1; return [t, 2 * t, t]; }, draw: 'line3', formula: '\\{t(1,2,1): t\\in\\mathbb R\\}' },
            octant: { name: 'Octant x, y, z ≥ 0', dim: 3, has: (v) => v.every(x => x >= -1e-9), sample: () => [randInt(0, 2), randInt(0, 2), randInt(0, 2)], draw: 'octant', formula: '\\{(x,y,z): x,y,z\\ge 0\\}' },
            xyz0: { name: 'Coordinate planes, xyz = 0', dim: 3, has: (v) => near(v[0] * v[1] * v[2], 0), sample: () => { const v = [randInt(-2, 2) || 1, randInt(-2, 2) || 1, randInt(-2, 2) || 1]; v[randInt(0, 2)] = 0; return v; }, draw: 'xyz0', formula: '\\{(x,y,z): xyz = 0\\}' }
        },
        wit: null, proj: null,
        init() {
            onInputs(['sc-preset'], () => { this.wit = null; this.redraw(); });
            const b = document.getElementById('btn-sc-witness'); if (b) b.addEventListener('click', () => { this.wit = null; this.redraw(); });
            this.proj = new Projector3D(-0.6, 0.5, 60);
            const c = document.getElementById('canvas-sub'); if (c) this.proj.attachDrag(c, () => this.redraw());
            this.redraw();
        },
        resize() { this.redraw(); },
        runTests(S) {
            const zeroV = S.dim === 2 ? [0, 0] : [0, 0, 0];
            const add = (u, v) => u.map((x, i) => x + v[i]);
            const sc = (a, v) => v.map(x => a * x);
            const hasZero = S.has(zeroV);
            let addFail = null, scFail = null, u = S.sample(), v = S.sample();
            for (let t = 0; t < 400 && !addFail; t++) { const a = S.sample(), b = S.sample(); if (!S.has(add(a, b))) addFail = { u: a, v: b, s: add(a, b) }; }
            for (let t = 0; t < 400 && !scFail; t++) { const a = S.sample(); const c = pickRandom([-1, 2, 0.5, -2, 3]); if (!S.has(sc(c, a))) scFail = { c, v: a, s: sc(c, a) }; }
            if (addFail) { u = addFail.u; v = addFail.v; }
            let cScale = pickRandom([-1, 2, 0.5]); let sv = scFail ? scFail.v : (S.has(sc(cScale, u)) ? u : v); if (scFail) cScale = scFail.c;
            if (u.every(x => x === 0) && !addFail) { u = S.sample(); }
            return { hasZero, addFail, scFail, u, v, sum: add(u, v), cScale, sv, scaled: sc(cScale, sv), zeroV };
        },
        redraw() {
            const canvas = document.getElementById('canvas-sub'); if (!canvas) return;
            const key = strVal('sc-preset', 'axes');
            const S = this.SETS[key] || this.SETS.axes;
            if (!this.wit || this.wit.key !== key) this.wit = { key, ...this.runTests(S) };
            const W = this.wit;
            const { ctx, w, h } = vzCanvasSize(canvas, 360);
            const pal = themePalette();
            ctx.clearRect(0, 0, w, h);
            const isSub = W.hasZero && !W.addFail && !W.scFail;
            if (S.dim === 2) this.draw2D(ctx, w, h, pal, S, W); else this.draw3D(ctx, w, h, pal, S, W);
            const mark = (ok) => (ok ? '<span class="text-success">✓ in the set</span>' : '<span class="text-error">✗ not in the set</span>');
            const rows = [
                ['(S1) contains 0', { v: W.hasZero ? '✓' : '✗', cls: W.hasZero ? 'text-success' : 'text-error' }, `0 = ${fmtV(W.zeroV)} ${W.hasZero ? 'satisfies the condition' : 'does not satisfy the condition'}`],
                ['(S2) closed under +', { v: W.addFail ? '✗' : '✓ (400 random pairs)', cls: W.addFail ? 'text-error' : 'text-success' }, `u = ${fmtV(W.u)}, v = ${fmtV(W.v)}, u + v = ${fmtV(W.sum)}: ${mark(S.has(W.sum))}`],
                ['(S3) closed under scalars', { v: W.scFail ? '✗' : '✓ (400 random trials)', cls: W.scFail ? 'text-error' : 'text-success' }, `c = ${W.cScale}, v = ${fmtV(W.sv)}, cv = ${fmtV(W.scaled)}: ${mark(S.has(W.scaled))}`]
            ];
            const verdictWhy = {
                line0: 'A line through the origin is $\\operatorname{span}\\{(1,2)\\}$: sums and multiples of multiples of $(1,2)$ are multiples of $(1,2)$.',
                line1: 'The origin is not on the line, so (S1) fails; (S2) fails too: adding two points doubles the intercept.',
                axes: 'Each axis alone is a subspace, but their union is not: a point on each axis adds to a point on neither. Unions of subspaces are subspaces only when one contains the other.',
                quadrant: 'Closed under addition and positive scalars, but multiplying by $-1$ leaves the quadrant.',
                disc: 'Bounded sets other than $\\{\\mathbf 0\\}$ are never subspaces: scale any non-zero point by a large $c$.',
                parabola: 'Contains the origin, but $(1,1)+(1,1) = (2,2)$ is not on $y = x^2$; nor is $2\\cdot(1,1)$.',
                lattice: 'Closed under addition and integer scalars, but not under real scalars: $\\frac12(1,0)\\notin\\mathbb Z^2$.',
                absline: 'Contains the origin and is closed under positive scalars, but $(-1)(1,1) = (-1,-1)$ has $y = -1\\neq|{-1}|$.',
                cross: 'Two lines through the origin: each is a subspace, the union is not ($(1,1)+(1,-1) = (2,0)$).',
                all: 'The whole space is trivially a subspace of itself.',
                zero: '$\\{\\mathbf 0\\}$ is the smallest subspace: $\\mathbf 0+\\mathbf 0 = \\mathbf 0$ and $c\\mathbf 0 = \\mathbf 0$.',
                plane0: 'A homogeneous linear equation: the null space of $(1\\ 1\\ 1)$, a plane through the origin of dimension $2$.',
                plane1: 'The origin gives $0\\neq 1$. A plane not through the origin is a translate of a subspace (an affine subspace), not a subspace.',
                line3: '$\\operatorname{span}\\{(1,2,1)\\}$, a line through the origin.',
                octant: 'Closed under addition but not under negative scalars.',
                xyz0: 'The union of the three coordinate planes; $(1,1,0)+(0,0,1)$ has all coordinates non-zero.'
            }[key];
            vzSet('sc-results', LabUI.kv([
                { label: 'Set', value: S.name },
                { label: 'Verdict', value: isSub ? 'Subspace' : 'Not a subspace' },
                { label: 'Failing test(s)', value: isSub ? 'none' : [!W.hasZero && 'S1', W.addFail && 'S2', W.scFail && 'S3'].filter(Boolean).join(', ') }
            ]) + LabUI.table(['Test', 'Result', 'Witness drawn on the canvas'], rows) + LabUI.steps([
                { title: 'Why', body: `$W = ${S.formula}$. ${verdictWhy}` },
                { title: 'Remember', body: isSub ? 'Random trials cannot prove closure; the proof takes two general elements of $W$ and shows the sum and multiple satisfy the defining condition.' : 'One explicit witness is a complete disproof. Look for $\\mathbf 0$ first, then try $c = -1$ and $c = 2$, then a sum of two "extreme" members.' }
            ]));
        },
        draw2D(ctx, w, h, pal, S, W) {
            const R = 4.2;
            const ch = new Chart2D(ctx.canvas, -R, R, -R, R);
            ch.padding = 24; ch.squareAspect();
            ch.drawGrid(pal); ch.drawAxes(pal);
            const fillA = pal.accentA(0.18);
            ctx.save();
            const X = (x) => ch.toScreenX(x), Y = (y) => ch.toScreenY(y);
            ctx.strokeStyle = pal.accent; ctx.fillStyle = fillA; ctx.lineWidth = 2.5;
            switch (S.draw) {
                case 'line': ctx.beginPath(); ctx.moveTo(X(-R), Y(S.a * -R + S.b)); ctx.lineTo(X(R), Y(S.a * R + S.b)); ctx.stroke(); break;
                case 'axes': ctx.beginPath(); ctx.moveTo(X(-R), Y(0)); ctx.lineTo(X(R), Y(0)); ctx.moveTo(X(0), Y(-R)); ctx.lineTo(X(0), Y(R)); ctx.stroke(); break;
                case 'quadrant': ctx.fillRect(X(0), Y(R), X(R) - X(0), Y(0) - Y(R)); ctx.strokeRect(X(0), Y(R), X(R) - X(0), Y(0) - Y(R)); break;
                case 'disc': ctx.beginPath(); ctx.arc(X(0), Y(0), X(1) - X(0), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); break;
                case 'parabola': ch.plotFunction(x => x * x, pal.accent); break;
                case 'lattice': for (let i = -4; i <= 4; i++) for (let j = -4; j <= 4; j++) { ctx.beginPath(); ctx.arc(X(i), Y(j), 3, 0, Math.PI * 2); ctx.fillStyle = pal.accent; ctx.fill(); } break;
                case 'abs': ctx.beginPath(); ctx.moveTo(X(-R), Y(R)); ctx.lineTo(X(0), Y(0)); ctx.lineTo(X(R), Y(R)); ctx.stroke(); break;
                case 'cross': ctx.beginPath(); ctx.moveTo(X(-R), Y(-R)); ctx.lineTo(X(R), Y(R)); ctx.moveTo(X(-R), Y(R)); ctx.lineTo(X(R), Y(-R)); ctx.stroke(); break;
                case 'all': ctx.fillRect(ch.padding, ch.padding, ch.plotW, ch.plotH); break;
                case 'zero': ctx.beginPath(); ctx.arc(X(0), Y(0), 6, 0, Math.PI * 2); ctx.fillStyle = pal.accent; ctx.fill(); break;
            }
            ctx.restore();
            const dot = (p, color, label, ok) => {
                if (Math.abs(p[0]) > R || Math.abs(p[1]) > R) { ch.text(`${label} = ${fmtV(p)} (off screen)`, 0, 0, color, { screen: true, dx: ch.padding + 4, dy: h - 6 }); return; }
                ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 6, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
                if (ok === false) { ctx.strokeStyle = pal.error; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(X(p[0]), Y(p[1]), 11, 0, Math.PI * 2); ctx.stroke(); }
                ch.text(label, p[0], p[1], color, { dx: 9, dy: -8, font: 'bold 12px Outfit, sans-serif' });
            };
            if (!W.hasZero) dot([0, 0], pal.pink, '0', false);
            dot(W.u, pal.blue, 'u', true); dot(W.v, pal.blue, 'v', true);
            ch.drawArrow(0, 0, W.u[0], W.u[1], pal.blue, { lineWidth: 1.5 }); ch.drawArrow(0, 0, W.v[0], W.v[1], pal.blue, { lineWidth: 1.5 });
            ctx.setLineDash([4, 4]); ch.drawArrow(W.u[0], W.u[1], W.sum[0], W.sum[1], pal.muted, { lineWidth: 1 }); ctx.setLineDash([]);
            dot(W.sum, pal.pink, 'u+v', S.has(W.sum));
            dot(W.scaled, pal.orange, `${W.cScale}v`, S.has(W.scaled));
        },
        draw3D(ctx, w, h, pal, S, W) {
            const P = this.proj; P.cx = w / 2; P.cy = h / 2 + 10; P.scale = Math.min(w, h) / 9;
            const L = (a, b, color, lw = 1, dash = null) => { const p = P.project(...a), q = P.project(...b); ctx.strokeStyle = color; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy); ctx.stroke(); ctx.setLineDash([]); };
            // axes
            L([-3, 0, 0], [3, 0, 0], pal.axis); L([0, -3, 0], [0, 3, 0], pal.axis); L([0, 0, -3], [0, 0, 3], pal.axis);
            const lbl = (p, t, c) => { const q = P.project(...p); ctx.fillStyle = c; ctx.font = '11px Outfit, sans-serif'; ctx.fillText(t, q.sx + 4, q.sy - 4); };
            lbl([3.2, 0, 0], 'x', pal.muted); lbl([0, 3.2, 0], 'y', pal.muted); lbl([0, 0, 3.2], 'z', pal.muted);
            ctx.fillStyle = pal.accentA(0.18); ctx.strokeStyle = pal.accent; ctx.lineWidth = 1.5;
            const poly = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const q = P.project(...p); i ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy); }); ctx.closePath(); ctx.fill(); ctx.stroke(); };
            if (S.draw === 'plane') { const d = S.d; poly([[3, -3, d], [3, 0, d - 3], [-3, 3, d], [-3, 0, d + 3]].map(p => [p[0], p[1], d - p[0] - p[1]])); }
            if (S.draw === 'line3') L([-1.5, -3, -1.5], [1.5, 3, 1.5], pal.accent, 3);
            if (S.draw === 'octant') { ctx.fillStyle = pal.accentA(0.12); poly([[0, 0, 0], [3, 0, 0], [3, 3, 0], [0, 3, 0]]); poly([[0, 0, 0], [3, 0, 0], [3, 0, 3], [0, 0, 3]]); poly([[0, 0, 0], [0, 3, 0], [0, 3, 3], [0, 0, 3]]); }
            if (S.draw === 'xyz0') { ctx.fillStyle = pal.accentA(0.10); poly([[-3, -3, 0], [3, -3, 0], [3, 3, 0], [-3, 3, 0]]); poly([[-3, 0, -3], [3, 0, -3], [3, 0, 3], [-3, 0, 3]]); poly([[0, -3, -3], [0, 3, -3], [0, 3, 3], [0, -3, 3]]); }
            const dot = (p, color, label, ok) => { const q = P.project(...p); ctx.beginPath(); ctx.arc(q.sx, q.sy, 6, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); if (ok === false) { ctx.strokeStyle = pal.error; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(q.sx, q.sy, 11, 0, Math.PI * 2); ctx.stroke(); } ctx.fillStyle = color; ctx.font = 'bold 12px Outfit, sans-serif'; ctx.fillText(`${label} ${fmtV(p)}`, q.sx + 9, q.sy - 8); };
            if (!W.hasZero) dot([0, 0, 0], pal.pink, '0', false);
            L([0, 0, 0], W.u, pal.blue, 1.5); L([0, 0, 0], W.v, pal.blue, 1.5); L(W.u, W.sum, pal.muted, 1, [4, 4]);
            dot(W.u, pal.blue, 'u', true); dot(W.v, pal.blue, 'v', true); dot(W.sum, pal.pink, 'u+v', S.has(W.sum)); dot(W.scaled, pal.orange, `${W.cScale}v`, S.has(W.scaled));
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.fillText('drag to rotate', 8, h - 8);
        }
    },

    /* ====================================================================
     * 3. Span & independence lab
     * ==================================================================== */
    spanlab: {
        proj: null,
        init() {
            onInputs(['sp-v1', 'sp-v2', 'sp-v3', 'sp-w', 'sp-preset', 'pp-p1', 'pp-p2', 'pp-p3', 'pp-p4', 'pp-target'], () => this.redraw());
            const pre = document.getElementById('sp-preset');
            if (pre) pre.addEventListener('change', () => {
                const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
                const p = { indep: ['1,0,0', '0,1,0', '1,1,1', '2,3,1'], plane: ['1,2,0', '0,1,1', '1,3,1', '2,5,1'], line: ['1,2,1', '2,4,2', '-1,-2,-1', '3,6,3'], off: ['1,2,0', '0,1,1', '', '1,1,1'], zero: ['1,1,0', '0,0,0', '2,2,0', '1,1,1'] }[pre.value];
                if (p) { set('sp-v1', p[0]); set('sp-v2', p[1]); set('sp-v3', p[2]); set('sp-w', p[3]); }
                this.redraw();
            });
            const b1 = document.getElementById('btn-sp-run'); if (b1) b1.addEventListener('click', () => this.redraw());
            const b2 = document.getElementById('btn-pp-run'); if (b2) b2.addEventListener('click', () => this.redraw());
            this.proj = new Projector3D(-0.6, 0.5, 60);
            const c = document.getElementById('canvas-span'); if (c) this.proj.attachDrag(c, () => this.drawRn());
            this.redraw();
        },
        resize() { this.redraw(); },
        onSubTab() { this.redraw(); },
        redraw() { const sub = currentSub('sp') || 'rn'; if (sub === 'rn') this.drawRn(); else this.drawPoly(); },
        /* rank/membership analysis shared by both sub-tools */
        analyse(vs, w, dimV) {
            const r = rankOf(vs);
            const rw = w ? rankOf(vs.concat([w])) : null;
            const cols = vs[0] ? vs[0].length : 0;
            const M = []; for (let i = 0; i < cols; i++) M.push(vs.map(v => v[i]));
            const R = rref(M);
            const basisIdx = R.pivots;
            let coords = null;
            if (w && rw === r) {
                const Aug = M.map((row, i) => row.concat([w[i]]));
                const RR = rref(Aug).rref;
                coords = vs.map(() => 0);
                RR.forEach((row, i) => { const pc = row.findIndex((x, j) => j < vs.length && Math.abs(x) > 1e-9); if (pc >= 0) coords[pc] = row[vs.length]; });
            }
            return { r, rw, inSpan: w ? rw === r : null, basisIdx, coords, spansAll: r === dimV, indep: r === vs.length };
        },
        drawRn() {
            const canvas = document.getElementById('canvas-span'); if (!canvas) return;
            const { ctx, w, h } = vzCanvasSize(canvas, 360);
            const pal = themePalette();
            ctx.clearRect(0, 0, w, h);
            const raw = [strVal('sp-v1', '1,0,0'), strVal('sp-v2', '0,1,0'), strVal('sp-v3', '')];
            const vs = raw.map(s => parseVec(s, 3)).filter(Boolean);
            const target = parseVec(strVal('sp-w', ''), 3);
            const P = this.proj; P.cx = w / 2; P.cy = h / 2 + 10; P.scale = Math.min(w, h) / 9;
            const L = (a, b, color, lw = 1, dash = null) => { const p = P.project(...a), q = P.project(...b); ctx.strokeStyle = color; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.beginPath(); ctx.moveTo(p.sx, p.sy); ctx.lineTo(q.sx, q.sy); ctx.stroke(); ctx.setLineDash([]); };
            L([-3, 0, 0], [3, 0, 0], pal.axis); L([0, -3, 0], [0, 3, 0], pal.axis); L([0, 0, -3], [0, 0, 3], pal.axis);
            const lbl = (p, t, c, bold) => { const q = P.project(...p); ctx.fillStyle = c; ctx.font = `${bold ? 'bold ' : ''}11px Outfit, sans-serif`; ctx.fillText(t, q.sx + 4, q.sy - 4); };
            lbl([3.2, 0, 0], 'x', pal.muted); lbl([0, 3.2, 0], 'y', pal.muted); lbl([0, 0, 3.2], 'z', pal.muted);
            if (!vs.length) { vzSet('sp-results', '<p class="text-muted">Enter at least one vector as three numbers, e.g. <code>1, 2, 0</code>.</p>'); return; }
            const A = this.analyse(vs, target, 3);
            // draw span: line (r=1) / plane (r=2) / everything (r=3)
            const norm = (v) => Math.hypot(...v) || 1;
            const basis = A.basisIdx.map(i => vs[i]);
            ctx.fillStyle = pal.accentA(0.16); ctx.strokeStyle = pal.accent; ctx.lineWidth = 1.2;
            if (A.r === 1) { const d = basis[0].map(x => 3.5 * x / norm(basis[0])); L(d.map(x => -x), d, pal.accent, 3); }
            else if (A.r === 2) {
                const e1 = basis[0].map(x => x / norm(basis[0]));
                const dotp = basis[1].reduce((s, x, i) => s + x * e1[i], 0); let e2 = basis[1].map((x, i) => x - dotp * e1[i]); e2 = e2.map(x => x / norm(e2));
                const s = 3.2; const corner = (a, b) => e1.map((x, i) => a * x + b * e2[i]);
                const pts = [corner(-s, -s), corner(s, -s), corner(s, s), corner(-s, s)];
                ctx.beginPath(); pts.forEach((p, i) => { const q = P.project(...p); i ? ctx.lineTo(q.sx, q.sy) : ctx.moveTo(q.sx, q.sy); }); ctx.closePath(); ctx.fill(); ctx.stroke();
            } else if (A.r === 3) { ctx.fillStyle = pal.muted; ctx.font = '12px Outfit, sans-serif'; ctx.fillText('span = all of R³', 8, 18); }
            vs.forEach((v, i) => { L([0, 0, 0], v, pal.blue, 2.2); lbl(v, `v${i + 1} ${fmtV(v)}`, pal.blue, true); });
            if (target) { L([0, 0, 0], target, A.inSpan ? pal.success : pal.pink, 2.2, [5, 4]); lbl(target, `w ${fmtV(target)}`, A.inSpan ? pal.success : pal.pink, true); }
            ctx.fillStyle = pal.muted; ctx.font = '11px Outfit, sans-serif'; ctx.fillText('drag to rotate', 8, h - 8);
            const M = [0, 1, 2].map(i => vs.map(v => v[i]));
            const RR = rref(M).rref;
            const matLatex = (rows) => `\\begin{pmatrix}${rows.map(r => r.map(numStr).join('&')).join('\\\\')}\\end{pmatrix}`;
            const steps = [
                { title: 'Rank', body: `Columns $= v_1,\\dots,v_{${vs.length}}$: $$${matLatex(M)} \\;\\xrightarrow{\\text{RREF}}\\; ${matLatex(RR)}$$ Rank $= ${A.r}$, pivot columns: ${A.basisIdx.map(i => `$v_{${i + 1}}$`).join(', ')}. So $\\dim\\operatorname{span} = ${A.r}$: ${A.r === 0 ? 'only the zero vector' : A.r === 1 ? 'a line through the origin' : A.r === 2 ? 'a plane through the origin' : 'all of $\\mathbb R^3$'}.` },
                { title: 'Independence', body: A.indep ? `Rank equals the number of vectors ($${vs.length}$), so every column is a pivot column and the set is <strong>linearly independent</strong>.` : `Rank $${A.r} <$ number of vectors $${vs.length}$: the set is <strong>dependent</strong>. A basis of the span is $\\{${A.basisIdx.map(i => `v_{${i + 1}}`).join(', ')}\\}$; the other vector(s) are combinations of these.` }
            ];
            if (target) steps.push({ title: 'Membership of w', body: A.inSpan ? `$\\operatorname{rank}[v\\mid w] = ${A.rw} = \\operatorname{rank}[v]$, so $w\\in\\operatorname{span}$: $w = ${A.coords.map((c, i) => `${numStr(Math.round(c * 1e6) / 1e6)}\\,v_{${i + 1}}`).join(' + ')}$${A.indep ? '' : ' (one of several expressions, since the set is dependent)'}.` : `$\\operatorname{rank}[v\\mid w] = ${A.rw} > ${A.r} = \\operatorname{rank}[v]$: the system $\\sum a_i v_i = w$ is inconsistent, so $w\\notin\\operatorname{span}$ (pink dashed vector leaves the ${A.r === 1 ? 'line' : 'plane'}).` });
            vzSet('sp-results', LabUI.kv([
                { label: 'Vectors', value: String(vs.length) },
                { label: 'dim span', value: String(A.r) },
                { label: 'Independent?', value: A.indep ? 'Yes' : 'No' },
                { label: 'Spans R³?', value: A.spansAll ? 'Yes' : 'No' },
                ...(target ? [{ label: 'w ∈ span?', value: A.inSpan ? 'Yes' : 'No' }] : [])
            ]) + LabUI.steps(steps));
        },
        drawPoly() {
            const raw = ['pp-p1', 'pp-p2', 'pp-p3', 'pp-p4'].map(id => strVal(id, ''));
            const vs = raw.map(s => parseVec(s, 4)).filter(Boolean);
            const target = parseVec(strVal('pp-target', ''), 4);
            if (!vs.length) { vzSet('pp-results', '<p class="text-muted">Enter polynomials of degree ≤ 3 as coefficient lists <code>a0, a1, a2, a3</code> (constant first). Example: <code>1, 0, 1, 0</code> is $1 + x^2$.</p>'); return; }
            const A = this.analyse(vs, target, 4);
            const M = [0, 1, 2, 3].map(i => vs.map(v => v[i]));
            const RR = rref(M).rref;
            const matLatex = (rows) => `\\begin{pmatrix}${rows.map(r => r.map(numStr).join('&')).join('\\\\')}\\end{pmatrix}`;
            const steps = [
                { title: 'Translate to coordinates', body: `Basis $\\{1, x, x^2, x^3\\}$ of $P_3$: ${vs.map((v, i) => `$p_{${i + 1}} = ${polyLatex(v)} \\leftrightarrow ${rowLatex(v)}$`).join(', ')}.` },
                { title: 'Row reduce (coefficient vectors as columns)', body: `$$${matLatex(M)} \\;\\xrightarrow{\\text{RREF}}\\; ${matLatex(RR)}$$ Rank $= ${A.r}$, so $\\dim\\operatorname{span}\\{p_i\\} = ${A.r}$; a basis of the span is $\\{${A.basisIdx.map(i => `p_{${i + 1}}`).join(', ')}\\}$.` },
                { title: 'Independence', body: A.indep ? `Rank $= ${vs.length}$ = number of polynomials: <strong>independent</strong>.` : `Rank $${A.r} < ${vs.length}$: <strong>dependent</strong>; some $p_i$ is a combination of the others.` + (vs.length > 4 ? ' (More than $4$ polynomials in the $4$-dimensional $P_3$ are always dependent.)' : '') },
                { title: 'Spanning', body: A.spansAll ? `Rank $= 4 = \\dim P_3$: the polynomials <strong>span $P_3$</strong>${A.indep ? ' and form a basis' : ''}.` : `Rank $${A.r} < 4$: they do not span $P_3$.` }
            ];
            if (target) steps.push({ title: 'Membership', body: A.inSpan ? `$q = ${polyLatex(target)}$ is in the span: $q = ${A.coords.map((c, i) => `${numStr(Math.round(c * 1e6) / 1e6)}\\,p_{${i + 1}}`).join(' + ')}$.` : `$q = ${polyLatex(target)}$ is <strong>not</strong> in the span: appending its coefficient vector raises the rank to $${A.rw}$.` });
            vzSet('pp-results', LabUI.kv([
                { label: 'Polynomials', value: String(vs.length) },
                { label: 'dim span', value: String(A.r) },
                { label: 'Independent?', value: A.indep ? 'Yes' : 'No' },
                { label: 'Spans P₃?', value: A.spansAll ? 'Yes' : 'No' },
                ...(target ? [{ label: 'q ∈ span?', value: A.inSpan ? 'Yes' : 'No' }] : [])
            ]) + LabUI.steps(steps));
        }
    }
};
