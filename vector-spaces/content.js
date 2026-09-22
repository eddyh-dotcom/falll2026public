/* ==========================================================================
 * Fields & Vector Spaces Lab — content
 * Standard textbook material only: fields, vector spaces over a field, the
 * usual examples (F^n, C over R, polynomials, functions, matrices), subspaces
 * and the subspace test, span, linear independence, bases and dimension.
 * ========================================================================== */

const LabConfig = {
    name: 'Fields & Vector Spaces Lab',
    shortName: 'Vector Spaces',
    storageKey: 'vector_lab',
    defaultReference: 'subspace',
    modules: {
        dashboard: { title: 'Dashboard & Reference', desc: 'Fields, vector-space axioms, the standard examples, subspaces, span, independence and dimension' },
        fieldlab: { title: 'Fields & Axiom Checker', desc: 'Z_n tables (which n give a field?) and a numeric checker for the vector-space axioms' },
        subcheck: { title: 'Subspace Checker', desc: 'Run the subspace test on subsets of R² and R³ and watch the witnesses' },
        spanlab: { title: 'Span & Independence Lab', desc: 'Span, independence, rank and membership in R³ and in polynomial spaces' },
        quiz: { title: 'Practice Quiz Hub', desc: 'Randomised drills with worked explanations' }
    }
};

/* --------------------------------------------------------------------------
 * Small exact-arithmetic helpers (fractions) shared with the visualizers
 * -------------------------------------------------------------------------- */
function modInv(a, p) { a = ((a % p) + p) % p; for (let x = 1; x < p; x++) if ((a * x) % p === 1) return x; return null; }
function isPrime(n) { if (n < 2) return false; for (let d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }
/* Row-reduce a matrix of numbers (rational-safe for small integers via floating point + rounding) → { rref, rank, pivots } */
function rref(M) {
    const A = M.map(r => r.slice());
    const rows = A.length, cols = rows ? A[0].length : 0;
    let r = 0; const pivots = [];
    for (let c = 0; c < cols && r < rows; c++) {
        let p = r; for (let i = r + 1; i < rows; i++) if (Math.abs(A[i][c]) > Math.abs(A[p][c])) p = i;
        if (Math.abs(A[p][c]) < 1e-9) continue;
        [A[r], A[p]] = [A[p], A[r]];
        const pv = A[r][c]; for (let j = 0; j < cols; j++) A[r][j] /= pv;
        for (let i = 0; i < rows; i++) if (i !== r) { const f = A[i][c]; if (Math.abs(f) > 1e-12) for (let j = 0; j < cols; j++) A[i][j] -= f * A[r][j]; }
        pivots.push(c); r++;
    }
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { if (Math.abs(A[i][j]) < 1e-9) A[i][j] = 0; A[i][j] = Math.round(A[i][j] * 1e6) / 1e6; }
    return { rref: A, rank: r, pivots };
}
function rankOf(vectors) { return vectors.length ? rref(vectors).rank : 0; }
const vecLatex = (v) => `\\begin{pmatrix}${v.join('\\\\')}\\end{pmatrix}`;
const rowLatex = (v) => `(${v.join(',\\,')})`;
const polyLatex = (coeffs) => { // coeffs[i] = coefficient of x^i
    const parts = [];
    for (let i = coeffs.length - 1; i >= 0; i--) {
        const c = coeffs[i]; if (c === 0) continue;
        const mag = Math.abs(c); const mon = i === 0 ? '' : i === 1 ? 'x' : `x^{${i}}`;
        const coef = (mag === 1 && mon) ? '' : String(mag);
        parts.push((c < 0 ? '-' : parts.length ? '+' : '') + coef + mon);
    }
    return parts.length ? parts.join('') : '0';
};
const numStr = (v) => (Number.isInteger(v) ? String(v) : fracLatexFromFloat(v));
function fracLatexFromFloat(v) { for (let d = 1; d <= 24; d++) { const n = Math.round(v * d); if (Math.abs(n / d - v) < 1e-9) return fracLatex(n, d); } return String(Math.round(v * 1000) / 1000); }

/* --------------------------------------------------------------------------
 * Reference hub
 * -------------------------------------------------------------------------- */
const ReferenceData = {
    fields: {
        title: '1. Fields',
        intro: 'A field is a set of "scalars" where you can add, subtract, multiply and divide by anything non-zero, with the usual rules. Vector spaces are always over a field.',
        sections: [
            {
                heading: 'Definition',
                text: 'A <strong>field</strong> is a set $F$ with two operations $+$ and $\\cdot$ such that for all $a,b,c\\in F$:',
                bullets: [
                    '<strong>(A1)</strong> $a+b\\in F$ and <strong>(M1)</strong> $ab\\in F$ (closure).',
                    '<strong>(A2)</strong> $a+b=b+a$, <strong>(M2)</strong> $ab=ba$ (commutativity).',
                    '<strong>(A3)</strong> $(a+b)+c=a+(b+c)$, <strong>(M3)</strong> $(ab)c=a(bc)$ (associativity).',
                    '<strong>(A4)</strong> there is $0\\in F$ with $a+0=a$; <strong>(M4)</strong> there is $1\\in F$, $1\\neq 0$, with $a\\cdot 1=a$ (identities).',
                    '<strong>(A5)</strong> every $a$ has $-a$ with $a+(-a)=0$; <strong>(M5)</strong> every $a\\neq 0$ has $a^{-1}$ with $a a^{-1}=1$ (inverses).',
                    '<strong>(D)</strong> $a(b+c)=ab+ac$ (distributivity).'
                ],
                note: 'Two things are easy to forget: $1 \\neq 0$ (so the one-element set is not a field), and only <em>non-zero</em> elements need multiplicative inverses.'
            },
            {
                heading: 'Examples and non-examples',
                bullets: [
                    '$\\mathbb Q$, $\\mathbb R$, $\\mathbb C$ are fields with the usual operations.',
                    '$\\mathbb F_p = \\mathbb Z_p = \\{0,1,\\dots,p-1\\}$ with addition and multiplication mod $p$ is a field <em>exactly when $p$ is prime</em>.',
                    '$\\mathbb Z$ is <strong>not</strong> a field: $2$ has no inverse ((M5) fails). Every other axiom holds.',
                    '$\\mathbb Z_6$ is <strong>not</strong> a field: $2\\cdot 3 = 0$ with $2,3\\neq 0$ (zero divisors), so $2$ has no inverse.',
                    '$\\mathbb Q(\\sqrt 2) = \\{a+b\\sqrt 2: a,b\\in\\mathbb Q\\}$ is a field: $(a+b\\sqrt2)^{-1} = \\frac{a-b\\sqrt2}{a^2-2b^2}$.',
                    'Subfields: $\\mathbb Q\\subset\\mathbb R\\subset\\mathbb C$; any subfield of $\\mathbb C$ contains $\\mathbb Q$.'
                ]
            },
            {
                heading: 'Why $\\mathbb Z_p$ is a field for prime $p$',
                text: 'If $a\\not\\equiv 0$ then $\\gcd(a,p)=1$, so Bézout gives $ax+py=1$, i.e. $ax\\equiv 1\\pmod p$. Alternatively: the map $x\\mapsto ax$ is injective on $\\mathbb Z_p$ (if $ax\\equiv ay$ then $p\\mid a(x-y)$, so $p\\mid x-y$), hence surjective, hence hits $1$.',
                formula: '\\text{In } \\mathbb Z_7:\\quad 3^{-1} = 5 \\;(3\\cdot 5 = 15 = 1),\\qquad 2^{-1} = 4,\\qquad 6^{-1} = 6',
                note: 'For composite $n$, any $a$ sharing a factor with $n$ is a zero divisor and has no inverse.'
            },
            {
                heading: 'Consequences of the axioms',
                bullets: [
                    'The identities $0$, $1$ and the inverses $-a$, $a^{-1}$ are unique.',
                    '$a\\cdot 0 = 0$: from $a\\cdot 0 = a(0+0) = a\\cdot 0 + a\\cdot 0$, add $-(a\\cdot 0)$ to both sides.',
                    '$(-1)a = -a$ and $(-a)(-b) = ab$.',
                    'Cancellation: $ab = ac$ and $a\\neq 0$ imply $b=c$ (multiply by $a^{-1}$).',
                    'No zero divisors: $ab=0$ implies $a=0$ or $b=0$.'
                ]
            },
            {
                heading: 'Characteristic',
                text: 'The characteristic of $F$ is the smallest $n$ with $\\underbrace{1+\\cdots+1}_{n} = 0$, or $0$ if no such $n$ exists. It is $0$ for $\\mathbb Q,\\mathbb R,\\mathbb C$ and $p$ for $\\mathbb Z_p$; a positive characteristic is always prime.',
                note: 'In characteristic $2$, $1+1=0$ so $a = -a$ for every $a$: signs disappear. This is why some results carry the hypothesis "$1+1\\neq 0$".'
            }
        ]
    },

    vs: {
        title: '2. Vector spaces',
        intro: 'A vector space over a field $F$ is a set $V$ with an addition $V\\times V\\to V$ and a scalar multiplication $F\\times V\\to V$ obeying eight rules. The rules say exactly that the algebra of $\\mathbb R^n$ works.',
        sections: [
            {
                heading: 'Definition',
                text: 'For all $u,v,w\\in V$ and $a,b\\in F$:',
                bullets: [
                    '<strong>(V0)</strong> $u+v\\in V$ and $av\\in V$ (closure).',
                    '<strong>(V1)</strong> $u+v = v+u$.',
                    '<strong>(V2)</strong> $(u+v)+w = u+(v+w)$.',
                    '<strong>(V3)</strong> there is $\\mathbf 0\\in V$ with $v+\\mathbf 0 = v$.',
                    '<strong>(V4)</strong> every $v$ has $-v$ with $v+(-v) = \\mathbf 0$.',
                    '<strong>(V5)</strong> $a(u+v) = au+av$.',
                    '<strong>(V6)</strong> $(a+b)v = av+bv$.',
                    '<strong>(V7)</strong> $(ab)v = a(bv)$.',
                    '<strong>(V8)</strong> $1v = v$.'
                ],
                note: 'Elements of $V$ are vectors, elements of $F$ are scalars. Nothing about vectors being "arrows" is assumed: polynomials, functions and matrices are vectors when they satisfy these rules.'
            },
            {
                heading: 'Consequences (provable from the axioms alone)',
                bullets: [
                    'The zero vector is unique; additive inverses are unique.',
                    '$0v = \\mathbf 0$: $0v = (0+0)v = 0v+0v$, then add $-(0v)$.',
                    '$a\\mathbf 0 = \\mathbf 0$ for every scalar $a$.',
                    '$(-1)v = -v$: $v + (-1)v = 1v + (-1)v = (1-1)v = 0v = \\mathbf 0$.',
                    '$av = \\mathbf 0$ implies $a = 0$ or $v = \\mathbf 0$ (if $a\\neq 0$, multiply by $a^{-1}$).'
                ],
                note: 'These proofs use (V6), (V8) and the field axioms. They are the standard "first exercises" and appear on tests as fill-in-the-justification questions.'
            },
            {
                heading: 'How to verify a candidate is a vector space',
                bullets: [
                    'Say what the set is, what $+$ is, what scalar multiplication is and which field $F$ is.',
                    'Check closure first (V0): both operations must land back in $V$.',
                    'Find the zero vector explicitly and the inverse of a general element; do not assume they are the "obvious" ones (for unusual operations they change).',
                    'Check the four scalar axioms (V5)–(V8) with general symbols; (V8) $1v=v$ is the one that most often fails for invented operations.',
                    'One failing axiom, shown with a specific counterexample, is enough to reject.'
                ]
            },
            {
                heading: 'Over which field?',
                text: 'The same set can be a vector space over different fields, with different dimensions.',
                formula: ['\\mathbb C \\text{ over } \\mathbb C: \\dim = 1 \\;(\\text{basis } \\{1\\}); \\qquad \\mathbb C \\text{ over } \\mathbb R: \\dim = 2 \\;(\\text{basis } \\{1, i\\})', '\\mathbb R \\text{ over } \\mathbb Q: \\text{infinite-dimensional}'],
                note: 'Always ask "which scalars are allowed?" before deciding independence: $\\{1, i\\}$ is dependent over $\\mathbb C$ ($i\\cdot 1 - 1\\cdot i = 0$) but independent over $\\mathbb R$.'
            }
        ]
    },

    examples: {
        title: '3. The standard examples',
        sections: [
            {
                heading: '$F^n$, in particular $\\mathbb R^n$ and $\\mathbb C^n$',
                text: 'Columns (or $n$-tuples) with entries in $F$, componentwise operations. Zero vector $(0,\\dots,0)$. Standard basis $e_1,\\dots,e_n$, so $\\dim F^n = n$.',
                formula: '(x_1,\\dots,x_n) + (y_1,\\dots,y_n) = (x_1+y_1,\\dots,x_n+y_n), \\qquad a(x_1,\\dots,x_n) = (ax_1,\\dots,ax_n)',
                note: '$\\mathbb C^n$ over $\\mathbb C$ has dimension $n$; over $\\mathbb R$ it has dimension $2n$.'
            },
            {
                heading: 'Polynomials $P_n(F)$ and $P(F) = F[x]$',
                text: '$P_n(F)$ = polynomials of degree <em>at most</em> $n$ with coefficients in $F$; $F[x]$ = all polynomials. Add and scale coefficientwise. Zero vector: the zero polynomial.',
                formula: '\\dim P_n(F) = n+1, \\quad \\text{basis } \\{1, x, x^2, \\dots, x^n\\}; \\qquad \\dim F[x] = \\infty',
                bullets: ['Identify $a_0+a_1x+\\cdots+a_nx^n$ with $(a_0,\\dots,a_n)\\in F^{n+1}$: every question about $P_n$ becomes a question about $F^{n+1}$.', 'Polynomials of degree <em>exactly</em> $n$ do <strong>not</strong> form a subspace: $x^n + (-x^n) = 0$ has no degree $n$, and the zero polynomial is missing.']
            },
            {
                heading: 'Functions $F^S$, $\\mathcal F(\\mathbb R)$, $C(\\mathbb R)$',
                text: 'All functions $S\\to F$ with pointwise operations $(f+g)(s) = f(s)+g(s)$, $(af)(s) = a f(s)$. Zero vector: the constantly-zero function. Continuous, differentiable and polynomial functions are subspaces of $\\mathcal F(\\mathbb R)$ (sums and multiples of continuous functions are continuous).',
                note: '$\\mathbb R^n$ is the special case $S = \\{1,\\dots,n\\}$; sequences are $S = \\mathbb N$.'
            },
            {
                heading: 'Matrices $M_{m\\times n}(F)$',
                formula: '\\dim M_{m\\times n}(F) = mn, \\qquad \\text{basis: the matrix units } E_{ij}',
                bullets: ['Symmetric matrices ($A^T = A$) form a subspace of $M_{n\\times n}$ of dimension $\\frac{n(n+1)}{2}$; skew-symmetric ones have dimension $\\frac{n(n-1)}{2}$.', 'Matrices of trace $0$: subspace of dimension $n^2-1$. Invertible matrices: <strong>not</strong> a subspace (no zero matrix; $I + (-I) = 0$).']
            },
            {
                heading: 'Examples with unusual operations',
                bullets: [
                    '$V = \\mathbb R_{>0}$ with $u\\oplus v = uv$ and $a\\odot v = v^a$ <strong>is</strong> a vector space over $\\mathbb R$: zero vector is $1$, $-v$ is $1/v$, and $(a+b)\\odot v = v^{a+b} = v^a v^b = a\\odot v \\oplus b\\odot v$. It is $\\mathbb R$ in disguise via $\\ln$.',
                    '$\\mathbb R^2$ with $a\\odot(x,y) = (ax, y)$ is <strong>not</strong>: $(a+b)\\odot(x,y) = ((a+b)x, y)$ but $a\\odot(x,y) + b\\odot(x,y) = ((a+b)x, 2y)$, so (V6) fails whenever $y\\neq 0$.',
                    '$\\mathbb R^2$ with $a\\odot(x,y) = (ax, 0)$ is <strong>not</strong>: $1\\odot(x,y) = (x,0)\\neq(x,y)$, (V8) fails.',
                    '$\\mathbb R^2$ with $(x_1,y_1)\\oplus(x_2,y_2) = (x_1+x_2, y_1y_2)$: no zero vector works for both coordinates with $y = 0$ (would need $0\\cdot y_0 = 0 = $ every $y$), so (V3)/(V4) fail.'
                ]
            }
        ]
    },

    subspace: {
        title: '4. Subspaces and the subspace test',
        intro: 'A subspace is a subset that is itself a vector space with the inherited operations. Because most axioms are inherited automatically, only three things need checking.',
        sections: [
            {
                heading: 'The subspace test',
                text: 'Let $V$ be a vector space over $F$ and $W\\subseteq V$. Then $W$ is a subspace if and only if',
                bullets: [
                    '<strong>(S1)</strong> $\\mathbf 0\\in W$ (equivalently, $W\\neq\\emptyset$);',
                    '<strong>(S2)</strong> $u,v\\in W \\Rightarrow u+v\\in W$ (closed under addition);',
                    '<strong>(S3)</strong> $a\\in F, v\\in W \\Rightarrow av\\in W$ (closed under scalar multiplication).'
                ],
                formula: '\\text{Compact form:}\\quad W \\neq \\emptyset \\text{ and } u,v\\in W,\\; a\\in F \\Rightarrow au+v\\in W',
                note: 'Why the other axioms are free: (V1), (V2), (V5)–(V8) are identities that hold in all of $V$, so in $W$. $-v = (-1)v\\in W$ by (S3). Only closure and non-emptiness can fail.'
            },
            {
                heading: 'How to use it',
                bullets: [
                    'To <em>prove</em> a subspace: take two general elements of $W$ (written in the form that defines $W$), add them / scale one, and show the result satisfies the defining condition. Then exhibit $\\mathbf 0$.',
                    'To <em>disprove</em>: one explicit counterexample suffices. First look for $\\mathbf 0$ (fastest): if $\\mathbf 0\\notin W$, done. Otherwise look for a sum or a scalar multiple (try $a = -1$ or $a = 2$) that leaves $W$.',
                    'Defining conditions that are <em>linear and homogeneous</em> (no constant term, no products, no absolute values, no inequalities) give subspaces. Anything else is suspect.'
                ]
            },
            {
                heading: 'Subspaces of $\\mathbb R^2$ and $\\mathbb R^3$',
                bullets: [
                    '$\\mathbb R^2$: $\\{\\mathbf 0\\}$, lines through the origin, $\\mathbb R^2$. Nothing else.',
                    '$\\mathbb R^3$: $\\{\\mathbf 0\\}$, lines through the origin, planes through the origin, $\\mathbb R^3$.',
                    'Solution set of a homogeneous system $A\\mathbf x = \\mathbf 0$ (the null space) is always a subspace of $F^n$.',
                    'Non-examples: a line not through $\\mathbf 0$ (fails S1); the union of the two axes $\\{xy = 0\\}$ (fails S2: $(1,0)+(0,1)$); the first quadrant $\\{x,y\\ge 0\\}$ (fails S3 with $a = -1$); the unit circle; $\\mathbb Z^2$ (fails S3 with $a = \\tfrac12$); the parabola $y = x^2$ (fails S2 and S3).'
                ]
            },
            {
                heading: 'Subspaces of polynomial, function and matrix spaces',
                bullets: [
                    'In $P_n$: $\\{p: p(0) = 0\\}$ ✓, $\\{p: p(1) = 0\\}$ ✓, $\\{p : p\'(2) = 0\\}$ ✓, even polynomials ✓, $\\{p: p(0) = 1\\}$ ✗ (no zero), $\\{p: \\deg p = n\\}$ ✗, $\\{p: p(0)p(1) = 0\\}$ ✗ (not closed under $+$: $x$ and $x-1$).',
                    'In $\\mathcal F(\\mathbb R)$: continuous ✓, $\\{f: f(3) = 0\\}$ ✓, $\\{f: f(-x) = f(x)\\}$ ✓, solutions of $y\'\' + y = 0$ ✓, $\\{f: f(0) = 1\\}$ ✗, $\\{f: f(x)\\ge 0\\}$ ✗, $\\{f: f(0)^2 = f(1)\\}$ ✗.',
                    'In $M_{n\\times n}$: symmetric ✓, upper triangular ✓, trace zero ✓, $\\{A: AB = BA\\}$ for fixed $B$ ✓, invertible ✗, $\\det A = 0$ ✗ (not closed under $+$), $A^2 = A$ ✗.'
                ]
            },
            {
                heading: 'Operations on subspaces',
                formula: ['U\\cap W \\text{ is a subspace}; \\qquad U + W = \\{u+w: u\\in U, w\\in W\\} \\text{ is a subspace}', 'U\\cup W \\text{ is a subspace} \\iff U\\subseteq W \\text{ or } W\\subseteq U', '\\dim(U+W) = \\dim U + \\dim W - \\dim(U\\cap W)'],
                bullets: ['$U+W$ is the smallest subspace containing both; $U\\cap W$ the largest contained in both.', 'The union of the two axes in $\\mathbb R^2$ is the standard counterexample for unions.', 'If $U\\cap W = \\{\\mathbf 0\\}$ the sum is <em>direct</em>, $U\\oplus W$, and every vector splits uniquely.']
            }
        ]
    },

    span: {
        title: '5. Linear combinations and span',
        sections: [
            {
                heading: 'Definitions',
                formula: ['a_1v_1 + a_2v_2 + \\cdots + a_kv_k \\quad (a_i\\in F) \\text{ is a linear combination of } v_1,\\dots,v_k', '\\operatorname{span}(S) = \\{\\text{all linear combinations of finitely many vectors of } S\\}, \\qquad \\operatorname{span}(\\emptyset) = \\{\\mathbf 0\\}'],
                bullets: ['$\\operatorname{span}(S)$ is a subspace of $V$, and it is the <em>smallest</em> subspace containing $S$.', '$S$ spans $V$ (is a spanning set) when $\\operatorname{span}(S) = V$.']
            },
            {
                heading: 'Is $w$ in the span? Solve a linear system',
                text: '$w\\in\\operatorname{span}(v_1,\\dots,v_k)$ iff $a_1v_1+\\cdots+a_kv_k = w$ has a solution. In $F^n$ that is the augmented system $[\\,v_1\\;\\cdots\\;v_k \\mid w\\,]$; consistent iff the last column is not a pivot column.',
                formula: '\\operatorname{rank}[v_1\\cdots v_k] = \\operatorname{rank}[v_1\\cdots v_k\\mid w] \\iff w\\in\\operatorname{span}(v_1,\\dots,v_k)',
                note: 'For polynomials, compare coefficients of each power of $x$; for matrices, compare entries. Both turn into the same kind of system.'
            },
            {
                heading: 'Geometry in $\\mathbb R^3$',
                bullets: ['$\\operatorname{span}(v)$ with $v\\neq\\mathbf 0$: the line through $\\mathbf 0$ in direction $v$.', '$\\operatorname{span}(u,v)$ with $u,v$ not parallel: the plane through $\\mathbf 0$ containing them.', 'Three vectors span $\\mathbb R^3$ iff the $3\\times 3$ matrix with those columns has rank $3$ (non-zero determinant).']
            },
            {
                heading: 'Useful facts',
                bullets: ['Adding a vector already in the span does not change the span: $\\operatorname{span}(S\\cup\\{w\\}) = \\operatorname{span}(S)$ iff $w\\in\\operatorname{span}(S)$.', 'Row operations do not change the row space, so the non-zero rows of an echelon form are a basis of the span of the original rows.', 'The span of the columns of $A$ is the column space; $\\dim = \\operatorname{rank}A$.']
            }
        ]
    },

    indep: {
        title: '6. Independence, bases, dimension',
        sections: [
            {
                heading: 'Linear independence',
                formula: 'v_1,\\dots,v_k \\text{ independent} \\iff \\big(a_1v_1+\\cdots+a_kv_k = \\mathbf 0 \\Rightarrow a_1=\\cdots=a_k=0\\big)',
                bullets: [
                    'Dependent iff some $v_i$ is a linear combination of the others.',
                    'Any set containing $\\mathbf 0$ is dependent; a single non-zero vector is independent; two vectors are dependent iff one is a multiple of the other.',
                    'In $F^n$: put the vectors as columns, row reduce; independent iff every column is a pivot column (rank $= k$). More than $n$ vectors in $F^n$ are always dependent.',
                    'For polynomials $\\{1, x, x^2, \\dots\\}$ is independent (a polynomial is zero only if all coefficients are). For functions, evaluate at several points or use Wronskians.'
                ]
            },
            {
                heading: 'Basis and dimension',
                text: 'A <strong>basis</strong> is an independent spanning set. Every basis of a finite-dimensional space has the same number of elements, the <strong>dimension</strong>.',
                formula: '\\dim F^n = n,\\quad \\dim P_n(F) = n+1,\\quad \\dim M_{m\\times n}(F) = mn,\\quad \\dim_{\\mathbb R}\\mathbb C = 2,\\quad \\dim\\{\\mathbf 0\\} = 0',
                bullets: [
                    'Every vector has a <em>unique</em> expression in a basis; the coefficients are its coordinates.',
                    'In an $n$-dimensional space: any $n$ independent vectors form a basis; any $n$ spanning vectors form a basis; any independent set extends to a basis; any spanning set contains a basis.',
                    'If $W\\subseteq V$ is a subspace then $\\dim W\\le\\dim V$, with equality iff $W = V$.'
                ]
            },
            {
                heading: 'Dimension of a subspace given by equations',
                text: 'A subspace of $F^n$ cut out by $r$ independent homogeneous linear equations has dimension $n - r$ (rank–nullity).',
                formula: '\\{(x,y,z): x+y+z = 0\\} \\subset\\mathbb R^3 \\text{ has } \\dim 2, \\text{ basis } \\{(1,-1,0), (1,0,-1)\\}',
                bullets: ['$\\{p\\in P_3: p(0) = 0\\}$: one condition on four coefficients, $\\dim = 3$, basis $\\{x, x^2, x^3\\}$.', '$\\{p\\in P_3: p(0) = p(1) = 0\\}$: $\\dim 2$, basis $\\{x(x-1), x^2(x-1)\\}$.', 'Symmetric $2\\times 2$ matrices: $\\dim 3$, basis $E_{11}, E_{22}, E_{12}+E_{21}$.']
            },
            {
                heading: 'Standard workflow',
                bullets: ['Translate to coordinates in $F^n$ (polynomial → coefficient vector, matrix → entries).', 'Row reduce the matrix whose columns (or rows) are the vectors.', 'Rank = dimension of the span; pivot columns pick out a basis from the original vectors; rank $= k$ means independent.', 'Membership of $w$: append $w$ as a column and compare ranks.']
            }
        ]
    },

    traps: {
        title: '7. Techniques and traps',
        sections: [
            {
                heading: 'Subspace slips',
                bullets: [
                    'Checking closure with <em>specific</em> vectors only proves nothing; the proof needs general elements. Specific vectors are for counterexamples.',
                    'A set can be closed under addition but not scalar multiplication (first quadrant, $\\mathbb Z^n$) or the other way round ($\\{xy = 0\\}$). Check both.',
                    '"Contains $\\mathbf 0$" is necessary, not sufficient: $y = x^2$ contains the origin.',
                    'Degree <em>at most</em> $n$ is a subspace; degree <em>exactly</em> $n$ is not.',
                    'Conditions with $=1$, $\\ge$, products, squares or absolute values almost never give subspaces.'
                ]
            },
            {
                heading: 'Field and scalar slips',
                bullets: [
                    'In $\\mathbb Z_p$, "divide by $a$" means multiply by $a^{-1}$; find it by trial or the extended Euclidean algorithm.',
                    '$\\mathbb Z_n$ is a field only for prime $n$. $\\mathbb Z_4$ is not (though a $4$-element field exists, it is not $\\mathbb Z_4$).',
                    'Dimension depends on the field: $\\mathbb C^2$ is $2$-dimensional over $\\mathbb C$ and $4$-dimensional over $\\mathbb R$.'
                ]
            },
            {
                heading: 'Span and independence slips',
                bullets: [
                    '"Independent" is a property of a <em>set</em>; "in the span" is about a vector and a set. Do not answer one when asked the other.',
                    'Rank is at most $\\min(\\text{rows}, \\text{columns})$: four vectors in $\\mathbb R^3$ are dependent before you compute anything.',
                    'A dependent set can still span; an independent set need not span. Basis = both.',
                    'Row reducing the matrix with vectors as <em>rows</em> gives a basis of the span from the echelon rows, but the pivot positions no longer point at the original vectors; use columns for that.'
                ]
            },
            {
                heading: 'Always check with $\\mathbf 0$, $-1$ and $2$',
                text: 'Before any algebra: is $\\mathbf 0$ in the set? Does multiplying a member by $-1$ or by $2$ stay in the set? Does adding two "extreme" members (one from each piece of a condition with "or") stay in the set? These three checks catch almost every non-subspace.'
            }
        ]
    }
};

/* --------------------------------------------------------------------------
 * Quiz generators
 * -------------------------------------------------------------------------- */
const TOPIC = {
    fieldAxioms: 'Fields: axioms and examples',
    fieldArith: 'Arithmetic in Z_p',
    vsAxioms: 'Vector-space axioms',
    vsExamples: 'Standard spaces and dimension',
    subspaceRn: 'Subspaces of R^n',
    subspacePoly: 'Subspaces of polynomial spaces',
    subspaceMatFn: 'Subspaces of matrix and function spaces',
    spanTest: 'Span and membership',
    independence: 'Linear independence',
    basisDim: 'Bases and dimension',
    subOps: 'Intersections, unions and sums'
};
const txtOpts = (correct, distractors) => ({ ...makeOptions(correct, distractors), isTextOptions: true });
const numOpts = (correct, distractors) => makeOptions(String(correct), distractors.map(String));
const PRIMES = [5, 7, 11, 13];
const randVec = (n, lo = -3, hi = 3) => Array.from({ length: n }, () => randInt(lo, hi));
const nonZeroVec = (n, lo = -3, hi = 3) => { let v; do { v = randVec(n, lo, hi); } while (v.every(x => x === 0)); return v; };
const addV = (u, v) => u.map((x, i) => x + v[i]);
const scaleV = (a, v) => v.map(x => a * x);
const yesNo = (correct, whyYes, whyNo) => txtOpts(correct ? 'Yes, it is a subspace' : 'No, it is not a subspace', correct ? ['No: it is not closed under addition', 'No: it does not contain the zero vector', 'No: it is not closed under scalar multiplication'] : ['Yes, it is a subspace', 'Yes, because it contains the zero vector', 'Yes, because it is closed under addition']);

const QuizGenerators = {
    fieldAxioms: [
        () => {
            const n = pickRandom([4, 6, 8, 9, 10, 12, 15]);
            const p = pickRandom(PRIMES);
            const askComposite = Math.random() < 0.5;
            const m = askComposite ? n : p;
            let d = 2; while (m % d) d++;
            return {
                topic: TOPIC.fieldAxioms,
                questionText: `Is $\\mathbb Z_{${m}}$ (integers mod $${m}$ with the usual operations) a field?`,
                mathText: '',
                ...txtOpts(askComposite ? `No: $${d}\\cdot${m / d} = 0$ in $\\mathbb Z_{${m}}$, so $${d}$ has no multiplicative inverse` : `Yes: $${m}$ is prime, so every non-zero element has an inverse`, askComposite ? [`Yes: $\\mathbb Z_n$ is a field for every $n\\ge 2$`, `No: addition is not commutative mod $${m}$`, `No: there is no element $1$`] : [`No: $${m}$ is odd`, `No: $${m - 1}$ has no inverse`, `Yes, but only because $${m} < 20$`]),
                explanation: askComposite ? `$\\mathbb Z_n$ is a field iff $n$ is prime. Here $${m} = ${d}\\cdot${m / d}$, so $${d}\\cdot${m / d}\\equiv 0$: two non-zero elements multiply to $0$ (zero divisors). If $${d}$ had an inverse $b$, then $${m / d} = b\\cdot${d}\\cdot${m / d} = b\\cdot 0 = 0$, a contradiction.` : `$${m}$ is prime, so for $a\\not\\equiv 0$ we have $\\gcd(a,${m}) = 1$ and Bézout gives $ax + ${m}y = 1$, i.e. $ax\\equiv 1$. All other field axioms are inherited from $\\mathbb Z$.`
            };
        },
        () => {
            const items = [
                { s: '\\mathbb Z', ans: '(M5): $2$ has no multiplicative inverse', why: 'Every axiom except inverses for multiplication holds in $\\mathbb Z$; $\\frac12\\notin\\mathbb Z$.' },
                { s: '\\mathbb N = \\{0,1,2,\\dots\\}', ans: '(A5): $1$ has no additive inverse', why: '$-1\\notin\\mathbb N$, so additive inverses already fail (multiplicative ones too).' },
                { s: '\\mathbb Z_6', ans: '(M5): $2$ has no multiplicative inverse', why: '$2\\cdot 3 = 0$ in $\\mathbb Z_6$; a zero divisor can never be invertible.' },
                { s: '\\{0\\}', ans: '(M4): it requires $1\\neq 0$', why: 'Every other axiom holds trivially in the one-element set, but the axiom (M4) explicitly demands $1\\neq 0$.' },
                { s: 'M_{2\\times 2}(\\mathbb R)', ans: '(M2) and (M5): multiplication is not commutative and singular matrices have no inverse', why: 'Matrix multiplication fails commutativity, and e.g. $\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}$ is non-zero without an inverse.' }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.fieldAxioms,
                questionText: `With the usual operations, which field axiom fails for $${it.s}$?`,
                mathText: '',
                ...txtOpts(it.ans, shuffleArray([...new Set(items.filter(x => x.ans !== it.ans).map(x => x.ans))]).slice(0, 3)),
                explanation: it.why
            };
        },
        () => {
            const p = pickRandom([2, 3, 5, 7]);
            const which = pickRandom(['Q', 'R', 'C', 'Zp']);
            const ans = which === 'Zp' ? String(p) : '0';
            return {
                topic: TOPIC.fieldAxioms,
                questionText: `What is the characteristic of $${which === 'Zp' ? `\\mathbb Z_{${p}}` : `\\mathbb ${which}`}$?`,
                mathText: '',
                ...numOpts(ans, which === 'Zp' ? ['0', String(p - 1), String(p + 1), '1', String(2 * p)] : ['1', '2', String(p), 'infinite']),
                explanation: which === 'Zp' ? `In $\\mathbb Z_{${p}}$, $1+1+\\cdots+1$ ($${p}$ times) $= ${p}\\equiv 0$, and no smaller sum is $0$. The characteristic of $\\mathbb Z_p$ is $p$.` : `No finite sum $1+\\cdots+1$ is $0$ in $\\mathbb ${which}$, so the characteristic is $0$ by definition.`
            };
        },
        () => {
            const steps = [
                { claim: 'a\\cdot 0 = 0', key: 'Write $0 = 0+0$, so $a\\cdot 0 = a\\cdot 0 + a\\cdot 0$ by (D), then add $-(a\\cdot 0)$ to both sides', bad: ['Divide both sides by $a$', 'Use $a\\cdot 0 = 0\\cdot a$ and commutativity', 'Use that $0$ has no inverse'] },
                { claim: '(-1)\\cdot a = -a', key: 'Compute $a + (-1)a = 1\\cdot a + (-1)a = (1 + (-1))a = 0\\cdot a = 0$, so $(-1)a$ is the additive inverse of $a$', bad: ['Multiply $-a$ by $-1$ twice', 'Use $(-1)(-1) = 1$', 'Note that $-1 < 0$'] },
                { claim: 'ab = 0 \\Rightarrow a = 0 \\text{ or } b = 0', key: 'If $a\\neq 0$, multiply $ab = 0$ by $a^{-1}$ to get $b = a^{-1}\\cdot 0 = 0$', bad: ['Take square roots of both sides', 'Use commutativity $ab = ba$', 'Use that $0$ is the additive identity only'] }
            ];
            const st = pickRandom(steps);
            return {
                topic: TOPIC.fieldAxioms,
                questionText: `In a field, which argument proves $${st.claim}$?`,
                mathText: '',
                ...txtOpts(st.key, st.bad),
                explanation: `${st.key}. The argument uses only the axioms (distributivity, identities, inverses), so it holds in every field, including $\\mathbb Z_p$.`
            };
        }
    ],

    fieldArith: [
        () => {
            const p = pickRandom(PRIMES); const a = randInt(2, p - 1);
            const inv = modInv(a, p);
            return {
                topic: TOPIC.fieldArith,
                questionText: `Find $${a}^{-1}$ in $\\mathbb Z_{${p}}$.`,
                mathText: '',
                ...numOpts(inv, [p - a, (a + 1) % p || 1, (inv + 1) % p || 1, a, (p - inv) % p || 2, (2 * inv) % p || 3, (inv + 2) % p || 4, p - 1, 1, (a * a) % p || 5, 0, p, p + a, p + inv]),
                explanation: `We need $x$ with $${a}x\\equiv 1\\pmod{${p}}$. Trying: $${a}\\cdot${inv} = ${a * inv} = ${Math.floor(a * inv / p)}\\cdot${p} + 1$. So $${a}^{-1} = ${inv}$. (Only non-zero elements have inverses, and each has exactly one.)`
            };
        },
        () => {
            const p = pickRandom(PRIMES); const a = randInt(2, p - 1), b = randInt(1, p - 1);
            const inv = modInv(a, p); const x = (inv * b) % p;
            return {
                topic: TOPIC.fieldArith,
                questionText: `Solve $${a}x = ${b}$ in $\\mathbb Z_{${p}}$.`,
                mathText: '',
                ...numOpts(x, [(b * a) % p, (b - a + p) % p, (x + 1) % p, (p - x) % p, Math.floor(b / a) || 1, (inv + b) % p, (x + 2) % p, (b + a) % p, inv, b]),
                explanation: `Multiply by $${a}^{-1} = ${inv}$ (since $${a}\\cdot${inv} = ${a * inv}\\equiv 1$): $x = ${inv}\\cdot${b} = ${inv * b}\\equiv ${x}\\pmod{${p}}$. Check: $${a}\\cdot${x} = ${a * x}\\equiv ${(a * x) % p}$. ✓`
            };
        },
        () => {
            const p = pickRandom(PRIMES); const a = randInt(1, p - 1), b = randInt(1, p - 1), c = randInt(1, p - 1);
            const v = ((a * b - c) % p + p) % p;
            return {
                topic: TOPIC.fieldArith,
                questionText: `Compute $${a}\\cdot${b} - ${c}$ in $\\mathbb Z_{${p}}$.`,
                mathText: '',
                ...numOpts(v, [(a * b) % p, ((a * b + c) % p), (v + p - 1) % p, (v + 1) % p, Math.abs(a * b - c), (a + b - c + p) % p]),
                explanation: `$${a}\\cdot${b} = ${a * b}\\equiv ${(a * b) % p}$, then subtract $${c}$: $${(a * b) % p} - ${c} = ${(a * b) % p - c}\\equiv ${v}\\pmod{${p}}$. Reduce mod $${p}$ at the end (or at every step; both work).`
            };
        },
        () => {
            const p = pickRandom([5, 7]);
            const a = randInt(1, p - 1);
            const sq = (a * a) % p;
            const roots = []; for (let x = 0; x < p; x++) if ((x * x) % p === sq) roots.push(x);
            return {
                topic: TOPIC.fieldArith,
                questionText: `In $\\mathbb Z_{${p}}$, which elements $x$ satisfy $x^2 = ${sq}$?`,
                mathText: '',
                ...txtOpts(`$x = ${roots.join('$ or $x = ')}$`, [`$x = ${a}$ only`, `$x = ${sq}$ and $x = ${(p - sq) % p}$`, `No solution`, `$x = ${(a + 1) % p}$ or $x = ${(a + 2) % p}$`]),
                explanation: `Check each element: ${Array.from({ length: p }, (_, x) => `$${x}^2\\equiv ${(x * x) % p}$`).join(', ')}. Solutions: $x = ${roots.join(', ')}$. A quadratic over a field has at most $2$ roots, and $x$ and $-x = ${p}-x$ always come as a pair.`
            };
        }
    ],

    vsAxioms: [
        () => {
            const items = [
                { ops: '\\mathbb R^2 \\text{ with } a\\odot(x,y) = (ax, y)', fail: '(V6): $(a+b)\\odot v \\neq a\\odot v + b\\odot v$', why: '$(a+b)\\odot(x,y) = ((a+b)x, y)$ but $a\\odot(x,y)+b\\odot(x,y) = ((a+b)x, 2y)$. Also (V8) holds here: $1\\odot(x,y) = (x,y)$.' },
                { ops: '\\mathbb R^2 \\text{ with } a\\odot(x,y) = (ax, 0)', fail: '(V8): $1\\odot v \\neq v$', why: '$1\\odot(x,y) = (x, 0)\\neq(x,y)$ when $y\\neq 0$.' },
                { ops: '\\mathbb R^2 \\text{ with } (x_1,y_1)\\oplus(x_2,y_2) = (x_1+x_2,\; 0)', fail: '(V3): there is no zero vector', why: 'A zero vector $(z_1,z_2)$ would need $(x,y)\\oplus(z_1,z_2) = (x+z_1, 0) = (x,y)$ for all $y$, impossible when $y\\neq 0$.' },
                { ops: '\\mathbb R^2 \\text{ with } (x_1,y_1)\\oplus(x_2,y_2) = (x_1+y_2,\; x_2+y_1)', fail: '(V1): addition is not commutative', why: '$(1,0)\\oplus(0,0) = (1, 0)$ but $(0,0)\\oplus(1,0) = (0, 1)$.' },
                { ops: '\\mathbb R \\text{ with } a\\odot x = a^2 x', fail: '(V6): $(a+b)\\odot v \\neq a\\odot v + b\\odot v$', why: '$(a+b)^2x \\neq a^2x + b^2x$ in general (take $a = b = 1$, $x = 1$: $4\\neq 2$). Note (V8) holds: $1^2x = x$.' }
            ];
            const it = pickRandom(items);
            const others = [...new Set(items.filter(x => x.fail !== it.fail).map(x => x.fail))];
            return {
                topic: TOPIC.vsAxioms,
                questionText: 'Which vector-space axiom fails? (Operations not mentioned are the usual ones.)',
                mathText: it.ops,
                ...txtOpts(it.fail, shuffleArray(others).slice(0, 3)),
                explanation: it.why
            };
        },
        () => {
            const good = [
                { ops: '\\mathbb R_{>0} \\text{ with } u\\oplus v = uv,\; a\\odot v = v^a', zero: '$1$', inv: '$1/v$' },
                { ops: '\\mathbb R^2 \\text{ with } (x_1,y_1)\\oplus(x_2,y_2) = (x_1+x_2-1,\; y_1+y_2),\; a\\odot(x,y) = (ax - a + 1,\; ay)', zero: '$(1, 0)$', inv: '$(2-x, -y)$' }
            ];
            const it = pickRandom(good);
            return {
                topic: TOPIC.vsAxioms,
                questionText: 'This is a vector space over $\\mathbb R$ with unusual operations. What is its zero vector?',
                mathText: it.ops,
                ...txtOpts(it.zero, it === good[0] ? ['$0$', '$e$', 'There is none'] : ['$(0, 0)$', '$(-1, 0)$', '$(1, 1)$']),
                explanation: `The zero vector is whatever $z$ satisfies $v\\oplus z = v$ for all $v$: here ${it.zero}. Additive inverse of $v$: ${it.inv}. With unusual operations, never assume the zero vector is the usual $0$.`
            };
        },
        () => {
            const props = [
                { claim: '0\\cdot v = \\mathbf 0', step: '$0v = (0+0)v = 0v + 0v$ by (V6); add $-(0v)$ to both sides', bad: ['$0v = v - v$ by definition of $0$', 'Because $0$ is the zero vector', 'By (V8), $0v = 0\\cdot 1v$'] },
                { claim: '(-1)v = -v', step: '$v + (-1)v = 1v + (-1)v = (1-1)v = 0v = \\mathbf 0$ using (V8), (V6) and $0v = \\mathbf 0$', bad: ['Because $-1$ is the additive inverse of $1$ in $F$', 'By (V7), $(-1)v = -(1v)$ is a notation', 'Multiply $-v$ by $-1$ on both sides'] },
                { claim: 'a\\mathbf 0 = \\mathbf 0', step: '$a\\mathbf 0 = a(\\mathbf 0+\\mathbf 0) = a\\mathbf 0 + a\\mathbf 0$ by (V5); add $-(a\\mathbf 0)$', bad: ['Because $a\\cdot 0 = 0$ in the field', 'By (V3) directly', 'Divide both sides by $a$'] }
            ];
            const it = pickRandom(props);
            return {
                topic: TOPIC.vsAxioms,
                questionText: `Which is a valid proof from the axioms that $${it.claim}$ in every vector space?`,
                mathText: '',
                ...txtOpts(it.step, it.bad),
                explanation: `${it.step}. Each step cites an axiom; "obvious" steps such as "because $0$ is zero" are not proofs. The distributive axioms (V5)/(V6) are the bridge between field arithmetic and vector arithmetic.`
            };
        }
    ],

    vsExamples: [
        () => {
            const items = [
                { s: 'P_4(\\mathbb R)', d: 5, why: 'polynomials of degree $\\le 4$: basis $\\{1,x,x^2,x^3,x^4\\}$' },
                { s: 'M_{2\\times 3}(\\mathbb R)', d: 6, why: 'basis: the six matrix units $E_{ij}$' },
                { s: '\\mathbb C^3 \\text{ over } \\mathbb C', d: 3, why: 'standard basis $e_1,e_2,e_3$' },
                { s: '\\mathbb C^3 \\text{ over } \\mathbb R', d: 6, why: 'each of the $3$ coordinates needs a real and an imaginary part: basis $e_j, ie_j$' },
                { s: '\\mathbb C \\text{ over } \\mathbb R', d: 2, why: 'basis $\\{1, i\\}$' },
                { s: '\\{A\\in M_{3\\times 3}(\\mathbb R): A^T = A\\}', d: 6, why: 'symmetric: $3$ diagonal entries plus $3$ above the diagonal, $\\frac{3\\cdot 4}{2} = 6$' },
                { s: '\\{A\\in M_{2\\times 2}(\\mathbb R): \\operatorname{tr}A = 0\\}', d: 3, why: 'one linear condition on $4$ entries' },
                { s: 'P_2(\\mathbb Z_5)', d: 3, why: 'basis $\\{1, x, x^2\\}$ over the field $\\mathbb Z_5$ (it has $5^3 = 125$ elements)' }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.vsExamples,
                questionText: `What is the dimension of $${it.s}$?`,
                mathText: '',
                ...numOpts(it.d, [it.d - 1, it.d + 1, 2 * it.d, it.d + 2, Math.max(1, it.d - 2), it.d * it.d]),
                explanation: `$\\dim = ${it.d}$: ${it.why}.`
            };
        },
        () => {
            const items = [
                { s: 'The set of polynomials of degree exactly $3$', ok: false, why: 'the zero polynomial is missing and $x^3 + (-x^3) = 0$ leaves the set' },
                { s: 'The set of all $2\\times 2$ invertible matrices', ok: false, why: 'the zero matrix is not invertible, and $I + (-I) = 0$' },
                { s: 'The set of all functions $f:\\mathbb R\\to\\mathbb R$ with pointwise operations', ok: true, why: 'pointwise sums and multiples are functions; the zero function is the zero vector' },
                { s: 'The set of all sequences of real numbers with termwise operations', ok: true, why: 'this is $\\mathbb R^{\\mathbb N}$, functions from $\\mathbb N$ to $\\mathbb R$' },
                { s: 'The set $\\mathbb Z^2$ of integer points, over $\\mathbb R$', ok: false, why: '$\\frac12(1,0) = (\\frac12, 0)$ is not an integer point: not closed under real scalars' },
                { s: 'The set of $2\\times 2$ matrices $A$ with $A^2 = A$', ok: false, why: '$I$ and $I$ are in the set but $I + I = 2I$ satisfies $(2I)^2 = 4I\\neq 2I$' },
                { s: 'The set of continuous functions on $[0,1]$', ok: true, why: 'sums and scalar multiples of continuous functions are continuous' }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.vsExamples,
                questionText: `With the usual operations, is this a vector space over $\\mathbb R$?<br><br><em>${it.s}</em>`,
                mathText: '',
                ...txtOpts(it.ok ? 'Yes' : 'No', it.ok ? ['No: it has no zero vector', 'No: it is not closed under addition', 'No: it is not closed under scalar multiplication'] : ['Yes', 'Yes, if you restrict to integer scalars', 'Yes, because it is non-empty']),
                explanation: `${it.ok ? 'Yes' : 'No'}: ${it.why}.`
            };
        },
        () => {
            const n = randInt(2, 4);
            const items = [
                { q: `the number of elements of $\\mathbb Z_3^{${n}}$`, a: Math.pow(3, n), d: [3 * n, Math.pow(n, 3), Math.pow(3, n - 1), Math.pow(2, n)] },
                { q: `the number of elements of $P_{${n}}(\\mathbb Z_2)$`, a: Math.pow(2, n + 1), d: [Math.pow(2, n), n + 1, 2 * (n + 1), Math.pow(2, n + 2)] },
                { q: `the number of vectors in $M_{2\\times ${n}}(\\mathbb Z_2)$`, a: Math.pow(2, 2 * n), d: [Math.pow(2, n), 2 * n, 4 * n, Math.pow(2, 2 * n - 1)] }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.vsExamples,
                questionText: `Compute ${it.q}.`,
                mathText: '',
                ...numOpts(it.a, it.d.concat([it.a + 1, it.a - 1, 2 * it.a, it.a + 2])),
                explanation: `A $d$-dimensional space over a field with $q$ elements has $q^d$ vectors (choose each of the $d$ coordinates freely). Here $q^d = ${it.a}$.`
            };
        }
    ],

    subspaceRn: [
        () => {
            const sets = [
                { s: '\\{(x,y)\\in\\mathbb R^2: y = 3x\\}', ok: true, why: 'a line through the origin: $(0,0)$ is in it, and if $y_1 = 3x_1$, $y_2 = 3x_2$ then $y_1+y_2 = 3(x_1+x_2)$ and $ay_1 = 3(ax_1)$' },
                { s: '\\{(x,y)\\in\\mathbb R^2: y = 3x + 1\\}', ok: false, fail: 'zero', why: '$(0,0)$ does not satisfy $0 = 3\\cdot 0 + 1$' },
                { s: '\\{(x,y)\\in\\mathbb R^2: xy = 0\\}', ok: false, fail: 'add', why: '$(1,0)$ and $(0,1)$ are in the set but their sum $(1,1)$ is not' },
                { s: '\\{(x,y)\\in\\mathbb R^2: x\\ge 0,\\ y\\ge 0\\}', ok: false, fail: 'scale', why: '$(1,1)$ is in the set but $(-1)(1,1) = (-1,-1)$ is not' },
                { s: '\\{(x,y)\\in\\mathbb R^2: x^2 + y^2 \\le 1\\}', ok: false, fail: 'scale', why: '$(1,0)$ is in the set but $2(1,0) = (2,0)$ is not' },
                { s: '\\{(x,y)\\in\\mathbb R^2: y = x^2\\}', ok: false, fail: 'add', why: '$(1,1)$ and $(2,4)$ are on the parabola but $(3,5)$ is not' },
                { s: '\\{(x,y,z)\\in\\mathbb R^3: x + 2y - z = 0\\}', ok: true, why: 'a plane through the origin (the null space of the $1\\times 3$ matrix $(1\\ 2\\ {-1})$)' },
                { s: '\\{(x,y,z)\\in\\mathbb R^3: x + 2y - z = 4\\}', ok: false, fail: 'zero', why: 'the origin gives $0\\neq 4$' },
                { s: '\\{(x,y,z)\\in\\mathbb R^3: x = y = z\\}', ok: true, why: 'the line spanned by $(1,1,1)$' },
                { s: '\\{(x,y,z)\\in\\mathbb R^3: |x| = |y|\\}', ok: false, fail: 'add', why: '$(1,1,0)$ and $(1,-1,0)$ are in the set, their sum $(2,0,0)$ is not' },
                { s: '\\{(x,y,z)\\in\\mathbb R^3: x, y, z\\in\\mathbb Z\\}', ok: false, fail: 'scale', why: '$\\frac12(1,0,0)\\notin\\mathbb Z^3$' },
                { s: '\\{(x,y)\\in\\mathbb R^2: x = 0 \\text{ or } y = 0\\}', ok: false, fail: 'add', why: 'the union of the axes: $(1,0)+(0,1) = (1,1)$ leaves it' }
            ];
            const it = pickRandom(sets);
            return {
                topic: TOPIC.subspaceRn,
                questionText: 'Is this set a subspace?',
                mathText: it.s,
                ...yesNo(it.ok),
                explanation: it.ok ? `Yes: ${it.why}. All three parts of the subspace test hold.` : `No: ${it.why}. ${it.fail === 'zero' ? 'A subspace must contain the zero vector, so this is the fastest check.' : it.fail === 'add' ? 'Failing closure under addition is enough to reject.' : 'Failing closure under scalar multiplication is enough to reject.'}`
            };
        },
        () => {
            const sets = [
                { s: '\\{(x,y): xy = 0\\}', fail: 'Closure under addition', w: '$(1,0)+(0,1) = (1,1)$' },
                { s: '\\{(x,y): x\\ge 0\\}', fail: 'Closure under scalar multiplication', w: '$(-1)\\cdot(1,0) = (-1,0)$' },
                { s: '\\{(x,y): x + y = 2\\}', fail: 'Contains the zero vector', w: '$0+0\\neq 2$' },
                { s: '\\{(x,y): x^2 = y^2\\}', fail: 'Closure under addition', w: '$(1,1)+(1,-1) = (2,0)$' },
                { s: '\\{(x,y): x, y \\in\\mathbb Q\\} \\text{ over } \\mathbb R', fail: 'Closure under scalar multiplication', w: '$\\sqrt2\\cdot(1,0)$' },
                { s: '\\{(x,y): y = |x|\\}', fail: 'Closure under scalar multiplication', w: '$(-1)\\cdot(1,1) = (-1,-1)$, and $-1\\neq|{-1}|$' }
            ];
            const it = pickRandom(sets);
            return {
                topic: TOPIC.subspaceRn,
                questionText: 'Which part of the subspace test is the <em>first</em> to fail, with the witness given in the explanation?',
                mathText: it.s,
                ...txtOpts(it.fail, ['Contains the zero vector', 'Closure under addition', 'Closure under scalar multiplication', 'None: it is a subspace'].filter(x => x !== it.fail)),
                explanation: `<strong>${it.fail}</strong> fails: witness ${it.w}. (Other parts may fail too, but one counterexample is enough.)`
            };
        },
        () => {
            const a = nonZeroVec(3), b = nonZeroVec(3);
            const conds = [
                { s: `${a[0]}x ${a[1] < 0 ? '-' : '+'} ${Math.abs(a[1])}y ${a[2] < 0 ? '-' : '+'} ${Math.abs(a[2])}z = 0`, ok: true, d: 2 },
                { s: `${a[0]}x ${a[1] < 0 ? '-' : '+'} ${Math.abs(a[1])}y ${a[2] < 0 ? '-' : '+'} ${Math.abs(a[2])}z = ${randInt(1, 5)}`, ok: false },
                { s: `x^2 + y^2 + z^2 = 0`, ok: true, d: 0, why: 'only the origin satisfies it, and $\\{\\mathbf 0\\}$ is a subspace' },
                { s: `xyz = 0`, ok: false, why: '$(1,1,0)+(0,0,1) = (1,1,1)$ leaves the set' },
                { s: `x = ${b[0]}t,\; y = ${b[1]}t,\; z = ${b[2]}t \\text{ for some } t\\in\\mathbb R`, ok: true, d: 1 }
            ];
            const it = pickRandom(conds);
            return {
                topic: TOPIC.subspaceRn,
                questionText: 'Is $\\{(x,y,z)\\in\\mathbb R^3 : \\text{condition}\\}$ a subspace, with the condition',
                mathText: it.s,
                ...yesNo(it.ok),
                explanation: it.ok ? `Yes. ${it.why || (it.d === 2 ? 'A homogeneous linear equation defines a plane through the origin (dimension 2).' : 'A parametrised line through the origin is $\\operatorname{span}$ of its direction vector (dimension 1).')}` : `No. ${it.why || 'The right-hand side is not $0$, so the origin is not in the set (a plane not through the origin).'}`
            };
        }
    ],

    subspacePoly: [
        () => {
            const n = randInt(2, 4); const c = randInt(-2, 2);
            const sets = [
                { s: `\\{p\\in P_{${n}}: p(${c}) = 0\\}`, ok: true, why: `evaluation at $${c}$ is linear: $(p+q)(${c}) = p(${c})+q(${c}) = 0$ and $(ap)(${c}) = a\\cdot 0 = 0$; the zero polynomial qualifies` },
                { s: `\\{p\\in P_{${n}}: p(${c}) = 1\\}`, ok: false, why: 'the zero polynomial has $p(' + c + ') = 0\\neq 1$' },
                { s: `\\{p\\in P_{${n}}: \\deg p = ${n}\\}`, ok: false, why: `$x^{${n}}$ and $-x^{${n}}$ have degree $${n}$ but their sum is $0$, which has no degree $${n}$` },
                { s: `\\{p\\in P_{${n}}: p'(${c}) = 0\\}`, ok: true, why: 'differentiation and evaluation are linear' },
                { s: `\\{p\\in P_{${n}}: p(x) = p(-x)\\}`, ok: true, why: 'even polynomials: the condition is linear in $p$' },
                { s: `\\{p\\in P_{${n}}: p(0)\\,p(1) = 0\\}`, ok: false, why: '$x$ and $x - 1$ are in the set (each has a root at $0$ or $1$) but $x + (x-1) = 2x - 1$ has neither' },
                { s: `\\{p\\in P_{${n}}: p(0) \\ge 0\\}`, ok: false, why: '$p = 1$ is in the set but $-p = -1$ is not' },
                { s: `\\{p\\in P_{${n}}: \\int_0^1 p(x)\\,dx = 0\\}`, ok: true, why: 'integration is linear' },
                { s: `\\{p\\in P_{${n}}: p \\text{ has integer coefficients}\\}`, ok: false, why: '$\\frac12\\cdot 1$ does not have integer coefficients (over $\\mathbb R$)' }
            ];
            const it = pickRandom(sets);
            return {
                topic: TOPIC.subspacePoly,
                questionText: `Is this subset of $P_{${n}}(\\mathbb R)$ a subspace?`,
                mathText: it.s,
                ...yesNo(it.ok),
                explanation: (it.ok ? 'Yes: ' : 'No: ') + it.why + '.'
            };
        },
        () => {
            const n = randInt(2, 4);
            const c = randInt(-2, 2);
            const d = n; // dim of {p in P_n : p(c)=0} is n
            return {
                topic: TOPIC.subspacePoly,
                questionText: `What is the dimension of $W = \\{p\\in P_{${n}}(\\mathbb R): p(${c}) = 0\\}$?`,
                mathText: '',
                ...numOpts(d, [n + 1, n - 1, 1, n + 2, 2 * n]),
                explanation: `$\\dim P_{${n}} = ${n + 1}$ and $p(${c}) = 0$ is one non-trivial linear condition, so $\\dim W = ${n + 1} - 1 = ${n}$. A basis: $\\{(x - ${c})${c < 0 ? '' : ''}, (x-${c})x, \\dots, (x-${c})x^{${n - 1}}\\}$ — every such $p$ factors as $(x-${c})q(x)$ with $\\deg q\\le ${n - 1}$.`.replace(/\(x - -(\d)\)/g, '(x + $1)').replace(/\(x--(\d)\)/g, '(x+$1)')
            };
        },
        () => {
            const items = [
                { s: 'W_1 = \\{p\\in P_3: p(0) = 0\\},\\quad W_2 = \\{p\\in P_3: p(1) = 0\\}', ans: '$W_1\\cap W_2 = \\{p: p(0) = p(1) = 0\\}$ is a subspace of dimension $2$', bad: ['$W_1\\cup W_2$ is a subspace of dimension $3$', '$W_1\\cap W_2 = \\{0\\}$', '$W_1 + W_2$ has dimension $6$'] },
                { s: 'W = \\{p\\in P_2: p(x) = p(-x)\\}', ans: 'A basis of $W$ is $\\{1, x^2\\}$', bad: ['A basis of $W$ is $\\{x\\}$', '$W$ is not a subspace', 'A basis of $W$ is $\\{1, x, x^2\\}$'] },
                { s: 'W = \\{p\\in P_3: p\'(0) = 0\\}', ans: 'A basis of $W$ is $\\{1, x^2, x^3\\}$', bad: ['A basis of $W$ is $\\{x\\}$', '$\\dim W = 4$', '$W$ is not a subspace because $p = 1$ is in it'] }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.subspacePoly,
                questionText: 'Which statement is correct?',
                mathText: it.s,
                ...txtOpts(it.ans, it.bad),
                explanation: `${it.ans}. Translate each condition into a linear condition on the coefficient vector: $p(0) = a_0$, $p'(0) = a_1$, $p(x) = p(-x)$ kills the odd coefficients. Intersections of subspaces are subspaces; unions usually are not.`
            };
        }
    ],

    subspaceMatFn: [
        () => {
            const sets = [
                { s: '\\{A\\in M_{2\\times 2}(\\mathbb R): A^T = A\\}', ok: true, why: 'transpose is linear: $(A+B)^T = A^T+B^T$, $(cA)^T = cA^T$' },
                { s: '\\{A\\in M_{2\\times 2}(\\mathbb R): \\det A = 0\\}', ok: false, why: '$\\operatorname{diag}(1,0)+\\operatorname{diag}(0,1) = I$ has determinant $1$' },
                { s: '\\{A\\in M_{2\\times 2}(\\mathbb R): A \\text{ is invertible}\\}', ok: false, why: 'the zero matrix is not invertible' },
                { s: '\\{A\\in M_{2\\times 2}(\\mathbb R): \\operatorname{tr}A = 0\\}', ok: true, why: 'trace is linear' },
                { s: '\\{A\\in M_{n\\times n}(\\mathbb R): AB = BA\\} \\text{ for a fixed } B', ok: true, why: '$(A_1+A_2)B = A_1B+A_2B = BA_1+BA_2 = B(A_1+A_2)$, similarly for scalars; $0$ commutes with $B$' },
                { s: '\\{A\\in M_{2\\times 2}(\\mathbb R): A^2 = 0\\}', ok: false, why: '$E_{12}$ and $E_{21}$ square to $0$ but $(E_{12}+E_{21})^2 = I\\neq 0$' },
                { s: '\\{f:\\mathbb R\\to\\mathbb R : f(2) = 0\\}', ok: true, why: 'evaluation at $2$ is linear' },
                { s: '\\{f:\\mathbb R\\to\\mathbb R : f(0) = 1\\}', ok: false, why: 'the zero function has $f(0) = 0$' },
                { s: '\\{f:\\mathbb R\\to\\mathbb R : f(x)\\ge 0 \\text{ for all } x\\}', ok: false, why: '$f = 1$ is in the set, $-f$ is not' },
                { s: '\\{f\\in C^2(\\mathbb R) : f\'\' + 4f = 0\\}', ok: true, why: 'the solution set of a homogeneous linear ODE: derivatives are linear' },
                { s: '\\{f:\\mathbb R\\to\\mathbb R : f(x)^2 = f(2x)\\}', ok: false, why: 'the constant $1$ satisfies it but $2\\cdot 1$ does not ($4\\neq 2$)' },
                { s: '\\{f:\\mathbb R\\to\\mathbb R : f(-x) = -f(x)\\}', ok: true, why: 'odd functions: the condition is linear in $f$' }
            ];
            const it = pickRandom(sets);
            return {
                topic: TOPIC.subspaceMatFn,
                questionText: 'Is this set a subspace (usual operations)?',
                mathText: it.s,
                ...yesNo(it.ok),
                explanation: (it.ok ? 'Yes: ' : 'No: ') + it.why + '.'
            };
        },
        () => {
            const n = randInt(2, 4);
            const which = pickRandom(['sym', 'skew', 'tr', 'diag', 'upper']);
            const dims = { sym: n * (n + 1) / 2, skew: n * (n - 1) / 2, tr: n * n - 1, diag: n, upper: n * (n + 1) / 2 };
            const names = { sym: 'symmetric', skew: 'skew-symmetric ($A^T = -A$)', tr: 'trace-zero', diag: 'diagonal', upper: 'upper triangular' };
            const whys = { sym: 'choose the $n$ diagonal entries and the $\\frac{n(n-1)}{2}$ entries above the diagonal', skew: 'the diagonal is forced to be $0$; choose the entries above the diagonal', tr: 'one linear condition on $n^2$ entries', diag: 'one free entry per diagonal position', upper: 'the entries on or above the diagonal are free' };
            const d = dims[which];
            return {
                topic: TOPIC.subspaceMatFn,
                questionText: `What is the dimension of the subspace of ${names[which]} matrices in $M_{${n}\\times${n}}(\\mathbb R)$?`,
                mathText: '',
                ...numOpts(d, [n * n, n, n * (n + 1) / 2, n * (n - 1) / 2, n * n - 1, 2 * n].filter(x => x !== d)),
                explanation: `$\\dim = ${d}$: ${whys[which]} (with $n = ${n}$).`
            };
        },
        () => {
            const items = [
                { s: 'Even functions and odd functions on $\\mathbb R$', ans: 'Both are subspaces, and every function is uniquely even + odd: $f = \\tfrac{f(x)+f(-x)}{2} + \\tfrac{f(x)-f(-x)}{2}$', bad: ['Only the even functions form a subspace', 'Their union is a subspace', 'Their intersection is empty'] },
                { s: 'Symmetric and skew-symmetric $n\\times n$ matrices', ans: 'Both are subspaces with intersection $\\{0\\}$, and $M_{n\\times n} = \\text{Sym}\\oplus\\text{Skew}$', bad: ['Their intersection is the diagonal matrices', 'Skew-symmetric matrices are not a subspace', 'Their sum has dimension $n^2 + n$'] },
                { s: 'Upper triangular and lower triangular $n\\times n$ matrices', ans: 'Both are subspaces; their intersection is the diagonal matrices ($\\dim n$) and their sum is all of $M_{n\\times n}$', bad: ['Their intersection is $\\{0\\}$', 'Their sum has dimension $n(n+1)$', 'Their union is a subspace'] }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.subspaceMatFn,
                questionText: `Which statement is correct about: <em>${it.s}</em>?`,
                mathText: '',
                ...txtOpts(it.ans, it.bad),
                explanation: `${it.ans}. Use $\\dim(U+W) = \\dim U + \\dim W - \\dim(U\\cap W)$ to check the dimension claims.`
            };
        }
    ],

    spanTest: [
        () => {
            const u = nonZeroVec(3); let v; do { v = nonZeroVec(3); } while (rankOf([u, v]) < 2);
            const inSpan = Math.random() < 0.5;
            let w; const a = randInt(-2, 2), b = randInt(-2, 2);
            if (inSpan) w = addV(scaleV(a, u), scaleV(b, v)); else { do { w = randVec(3, -4, 4); } while (rankOf([u, v, w]) < 3); }
            const r2 = rankOf([u, v]), r3 = rankOf([u, v, w]);
            const actuallyIn = r2 === r3;
            return {
                topic: TOPIC.spanTest,
                questionText: `Is $w = ${rowLatex(w)}$ in $\\operatorname{span}\\{u, v\\}$ where $u = ${rowLatex(u)}$, $v = ${rowLatex(v)}$?`,
                mathText: '',
                ...txtOpts(actuallyIn ? 'Yes' : 'No', actuallyIn ? ['No: the three vectors are independent', 'No: $w$ is not a multiple of $u$', 'Only if $w = u + v$'] : ['Yes', 'Yes: any vector in $\\mathbb R^3$ is', 'Yes, since $w\\neq\\mathbf 0$']),
                explanation: actuallyIn ? `Yes: $w = ${a}u ${b < 0 ? '-' : '+'} ${Math.abs(b)}v$ (check componentwise). Equivalently $\\operatorname{rank}[u\\ v] = \\operatorname{rank}[u\\ v\\ w] = ${r3}$.` : `No: $\\operatorname{rank}[u\\ v] = ${r2}$ but $\\operatorname{rank}[u\\ v\\ w] = ${r3}$, so the system $a u + b v = w$ is inconsistent. Geometrically, $w$ is off the plane spanned by $u$ and $v$.`
            };
        },
        () => {
            const p = [randInt(-2, 2), randInt(-2, 2), randInt(1, 2)]; // deg 2
            const q = [randInt(-2, 2), randInt(1, 2), 0];
            const inSpan = Math.random() < 0.5;
            const a = randInt(-2, 2) || 1, b = randInt(-2, 2) || 1;
            let r = inSpan ? addV(scaleV(a, p), scaleV(b, q)) : addV(addV(scaleV(a, p), scaleV(b, q)), [0, 0, 0]);
            if (!inSpan) { do { r = [randInt(-3, 3), randInt(-3, 3), randInt(-3, 3)]; } while (rankOf([p, q, r]) < 3); }
            const actuallyIn = rankOf([p, q, r]) === rankOf([p, q]);
            return {
                topic: TOPIC.spanTest,
                questionText: `In $P_2(\\mathbb R)$, is $r(x) = ${polyLatex(r)}$ in $\\operatorname{span}\\{p, q\\}$ with $p(x) = ${polyLatex(p)}$ and $q(x) = ${polyLatex(q)}$?`,
                mathText: '',
                ...txtOpts(actuallyIn ? 'Yes' : 'No', actuallyIn ? ['No: the degrees do not match', 'No: $p$, $q$, $r$ are independent', 'Only if $r = p + q$'] : ['Yes', 'Yes: $P_2$ is spanned by any two polynomials', 'Yes, because $\\deg r\\le 2$']),
                explanation: actuallyIn ? `Yes: comparing coefficients, $r = ${a}p ${b < 0 ? '-' : '+'} ${Math.abs(b)}q$. Coefficient vectors: $p\\leftrightarrow ${rowLatex(p)}$, $q\\leftrightarrow ${rowLatex(q)}$, $r\\leftrightarrow ${rowLatex(r)}$ (constant, $x$, $x^2$).` : `No: with coefficient vectors $p\\leftrightarrow ${rowLatex(p)}$, $q\\leftrightarrow ${rowLatex(q)}$, $r\\leftrightarrow ${rowLatex(r)}$ the three are independent (rank $3$), so $r$ is not a combination of $p$ and $q$.`
            };
        },
        () => {
            const u = nonZeroVec(2, -3, 3);
            let v; do { v = nonZeroVec(2, -3, 3); } while (rankOf([u, v]) < 2);
            const k = randInt(-3, 3) || 2;
            const items = [
                { q: `$\\operatorname{span}\\{${rowLatex(u)}\\}$ in $\\mathbb R^2$`, ans: `The line through the origin with direction $${rowLatex(u)}$`, bad: ['All of $\\mathbb R^2$', 'The single point $' + rowLatex(u) + '$', 'The line through $' + rowLatex(u) + '$ parallel to the $x$-axis'] },
                { q: `$\\operatorname{span}\\{${rowLatex(u)}, ${rowLatex(scaleV(k, u))}\\}$ in $\\mathbb R^2$`, ans: `The line through the origin with direction $${rowLatex(u)}$`, bad: ['All of $\\mathbb R^2$', 'Two lines', 'The origin only'] },
                { q: `$\\operatorname{span}\\{${rowLatex(u)}, ${rowLatex(v)}\\}$ in $\\mathbb R^2$`, ans: 'All of $\\mathbb R^2$', bad: [`The line through the origin with direction $${rowLatex(u)}$`, 'A parallelogram', 'The union of two lines'] },
                { q: `$\\operatorname{span}\\{(0,0)\\}$ in $\\mathbb R^2$`, ans: 'The origin only, $\\{\\mathbf 0\\}$', bad: ['The empty set', 'All of $\\mathbb R^2$', 'The $x$-axis'] }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.spanTest,
                questionText: `Describe ${it.q}.`,
                mathText: '',
                ...txtOpts(it.ans, it.bad),
                explanation: `${it.ans}. The span of one non-zero vector is a line; of two non-parallel vectors in $\\mathbb R^2$, the whole plane; a multiple of a vector adds nothing to the span; $\\operatorname{span}\\{\\mathbf 0\\} = \\{\\mathbf 0\\}$.`
            };
        }
    ],

    independence: [
        () => {
            const n = 3;
            const dep = Math.random() < 0.5;
            let vs;
            if (dep) { const u = nonZeroVec(n), v = nonZeroVec(n); vs = [u, v, addV(scaleV(randInt(-2, 2) || 1, u), scaleV(randInt(-2, 2) || 1, v))]; if (rankOf(vs) === 3) vs = [u, v, addV(u, v)]; }
            else { do { vs = [nonZeroVec(n), nonZeroVec(n), nonZeroVec(n)]; } while (rankOf(vs) < 3); }
            const r = rankOf(vs);
            return {
                topic: TOPIC.independence,
                questionText: `Are the vectors $${vs.map(rowLatex).join(',\; ')}$ in $\\mathbb R^3$ linearly independent?`,
                mathText: '',
                ...txtOpts(r === 3 ? 'Independent (rank 3)' : `Dependent (rank ${r})`, r === 3 ? ['Dependent (rank 2)', 'Dependent (rank 1)', 'Independent, because none is the zero vector'] : ['Independent (rank 3)', 'Independent, because none is a multiple of another', 'Dependent (rank 3)']),
                explanation: r === 3 ? `Row reducing the matrix with these vectors as columns gives three pivots, so the only solution of $a v_1 + b v_2 + c v_3 = \\mathbf 0$ is $a = b = c = 0$.` : `The rank is $${r} < 3$, so there is a non-trivial combination equal to $\\mathbf 0$: here $v_3$ is a combination of $v_1$ and $v_2$. "No vector is a multiple of another" is not enough for three or more vectors.`
            };
        },
        () => {
            const items = [
                { s: '\\{1,\; x,\; x^2\\} \\subset P_2', ans: 'Independent', why: 'a polynomial $a + bx + cx^2$ is the zero polynomial only if $a = b = c = 0$' },
                { s: '\\{1 + x,\; 1 - x,\; x\\} \\subset P_1', ans: 'Dependent', why: '$(1+x) - (1-x) - 2x = 0$; also three vectors in the $2$-dimensional $P_1$ must be dependent' },
                { s: '\\{1 + x,\; 1 - x\\} \\subset P_1', ans: 'Independent', why: '$a(1+x) + b(1-x) = (a+b) + (a-b)x = 0$ forces $a+b = a-b = 0$, so $a = b = 0$' },
                { s: '\\{x,\; x^2,\; x + x^2\\} \\subset P_2', ans: 'Dependent', why: 'the third is the sum of the first two' },
                { s: '\\{\\sin x,\; \\cos x\\} \\subset \\mathcal F(\\mathbb R)', ans: 'Independent', why: '$a\\sin x + b\\cos x = 0$ for all $x$: at $x = 0$ get $b = 0$, at $x = \\pi/2$ get $a = 0$' },
                { s: '\\{1,\; \\sin^2 x,\; \\cos^2 x\\} \\subset \\mathcal F(\\mathbb R)', ans: 'Dependent', why: '$1 - \\sin^2 x - \\cos^2 x = 0$' },
                { s: '\\{e^x,\; e^{2x}\\} \\subset \\mathcal F(\\mathbb R)', ans: 'Independent', why: '$ae^x + be^{2x} = 0$ at $x = 0$ and $x = \\ln 2$ gives $a + b = 0$, $2a + 4b = 0$, so $a = b = 0$' },
                { s: '\\{1,\; i\\} \\subset \\mathbb C \\text{ over } \\mathbb C', ans: 'Dependent', why: '$i\\cdot 1 + (-1)\\cdot i = 0$ with complex scalars; over $\\mathbb R$ the same set is independent' }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.independence,
                questionText: 'Independent or dependent?',
                mathText: it.s,
                ...txtOpts(it.ans, [it.ans === 'Independent' ? 'Dependent' : 'Independent', 'Independent only over $\\mathbb Q$', 'Cannot be decided without a basis']),
                explanation: `${it.ans}: ${it.why}.`
            };
        },
        () => {
            const u = nonZeroVec(2, -3, 3);
            const k = randInt(-3, 3) || 2;
            const v = scaleV(k, u);
            const w = [u[1] === 0 ? 1 : -u[1], u[0]]; // perpendicular-ish, independent of u
            const items = [
                { s: `\\{${rowLatex(u)}, ${rowLatex(v)}\\}`, ans: `Dependent: $${rowLatex(v)} = ${k}\\cdot${rowLatex(u)}$` },
                { s: `\\{${rowLatex(u)}, ${rowLatex(w)}\\}`, ans: 'Independent: neither is a multiple of the other' },
                { s: `\\{${rowLatex(u)}, (0,0)\\}`, ans: 'Dependent: any set containing $\\mathbf 0$ is dependent ($0\\cdot u + 1\\cdot\\mathbf 0 = \\mathbf 0$)' },
                { s: `\\{${rowLatex(u)}, ${rowLatex(w)}, ${rowLatex(addV(u, w))}\\}`, ans: 'Dependent: three vectors in $\\mathbb R^2$ are always dependent' }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.independence,
                questionText: 'Which statement about this subset of $\\mathbb R^2$ is correct?',
                mathText: it.s,
                ...txtOpts(it.ans, items.filter(x => x.ans !== it.ans).map(x => x.ans)),
                explanation: `${it.ans}. Two vectors are dependent iff one is a multiple of the other; more than $n$ vectors in $F^n$ are dependent; $\\mathbf 0$ makes any set dependent.`
            };
        }
    ],

    basisDim: [
        () => {
            const eqs = randInt(1, 2); const n = randInt(3, 5);
            const d = n - eqs;
            return {
                topic: TOPIC.basisDim,
                questionText: `A subspace $W\\subseteq\\mathbb R^{${n}}$ is the solution set of $${eqs}$ independent homogeneous linear equation${eqs > 1 ? 's' : ''}. What is $\\dim W$?`,
                mathText: '',
                ...numOpts(d, [n, eqs, n + eqs, d - 1, d + 1, n * eqs]),
                explanation: `Each independent homogeneous equation removes one degree of freedom: $\\dim W = ${n} - ${eqs} = ${d}$ (rank–nullity: $\\dim W = n - \\operatorname{rank}A$). A single equation $a\\cdot x = 0$ gives a hyperplane of dimension $n-1$.`
            };
        },
        () => {
            const n = 3; let vs;
            const target = randInt(1, 3);
            if (target === 3) { do { vs = [nonZeroVec(n), nonZeroVec(n), nonZeroVec(n)]; } while (rankOf(vs) < 3); }
            else if (target === 2) { const u = nonZeroVec(n), v = nonZeroVec(n); vs = [u, v, addV(scaleV(2, u), scaleV(-1, v))]; if (rankOf(vs) !== 2) vs = [[1, 0, 0], [0, 1, 0], [1, 1, 0]]; }
            else { const u = nonZeroVec(n, -2, 2); vs = [u, scaleV(2, u), scaleV(-1, u)]; }
            const r = rankOf(vs);
            return {
                topic: TOPIC.basisDim,
                questionText: `What is $\\dim\\operatorname{span}\\{${vs.map(rowLatex).join(', ')}\\}$?`,
                mathText: '',
                ...numOpts(r, [1, 2, 3, 0].filter(x => x !== r)),
                explanation: `The dimension of the span is the rank of the matrix whose columns are the vectors: $${r}$. ${r === 3 ? 'Three independent vectors span all of $\\mathbb R^3$.' : r === 2 ? 'One vector is a combination of the other two; the span is a plane through the origin.' : 'All three are multiples of one vector; the span is a line.'} The pivot columns give a basis.`
            };
        },
        () => {
            const items = [
                { s: 'W = \\{(x,y,z): x + y + z = 0\\}', basis: '\\{(1,-1,0), (1,0,-1)\\}', bad: ['\\{(1,1,1)\\}', '\\{(1,-1,0), (-1,1,0)\\}', '\\{(1,0,0),(0,1,0),(0,0,1)\\}'] },
                { s: 'W = \\{(x,y,z): x = 2y\\}', basis: '\\{(2,1,0), (0,0,1)\\}', bad: ['\\{(2,1,0)\\}', '\\{(1,2,0),(0,0,1)\\}', '\\{(2,1,0),(4,2,0)\\}'] },
                { s: 'W = \\{p\\in P_2: p(0) = 0\\}', basis: '\\{x, x^2\\}', bad: ['\\{1, x\\}', '\\{x\\}', '\\{1, x, x^2\\}'] },
                { s: 'W = \\{A\\in M_{2\\times 2}: A^T = A\\}', basis: '\\left\\{\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}, \\begin{pmatrix}0&0\\\\0&1\\end{pmatrix}, \\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}\\right\\}', bad: ['\\left\\{\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}\\right\\}', '\\left\\{\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}, \\begin{pmatrix}0&1\\\\0&0\\end{pmatrix}\\right\\}', '\\left\\{\\begin{pmatrix}0&1\\\\-1&0\\end{pmatrix}\\right\\}'] },
                { s: 'W = \\{(x,y,z,w): x = w,\; y = 0\\}', basis: '\\{(1,0,0,1), (0,0,1,0)\\}', bad: ['\\{(1,0,0,1)\\}', '\\{(1,0,0,-1),(0,0,1,0)\\}', '\\{(1,0,0,1),(0,1,0,0),(0,0,1,0)\\}'] }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.basisDim,
                questionText: 'Which set is a basis of $W$?',
                mathText: it.s,
                ...makeOptions(it.basis, it.bad),
                explanation: `Solve the defining conditions for the free variables and read off one basis vector per free variable: $${it.basis}$. The wrong options are either dependent, too small to span, or contain vectors outside $W$.`
            };
        },
        () => {
            const n = 3;
            let vs; do { vs = [nonZeroVec(n, -2, 2), nonZeroVec(n, -2, 2), nonZeroVec(n, -2, 2)]; } while (rankOf(vs) < 3);
            const c = [randInt(-2, 2), randInt(-2, 2), randInt(-2, 2)];
            const w = addV(addV(scaleV(c[0], vs[0]), scaleV(c[1], vs[1])), scaleV(c[2], vs[2]));
            return {
                topic: TOPIC.basisDim,
                questionText: `With basis $B = \\{${vs.map(rowLatex).join(', ')}\\}$ of $\\mathbb R^3$, what is the coordinate vector $[w]_B$ of $w = ${rowLatex(w)}$?`,
                mathText: '',
                ...makeOptions(rowLatex(c), [rowLatex(w), rowLatex([c[1], c[0], c[2]]), rowLatex(scaleV(-1, c)), rowLatex([c[0], c[1], c[2] + 1]), rowLatex([c[2], c[1], c[0]]), rowLatex(addV(c, [1, 0, 0])), rowLatex(addV(c, [0, -1, 0])), rowLatex(scaleV(2, c)), rowLatex(addV(c, [1, 1, 1]))]),
                explanation: `$[w]_B = (a,b,c)$ means $w = a v_1 + b v_2 + c v_3$. Solving the $3\\times 3$ system (or checking directly) gives $${rowLatex(c)}$: $${c[0]}${rowLatex(vs[0])} ${c[1] < 0 ? '-' : '+'} ${Math.abs(c[1])}${rowLatex(vs[1])} ${c[2] < 0 ? '-' : '+'} ${Math.abs(c[2])}${rowLatex(vs[2])} = ${rowLatex(w)}$. Coordinates are unique because $B$ is a basis.`
            };
        }
    ],

    subOps: [
        () => {
            const items = [
                { q: 'Which of the following is <em>always</em> a subspace when $U$ and $W$ are subspaces of $V$?', ans: '$U\\cap W$ and $U + W$', bad: ['$U\\cup W$', '$U\\setminus W$', '$V\\setminus(U\\cup W)$'] },
                { q: 'When is $U\\cup W$ a subspace?', ans: 'Exactly when $U\\subseteq W$ or $W\\subseteq U$', bad: ['Always', 'Never', 'Exactly when $U\\cap W = \\{\\mathbf 0\\}$'] },
                { q: 'What is $U + W$?', ans: 'The set of all sums $u + w$ with $u\\in U$, $w\\in W$; the smallest subspace containing $U\\cup W$', bad: ['The same as $U\\cup W$', 'The set of vectors in both $U$ and $W$', 'The set of all $u + w$ with $u,w\\in U\\cap W$'] }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.subOps,
                questionText: it.q,
                mathText: '',
                ...txtOpts(it.ans, it.bad),
                explanation: `${it.ans}. Standard counterexample for unions: the two axes in $\\mathbb R^2$, where $(1,0)+(0,1)$ leaves the union.`
            };
        },
        () => {
            const dU = randInt(2, 4), dW = randInt(2, 4), dI = randInt(0, Math.min(dU, dW) - 1);
            const dS = dU + dW - dI;
            return {
                topic: TOPIC.subOps,
                questionText: `Subspaces $U, W$ of some vector space have $\\dim U = ${dU}$, $\\dim W = ${dW}$ and $\\dim(U\\cap W) = ${dI}$. What is $\\dim(U+W)$?`,
                mathText: '',
                ...numOpts(dS, [dU + dW, dU + dW + dI, Math.max(dU, dW), dS - 1, dS + 1, dU * dW]),
                explanation: `$\\dim(U+W) = \\dim U + \\dim W - \\dim(U\\cap W) = ${dU} + ${dW} - ${dI} = ${dS}$. Vectors in the intersection are counted twice in $\\dim U + \\dim W$, so subtract once.`
            };
        },
        () => {
            const items = [
                { s: 'U = \\{(x,y,z): z = 0\\},\\quad W = \\{(x,y,z): x = 0\\} \\text{ in } \\mathbb R^3', inter: 'the $y$-axis, $\\dim 1$', sum: '$\\mathbb R^3$, $\\dim 3$', bad: ['$U\\cap W = \\{\\mathbf 0\\}$ and $U+W = \\mathbb R^3$', '$U\\cap W$ is the $y$-axis and $U + W$ has dimension $4$', '$U\\cap W$ is the $xz$-plane'] },
                { s: 'U = \\operatorname{span}\\{(1,0,0)\\},\\quad W = \\operatorname{span}\\{(0,1,0)\\} \\text{ in } \\mathbb R^3', inter: '$\\{\\mathbf 0\\}$, $\\dim 0$', sum: 'the $xy$-plane, $\\dim 2$ (a direct sum)', bad: ['$U\\cap W = \\{\\mathbf 0\\}$ and $U+W = \\mathbb R^3$', '$U\\cap W = \\{(1,1,0)\\}$', '$U+W$ has dimension $1$'] },
                { s: 'U = \\{p\\in P_2: p(0) = 0\\},\\quad W = \\{p\\in P_2: p(1) = 0\\}', inter: '$\\operatorname{span}\\{x^2 - x\\}$, $\\dim 1$', sum: 'all of $P_2$, $\\dim 2 + 2 - 1 = 3$', bad: ['$U\\cap W = \\{0\\}$ and $U + W = P_2$', '$U\\cap W = \\operatorname{span}\\{x\\}$', '$U + W$ has dimension $4$'] }
            ];
            const it = pickRandom(items);
            const ans = `$U\\cap W$ is ${it.inter}; $U + W$ is ${it.sum}`;
            return {
                topic: TOPIC.subOps,
                questionText: 'Describe $U\\cap W$ and $U + W$.',
                mathText: it.s,
                ...txtOpts(ans, it.bad),
                explanation: `${ans}. Check with $\\dim(U+W) = \\dim U + \\dim W - \\dim(U\\cap W)$.`
            };
        }
    ]
};

/* --------------------------------------------------------------------------
 * Custom-mode pools
 * -------------------------------------------------------------------------- */
const MatchingQuestions = [
    { desc: 'Field axiom (M5): multiplicative inverses', formula: '\\forall a\\neq 0\\ \\exists a^{-1}: a a^{-1} = 1', exp: 'Only non-zero elements need inverses.' },
    { desc: 'Field axiom (D): distributivity', formula: 'a(b+c) = ab + ac', exp: 'Links the two operations.' },
    { desc: 'Field axiom (M4): multiplicative identity', formula: '\\exists 1\\neq 0: a\\cdot 1 = a', exp: 'Note the requirement $1\\neq 0$.' },
    { desc: 'Criterion for $\\mathbb Z_n$ to be a field', formula: 'n \\text{ is prime}', exp: 'Composite $n$ has zero divisors.' },
    { desc: 'Inverse in $\\mathbb Z_p$ via Bézout', formula: 'ax + py = 1 \\Rightarrow a^{-1} \\equiv x', exp: 'Extended Euclidean algorithm.' },
    { desc: 'Characteristic of a field', formula: '\\min\\{n\\ge 1: \\underbrace{1+\\cdots+1}_{n} = 0\\} \\text{ (or } 0)', exp: 'Always $0$ or a prime.' },
    { desc: 'Vector-space axiom (V6)', formula: '(a+b)v = av + bv', exp: 'Distributivity over scalar addition.' },
    { desc: 'Vector-space axiom (V5)', formula: 'a(u+v) = au + av', exp: 'Distributivity over vector addition.' },
    { desc: 'Vector-space axiom (V7)', formula: '(ab)v = a(bv)', exp: 'Compatibility of the two multiplications.' },
    { desc: 'Vector-space axiom (V8)', formula: '1v = v', exp: 'The axiom that invented scalar multiplications most often break.' },
    { desc: 'Consequence: zero scalar', formula: '0v = \\mathbf 0', exp: 'From $0v = (0+0)v$.' },
    { desc: 'Consequence: negatives', formula: '(-1)v = -v', exp: 'From $v + (-1)v = (1-1)v = \\mathbf 0$.' },
    { desc: 'Subspace test', formula: '\\mathbf 0\\in W,\\quad u,v\\in W\\Rightarrow u+v\\in W,\\quad a\\in F, v\\in W\\Rightarrow av\\in W', exp: 'Three checks; the rest is inherited.' },
    { desc: 'One-line subspace test', formula: 'W\\neq\\emptyset \\text{ and } au + v\\in W \\ \\forall a\\in F,\\ u,v\\in W', exp: 'Combines closure under both operations.' },
    { desc: 'Null space is a subspace', formula: '\\{x: Ax = \\mathbf 0\\} \\le F^n', exp: 'Homogeneous linear conditions give subspaces.' },
    { desc: 'Union of subspaces', formula: 'U\\cup W \\le V \\iff U\\subseteq W \\text{ or } W\\subseteq U', exp: 'Otherwise a sum leaves the union.' },
    { desc: 'Sum of subspaces', formula: 'U + W = \\{u + w: u\\in U, w\\in W\\}', exp: 'Smallest subspace containing both.' },
    { desc: 'Dimension formula for a sum', formula: '\\dim(U+W) = \\dim U + \\dim W - \\dim(U\\cap W)', exp: 'Inclusion–exclusion for dimensions.' },
    { desc: 'Span of a set', formula: '\\operatorname{span}(S) = \\{a_1v_1+\\cdots+a_kv_k : v_i\\in S, a_i\\in F\\}', exp: 'Smallest subspace containing $S$.' },
    { desc: 'Membership in a span', formula: 'w\\in\\operatorname{span}(v_1,\\dots,v_k) \\iff \\operatorname{rank}[v_1\\cdots v_k\\mid w] = \\operatorname{rank}[v_1\\cdots v_k]', exp: 'Consistency of the linear system.' },
    { desc: 'Linear independence', formula: 'a_1v_1+\\cdots+a_kv_k = \\mathbf 0 \\Rightarrow a_1 = \\cdots = a_k = 0', exp: 'Only the trivial combination gives zero.' },
    { desc: 'Independence test in $F^n$', formula: '\\operatorname{rank}[v_1\\cdots v_k] = k', exp: 'Every column is a pivot column.' },
    { desc: 'Basis', formula: '\\text{independent} + \\text{spanning}', exp: 'Every vector has unique coordinates.' },
    { desc: 'Dimension of $P_n(F)$', formula: 'n + 1', exp: 'Basis $1, x, \\dots, x^n$.' },
    { desc: 'Dimension of $M_{m\\times n}(F)$', formula: 'mn', exp: 'Matrix units $E_{ij}$.' },
    { desc: 'Dimension of $\\mathbb C$ over $\\mathbb R$', formula: '2', exp: 'Basis $\\{1, i\\}$.' },
    { desc: 'Dimension of symmetric $n\\times n$ matrices', formula: '\\tfrac{n(n+1)}{2}', exp: 'Diagonal plus above-diagonal entries.' },
    { desc: 'Dimension of a solution space', formula: '\\dim\\{x: Ax = \\mathbf 0\\} = n - \\operatorname{rank}A', exp: 'Rank–nullity.' },
    { desc: 'Subspace dimension bound', formula: 'W\\le V \\Rightarrow \\dim W\\le\\dim V, \\text{ equality iff } W = V', exp: 'Extend a basis of $W$.' }
];

const ConceptPairs = [
    { name: 'Field', condition: '(F, +, \\cdot) \\text{ with both operations commutative, associative, identities } 0\\neq 1, \\text{ inverses (non-zero for } \\cdot), \\text{ distributive}', conclusion: '\\text{scalars can be added, subtracted, multiplied and divided by non-zero elements}', textConclusion: true, exp: 'The definition of a field.' },
    { name: '$\\mathbb Z_p$ is a field', condition: 'p \\text{ prime}', conclusion: '\\forall a\\not\\equiv 0\\ \\exists x: ax\\equiv 1 \\pmod p', exp: 'Bézout / injectivity of $x\\mapsto ax$.' },
    { name: 'Zero divisors kill fields', condition: 'ab = 0 \\text{ with } a, b\\neq 0', conclusion: '\\text{the structure is not a field}', textConclusion: true, exp: 'A zero divisor cannot have an inverse.' },
    { name: 'Vector space', condition: 'V \\text{ with } + \\text{ and scalar multiplication satisfying (V0)–(V8)}', conclusion: '\\text{linear combinations, span, independence and bases make sense}', textConclusion: true, exp: 'The definition.' },
    { name: 'Subspace test', condition: '\\mathbf 0\\in W,\\ W \\text{ closed under } + \\text{ and scalar multiplication}', conclusion: 'W \\text{ is a vector space with the inherited operations}', exp: 'The remaining axioms are identities inherited from $V$.' },
    { name: 'Null space', condition: 'W = \\{x\\in F^n : Ax = \\mathbf 0\\}', conclusion: 'W \\le F^n,\\ \\dim W = n - \\operatorname{rank}A', exp: 'Homogeneous system.' },
    { name: 'Intersection of subspaces', condition: 'U, W \\le V', conclusion: 'U\\cap W \\le V', exp: 'Both closures pass to the intersection.' },
    { name: 'Union of subspaces', condition: 'U\\not\\subseteq W \\text{ and } W\\not\\subseteq U', conclusion: 'U\\cup W \\text{ is not a subspace}', textConclusion: true, exp: 'Pick $u\\in U\\setminus W$, $w\\in W\\setminus U$; $u+w$ is in neither.' },
    { name: 'Span is a subspace', condition: 'S\\subseteq V \\text{ any subset}', conclusion: '\\operatorname{span}(S) \\text{ is the smallest subspace containing } S', textConclusion: true, exp: 'Closed under combinations by construction.' },
    { name: 'Dependence criterion', condition: 'v_1,\\dots,v_k \\text{ dependent}', conclusion: '\\text{some } v_i \\text{ is a linear combination of the others}', textConclusion: true, exp: 'Solve the non-trivial relation for a vector with non-zero coefficient.' },
    { name: 'Too many vectors', condition: 'k > n \\text{ vectors in } F^n', conclusion: '\\text{they are linearly dependent}', textConclusion: true, exp: 'Rank is at most $n$.' },
    { name: 'Independent set of the right size', condition: 'n \\text{ independent vectors in an } n\\text{-dimensional space}', conclusion: '\\text{they form a basis}', textConclusion: true, exp: 'Independent sets of maximal size span.' },
    { name: 'Unique coordinates', condition: 'B \\text{ a basis of } V', conclusion: '\\text{every } v\\in V \\text{ is a unique linear combination of } B', textConclusion: true, exp: 'Existence from spanning, uniqueness from independence.' },
    { name: 'Dimension of a sum', condition: 'U, W \\le V \\text{ finite-dimensional}', conclusion: '\\dim(U+W) = \\dim U + \\dim W - \\dim(U\\cap W)', exp: 'Extend a basis of the intersection.' },
    { name: 'Field matters for dimension', condition: 'V = \\mathbb C^n \\text{ viewed over } \\mathbb R', conclusion: '\\dim_{\\mathbb R}\\mathbb C^n = 2n', exp: 'Basis $e_j, ie_j$.' },
    { name: 'Rank–nullity', condition: 'A \\text{ an } m\\times n \\text{ matrix}', conclusion: '\\operatorname{rank}A + \\dim\\operatorname{Null}A = n', exp: 'Pivot columns plus free variables.' }
];

const SetupQuestions = [
    { situation: 'You must decide whether $W = \\{(x,y,z): 2x - y + 3z = 0\\}$ is a subspace of $\\mathbb R^3$.', q: 'What is the efficient argument?', options: ['It is the null space of the $1\\times 3$ matrix $(2\\ {-1}\\ 3)$, hence a subspace', 'Check the eight vector-space axioms one by one', 'Check that $(1,2,0)$ and $(0,3,1)$ are in $W$', 'Compute the determinant'], correctIdx: 0, exp: 'Any homogeneous linear system defines a subspace; no axiom checking is needed. Testing specific vectors proves nothing.' },
    { situation: 'You suspect $W = \\{(x,y): xy \\ge 0\\}$ is not a subspace.', q: 'Which single computation settles it?', options: ['$(1,0)+(0,-1) = (1,-1)$, and $1\\cdot(-1) < 0$', '$(0,0)\\in W$', '$2\\cdot(1,1) = (2,2)\\in W$', '$(-1)\\cdot(1,1) = (-1,-1)\\in W$'], correctIdx: 0, exp: 'A single sum that leaves the set breaks closure under addition. The other computations stay inside $W$ and prove nothing.' },
    { situation: 'You want to check whether $x^2 + 1$ is in $\\operatorname{span}\\{x^2 + x, x + 1, x^2 - 1\\}$ in $P_2$.', q: 'What system do you solve?', options: ['Coefficient vectors as columns: $\\begin{pmatrix}0&1&-1\\\\1&1&0\\\\1&0&1\\end{pmatrix}\\begin{pmatrix}a\\\\b\\\\c\\end{pmatrix} = \\begin{pmatrix}1\\\\0\\\\1\\end{pmatrix}$', 'Evaluate all four polynomials at $x = 0$', 'Check whether the degrees add up', 'Compute the derivative of each polynomial'], correctIdx: 0, exp: 'Match the coefficients of $1$, $x$, $x^2$: three equations in $a, b, c$. Consistent iff the polynomial is in the span.' },
    { situation: 'You are asked whether $\\{(1,2,3), (2,4,6), (0,1,1)\\}$ is a basis of $\\mathbb R^3$.', q: 'Fastest route?', options: ['Notice $(2,4,6) = 2(1,2,3)$, so the set is dependent and cannot be a basis', 'Row reduce a $3\\times 3$ matrix fully', 'Check that the vectors are non-zero', 'Check that the set has three elements'], correctIdx: 0, exp: 'A visible multiple kills independence immediately. Three elements and non-zero entries are necessary but far from sufficient.' },
    { situation: 'You need a basis for $W = \\{(x,y,z,w): x + y = 0,\\ z - 2w = 0\\}$.', q: 'Plan?', options: ['Solve for $x = -y$, $z = 2w$; free variables $y, w$ give basis $\\{(-1,1,0,0), (0,0,2,1)\\}$', 'Take the coefficient rows $(1,1,0,0), (0,0,1,-2)$ as the basis', 'Guess four vectors in $W$', 'Use the standard basis of $\\mathbb R^4$'], correctIdx: 0, exp: 'Parametrise the solution set; one basis vector per free variable. The coefficient rows span the orthogonal complement, not $W$.' },
    { situation: 'A scalar multiplication on $\\mathbb R^2$ is defined by $a\\odot(x,y) = (ax, 0)$.', q: 'Which axiom should you test first?', options: ['(V8): $1\\odot(x,y) = (x,0)\\neq(x,y)$', '(V1): commutativity of addition', '(V2): associativity of addition', '(V3): existence of a zero vector'], correctIdx: 0, exp: 'Invented scalar multiplications most often fail $1v = v$; addition here is untouched, so (V1)–(V4) still hold.' },
    { situation: 'You must show $\\{p\\in P_3: p(1) = 0\\}$ is a subspace.', q: 'Correct proof shape?', options: ['Take $p, q$ with $p(1) = q(1) = 0$ and $a\\in\\mathbb R$; then $(p+q)(1) = 0$ and $(ap)(1) = 0$; also the zero polynomial has value $0$ at $1$', 'Show $x - 1$ and $x^2 - 1$ are in the set', 'Show it has dimension $3$', 'Show every polynomial can be written as $(x-1)q(x)$'], correctIdx: 0, exp: 'General elements, both closures, zero vector. The dimension count is a consequence, not a proof.' },
    { situation: 'You need $\\dim(U+W)$ where $U, W\\le\\mathbb R^5$ have dimensions $3$ and $4$.', q: 'What extra information is needed?', options: ['$\\dim(U\\cap W)$, then $\\dim(U+W) = 7 - \\dim(U\\cap W)$', 'Nothing: it is $7$', 'Nothing: it is $5$', 'A basis of $\\mathbb R^5$'], correctIdx: 0, exp: 'The formula needs the intersection. Since $\\dim(U+W)\\le 5$, the intersection has dimension at least $2$.' },
    { situation: 'In $\\mathbb Z_{11}$ you need to solve $7x = 3$.', q: 'Plan?', options: ['Find $7^{-1} = 8$ (since $56 = 5\\cdot 11 + 1$) and compute $x = 8\\cdot 3 = 24\\equiv 2$', 'Divide $3$ by $7$ to get $x = 3/7$', 'Try $x = 3 - 7 = -4$', 'Conclude there is no solution because $7\\nmid 3$'], correctIdx: 0, exp: 'Division in $\\mathbb Z_p$ is multiplication by the inverse. Every equation $ax = b$ with $a\\neq 0$ has exactly one solution in a field.' },
    { situation: 'You are told $S = \\{v_1, v_2, v_3, v_4\\}\\subset\\mathbb R^3$ spans $\\mathbb R^3$.', q: 'What can you conclude, and how do you get a basis?', options: ['$S$ is dependent (four vectors in $\\mathbb R^3$); row reduce with the $v_i$ as columns and keep the pivot columns', '$S$ is a basis', 'Any three of the vectors form a basis', 'No basis can be extracted from $S$'], correctIdx: 0, exp: 'Every spanning set contains a basis; the pivot columns identify one. Not every triple works (some triples may be dependent).' },
    { situation: 'You want to prove that in any vector space $a\\mathbf 0 = \\mathbf 0$.', q: 'Key step?', options: ['$a\\mathbf 0 = a(\\mathbf 0 + \\mathbf 0) = a\\mathbf 0 + a\\mathbf 0$, then cancel $a\\mathbf 0$', 'Divide both sides by $a$', 'Use $a\\mathbf 0 = 0a$', 'Use (V8): $1\\mathbf 0 = \\mathbf 0$'], correctIdx: 0, exp: 'Use (V3) to write $\\mathbf 0 = \\mathbf 0 + \\mathbf 0$, then (V5) and cancellation via (V4).' },
    { situation: 'You need to decide whether $\\{1, \\cos 2x, \\cos^2 x\\}$ is independent in $\\mathcal F(\\mathbb R)$.', q: 'What to look for?', options: ['A trigonometric identity: $\\cos 2x = 2\\cos^2 x - 1$, so the set is dependent', 'Evaluate at $x = 0$ only', 'Compute derivatives at $0$', 'Note the functions look different, so they are independent'], correctIdx: 0, exp: 'Known identities are relations. "Looking different" is not a criterion.' },
    { situation: 'You are asked for the dimension of $\\{A\\in M_{3\\times 3}(\\mathbb R): A^T = -A\\}$.', q: 'Count?', options: ['Diagonal entries must be $0$; the three entries above the diagonal are free: $\\dim 3$', '$9$', '$6$', '$0$'], correctIdx: 0, exp: 'Skew-symmetric: $a_{ii} = -a_{ii}$ forces $a_{ii} = 0$, and $a_{ji} = -a_{ij}$ determines the lower part.' },
    { situation: 'A student claims $W = \\{(x,y): y = x^2\\}$ is a subspace "because it passes through the origin".', q: 'Best reply?', options: ['Containing $\\mathbf 0$ is necessary but not sufficient; $(1,1)+(1,1) = (2,2)\\notin W$', 'Correct', 'Wrong: it does not pass through the origin', 'Wrong: subspaces must be lines'], correctIdx: 0, exp: 'All three conditions are needed. A parabola is closed under neither addition nor scaling.' },
    { situation: 'You need to write $(5,1)$ in the basis $B = \\{(1,1), (1,-1)\\}$ of $\\mathbb R^2$.', q: 'Setup?', options: ['Solve $a(1,1) + b(1,-1) = (5,1)$: $a + b = 5$, $a - b = 1$, so $[v]_B = (3, 2)$', 'Take the dot products $(5,1)\\cdot(1,1)$ and $(5,1)\\cdot(1,-1)$ as the coordinates', 'The coordinates are $(5,1)$ in every basis', 'Multiply $(5,1)$ by the matrix with rows $(1,1)$ and $(1,-1)$'], correctIdx: 0, exp: 'Coordinates solve a linear system. (Dot products would work only after normalising, because this basis happens to be orthogonal.)' },
    { situation: 'You want to show $\\mathbb Q(\\sqrt 3) = \\{a + b\\sqrt3: a,b\\in\\mathbb Q\\}$ is a field.', q: 'Non-trivial part?', options: ['Inverses: $(a+b\\sqrt3)^{-1} = \\dfrac{a - b\\sqrt3}{a^2 - 3b^2}$, and $a^2 - 3b^2\\neq 0$ for $(a,b)\\neq(0,0)$ since $\\sqrt3\\notin\\mathbb Q$', 'Commutativity of addition', 'That $1 = 1 + 0\\sqrt3$ is in the set', 'Associativity of multiplication'], correctIdx: 0, exp: 'Closure and the identities are inherited from $\\mathbb R$; the only real work is producing inverses inside the set.' },
    { situation: 'You need to decide whether three given vectors span $\\mathbb R^3$.', q: 'Test?', options: ['Put them as columns of a $3\\times 3$ matrix; they span iff the rank is $3$ (iff $\\det\\neq 0$)', 'Check that none of them is zero', 'Check that they are pairwise non-parallel', 'Check that their sum is non-zero'], correctIdx: 0, exp: 'Three vectors in a $3$-dimensional space span iff they are independent iff the rank is $3$. Pairwise non-parallel is not enough.' }
];

const FinalBlueprint = [
    ['fieldAxioms'], ['fieldArith'], ['fieldArith', 'fieldAxioms'], ['vsAxioms'], ['vsAxioms', 'vsExamples'], ['vsExamples'],
    ['subspaceRn'], ['subspaceRn'], ['subspacePoly'], ['subspacePoly'], ['subspaceMatFn'], ['subspaceMatFn'],
    ['spanTest'], ['spanTest'], ['independence'], ['independence'], ['basisDim'], ['basisDim'], ['subOps'], ['subOps']
];

const QuizModes = {
    standard: { label: 'Standard (10 questions from selected topics)', kind: 'topics', count: 10 },
    long: { label: 'Long drill (20 questions from selected topics)', kind: 'topics', count: 20 },
    matching: { label: 'Definition matching (name ↔ formula)', kind: 'custom', build: () => generateMatchingQuiz(MatchingQuestions, 'Definition Matching', 12) },
    concepts: { label: 'Hypothesis ↔ conclusion', kind: 'custom', build: () => generateConceptQuiz(ConceptPairs, 'Concept ↔ Statement', 10) },
    setup: { label: 'Setup & strategy problems', kind: 'custom', build: () => generateSetupQuiz(SetupQuestions, 'Setup & Strategy', 10) },
    final: { label: 'Full test (20 questions, every topic)', kind: 'custom', build: () => generateBlueprintQuiz(FinalBlueprint) }
};
