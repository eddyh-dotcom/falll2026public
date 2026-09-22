/* ==========================================================================
 * Binomial & Multinomial Lab — content
 * Everything here is standard textbook material (binomial coefficients, the
 * binomial and multinomial theorems and the identities usually derived from
 * them). No course-specific material.
 * ========================================================================== */

const LabConfig = {
    name: 'Binomial & Multinomial Lab',
    shortName: 'Binomial Lab',
    storageKey: 'binomial_lab',
    defaultReference: 'binom',
    modules: {
        dashboard: { title: 'Dashboard & Reference', desc: 'Formula sheets for binomial coefficients, both theorems and the identities derived from them' },
        pascal: { title: "Pascal's Triangle & Identities", desc: 'See each identity as a pattern of cells, and as lattice paths' },
        expand: { title: 'Binomial Expansion Tool', desc: 'Expand (ax + by)^n, pick out one term, and test substitution identities' },
        multi: { title: 'Multinomial Explorer', desc: 'Coefficients of (x+y+z)^n, arrangements of a word, and a coefficient finder' },
        quiz: { title: 'Practice Quiz Hub', desc: 'Randomised drills with worked explanations' }
    }
};

/* --------------------------------------------------------------------------
 * Exact arithmetic helpers (BigInt) used by both content and visualizers
 * -------------------------------------------------------------------------- */
function bigFact(n) { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return r; }
function bigBinom(n, k) {
    n = Number(n); k = Number(k);
    if (k < 0 || k > n || n < 0) return 0n;
    k = Math.min(k, n - k);
    let r = 1n;
    for (let i = 1; i <= k; i++) r = r * BigInt(n - k + i) / BigInt(i);
    return r;
}
function bigMultinom(parts) {
    const n = parts.reduce((a, b) => a + b, 0);
    let r = bigFact(n);
    parts.forEach(p => { r /= bigFact(p); });
    return r;
}
function bigPow(b, e) { let r = 1n; b = BigInt(b); for (let i = 0; i < e; i++) r *= b; return r; }
function fmtBig(x, latex = false) {
    const s = x.toString();
    const neg = s[0] === '-';
    const digits = neg ? s.slice(1) : s;
    const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, latex ? '\\,' : ',');
    return (neg ? '-' : '') + grouped;
}
const B = (x) => fmtBig(x, true);
const nbin = (n, k) => Number(bigBinom(n, k));
const nfact = (n) => Number(bigFact(n));
const nmult = (parts) => Number(bigMultinom(parts));

/* --------------------------------------------------------------------------
 * Reference hub
 * -------------------------------------------------------------------------- */
const ReferenceData = {
    coef: {
        title: '1. Binomial coefficients',
        intro: 'The number $\\binom{n}{k}$ ("n choose k") counts the $k$-element subsets of an $n$-element set. Everything else on this page is a consequence of that single definition.',
        sections: [
            {
                heading: 'Definition and the factorial formula',
                text: 'For integers $0 \\le k \\le n$, $\\binom{n}{k}$ is the number of ways to choose $k$ objects from $n$ distinct objects when order does not matter. Counting ordered selections two ways gives the formula.',
                formula: ['\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!} = \\frac{n(n-1)\\cdots(n-k+1)}{k!}', '\\binom{n}{k} = 0 \\text{ if } k<0 \\text{ or } k>n, \\qquad \\binom{n}{0} = \\binom{n}{n} = 1'],
                bullets: [
                    '<strong>Why:</strong> there are $n(n-1)\\cdots(n-k+1) = \\frac{n!}{(n-k)!}$ ordered $k$-selections, and each unordered selection appears $k!$ times among them.',
                    'Hand computation: cancel first. $\\binom{10}{3} = \\frac{10\\cdot 9\\cdot 8}{3\\cdot 2\\cdot 1} = 120$; never compute $10!$.',
                    'Multiplicative recursion: $\\binom{n}{k} = \\binom{n}{k-1}\\cdot\\frac{n-k+1}{k}$, so a row of Pascal\'s triangle is built left to right with one multiply and one divide per step.'
                ]
            },
            {
                heading: 'Symmetry',
                text: 'Choosing the $k$ elements to keep is the same as choosing the $n-k$ elements to leave out.',
                formula: '\\binom{n}{k} = \\binom{n}{n-k}',
                bullets: ['Use it to shrink work: $\\binom{20}{18} = \\binom{20}{2} = 190$.', 'It is why each row of Pascal\'s triangle reads the same backwards.']
            },
            {
                heading: "Pascal's rule (the addition formula)",
                text: 'Fix one element $x$ of the $n$-set. A $k$-subset either contains $x$ (choose the other $k-1$ from the remaining $n-1$) or does not (choose all $k$ from the remaining $n-1$).',
                formula: '\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}',
                bullets: [
                    'Algebraic check: $\\binom{n-1}{k-1}+\\binom{n-1}{k} = \\frac{(n-1)!}{(k-1)!\\,(n-k)!} + \\frac{(n-1)!}{k!\\,(n-k-1)!} = \\frac{(n-1)!\\,[\\,k + (n-k)\\,]}{k!\\,(n-k)!} = \\frac{n!}{k!\\,(n-k)!}$.',
                    'This is the rule that generates Pascal\'s triangle: each entry is the sum of the two entries above it.',
                    'It is also the induction step in the inductive proof of the binomial theorem.'
                ]
            },
            {
                heading: "Pascal's triangle",
                text: 'Row $n$ lists $\\binom{n}{0}, \\binom{n}{1}, \\dots, \\binom{n}{n}$. Rows 0–6:',
                formula: '\\begin{array}{c} 1 \\\\ 1\\;1 \\\\ 1\\;2\\;1 \\\\ 1\\;3\\;3\\;1 \\\\ 1\\;4\\;6\\;4\\;1 \\\\ 1\\;5\\;10\\;10\\;5\\;1 \\\\ 1\\;6\\;15\\;20\\;15\\;6\\;1 \\end{array}',
                bullets: [
                    'Row sums are $1, 2, 4, 8, 16, \\dots = 2^n$ (every subset is counted once).',
                    'The second diagonal is $1,2,3,4,\\dots$ ($\\binom{n}{1} = n$), the third is the triangular numbers $\\binom{n}{2} = \\frac{n(n-1)}{2}$.',
                    'The largest entry in row $n$ is the middle one, $\\binom{n}{\\lfloor n/2\\rfloor}$; entries increase up to the middle and then decrease (unimodal).'
                ]
            },
            {
                heading: 'Absorption (pulling a factor out)',
                text: 'Count pairs (committee of $k$ people, chair of the committee) from $n$ people two ways: pick the committee then its chair, or pick the chair then the other $k-1$ members.',
                formula: 'k\\binom{n}{k} = n\\binom{n-1}{k-1} \\qquad\\Longleftrightarrow\\qquad \\binom{n}{k} = \\frac{n}{k}\\binom{n-1}{k-1}',
                note: 'This is the identity that turns $\\sum k\\binom nk$ into $n\\sum\\binom{n-1}{k-1} = n\\,2^{n-1}$ without calculus.'
            },
            {
                heading: 'Hockey-stick (upper summation) identity',
                text: 'Summing a diagonal of the triangle gives the entry just below the end of the diagonal. Proof: apply Pascal\'s rule repeatedly to $\\binom{n+1}{k+1}$, or count $(k+1)$-subsets of $\\{1,\\dots,n+1\\}$ by their largest element $j+1$.',
                formula: '\\sum_{j=k}^{n} \\binom{j}{k} = \\binom{k}{k}+\\binom{k+1}{k}+\\cdots+\\binom{n}{k} = \\binom{n+1}{k+1}',
                bullets: ['Example: $\\binom{2}{2}+\\binom{3}{2}+\\binom{4}{2}+\\binom{5}{2} = 1+3+6+10 = 20 = \\binom{6}{3}$.']
            }
        ]
    },

    binom: {
        title: '2. The binomial theorem',
        intro: 'Expanding $(x+y)^n$ means choosing, from each of the $n$ factors, either the $x$ or the $y$. The theorem just organises that count.',
        sections: [
            {
                heading: 'Statement',
                text: 'For every non-negative integer $n$ and all $x, y$ (real, complex, or in any commutative ring):',
                formula: '(x+y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^{n-k} y^{k} = \\sum_{k=0}^{n} \\binom{n}{k} x^{k} y^{n-k}',
                bullets: [
                    'Both index conventions are the same theorem because $\\binom nk = \\binom n{n-k}$; pick one and stay with it inside a problem.',
                    'There are $n+1$ terms, and in each term the exponents add to $n$.',
                    'Special case $y = 1$: $(1+x)^n = \\sum_{k=0}^n \\binom nk x^k$ — the generating function of row $n$ of Pascal\'s triangle.'
                ]
            },
            {
                heading: 'Proof 1: counting',
                text: 'Write $(x+y)^n = (x+y)(x+y)\\cdots(x+y)$ with $n$ factors. Multiplying out without collecting gives $2^n$ products, one for each choice of $x$ or $y$ from every factor. A product equals $x^{n-k}y^k$ exactly when $y$ was chosen from $k$ of the factors, and there are $\\binom nk$ ways to choose which $k$ factors. Collecting like terms gives the coefficient $\\binom nk$.',
                note: 'This proof is why the coefficient of $x^{n-k}y^k$ is a <em>count</em>. It is the argument to generalise for the multinomial theorem.'
            },
            {
                heading: 'Proof 2: induction on $n$',
                text: 'Base case $n=0$: both sides are $1$. Inductive step: assume the formula for $n$. Then $(x+y)^{n+1} = (x+y)\\sum_{k}\\binom nk x^{n-k}y^k$. Multiply out, shift the index of the $y$-part by one, and collect: the coefficient of $x^{n+1-k}y^k$ is $\\binom{n}{k} + \\binom{n}{k-1}$, which is $\\binom{n+1}{k}$ by Pascal\'s rule.',
                formula: '\\binom{n}{k}+\\binom{n}{k-1} = \\binom{n+1}{k}',
                note: 'The index shift is the only place students slip: $\\sum_{k=0}^{n}\\binom nk x^{n-k}y^{k+1} = \\sum_{k=1}^{n+1}\\binom{n}{k-1}x^{n+1-k}y^{k}$.'
            },
            {
                heading: 'The general term',
                text: 'The term with $y^k$ (the $(k+1)$-th term, counting from $k=0$) is',
                formula: 'T_{k+1} = \\binom{n}{k} x^{n-k} y^{k}',
                bullets: [
                    'To find the coefficient of a given power, solve for $k$ first, then evaluate the term. Example: the coefficient of $x^3$ in $(2x+3)^5$ has $k$ with $x$-exponent $3$, so $k=2$ if we write $\\binom 5k (2x)^{5-k}3^{k}$: $\\binom 52 2^3 3^2 = 10\\cdot 8\\cdot 9 = 720$.',
                    '"Constant term" or "term independent of $x$" means the exponent of $x$ is $0$. In $\\left(x^2+\\frac1x\\right)^{9}$ the general term is $\\binom 9k x^{2(9-k)}x^{-k} = \\binom 9k x^{18-3k}$, so $k=6$ and the constant term is $\\binom 96 = 84$.',
                    'If no integer $k$ in $0..n$ works, the coefficient is $0$.'
                ]
            },
            {
                heading: 'Signs and scalars',
                text: 'Replace $y$ by $-y$ to get the alternating version; replace $x$ by $ax$ and $y$ by $by$ to pull scalars into the coefficients.',
                formula: ['(x-y)^n = \\sum_{k=0}^{n} (-1)^k \\binom{n}{k} x^{n-k} y^{k}', '(ax+by)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^{k}\\, x^{n-k} y^{k}'],
                bullets: ['Sign rule: the term with $y^k$ carries $(-1)^k$, so the sign alternates starting with $+$.', 'Trap: in $(ax+by)^n$ the scalar is raised to the <em>same</em> exponent as its variable, $a^{n-k}$ with $x^{n-k}$.']
            },
            {
                heading: 'Worked expansions',
                formula: ['(x+y)^4 = x^4 + 4x^3y + 6x^2y^2 + 4xy^3 + y^4', '(2x-1)^5 = 32x^5 - 80x^4 + 80x^3 - 40x^2 + 10x - 1', '(1+x)^n = 1 + nx + \\binom n2 x^2 + \\cdots + x^n'],
                note: 'Check any expansion by substituting $x=y=1$: the coefficients must add to $2^n$ (or to $(a+b)^n$ for $(ax+by)^n$). For $(2x-1)^5$: $32-80+80-40+10-1 = 1 = (2-1)^5$. ✓'
            }
        ]
    },

    ident: {
        title: '3. Identities from the binomial theorem',
        intro: 'Substituting values into $(1+x)^n = \\sum_k \\binom nk x^k$, differentiating it, integrating it, or multiplying two copies together produces the standard identities. Each also has a counting proof.',
        sections: [
            {
                heading: 'Row sum: put $x = 1$',
                formula: '\\sum_{k=0}^{n} \\binom{n}{k} = 2^n',
                bullets: ['Counting proof: both sides count all subsets of an $n$-set, the left side by size.', 'Example: $1+5+10+10+5+1 = 32 = 2^5$.']
            },
            {
                heading: 'Alternating sum: put $x = -1$',
                formula: '\\sum_{k=0}^{n} (-1)^k \\binom{n}{k} = 0 \\quad (n \\ge 1), \\qquad\\text{hence}\\qquad \\sum_{k \\text{ even}} \\binom nk = \\sum_{k \\text{ odd}} \\binom nk = 2^{n-1}',
                bullets: [
                    'Counting proof: fix an element $x$; toggling whether $x$ is in a subset is a bijection between even-sized and odd-sized subsets.',
                    'Adding and subtracting the two sums gives the even/odd halves: $\\frac{2^n + 0}{2} = 2^{n-1}$.',
                    'Trap: for $n = 0$ the alternating sum is $1$, not $0$.'
                ]
            },
            {
                heading: 'Weighted sum: differentiate, or absorb',
                text: 'Differentiate $(1+x)^n = \\sum_k \\binom nk x^k$ to get $n(1+x)^{n-1} = \\sum_k k\\binom nk x^{k-1}$, then put $x = 1$.',
                formula: ['\\sum_{k=0}^{n} k\\binom{n}{k} = n\\,2^{n-1}', '\\sum_{k=0}^{n} k(k-1)\\binom{n}{k} = n(n-1)\\,2^{n-2}, \\qquad \\sum_{k=0}^{n} k^2\\binom{n}{k} = n(n+1)\\,2^{n-2}'],
                bullets: [
                    'Counting proof of the first: both sides count (subset, distinguished member) pairs — choose the subset then its chair, or choose the chair ($n$ ways) then any subset of the other $n-1$ ($2^{n-1}$).',
                    'Without calculus: $k\\binom nk = n\\binom{n-1}{k-1}$, so the sum is $n\\sum_{j}\\binom{n-1}{j} = n2^{n-1}$.',
                    'For $k^2$, write $k^2 = k(k-1)+k$ and add the two results.'
                ]
            },
            {
                heading: 'Scaled sums: put $x = 2$, $x = t$',
                formula: ['\\sum_{k=0}^{n} 2^k\\binom{n}{k} = 3^n, \\qquad \\sum_{k=0}^{n} \\binom{n}{k} t^k = (1+t)^n', '\\sum_{k=0}^{n} (-1)^k\\binom{n}{k} 2^{k} = (-1)^n'],
                bullets: ['Counting proof of $3^n$: strings over $\\{0,1,2\\}$ of length $n$ — choose which $k$ positions are non-zero, then fill them with $1$ or $2$.']
            },
            {
                heading: 'Integrate: put the $\\frac{1}{k+1}$ in',
                text: 'Integrate $(1+x)^n$ from $0$ to $1$ term by term.',
                formula: '\\sum_{k=0}^{n} \\frac{1}{k+1}\\binom{n}{k} = \\frac{2^{n+1}-1}{n+1}, \\qquad \\sum_{k=0}^{n} \\frac{(-1)^k}{k+1}\\binom{n}{k} = \\frac{1}{n+1}',
                note: 'Also from absorption: $\\frac{1}{k+1}\\binom nk = \\frac{1}{n+1}\\binom{n+1}{k+1}$.'
            },
            {
                heading: "Vandermonde's identity: multiply two expansions",
                text: 'Compare the coefficient of $x^r$ on both sides of $(1+x)^m(1+x)^n = (1+x)^{m+n}$.',
                formula: ['\\sum_{k=0}^{r} \\binom{m}{k}\\binom{n}{r-k} = \\binom{m+n}{r}', '\\text{Special case } m=n=r: \\quad \\sum_{k=0}^{n} \\binom{n}{k}^2 = \\binom{2n}{n}'],
                bullets: [
                    'Counting proof: choose $r$ people from a group of $m$ women and $n$ men, sorted by how many women ($k$) are chosen.',
                    'The square version uses $\\binom{n}{n-k} = \\binom nk$ before applying Vandermonde with $m=n$, $r=n$.',
                    'Example: $\\binom 40^2+\\binom 41^2+\\binom 42^2+\\binom 43^2+\\binom 44^2 = 1+16+36+16+1 = 70 = \\binom 84$.'
                ]
            },
            {
                heading: 'Prime exponents',
                text: 'If $p$ is prime and $0<k<p$, then $p$ divides $\\binom pk$, because $p$ divides the numerator $p!$ but not the denominator $k!(p-k)!$.',
                formula: '(x+y)^p \\equiv x^p + y^p \\pmod p \\qquad (\\text{the "freshman\'s dream"})',
                note: 'Iterating with $x = 1$ gives $a^p \\equiv a \\pmod p$ for every integer $a \\ge 0$: Fermat\'s little theorem by induction on $a$.'
            }
        ]
    },

    multi: {
        title: '4. Multinomial coefficients',
        intro: 'A binomial coefficient splits $n$ objects into two labelled groups. A multinomial coefficient splits them into $m$ labelled groups of prescribed sizes.',
        sections: [
            {
                heading: 'Definition',
                text: 'For non-negative integers $n_1 + n_2 + \\cdots + n_m = n$, the multinomial coefficient counts the ways to partition an $n$-set into labelled blocks of sizes $n_1, \\dots, n_m$, equivalently the arrangements of $n$ objects of which $n_i$ are identical of type $i$.',
                formula: '\\binom{n}{n_1, n_2, \\dots, n_m} = \\frac{n!}{n_1!\\,n_2!\\cdots n_m!}',
                bullets: [
                    'With $m = 2$ this is the binomial coefficient: $\\binom{n}{k,\\,n-k} = \\binom nk$.',
                    'Why the formula: arrange all $n$ objects as if distinct ($n!$ ways); permuting the identical objects of each type ($n_i!$ ways each) does not change the arrangement.'
                ]
            },
            {
                heading: 'As a product of binomials',
                text: 'Fill the blocks one at a time: choose $n_1$ of the $n$ positions, then $n_2$ of the remaining $n - n_1$, and so on. The product telescopes to the factorial formula.',
                formula: '\\binom{n}{n_1,\\dots,n_m} = \\binom{n}{n_1}\\binom{n-n_1}{n_2}\\binom{n-n_1-n_2}{n_3}\\cdots\\binom{n_m}{n_m}',
                note: 'Any order of filling the blocks gives the same number, which is a useful sanity check.'
            },
            {
                heading: 'Arrangements of a word',
                text: 'The number of distinct strings obtained by rearranging the letters of a word is the multinomial coefficient of its letter multiplicities.',
                formula: '\\text{MISSISSIPPI: } \\binom{11}{1,4,4,2} = \\frac{11!}{1!\\,4!\\,4!\\,2!} = 34\\,650',
                bullets: ['BANANA: $\\frac{6!}{1!\\,3!\\,2!} = 60$.', 'With a constraint (e.g. the two P\'s adjacent) glue them into one symbol first: $\\frac{10!}{1!\\,4!\\,4!\\,1!} = 6300$.']
            },
            {
                heading: 'Symmetry and the multinomial Pascal rule',
                text: 'Permuting the block sizes does not change the coefficient. Removing one object from block $i$ gives the addition rule, which generates Pascal\'s pyramid for $m = 3$.',
                formula: '\\binom{n}{n_1,\\dots,n_m} = \\sum_{i=1}^{m} \\binom{n-1}{n_1,\\dots,n_i - 1,\\dots,n_m}',
                note: 'Counting proof: classify partitions of $\\{1,\\dots,n\\}$ by which block contains the element $n$.'
            },
            {
                heading: 'How many multinomial coefficients are there for given $n$ and $m$?',
                text: 'The number of ways to write $n = n_1 + \\cdots + n_m$ with $n_i \\ge 0$ (compositions with zeros allowed, or "stars and bars") is',
                formula: '\\binom{n+m-1}{m-1} = \\binom{n+m-1}{n}',
                bullets: ['This is also the number of distinct terms in the expansion of $(x_1+\\cdots+x_m)^n$.', 'Example: $(x+y+z)^4$ has $\\binom{6}{2} = 15$ terms.']
            }
        ]
    },

    multith: {
        title: '5. The multinomial theorem',
        intro: 'The same counting argument as for the binomial theorem, with $m$ choices per factor instead of two.',
        sections: [
            {
                heading: 'Statement',
                formula: '(x_1 + x_2 + \\cdots + x_m)^n = \\sum_{\\substack{n_1+\\cdots+n_m = n \\\\ n_i \\ge 0}} \\binom{n}{n_1,\\dots,n_m}\\, x_1^{n_1} x_2^{n_2}\\cdots x_m^{n_m}',
                bullets: ['The sum runs over all $\\binom{n+m-1}{m-1}$ exponent vectors.', 'For $m = 2$ it is the binomial theorem with $n_1 = n-k$, $n_2 = k$.']
            },
            {
                heading: 'Proof by counting',
                text: 'Multiplying out $n$ copies of $(x_1+\\cdots+x_m)$ without collecting gives $m^n$ products, one for each choice of a variable from each factor. The product is $x_1^{n_1}\\cdots x_m^{n_m}$ exactly when $x_i$ was chosen from $n_i$ of the factors, and the number of ways to assign the $n$ factors to the $m$ variables with those counts is $\\binom{n}{n_1,\\dots,n_m}$.',
                note: 'Alternative: induction on $m$ using the binomial theorem on $\\big((x_1+\\cdots+x_{m-1}) + x_m\\big)^n$, then the product formula for multinomial coefficients.'
            },
            {
                heading: 'Finding one coefficient',
                text: 'The coefficient of $x_1^{n_1}\\cdots x_m^{n_m}$ (with the exponents adding to $n$) is the multinomial coefficient times the scalars raised to matching exponents.',
                formula: '[x^a y^b z^c]\\,(\\alpha x+\\beta y+\\gamma z)^n = \\binom{n}{a,b,c}\\,\\alpha^a\\beta^b\\gamma^c \\qquad (a+b+c = n)',
                bullets: [
                    'Example: coefficient of $x^2y^3z$ in $(x+2y-z)^6$ is $\\binom{6}{2,3,1}\\cdot 1^2\\cdot 2^3\\cdot(-1)^1 = 60\\cdot 8\\cdot(-1) = -480$.',
                    'Trap: if the exponents do not add to $n$, the coefficient is $0$ (unless a variable with a fractional or negative power is hiding a second contribution, as in $(x + 1/x + 1)^n$).'
                ]
            },
            {
                heading: 'Sum of all coefficients: put every $x_i = 1$',
                formula: '\\sum_{n_1+\\cdots+n_m = n} \\binom{n}{n_1,\\dots,n_m} = m^n',
                bullets: ['Counting proof: both sides count strings of length $n$ over an alphabet of $m$ letters, the left side by letter multiplicities.', 'Example: the coefficients of $(x+y+z)^3$ add to $27$: $1+1+1+3\\cdot 6+6 = 27$ ✓ (three cubes, six terms with coefficient $3$, one term $6xyz$).']
            },
            {
                heading: 'Worked trinomial expansion',
                formula: '(x+y+z)^3 = x^3+y^3+z^3 + 3x^2y+3x^2z+3y^2x+3y^2z+3z^2x+3z^2y + 6xyz',
                note: 'The coefficients $1, 3, 6$ are $\\binom{3}{3,0,0}$, $\\binom{3}{2,1,0}$, $\\binom{3}{1,1,1}$. Group terms by the <em>shape</em> of the exponent vector to avoid missing any.'
            },
            {
                heading: 'Hidden binomials: a term like $(x + y + 1)^n$',
                text: 'When a coefficient question mixes powers, expand in stages: treat $(x+y+1)^n = \\big((x+y)+1\\big)^n$, or use the multinomial theorem with one exponent absorbed by the constant.',
                formula: '[x^a y^b]\\,(x+y+1)^n = \\binom{n}{a,\\,b,\\,n-a-b}',
                note: 'The exponent of the constant $1$ is whatever is left over, $n-a-b$, which must be $\\ge 0$.'
            }
        ]
    },

    apps: {
        title: '6. Standard applications',
        intro: 'Places where binomial coefficients appear as answers to counting questions or as approximations.',
        sections: [
            {
                heading: 'Lattice paths',
                text: 'Paths from $(0,0)$ to $(a,b)$ using unit steps right (R) or up (U) are strings of $a$ R\'s and $b$ U\'s.',
                formula: '\\#\\text{paths} = \\binom{a+b}{a} = \\binom{a+b}{b}',
                bullets: ['Pascal\'s rule is the statement "the last step came from the left or from below".', 'Paths through a checkpoint $(c,d)$: multiply, $\\binom{c+d}{c}\\binom{a-c+b-d}{a-c}$.']
            },
            {
                heading: 'Binary strings and subsets',
                text: 'Length-$n$ binary strings with exactly $k$ ones ↔ $k$-subsets of positions ↔ terms $x^{n-k}y^k$ in $(x+y)^n$.',
                formula: '\\#\\{\\text{strings with } k \\text{ ones}\\} = \\binom nk, \\qquad \\#\\{\\text{strings with at most } k \\text{ ones}\\} = \\sum_{j=0}^{k}\\binom nj',
                note: 'There is no closed form for the partial sum $\\sum_{j\\le k}\\binom nj$ in general; the hockey stick is a sum down a column, not across a row.'
            },
            {
                heading: 'Binomial probabilities',
                text: 'For $n$ independent trials with success probability $p$, the probability of exactly $k$ successes is a term of $(p + q)^n$ with $q = 1-p$.',
                formula: 'P(X=k) = \\binom nk p^k (1-p)^{n-k}, \\qquad \\sum_{k=0}^{n} P(X=k) = (p+q)^n = 1',
                note: 'The mean $np$ is $\\sum_k k\\binom nk p^k q^{n-k}$, evaluated with the differentiation trick.'
            },
            {
                heading: 'Approximation for small $x$',
                formula: '(1+x)^n = 1 + nx + \\binom n2 x^2 + \\cdots \\approx 1 + nx \\quad (|x| \\ll 1)',
                bullets: ['Example: $1.01^{10} \\approx 1 + 0.1 + 45\\cdot 0.0001 = 1.1045$ (true value $1.10462$).', 'Bernoulli\'s inequality $(1+x)^n \\ge 1+nx$ for $x \\ge -1$ follows for $x \\ge 0$ since every dropped term is non-negative.']
            },
            {
                heading: 'The central binomial coefficient',
                formula: '\\binom{2n}{n} = \\sum_{k=0}^{n}\\binom nk^2, \\qquad \\binom{2n}{n} = \\frac{(2n)!}{(n!)^2} \\sim \\frac{4^n}{\\sqrt{\\pi n}}',
                bullets: ['It is the largest entry in row $2n$ and the number of monotone lattice paths across an $n\\times n$ grid.', 'The values $1, 2, 6, 20, 70, 252, \\dots$ sit on the central column of the triangle.']
            },
            {
                heading: 'Counting non-negative integer solutions',
                text: 'The number of solutions of $x_1 + \\cdots + x_m = n$ in non-negative integers (stars and bars) equals the number of terms of $(x_1+\\cdots+x_m)^n$.',
                formula: '\\binom{n+m-1}{m-1}; \\qquad \\text{with each } x_i \\ge 1: \\binom{n-1}{m-1}',
                note: 'Combinations with repetition, distributing identical balls into labelled boxes and counting monomials of degree $n$ in $m$ variables are all this number.'
            }
        ]
    },

    traps: {
        title: '7. Techniques and traps',
        sections: [
            {
                heading: 'Which substitution gives which identity',
                bullets: [
                    'Want $\\sum \\binom nk$? Put $x = 1$ in $(1+x)^n$.',
                    'Want $\\sum (-1)^k\\binom nk$? Put $x = -1$.',
                    'Want $\\sum \\binom nk c^k$? Put $x = c$: the answer is $(1+c)^n$.',
                    'Want $\\sum k\\binom nk$ or $\\sum k(k-1)\\binom nk$? Differentiate once or twice, then substitute.',
                    'Want $\\sum \\frac{\\binom nk}{k+1}$? Integrate from $0$ to $1$.',
                    'Want $\\sum \\binom mk\\binom n{r-k}$? Compare coefficients in $(1+x)^m(1+x)^n$.'
                ]
            },
            {
                heading: 'Index bookkeeping',
                bullets: [
                    'The term with $y^k$ is the $(k+1)$-th term. "The 4th term" means $k = 3$.',
                    'Solve for $k$ from the required exponent <em>before</em> computing anything; if $k$ is not an integer in $[0,n]$ the coefficient is $0$.',
                    'In $(ax+by)^n$ keep $a^{n-k}$ with $x^{n-k}$ and $b^k$ with $y^k$.',
                    'Negative $y$: the sign is $(-1)^k$, attached to the power of the negative piece, not to the position of the term.'
                ]
            },
            {
                heading: 'Coefficient versus term',
                bullets: [
                    'A <em>term</em> includes the variables: $-480x^2y^3z$. A <em>coefficient</em> is the number: $-480$.',
                    'The "coefficient of $x^3$" in $(2x+3)^5$ is $720$, not $\\binom 52 = 10$; the scalars must be included.'
                ]
            },
            {
                heading: 'Multinomial slips',
                bullets: [
                    'The exponents must add up to $n$. Check before computing.',
                    'Divide by <em>every</em> block\'s factorial, including $1!$ and $0!$ (both equal $1$, harmless but easy to forget when listing).',
                    'The number of distinct terms is $\\binom{n+m-1}{m-1}$, not $m^n$; $m^n$ is the sum of the coefficients.'
                ]
            },
            {
                heading: 'Always check with small cases',
                text: 'Any identity claimed for all $n$ can be tested at $n = 1, 2, 3$ in seconds. Substituting $x = y = 1$ into an expansion checks the coefficient sum; substituting $x = 1$, $y = -1$ checks the alternating sum.',
                formula: '(x+y)^3 \\text{ at } x=y=1: \\; 1+3+3+1 = 8 = 2^3 \\;\\checkmark'
            }
        ]
    }
};

/* --------------------------------------------------------------------------
 * Quiz generators
 * -------------------------------------------------------------------------- */
const TOPIC = {
    coefCompute: 'Binomial coefficients: computing',
    coefIdentity: "Pascal's rule, symmetry, hockey stick",
    expandTerm: 'Binomial theorem: terms and coefficients',
    expandSpecific: 'Binomial theorem: constant terms and hidden powers',
    sumIdentities: 'Substitution identities',
    calcIdentities: 'Differentiate / integrate / Vandermonde',
    multiCoef: 'Multinomial coefficients',
    multiTheorem: 'Multinomial theorem',
    counting: 'Counting applications',
    proofs: 'Proof techniques',
    traps: 'Error spotting'
};

const numOpts = (correct, distractors) => makeOptions(String(correct), distractors.map(String));
const bigOpts = (correct, distractors) => makeOptions(B(correct), distractors.map(d => B(d)));
const sgn = (v) => (v < 0 ? '-' : '+');
const powLatex = (base, e) => (e === 0 ? '' : e === 1 ? base : `${base}^{${e}}`);
const coefLatex = (c, isFirst = false) => {
    if (c === 1) return isFirst ? '' : '+';
    if (c === -1) return '-';
    return (c > 0 && !isFirst ? '+' : '') + String(c);
};
const termLatex = (c, x, ex, y, ey, isFirst = false) => {
    const mon = powLatex(x, ex) + powLatex(y, ey);
    if (!mon) return (c > 0 && !isFirst ? '+' : '') + String(c);
    return coefLatex(c, isFirst) + mon;
};
const monoLatex = (x, ex, y, ey) => (powLatex(x, ex) + powLatex(y, ey)) || '1';

const QuizGenerators = {
    /* ---------------- coefCompute ---------------- */
    coefCompute: [
        () => {
            const n = randInt(6, 14), k = randInt(2, Math.min(5, n - 2));
            const C = nbin(n, k);
            const nums = Array.from({ length: k }, (_, i) => n - i).join('\\cdot ');
            return {
                topic: TOPIC.coefCompute,
                questionText: `Compute $\\binom{${n}}{${k}}$.`,
                mathText: '',
                ...numOpts(C, [nbin(n, k - 1), nbin(n, k + 1), nbin(n + 1, k), nbin(n - 1, k), C * k, Math.round(nfact(n) / nfact(n - k)), C + n]),
                explanation: `$$\\binom{${n}}{${k}} = \\frac{${nums}}{${k}!} = \\frac{${Array.from({ length: k }, (_, i) => n - i).reduce((a, b) => a * b, 1)}}{${nfact(k)}} = ${C}.$$ Cancel before multiplying; the numerator has exactly $k = ${k}$ factors counting down from $n = ${n}$.`
            };
        },
        () => {
            const n = randInt(12, 30), k = randInt(n - 4, n - 2);
            const C = nbin(n, k);
            return {
                topic: TOPIC.coefCompute,
                questionText: `Use symmetry to compute $\\binom{${n}}{${k}}$.`,
                mathText: '',
                ...numOpts(C, [nbin(n, n - k - 1), nbin(n, n - k + 1), n * (n - k), nbin(n - 1, n - k), C * 2, Math.round(nfact(n - k)), n * k]),
                explanation: `$\\binom{${n}}{${k}} = \\binom{${n}}{${n - k}}$, and $\\binom{${n}}{${n - k}} = ${C}$ needs only ${n - k} factors: $\\frac{${Array.from({ length: n - k }, (_, i) => n - i).join('\\cdot ')}}{${n - k}!} = ${C}$.`
            };
        },
        () => {
            const n = randInt(5, 12);
            const half = Math.floor(n / 2);
            const mx = nbin(n, half);
            return {
                topic: TOPIC.coefCompute,
                questionText: `What is the largest entry in row $n = ${n}$ of Pascal's triangle?`,
                mathText: '',
                ...numOpts(mx, [nbin(n, half - 1), nbin(n + 1, half), Math.pow(2, n), Math.pow(2, n - 1), nbin(n, half - 2), n * (n - 1), mx + n]),
                explanation: `Row entries increase up to the middle then decrease (unimodality), so the maximum is $\\binom{${n}}{\\lfloor ${n}/2\\rfloor} = \\binom{${n}}{${half}} = ${mx}$.${n % 2 ? ` For odd $n$ the two middle entries $\\binom{${n}}{${half}}$ and $\\binom{${n}}{${half + 1}}$ tie.` : ''}`
            };
        },
        () => {
            const n = randInt(7, 15), k = randInt(2, 5);
            const prev = nbin(n, k - 1), C = nbin(n, k);
            return {
                topic: TOPIC.coefCompute,
                questionText: `Given $\\binom{${n}}{${k - 1}} = ${prev}$, use the multiplicative recursion to find $\\binom{${n}}{${k}}$.`,
                mathText: '\\binom{n}{k} = \\binom{n}{k-1}\\cdot\\frac{n-k+1}{k}',
                ...numOpts(C, [Math.round(prev * (n - k) / k), Math.round(prev * (n - k + 1) / (k - 1)), Math.round(prev * (n - k + 2) / k), prev * (n - k + 1), Math.round(prev * k / (n - k + 1)), prev + n]),
                explanation: `$$\\binom{${n}}{${k}} = ${prev}\\cdot\\frac{${n} - ${k} + 1}{${k}} = ${prev}\\cdot\\frac{${n - k + 1}}{${k}} = ${C}.$$ The factor is $\\frac{n-k+1}{k}$: the new numerator factor over the new denominator factor.`
            };
        },
        () => {
            const n = randInt(4, 9);
            const row = Array.from({ length: n + 1 }, (_, k) => nbin(n, k));
            const correct = row.join(',\\;');
            const wrong1 = Array.from({ length: n + 1 }, (_, k) => nbin(n - 1, k)).join(',\\;');
            const wrong2 = Array.from({ length: n + 2 }, (_, k) => nbin(n + 1, k)).join(',\\;');
            const wrong3 = row.map((v, i) => (i === Math.floor(n / 2) ? v + 1 : v)).join(',\\;');
            const wrong4 = row.slice(0, n).join(',\\;');
            return {
                topic: TOPIC.coefCompute,
                questionText: `Which list is row $${n}$ of Pascal's triangle, $\\binom{${n}}{0}, \\dots, \\binom{${n}}{${n}}$?`,
                mathText: '',
                ...makeOptions(correct, [wrong1, wrong2, wrong3, wrong4]),
                explanation: `Row $n$ has $n+1 = ${n + 1}$ entries, starts and ends with $1$, is symmetric and sums to $2^{${n}} = ${Math.pow(2, n)}$. The row is $${correct}$.`
            };
        }
    ],

    /* ---------------- coefIdentity ---------------- */
    coefIdentity: [
        () => {
            const n = randInt(6, 14), k = randInt(2, n - 2);
            const a = nbin(n - 1, k - 1), b = nbin(n - 1, k), C = nbin(n, k);
            return {
                topic: TOPIC.coefIdentity,
                questionText: `Given $\\binom{${n - 1}}{${k - 1}} = ${a}$ and $\\binom{${n - 1}}{${k}} = ${b}$, what is $\\binom{${n}}{${k}}$?`,
                mathText: '',
                ...numOpts(C, [a * b, Math.abs(a - b), C + 1, nbin(n, k + 1), 2 * a, 2 * b, a + b + 1]),
                explanation: `Pascal's rule: $\\binom{${n}}{${k}} = \\binom{${n - 1}}{${k - 1}} + \\binom{${n - 1}}{${k}} = ${a} + ${b} = ${C}$. Combinatorially, a $${k}$-subset of $\\{1,\\dots,${n}\\}$ either contains $${n}$ or does not.`
            };
        },
        () => {
            const k = randInt(1, 3), n = randInt(k + 3, k + 8);
            const terms = []; let s = 0;
            for (let j = k; j <= n; j++) { terms.push(`\\binom{${j}}{${k}}`); s += nbin(j, k); }
            const C = nbin(n + 1, k + 1);
            return {
                topic: TOPIC.coefIdentity,
                questionText: 'Evaluate the sum using the hockey-stick identity.',
                mathText: terms.join(' + '),
                ...numOpts(C, [nbin(n, k + 1), nbin(n + 1, k), nbin(n, k), nbin(n + 1, k + 2), C + 1, nbin(n + 2, k + 1), C - 1]),
                explanation: `$$\\sum_{j=${k}}^{${n}}\\binom{j}{${k}} = \\binom{${n + 1}}{${k + 1}} = ${C}.$$ Check by adding: ${Array.from({ length: n - k + 1 }, (_, i) => nbin(k + i, k)).join(' + ')} $= ${s}$. The sum of a diagonal ends one row below and one column right.`
            };
        },
        () => {
            const n = randInt(8, 20), k = randInt(1, Math.floor(n / 2) - 1);
            const correct = `\\binom{${n}}{${n - k}}`;
            return {
                topic: TOPIC.coefIdentity,
                questionText: `Which expression is always equal to $\\binom{${n}}{${k}}$?`,
                mathText: '',
                ...makeOptions(correct, [`\\binom{${n - k}}{${k}}`, `\\binom{${n}}{${k + 1}}`, `\\binom{${n - 1}}{${k}}`, `\\binom{${k}}{${n}}`, `\\binom{${n + 1}}{${k}}`]),
                explanation: `Symmetry: choosing the $${k}$ elements to keep is the same as choosing the $${n - k}$ to leave out, so $\\binom{${n}}{${k}} = \\binom{${n}}{${n - k}} = ${nbin(n, k)}$.`
            };
        },
        () => {
            const n = randInt(6, 12), k = randInt(2, n - 2);
            const C = nbin(n, k), L = k * C, R = n * nbin(n - 1, k - 1);
            const correct = `n\\binom{n-1}{k-1}`;
            return {
                topic: TOPIC.coefIdentity,
                questionText: `The absorption identity says $k\\binom{n}{k}$ equals which expression? (Check: $n=${n}$, $k=${k}$ gives $${L}$.)`,
                mathText: '',
                ...makeOptions(correct, ['n\\binom{n}{k-1}', '(n-k)\\binom{n-1}{k}', 'k\\binom{n-1}{k-1}', 'n\\binom{n-1}{k}', '\\binom{n}{k-1}']),
                explanation: `Count (committee of $k$, chair) pairs two ways: $\\binom nk\\cdot k$ or $n\\cdot\\binom{n-1}{k-1}$. Here $${k}\\cdot${C} = ${L}$ and $${n}\\cdot\\binom{${n - 1}}{${k - 1}} = ${n}\\cdot${nbin(n - 1, k - 1)} = ${R}$. ✓`
            };
        },
        () => {
            const n = randInt(5, 10);
            const stories = [
                { s: `A $k$-subset of $\\{1,\\dots,${n}\\}$ either contains the element $${n}$ or it does not.`, id: "Pascal's rule", f: '\\binom{n}{k} = \\binom{n-1}{k-1}+\\binom{n-1}{k}' },
                { s: `Choosing which $k$ of $${n}$ people join the committee is the same as choosing which $${n}-k$ stay out.`, id: 'Symmetry', f: '\\binom{n}{k} = \\binom{n}{n-k}' },
                { s: `Classify the $(k+1)$-subsets of $\\{1,\\dots,${n + 1}\\}$ by their largest element.`, id: 'Hockey stick', f: '\\sum_{j=k}^{n}\\binom{j}{k} = \\binom{n+1}{k+1}' },
                { s: `Pick a committee of $k$ from $${n}$ people and then its chair, or pick the chair first and then the other $k-1$ members.`, id: 'Absorption', f: 'k\\binom{n}{k} = n\\binom{n-1}{k-1}' },
                { s: `Every subset of $\\{1,\\dots,${n}\\}$ has some size $k$ between $0$ and $${n}$.`, id: 'Row sum', f: '\\sum_{k}\\binom{n}{k} = 2^n' }
            ];
            const pick = pickRandom(stories);
            const others = stories.filter(x => x.id !== pick.id).map(x => x.id);
            return {
                topic: TOPIC.coefIdentity,
                questionText: `Which identity does this counting argument prove?<br><br><em>${pick.s}</em>`,
                mathText: '',
                ...makeOptions(pick.id, shuffleArray(others)),
                isTextOptions: true,
                explanation: `This is the standard proof of <strong>${pick.id}</strong>: $$${pick.f}.$$ Both sides count the same set, sorted in two different ways.`
            };
        }
    ],

    /* ---------------- expandTerm ---------------- */
    expandTerm: [
        () => {
            const n = randInt(4, 8), k = randInt(1, n - 1);
            const C = nbin(n, k);
            const correct = `${C}x^{${n - k}}y^{${k}}`;
            return {
                topic: TOPIC.expandTerm,
                questionText: `In the expansion of $(x+y)^{${n}}$, which is the term containing $y^{${k}}$?`,
                mathText: '',
                ...makeOptions(correct, [`${nbin(n, k - 1)}x^{${n - k}}y^{${k}}`, `${C}x^{${k}}y^{${k}}`, `${nbin(n, k + 1)}x^{${n - k}}y^{${k}}`, `${C}x^{${n - k}}y^{${k + 1}}`, `${n * k}x^{${n - k}}y^{${k}}`, `${C * k}x^{${n - k}}y^{${k}}`]),
                explanation: `General term $\\binom{${n}}{k}x^{${n}-k}y^{k}$ with $k = ${k}$: $\\binom{${n}}{${k}} = ${C}$, so the term is $${C}x^{${n - k}}y^{${k}}$. The exponents must add to $${n}$.`
            };
        },
        () => {
            const n = randInt(4, 7), a = randInt(2, 3), b = pickRandom([1, 2, -1, -2, 3, -3]);
            const k = randInt(1, n - 1);
            const coef = nbin(n, k) * Math.pow(a, n - k) * Math.pow(b, k);
            const inner = `${a}x${b < 0 ? '-' : '+'}${Math.abs(b) === 1 ? '' : Math.abs(b)}y`;
            return {
                topic: TOPIC.expandTerm,
                questionText: `Find the coefficient of $x^{${n - k}}y^{${k}}$ in $(${inner})^{${n}}$.`,
                mathText: '',
                ...numOpts(coef, [nbin(n, k) * Math.pow(a, k) * Math.pow(b, n - k), -coef, nbin(n, k), nbin(n, k) * Math.pow(a, n - k), nbin(n, k) * Math.pow(b, k), nbin(n, k - 1) * Math.pow(a, n - k) * Math.pow(b, k), coef * 2]),
                explanation: `Term: $\\binom{${n}}{${k}}(${a}x)^{${n - k}}(${b}y)^{${k}} = ${nbin(n, k)}\\cdot ${a}^{${n - k}}\\cdot(${b})^{${k}}\\,x^{${n - k}}y^{${k}}$. Coefficient: $${nbin(n, k)}\\cdot${Math.pow(a, n - k)}\\cdot${Math.pow(b, k)} = ${coef}$.${b < 0 ? ` The sign is $(-1)^{${k}}$.` : ''} Trap: the scalar $${a}$ goes with the exponent of $x$, not of $y$.`
            };
        },
        () => {
            const n = randInt(5, 9), r = randInt(2, n);
            const k = r - 1;
            const correct = `\\binom{${n}}{${k}}x^{${n - k}}y^{${k}}`;
            return {
                topic: TOPIC.expandTerm,
                questionText: `Writing $(x+y)^{${n}}$ in decreasing powers of $x$, what is the ${r}${r === 2 ? 'nd' : r === 3 ? 'rd' : 'th'} term?`,
                mathText: '',
                ...makeOptions(correct, [`\\binom{${n}}{${r}}x^{${n - r}}y^{${r}}`, `\\binom{${n}}{${k}}x^{${k}}y^{${n - k}}`, `\\binom{${n}}{${r}}x^{${n - k}}y^{${k}}`, `\\binom{${n}}{${k}}x^{${n - k}}y^{${r}}`, `\\binom{${n}}{${k - 1 < 0 ? 0 : k - 1}}x^{${n - k}}y^{${k}}`]),
                explanation: `The terms are indexed from $k = 0$, so the $${r}$-th term has $k = ${r} - 1 = ${k}$: $T_{${r}} = \\binom{${n}}{${k}}x^{${n - k}}y^{${k}} = ${nbin(n, k)}x^{${n - k}}y^{${k}}$. Off-by-one is the classic slip here.`
            };
        },
        () => {
            const n = randInt(4, 7), b = randInt(1, 3);
            const terms = [];
            for (let k = 0; k <= n; k++) terms.push(termLatex(nbin(n, k) * Math.pow(-b, k), 'x', n - k, '', 0, k === 0));
            const correct = terms.join('');
            const wrongAllPlus = Array.from({ length: n + 1 }, (_, k) => termLatex(nbin(n, k) * Math.pow(b, k), 'x', n - k, '', 0, k === 0)).join('');
            const wrongSign = Array.from({ length: n + 1 }, (_, k) => termLatex(-nbin(n, k) * Math.pow(-b, k), 'x', n - k, '', 0, k === 0)).join('');
            const wrongPow = Array.from({ length: n + 1 }, (_, k) => termLatex(nbin(n, k) * Math.pow(-1, k) * b, 'x', n - k, '', 0, k === 0)).join('');
            const wrongCoef = Array.from({ length: n + 1 }, (_, k) => termLatex(nbin(n - 1, Math.min(k, n - 1)) * Math.pow(-b, k), 'x', n - k, '', 0, k === 0)).join('');
            return {
                topic: TOPIC.expandTerm,
                questionText: `Expand $(x - ${b === 1 ? '' : b})^{${n}}$.`.replace('(x - )', '(x - 1)'),
                mathText: '',
                ...makeOptions(correct, [wrongAllPlus, wrongSign, wrongPow, wrongCoef]),
                explanation: `$(x-${b})^{${n}} = \\sum_k \\binom{${n}}{k}x^{${n}-k}(-${b})^k$, so the signs alternate starting with $+$ and the $k$-th coefficient is $\\binom{${n}}{k}\\cdot${b}^k$ with sign $(-1)^k$: $$${correct}.$$ Check at $x = 1$: the coefficients sum to $(1-${b})^{${n}} = ${Math.pow(1 - b, n)}$.`
            };
        },
        () => {
            const n = randInt(3, 6), a = randInt(2, 4);
            const sum = Math.pow(a + 1, n);
            return {
                topic: TOPIC.expandTerm,
                questionText: `What is the sum of all the coefficients in the expansion of $(${a}x + 1)^{${n}}$?`,
                mathText: '',
                ...numOpts(sum, [Math.pow(2, n), Math.pow(a, n), Math.pow(a, n) + 1, Math.pow(a + 1, n - 1), n * (a + 1), Math.pow(a - 1, n) + 2, sum + 1]),
                explanation: `Substitute $x = 1$: the coefficient sum is $(${a}\\cdot 1 + 1)^{${n}} = ${a + 1}^{${n}} = ${sum}$. Substituting $1$ for every variable always returns the sum of coefficients.`
            };
        }
    ],

    /* ---------------- expandSpecific ---------------- */
    expandSpecific: [
        () => {
            const p = randInt(1, 3), q = randInt(1, 3);
            const n = (p + q) * randInt(1, 3); // ensure constant term exists
            const k = n * p / (p + q); // x^{p(n-k)} x^{-qk} = 0 → k = pn/(p+q)
            const C = nbin(n, k);
            return {
                topic: TOPIC.expandSpecific,
                questionText: `Find the constant term (the term independent of $x$) in $\\left(x^{${p}} + \\dfrac{1}{x^{${q}}}\\right)^{${n}}$.`,
                mathText: '',
                ...numOpts(C, [nbin(n, k - 1), nbin(n, k + 1), nbin(n, Math.floor(n / 2)), nbin(n, Math.floor(n / 2) - 1), Math.pow(2, n), n, C * 2, 0]),
                explanation: `General term: $\\binom{${n}}{k}(x^{${p}})^{${n}-k}(x^{-${q}})^{k} = \\binom{${n}}{k}x^{${p * n} - ${p + q}k}$. Set the exponent to $0$: $k = ${p * n}/${p + q} = ${k}$. Constant term $= \\binom{${n}}{${k}} = ${C}$.`
            };
        },
        () => {
            const n = randInt(5, 8);
            const target = randInt(0, 2 * n);
            // (x^2 + 1)^n: term k has x^{2k}; coefficient of x^target
            const exists = target % 2 === 0;
            const k = target / 2;
            const coef = exists ? nbin(n, k) : 0;
            return {
                topic: TOPIC.expandSpecific,
                questionText: `What is the coefficient of $x^{${target}}$ in $(x^2 + 1)^{${n}}$?`,
                mathText: '',
                ...numOpts(coef, exists ? [nbin(n, k - 1), nbin(n, k + 1), nbin(n, target), 0, nbin(2 * n, target), coef * 2] : [nbin(n, Math.floor(target / 2)), nbin(n, Math.ceil(target / 2)), nbin(n, target > n ? n : target), 1, nbin(2 * n, target)]),
                explanation: exists
                    ? `General term $\\binom{${n}}{k}(x^2)^k = \\binom{${n}}{k}x^{2k}$. For $x^{${target}}$ we need $2k = ${target}$, $k = ${k}$, giving $\\binom{${n}}{${k}} = ${coef}$.`
                    : `Every term is $\\binom{${n}}{k}x^{2k}$, an <em>even</em> power of $x$. There is no $k$ with $2k = ${target}$, so the coefficient is $0$.`
            };
        },
        () => {
            const n = randInt(4, 7), m = randInt(1, n);
            // (1+x)^n (1+x) = coefficient of x^m in (1+x)^{n+1}? Instead: coefficient of x^m in (1+x)^n + (1+x)^{n+1}
            const coef = nbin(n, m) + nbin(n + 1, m);
            return {
                topic: TOPIC.expandSpecific,
                questionText: `Find the coefficient of $x^{${m}}$ in $(1+x)^{${n}} + (1+x)^{${n + 1}}$.`,
                mathText: '',
                ...numOpts(coef, [nbin(n, m) * nbin(n + 1, m), nbin(2 * n + 1, m), nbin(n + 1, m), nbin(n, m), nbin(n + 2, m), coef + 1, nbin(n, m) + nbin(n, m - 1)]),
                explanation: `Coefficients add across a sum: $\\binom{${n}}{${m}} + \\binom{${n + 1}}{${m}} = ${nbin(n, m)} + ${nbin(n + 1, m)} = ${coef}$. (For a <em>product</em> you would convolve the coefficients instead.)`
            };
        },
        () => {
            const n = randInt(4, 6), a = randInt(2, 3);
            const k = randInt(1, n - 1);
            const coef = nbin(n, k) * Math.pow(a, k);
            return {
                topic: TOPIC.expandSpecific,
                questionText: `Find the coefficient of $x^{${k}}$ in $(1 + ${a}x)^{${n}}$.`,
                mathText: '',
                ...numOpts(coef, [nbin(n, k) * Math.pow(a, n - k), nbin(n, k), nbin(n, k) * a, Math.pow(a, k), nbin(n, k - 1) * Math.pow(a, k), coef / a, coef * a]),
                explanation: `$(1+${a}x)^{${n}} = \\sum_k\\binom{${n}}{k}(${a}x)^k$, so the coefficient of $x^{${k}}$ is $\\binom{${n}}{${k}}\\cdot${a}^{${k}} = ${nbin(n, k)}\\cdot${Math.pow(a, k)} = ${coef}$. The scalar is raised to the exponent of its own variable.`
            };
        },
        () => {
            const n = randInt(3, 6);
            const a = randInt(1, 3);
            // coefficient of x^{n} in (x + a)^n (x + 1)^? -- keep simpler: middle term of (x + a/x)^{2m}
            const m = randInt(2, 4);
            const N = 2 * m;
            const coef = nbin(N, m) * Math.pow(a, m);
            return {
                topic: TOPIC.expandSpecific,
                questionText: `Find the constant term of $\\left(x + \\dfrac{${a}}{x}\\right)^{${N}}$.`,
                mathText: '',
                ...numOpts(coef, [nbin(N, m), nbin(N, m) * Math.pow(a, N), Math.pow(a, m), nbin(N, m - 1) * Math.pow(a, m), nbin(N, m) * a, coef * 2, Math.pow(2, N)]),
                explanation: `General term $\\binom{${N}}{k}x^{${N}-k}\\left(\\frac{${a}}{x}\\right)^k = \\binom{${N}}{k}${a}^k x^{${N}-2k}$. Exponent $0$ forces $k = ${m}$: $\\binom{${N}}{${m}}\\cdot${a}^{${m}} = ${nbin(N, m)}\\cdot${Math.pow(a, m)} = ${coef}$.`
            };
        }
    ],

    /* ---------------- sumIdentities ---------------- */
    sumIdentities: [
        () => {
            const n = randInt(4, 12);
            const v = Math.pow(2, n);
            return {
                topic: TOPIC.sumIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}}\\binom{${n}}{k}$.`,
                mathText: '',
                ...numOpts(v, [Math.pow(2, n - 1), Math.pow(2, n + 1), n * n, nbin(2 * n, n), Math.pow(3, n), 0, n * (n + 1)]),
                explanation: `Put $x = y = 1$ in $(x+y)^{${n}}$: $\\sum_k\\binom{${n}}{k} = 2^{${n}} = ${v}$. Equivalently, an $${n}$-set has $2^{${n}}$ subsets.`
            };
        },
        () => {
            const n = randInt(3, 12);
            return {
                topic: TOPIC.sumIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}}(-1)^k\\binom{${n}}{k}$.`,
                mathText: '',
                ...numOpts(0, [1, -1, Math.pow(2, n - 1), Math.pow(2, n), -Math.pow(2, n - 1), n]),
                explanation: `Put $x = 1$, $y = -1$: $(1-1)^{${n}} = 0$. For $n \\ge 1$ the alternating sum of a row of Pascal's triangle is $0$ (only $n = 0$ gives $1$). Equivalently, an $${n}$-set has as many even-sized as odd-sized subsets.`
            };
        },
        () => {
            const n = randInt(3, 10);
            const v = Math.pow(2, n - 1);
            const parity = pickRandom(['even', 'odd']);
            return {
                topic: TOPIC.sumIdentities,
                questionText: `How many subsets of a $${n}$-element set have ${parity} size? (Count $\\emptyset$ as size $0$, which is even.)`,
                mathText: `\\sum_{k \\text{ ${parity}}}\\binom{${n}}{k}`,
                ...numOpts(v, [Math.pow(2, n), Math.pow(2, n - 2), Math.pow(2, n) - 1, nbin(n, Math.floor(n / 2)), Math.pow(2, n - 1) + 1, n * n]),
                explanation: `Adding the row sum $2^{${n}}$ and the alternating sum $0$ gives $2\\sum_{\\text{even}} = 2^{${n}}$, so both the even and the odd subsets number $2^{${n - 1}} = ${v}$. Bijection: toggle a fixed element in or out.`
            };
        },
        () => {
            const n = randInt(3, 8), c = pickRandom([2, 3, -2, 4]);
            const v = Math.pow(1 + c, n);
            return {
                topic: TOPIC.sumIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}}\\binom{${n}}{k}\\,(${c})^{k}$.`,
                mathText: '',
                ...numOpts(v, [Math.pow(c, n), Math.pow(2, n) * c, Math.pow(1 + c, n - 1), Math.pow(c, n) + 1, Math.pow(2, n), Math.pow(1 - c, n), v * 2]),
                explanation: `This is $(1+x)^{${n}}$ at $x = ${c}$: $(1 + (${c}))^{${n}} = ${1 + c}^{${n}} = ${v}$. Reading a sum as "binomial theorem with something substituted" is the whole trick.`
            };
        },
        () => {
            const n = randInt(3, 8);
            const v = Math.pow(3, n);
            const correct = 'x = 2';
            return {
                topic: TOPIC.sumIdentities,
                questionText: `To prove $\\displaystyle\\sum_{k=0}^{${n}}\\binom{${n}}{k}2^k = ${v}$, which value should be substituted into $(1+x)^{${n}} = \\sum_k\\binom{${n}}{k}x^k$?`,
                mathText: '',
                ...makeOptions(correct, ['x = 3', 'x = 1', 'x = -2', 'x = 1/2']),
                isTextOptions: true,
                explanation: `The summand $\\binom{${n}}{k}x^k$ matches $\\binom{${n}}{k}2^k$ when $x = 2$, and then $(1+2)^{${n}} = 3^{${n}} = ${v}$. Trap: the base $3$ on the right is $1 + 2$, not the value substituted.`
            };
        },
        () => {
            const n = randInt(3, 8);
            const items = [
                { s: `\\sum_{k=0}^{${n}}\\binom{${n}}{k}`, v: Math.pow(2, n), how: `$x = 1$ in $(1+x)^{${n}}$` },
                { s: `\\sum_{k=0}^{${n}}(-1)^k\\binom{${n}}{k}`, v: 0, how: `$x = -1$ in $(1+x)^{${n}}$` },
                { s: `\\sum_{k=0}^{${n}}\\binom{${n}}{k}3^k`, v: Math.pow(4, n), how: `$x = 3$ in $(1+x)^{${n}}$` },
                { s: `\\sum_{k=0}^{${n}}\\binom{${n}}{k}2^{${n}-k}`, v: Math.pow(3, n), how: `$x = 2$, $y = 1$ in $(x+y)^{${n}}$` }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.sumIdentities,
                questionText: 'Evaluate:',
                mathText: it.s,
                ...numOpts(it.v, items.filter(x => x.v !== it.v).map(x => x.v).concat([Math.pow(2, n - 1), n, Math.pow(2, n + 1), Math.pow(3, n - 1)])),
                explanation: `Substitute ${it.how}: the value is $${it.v}$.`
            };
        }
    ],

    /* ---------------- calcIdentities ---------------- */
    calcIdentities: [
        () => {
            const n = randInt(3, 10);
            const v = n * Math.pow(2, n - 1);
            return {
                topic: TOPIC.calcIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}} k\\binom{${n}}{k}$.`,
                mathText: '',
                ...numOpts(v, [Math.pow(2, n), n * Math.pow(2, n), (n - 1) * Math.pow(2, n - 1), n * Math.pow(2, n - 2), Math.pow(2, n - 1), n * n, v + n]),
                explanation: `Differentiate $(1+x)^{${n}} = \\sum_k\\binom{${n}}{k}x^k$ to get $${n}(1+x)^{${n - 1}} = \\sum_k k\\binom{${n}}{k}x^{k-1}$; put $x = 1$: $${n}\\cdot 2^{${n - 1}} = ${v}$. Counting: choose a chair ($${n}$ ways) then any subset of the rest ($2^{${n - 1}}$).`
            };
        },
        () => {
            const n = randInt(4, 10);
            const v = n * (n - 1) * Math.pow(2, n - 2);
            return {
                topic: TOPIC.calcIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}} k(k-1)\\binom{${n}}{k}$.`,
                mathText: '',
                ...numOpts(v, [n * Math.pow(2, n - 1), n * n * Math.pow(2, n - 2), n * (n - 1) * Math.pow(2, n - 1), n * (n + 1) * Math.pow(2, n - 2), Math.pow(2, n), n * (n - 1), v / 2]),
                explanation: `Differentiate twice: $${n}\\cdot${n - 1}(1+x)^{${n - 2}} = \\sum_k k(k-1)\\binom{${n}}{k}x^{k-2}$; put $x = 1$: $${n}\\cdot${n - 1}\\cdot 2^{${n - 2}} = ${v}$. Counting: choose an ordered pair (chair, vice-chair) then any subset of the remaining $${n - 2}$.`
            };
        },
        () => {
            const n = randInt(3, 8);
            const num = Math.pow(2, n + 1) - 1, den = n + 1;
            const correct = fracLatex(num, den);
            return {
                topic: TOPIC.calcIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}} \\frac{1}{k+1}\\binom{${n}}{k}$.`,
                mathText: '',
                ...makeOptions(correct, [fracLatex(Math.pow(2, n) - 1, n + 1), fracLatex(Math.pow(2, n + 1), n + 1), fracLatex(Math.pow(2, n), n), fracLatex(Math.pow(2, n + 1) - 1, n), fracLatex(Math.pow(2, n - 1), n + 1)]),
                explanation: `Integrate $(1+x)^{${n}} = \\sum_k\\binom{${n}}{k}x^k$ from $0$ to $1$: $\\left[\\frac{(1+x)^{${n + 1}}}{${n + 1}}\\right]_0^1 = \\frac{2^{${n + 1}} - 1}{${n + 1}}$ on the left, $\\sum_k\\frac{1}{k+1}\\binom{${n}}{k}$ on the right. Value: $${correct}$.`
            };
        },
        () => {
            const m = randInt(3, 6), n = randInt(3, 6), r = randInt(2, Math.min(m, n));
            const v = nbin(m + n, r);
            const terms = []; for (let k = 0; k <= r; k++) terms.push(`\\binom{${m}}{${k}}\\binom{${n}}{${r - k}}`);
            return {
                topic: TOPIC.calcIdentities,
                questionText: 'Evaluate using Vandermonde\'s identity:',
                mathText: terms.join(' + '),
                ...numOpts(v, [nbin(m, r) * nbin(n, r), nbin(m + n, r - 1), nbin(m, r) + nbin(n, r), nbin(m + n, r + 1), nbin(m * n, r), v + 1, nbin(m + n - 1, r)]),
                explanation: `$\\sum_k\\binom{${m}}{k}\\binom{${n}}{${r}-k} = \\binom{${m + n}}{${r}} = ${v}$: compare the coefficient of $x^{${r}}$ in $(1+x)^{${m}}(1+x)^{${n}} = (1+x)^{${m + n}}$. Counting: choose $${r}$ people from $${m}$ women and $${n}$ men, classified by the number of women.`
            };
        },
        () => {
            const n = randInt(3, 7);
            const v = nbin(2 * n, n);
            return {
                topic: TOPIC.calcIdentities,
                questionText: `Evaluate $\\displaystyle\\sum_{k=0}^{${n}}\\binom{${n}}{k}^2$.`,
                mathText: '',
                ...numOpts(v, [Math.pow(2, 2 * n), Math.pow(2, n) * Math.pow(2, n) / 2, nbin(2 * n, n - 1), nbin(n, Math.floor(n / 2)) * nbin(n, Math.floor(n / 2)), Math.pow(4, n - 1), v + 2, nbin(2 * n + 1, n)]),
                explanation: `Write $\\binom{${n}}{k}^2 = \\binom{${n}}{k}\\binom{${n}}{${n}-k}$ and apply Vandermonde with $m = n = r = ${n}$: the sum is $\\binom{${2 * n}}{${n}} = ${v}$. Check: ${Array.from({ length: n + 1 }, (_, k) => nbin(n, k) * nbin(n, k)).join(' + ')} $= ${v}$.`
            };
        },
        () => {
            const items = [
                { goal: '\\sum_k k\\binom{n}{k}', tool: 'Differentiate $(1+x)^n$ once, then put $x = 1$' },
                { goal: '\\sum_k \\frac{1}{k+1}\\binom{n}{k}', tool: 'Integrate $(1+x)^n$ from $0$ to $1$' },
                { goal: '\\sum_k \\binom{m}{k}\\binom{n}{r-k}', tool: 'Compare coefficients of $x^r$ in $(1+x)^m(1+x)^n$' },
                { goal: '\\sum_k (-1)^k\\binom{n}{k}', tool: 'Put $x = -1$ in $(1+x)^n$' },
                { goal: '\\sum_k k(k-1)\\binom{n}{k}', tool: 'Differentiate $(1+x)^n$ twice, then put $x = 1$' }
            ];
            const it = pickRandom(items);
            return {
                topic: TOPIC.calcIdentities,
                questionText: 'Which manipulation of $(1+x)^n = \\sum_k \\binom nk x^k$ evaluates this sum?',
                mathText: it.goal,
                ...makeOptions(it.tool, shuffleArray(items.filter(x => x.tool !== it.tool).map(x => x.tool)).slice(0, 3)),
                isTextOptions: true,
                explanation: `Match the summand to what the operation produces: a factor $k$ comes from one derivative, $k(k-1)$ from two, $\\frac{1}{k+1}$ from integrating, a product of two binomials from multiplying two expansions, and a power $c^k$ from substituting $x = c$. Here: <strong>${it.tool}</strong>.`
            };
        }
    ],

    /* ---------------- multiCoef ---------------- */
    multiCoef: [
        () => {
            const parts = [randInt(1, 3), randInt(1, 3), randInt(1, 3)];
            const n = parts.reduce((a, b) => a + b, 0);
            const v = nmult(parts);
            return {
                topic: TOPIC.multiCoef,
                questionText: `Compute the multinomial coefficient $\\dbinom{${n}}{${parts.join(',')}}$.`,
                mathText: '',
                ...numOpts(v, [nfact(n), nfact(n) / nfact(parts[0]), nbin(n, parts[0]) * nbin(n, parts[1]), nbin(n, parts[0]), v * parts[0], nfact(n) / (parts[0] * parts[1] * parts[2]), v + n, v * 2, v + 1, Math.pow(3, n), n * n]),
                explanation: `$$\\binom{${n}}{${parts.join(',')}} = \\frac{${n}!}{${parts.map(p => p + '!').join('\\,')}} = \\frac{${nfact(n)}}{${parts.map(p => nfact(p)).join('\\cdot')}} = ${v}.$$ As a product of binomials: $\\binom{${n}}{${parts[0]}}\\binom{${n - parts[0]}}{${parts[1]}}\\binom{${parts[2]}}{${parts[2]}} = ${nbin(n, parts[0])}\\cdot${nbin(n - parts[0], parts[1])}\\cdot 1 = ${v}$.`
            };
        },
        () => {
            const words = ['BANANA', 'LETTER', 'SUCCESS', 'BOOKKEEPER', 'ASSESS', 'PEPPER', 'COFFEE', 'BALLOON', 'MISSISSIPPI', 'TENNESSEE', 'ALGEBRA', 'COMMITTEE'];
            const w = pickRandom(words);
            const counts = {}; for (const ch of w) counts[ch] = (counts[ch] || 0) + 1;
            const parts = Object.values(counts);
            const v = nmult(parts);
            const n = w.length;
            const denomStr = Object.entries(counts).filter(([, c]) => c > 1).map(([ch, c]) => `${c}!`).join('\\,') || '1';
            return {
                topic: TOPIC.multiCoef,
                questionText: `How many distinct strings can be formed by rearranging all the letters of <strong>${w}</strong>?`,
                mathText: '',
                ...bigOpts(bigMultinom(parts), [bigFact(n), bigMultinom(parts) * BigInt(Math.max(...parts)), bigFact(n) / bigFact(Math.max(...parts)), bigMultinom(parts) * 2n, bigFact(n - 1), bigMultinom(parts) + BigInt(n)]),
                explanation: `Letter counts: ${Object.entries(counts).map(([ch, c]) => `${ch}×${c}`).join(', ')}. Arrangements $= \\dfrac{${n}!}{${denomStr}} = ${B(bigMultinom(parts))}$. Each block of identical letters can be permuted $n_i!$ ways without changing the string, so divide by every $n_i!$.`
            };
        },
        () => {
            const n = randInt(4, 8), m = randInt(3, 4);
            const v = nbin(n + m - 1, m - 1);
            return {
                topic: TOPIC.multiCoef,
                questionText: `How many distinct terms are there in the expansion of $(x_1 + x_2 + \\cdots + x_{${m}})^{${n}}$?`,
                mathText: '',
                ...numOpts(v, [Math.pow(m, n), nbin(n + m, m), nbin(n, m - 1), nbin(n + m - 1, m), n + 1, m * n, nbin(n + m - 2, m - 1)]),
                explanation: `Terms correspond to exponent vectors $(n_1,\\dots,n_{${m}})$ with $n_i \\ge 0$ and sum $${n}$. Stars and bars: $\\binom{${n} + ${m} - 1}{${m} - 1} = \\binom{${n + m - 1}}{${m - 1}} = ${v}$. Trap: $${m}^{${n}} = ${Math.pow(m, n)}$ is the sum of the coefficients, not the number of terms.`
            };
        },
        () => {
            const parts = [randInt(1, 3), randInt(1, 3), randInt(1, 2), randInt(1, 2)];
            const n = parts.reduce((a, b) => a + b, 0);
            const correct = `\\binom{${n}}{${parts[0]}}\\binom{${n - parts[0]}}{${parts[1]}}\\binom{${n - parts[0] - parts[1]}}{${parts[2]}}`;
            return {
                topic: TOPIC.multiCoef,
                questionText: `Which product of binomial coefficients equals $\\dbinom{${n}}{${parts.join(',')}}$?`,
                mathText: '',
                ...makeOptions(correct, [`\\binom{${n}}{${parts[0]}}\\binom{${n}}{${parts[1]}}\\binom{${n}}{${parts[2]}}`, `\\binom{${n}}{${parts[0]}}\\binom{${n - parts[0]}}{${parts[1]}}\\binom{${n - parts[0]}}{${parts[2]}}`, `\\binom{${n}}{${parts[0]}}+\\binom{${n - parts[0]}}{${parts[1]}}+\\binom{${n - parts[0] - parts[1]}}{${parts[2]}}`, `\\binom{${n - 1}}{${parts[0]}}\\binom{${n - parts[0]}}{${parts[1]}}\\binom{${n - parts[0] - parts[1]}}{${parts[2]}}`]),
                explanation: `Fill the blocks in turn: $${parts[0]}$ of the $${n}$ positions, then $${parts[1]}$ of the remaining $${n - parts[0]}$, then $${parts[2]}$ of the remaining $${n - parts[0] - parts[1]}$; the last block is forced. The product telescopes to $\\frac{${n}!}{${parts.map(p => p + '!').join('\\,')}} = ${nmult(parts)}$.`
            };
        },
        () => {
            const n = randInt(6, 9);
            const m = 3;
            const k = randInt(2, 3);
            const rest = n - 2 * k;
            const valid = rest >= 0;
            const parts = valid ? [k, k, rest] : [k, k, 0];
            const nn = parts.reduce((a, b) => a + b, 0);
            const v = nmult(parts);
            return {
                topic: TOPIC.multiCoef,
                questionText: `$${nn}$ students are split into three labelled teams: Team A with $${parts[0]}$, Team B with $${parts[1]}$ and Team C with $${parts[2]}$ members. How many ways?`,
                mathText: '',
                ...numOpts(v, [v / 2, nbin(nn, parts[0]) * nbin(nn, parts[1]), nfact(nn), nbin(nn, parts[0]) + nbin(nn - parts[0], parts[1]), Math.pow(m, nn), v * 2, nbin(nn, parts[2])]),
                explanation: `Labelled blocks of sizes $${parts.join(',')}$: $\\binom{${nn}}{${parts.join(',')}} = \\frac{${nn}!}{${parts.map(p => p + '!').join('\\,')}} = ${v}$. (If the two equal-sized teams were <em>unlabelled</em> you would divide by $2$.)`
            };
        }
    ],

    /* ---------------- multiTheorem ---------------- */
    multiTheorem: [
        () => {
            const a = randInt(1, 3), b = randInt(1, 3), c = randInt(0, 2);
            const n = a + b + c;
            const v = nmult([a, b, c]);
            return {
                topic: TOPIC.multiTheorem,
                questionText: `What is the coefficient of $x^{${a}}y^{${b}}${c ? `z^{${c}}` : ''}$ in $(x+y+z)^{${n}}$?`,
                mathText: '',
                ...numOpts(v, [nbin(n, a), nbin(n, a) * nbin(n, b), nfact(n), v * 2, nbin(n, a) + nbin(n, b), v + 1, Math.pow(3, n)]),
                explanation: `Exponents $${a}+${b}+${c} = ${n}$ ✓, so the coefficient is $\\binom{${n}}{${a},${b},${c}} = \\frac{${n}!}{${a}!\\,${b}!\\,${c}!} = ${v}$.${c === 0 ? ' The factor $0! = 1$ for $z$ does nothing, but the term still lives in the trinomial expansion.' : ''}`
            };
        },
        () => {
            const a = randInt(1, 2), b = randInt(1, 2), c = randInt(1, 2);
            const n = a + b + c;
            const alpha = 1, beta = pickRandom([2, -1, 3]), gamma = pickRandom([-1, 2, -2]);
            const v = nmult([a, b, c]) * Math.pow(alpha, a) * Math.pow(beta, b) * Math.pow(gamma, c);
            const inner = `x ${beta < 0 ? '-' : '+'} ${Math.abs(beta) === 1 ? '' : Math.abs(beta)}y ${gamma < 0 ? '-' : '+'} ${Math.abs(gamma) === 1 ? '' : Math.abs(gamma)}z`;
            return {
                topic: TOPIC.multiTheorem,
                questionText: `Find the coefficient of $x^{${a}}y^{${b}}z^{${c}}$ in $(${inner})^{${n}}$.`,
                mathText: '',
                ...numOpts(v, [nmult([a, b, c]), -v, nmult([a, b, c]) * Math.pow(beta, b), nmult([a, b, c]) * Math.pow(beta, c) * Math.pow(gamma, b), v * 2, nmult([a, b, c]) * beta * gamma, Math.abs(v) + 1]),
                explanation: `Coefficient $= \\binom{${n}}{${a},${b},${c}}\\cdot 1^{${a}}\\cdot(${beta})^{${b}}\\cdot(${gamma})^{${c}} = ${nmult([a, b, c])}\\cdot${Math.pow(beta, b)}\\cdot${Math.pow(gamma, c)} = ${v}$. Each scalar is raised to the exponent of its own variable; the sign comes from the odd powers of negative scalars.`
            };
        },
        () => {
            const n = randInt(2, 6), m = randInt(3, 5);
            const v = Math.pow(m, n);
            return {
                topic: TOPIC.multiTheorem,
                questionText: `What is the sum of all the coefficients in the expansion of $(x_1 + \\cdots + x_{${m}})^{${n}}$?`,
                mathText: '\\sum_{n_1+\\cdots+n_m = n}\\binom{n}{n_1,\\dots,n_m} = \\;?',
                ...numOpts(v, [nbin(n + m - 1, m - 1), Math.pow(n, m), Math.pow(2, n), nfact(n), m * n, Math.pow(m, n - 1), v + 1]),
                explanation: `Put every $x_i = 1$: $(1+\\cdots+1)^{${n}} = ${m}^{${n}} = ${v}$. Counting: strings of length $${n}$ over $${m}$ letters, sorted by letter multiplicities.`
            };
        },
        () => {
            const a = randInt(1, 3), b = randInt(1, 3);
            const n = a + b + randInt(1, 3);
            const c = n - a - b;
            const v = nmult([a, b, c]);
            return {
                topic: TOPIC.multiTheorem,
                questionText: `Find the coefficient of $x^{${a}}y^{${b}}$ in $(x + y + 1)^{${n}}$.`,
                mathText: '',
                ...numOpts(v, [nbin(n, a) * nbin(n, b), nbin(n, a + b), nbin(a + b, a), v + 2, nfact(n) / (nfact(a) * nfact(b)), v * 2, nfact(n)]),
                explanation: `The constant $1$ takes the leftover exponent $${n} - ${a} - ${b} = ${c}$, so the coefficient is $\\binom{${n}}{${a},${b},${c}} = \\frac{${n}!}{${a}!\\,${b}!\\,${c}!} = ${v}$. Alternative: $[x^{${a}}y^{${b}}]\\big((x+y)+1\\big)^{${n}} = \\binom{${n}}{${a + b}}\\binom{${a + b}}{${a}} = ${nbin(n, a + b)}\\cdot${nbin(a + b, a)} = ${v}$.`
            };
        },
        () => {
            const n = randInt(2, 4);
            const a = randInt(0, n), b = randInt(0, n), c = randInt(0, n);
            const ok = a + b + c === n;
            const v = ok ? nmult([a, b, c]) : 0;
            return {
                topic: TOPIC.multiTheorem,
                questionText: `What is the coefficient of $x^{${a}}y^{${b}}z^{${c}}$ in $(x+y+z)^{${n}}$? (Watch the exponents.)`,
                mathText: '',
                ...numOpts(v, ok ? [nfact(n), nbin(n, a), v + 1, nbin(n, a) * nbin(n, b), v * 2, Math.pow(3, n), n + 1] : [Math.round(nfact(n) / (nfact(a) * nfact(b) * nfact(c))) || 2, nbin(n, Math.min(a, n)) || 4, nfact(n), 1, 3, Math.pow(3, n), n + 1, 2 * n, nfact(a + b + c) || 5]),
                explanation: ok
                    ? `$${a}+${b}+${c} = ${n}$, so the term exists with coefficient $\\binom{${n}}{${a},${b},${c}} = ${v}$.`
                    : `$${a}+${b}+${c} = ${a + b + c} \\ne ${n}$. Every term of $(x+y+z)^{${n}}$ has total degree $${n}$, so this monomial does not appear: coefficient $0$. Always check the exponent sum before computing anything.`
            };
        }
    ],

    /* ---------------- counting ---------------- */
    counting: [
        () => {
            const a = randInt(2, 6), b = randInt(2, 6);
            const v = nbin(a + b, a);
            return {
                topic: TOPIC.counting,
                questionText: `How many lattice paths go from $(0,0)$ to $(${a},${b})$ using only unit steps right or up?`,
                mathText: '',
                ...numOpts(v, [nbin(a + b, a - 1), a * b, Math.pow(2, a + b), nfact(a + b), nbin(a + b - 1, a), nbin(a, b) || 1, v + a]),
                explanation: `A path is a string of $${a}$ R's and $${b}$ U's; choose the positions of the R's: $\\binom{${a + b}}{${a}} = ${v}$. Pascal's rule is "the last step was R or U".`
            };
        },
        () => {
            const n = randInt(6, 10), k = randInt(2, 4);
            const v = nbin(n, k);
            return {
                topic: TOPIC.counting,
                questionText: `How many binary strings of length $${n}$ contain exactly $${k}$ ones?`,
                mathText: '',
                ...numOpts(v, [Math.pow(2, k), nbin(n, k - 1), n * k, Math.pow(2, n - k), nbin(n - 1, k), v * 2, Math.pow(2, n)]),
                explanation: `Choose which $${k}$ of the $${n}$ positions hold a $1$: $\\binom{${n}}{${k}} = ${v}$. This is the term $x^{${n - k}}y^{${k}}$ in $(x+y)^{${n}}$ with $x$ = "0" and $y$ = "1".`
            };
        },
        () => {
            const n = randInt(5, 9), k = randInt(2, 4);
            const v = k * nbin(n, k);
            return {
                topic: TOPIC.counting,
                questionText: `From $${n}$ people, how many ways can you form a committee of $${k}$ and then choose one of its members as chair?`,
                mathText: '',
                ...numOpts(v, [nbin(n, k), n * nbin(n, k), k * nbin(n - 1, k), nbin(n, k) * nbin(n, 1), nbin(n, k - 1), v / k, nbin(n, k) + k]),
                explanation: `Committee then chair: $\\binom{${n}}{${k}}\\cdot${k} = ${nbin(n, k)}\\cdot${k} = ${v}$. Chair then the rest: $${n}\\cdot\\binom{${n - 1}}{${k - 1}} = ${n}\\cdot${nbin(n - 1, k - 1)} = ${v}$. That equality is the absorption identity.`
            };
        },
        () => {
            const n = randInt(4, 8), m = randInt(3, 4);
            const v = nbin(n + m - 1, m - 1);
            return {
                topic: TOPIC.counting,
                questionText: `How many solutions in non-negative integers does $x_1 + x_2 + \\cdots + x_{${m}} = ${n}$ have?`,
                mathText: '',
                ...numOpts(v, [nbin(n - 1, m - 1), Math.pow(m, n), nbin(n + m, m), nbin(n, m), Math.pow(n, m), nbin(n + m - 1, m), v + 1]),
                explanation: `Stars and bars: $${n}$ stars and $${m - 1}$ bars in a row, choose the bar positions: $\\binom{${n + m - 1}}{${m - 1}} = ${v}$. This is also the number of terms in $(x_1+\\cdots+x_{${m}})^{${n}}$. With each $x_i \\ge 1$ the answer would be $\\binom{${n - 1}}{${m - 1}} = ${nbin(n - 1, m - 1)}$.`
            };
        },
        () => {
            const n = randInt(4, 7);
            const v = Math.pow(2, n) - 1 - n;
            return {
                topic: TOPIC.counting,
                questionText: `How many subsets of a $${n}$-element set have at least two elements?`,
                mathText: '',
                ...numOpts(v, [Math.pow(2, n) - 1, Math.pow(2, n) - n, Math.pow(2, n - 1), nbin(n, 2), Math.pow(2, n) - 2, v + 1]),
                explanation: `Total subsets $2^{${n}} = ${Math.pow(2, n)}$ minus the empty set and the $${n}$ singletons: $${Math.pow(2, n)} - 1 - ${n} = ${v}$. Equivalently $\\sum_{k\\ge 2}\\binom{${n}}{k}$.`
            };
        }
    ],

    /* ---------------- proofs ---------------- */
    proofs: [
        () => {
            const correct = "Pascal's rule, $\\binom nk + \\binom n{k-1} = \\binom{n+1}{k}$";
            return {
                topic: TOPIC.proofs,
                questionText: 'In the inductive proof of the binomial theorem, after multiplying $(x+y)\\sum_k\\binom nk x^{n-k}y^k$ and shifting the index, the coefficient of $x^{n+1-k}y^k$ is $\\binom nk + \\binom n{k-1}$. Which fact finishes the step?',
                mathText: '',
                ...makeOptions(correct, ['Symmetry, $\\binom nk = \\binom n{n-k}$', 'The row sum, $\\sum_k\\binom nk = 2^n$', "Vandermonde's identity", 'Absorption, $k\\binom nk = n\\binom{n-1}{k-1}$']),
                isTextOptions: true,
                explanation: "Pascal's rule turns $\\binom nk + \\binom n{k-1}$ into $\\binom{n+1}{k}$, exactly the coefficient the theorem predicts for $n+1$. That is why the addition formula and the binomial theorem are proved together."
            };
        },
        () => {
            const n = randInt(4, 8), k = randInt(1, n - 1);
            const correct = `the number of ways to choose which $${k}$ of the $${n}$ factors contribute a $y$`;
            return {
                topic: TOPIC.proofs,
                questionText: `In the counting proof of the binomial theorem for $(x+y)^{${n}}$, the coefficient $\\binom{${n}}{${k}}$ of $x^{${n - k}}y^{${k}}$ is interpreted as:`,
                mathText: '',
                ...makeOptions(correct, [`the number of ways to order $${k}$ copies of $y$`, `the number of factors, $${n}$, divided by $${k}$`, `the number of terms in the expansion`, `the number of subsets of a $${k}$-element set`]),
                isTextOptions: true,
                explanation: `Multiplying out the $${n}$ factors without collecting gives $2^{${n}}$ products. A product equals $x^{${n - k}}y^{${k}}$ exactly when $y$ was picked from $${k}$ specific factors, and there are $\\binom{${n}}{${k}} = ${nbin(n, k)}$ such choices.`
            };
        },
        () => {
            const p = pickRandom([5, 7, 11, 13]);
            const k = randInt(1, p - 1);
            const v = nbin(p, k);
            return {
                topic: TOPIC.proofs,
                questionText: `Why is $\\binom{${p}}{${k}} = ${v}$ divisible by $${p}$?`,
                mathText: '',
                ...makeOptions(`$${p}$ divides the numerator $${p}!$ but not the denominator $${k}!\\,${p - k}!$, since $${p}$ is prime and larger than every factor there`, [`Every binomial coefficient $\\binom nk$ with $0<k<n$ is divisible by $n$`, `Because $\\binom{${p}}{${k}} = \\binom{${p}}{${p - k}}$`, `Because the row sum $2^{${p}}$ is divisible by $${p}$`, `Because $${k}$ divides $${p}$`]),
                isTextOptions: true,
                explanation: `$\\binom pk = \\frac{p!}{k!(p-k)!}$. The prime $p$ appears in $p!$ and cannot be cancelled by $k!(p-k)!$ (all factors are $< p$). Hence $(x+y)^p \\equiv x^p + y^p \\pmod p$; with $x = a$, $y = 1$ and induction on $a$ this gives Fermat's little theorem. The claim "every $\\binom nk$ is divisible by $n$" fails for composite $n$: $\\binom 42 = 6$.`
            };
        },
        () => {
            const n = randInt(4, 8);
            const correct = 'Fix an element $a$; the map $S \\mapsto S \\triangle \\{a\\}$ (toggle $a$) is a bijection from even-sized to odd-sized subsets';
            return {
                topic: TOPIC.proofs,
                questionText: `Which argument proves without algebra that a $${n}$-element set has equally many even-sized and odd-sized subsets?`,
                mathText: '',
                ...makeOptions(correct, ['Every subset has a complement of the same size', 'The middle binomial coefficient is the largest', `There are $2^{${n}}$ subsets and $2^{${n}}$ is even`, 'Order the subsets by size and pair consecutive ones']),
                isTextOptions: true,
                explanation: `Toggling a fixed element changes the size by exactly $1$, so it swaps parities, and applying it twice is the identity, so it is a bijection. Algebraically this is $\\sum_k(-1)^k\\binom{${n}}{k} = (1-1)^{${n}} = 0$. Complements have size $${n}-k$, which has the same parity as $k$ only when $${n}$ is even, so that option fails.`
            };
        },
        () => {
            const m = randInt(3, 5), n = randInt(3, 5), r = randInt(2, 3);
            const correct = `Choose $${r}$ people from $${m}$ women and $${n}$ men, classified by how many women are chosen`;
            return {
                topic: TOPIC.proofs,
                questionText: `Which counting story proves $\\displaystyle\\sum_{k}\\binom{${m}}{k}\\binom{${n}}{${r}-k} = \\binom{${m + n}}{${r}}$?`,
                mathText: '',
                ...makeOptions(correct, [`Choose $${r}$ people from $${m}$ and then $${r}$ from $${n}$`, `Arrange $${m}$ women and $${n}$ men in a row`, `Choose a committee of $${m}$ and a chair among $${n}$`, `Split $${m + n}$ people into two teams of $${r}$`]),
                isTextOptions: true,
                explanation: `Right side: $\\binom{${m + n}}{${r}}$ ways to choose $${r}$ people from all $${m + n}$. Left side: the same choices sorted by the number $k$ of women: $\\binom{${m}}{k}$ ways to pick the women and $\\binom{${n}}{${r}-k}$ ways to pick the men. This is Vandermonde's identity, also obtained by comparing $x^{${r}}$ coefficients in $(1+x)^{${m}}(1+x)^{${n}}$.`
            };
        }
    ],

    /* ---------------- traps ---------------- */
    traps: [
        () => {
            const n = randInt(4, 7), a = randInt(2, 3), k = randInt(1, n - 1);
            const right = nbin(n, k) * Math.pow(a, n - k);
            const wrong = nbin(n, k) * Math.pow(a, k);
            return {
                topic: TOPIC.traps,
                questionText: `A student says the coefficient of $y^{${k}}$ in $(${a}x + y)^{${n}}$ is $\\binom{${n}}{${k}}\\cdot${a}^{${k}} = ${wrong}$. What is wrong?`,
                mathText: '',
                ...makeOptions(`The scalar $${a}$ belongs to $x$, so it is raised to $${n - k}$: the coefficient is $\\binom{${n}}{${k}}${a}^{${n - k}} = ${right}$`, [`Nothing, $${wrong}$ is correct`, `The binomial coefficient should be $\\binom{${n}}{${k - 1}}$`, `The answer should be negative`, `The scalar should not appear at all: the coefficient is $\\binom{${n}}{${k}}$`]),
                isTextOptions: true,
                explanation: `Term: $\\binom{${n}}{${k}}(${a}x)^{${n - k}}y^{${k}} = ${nbin(n, k)}\\cdot${a}^{${n - k}}\\,x^{${n - k}}y^{${k}}$, coefficient $${right}$. The exponent on $${a}$ matches the exponent on $x$.`
            };
        },
        () => {
            const n = randInt(5, 9), r = randInt(3, n);
            return {
                topic: TOPIC.traps,
                questionText: `"The ${r}th term of $(x+y)^{${n}}$ is $\\binom{${n}}{${r}}x^{${n - r}}y^{${r}}$." True or false, and why?`,
                mathText: '',
                ...makeOptions(`False: the terms start at $k = 0$, so the ${r}th term has $k = ${r - 1}$: $\\binom{${n}}{${r - 1}}x^{${n - r + 1}}y^{${r - 1}}$`, ['True', `False: it should be $\\binom{${n}}{${r + 1}}x^{${n - r - 1}}y^{${r + 1}}$`, `False: the exponents should be swapped, $x^{${r}}y^{${n - r}}$`, `False: there is no ${r}th term`]),
                isTextOptions: true,
                explanation: `$T_{k+1} = \\binom{${n}}{k}x^{${n}-k}y^k$. The first term is $k = 0$, so the $${r}$th is $k = ${r - 1}$. Off-by-one in the index is the most common binomial theorem error.`
            };
        },
        () => {
            const n = randInt(4, 8);
            return {
                topic: TOPIC.traps,
                questionText: `A student claims $\\displaystyle\\sum_{k=0}^{${n}}(-1)^k\\binom{${n}}{k} = 2^{${n - 1}}$ "because half the terms cancel". What is the correct value and reason?`,
                mathText: '',
                ...makeOptions(`$0$: substitute $x = 1$, $y = -1$ into $(x+y)^{${n}}$`, [`$2^{${n - 1}}$: half of $2^{${n}}$`, `$1$: only the $k = 0$ term survives`, `$-2^{${n - 1}}$: the odd terms dominate`, `$2^{${n}}$: the signs do not matter`]),
                isTextOptions: true,
                explanation: `$(1 - 1)^{${n}} = 0$. The value $2^{${n - 1}}$ is the sum of the even-indexed terms alone (or the odd ones alone), not the alternating sum. Check with $n = 2$: $1 - 2 + 1 = 0$.`
            };
        },
        () => {
            const n = randInt(4, 6);
            const terms = nbin(n + 2, 2);
            return {
                topic: TOPIC.traps,
                questionText: `"$(x+y+z)^{${n}}$ has $3^{${n}} = ${Math.pow(3, n)}$ terms." What is wrong?`,
                mathText: '',
                ...makeOptions(`$3^{${n}}$ is the sum of the coefficients; the number of distinct terms is $\\binom{${n + 2}}{2} = ${terms}$`, ['Nothing, that is correct', `The number of terms is $${n} + 1 = ${n + 1}$`, `The number of terms is $3\\cdot${n} = ${3 * n}$`, `The number of terms is $${n}! = ${nfact(n)}$`]),
                isTextOptions: true,
                explanation: `Terms ↔ exponent vectors $(a,b,c)$ with $a+b+c = ${n}$: $\\binom{${n}+3-1}{3-1} = \\binom{${n + 2}}{2} = ${terms}$. Setting $x=y=z=1$ shows the coefficients add to $3^{${n}}$, a different number. ($${n}+1$ is the count for a <em>binomial</em>.)`
            };
        },
        () => {
            const a = randInt(1, 3), b = randInt(1, 3), n = a + b + randInt(1, 2);
            const c = n - a - b;
            const wrong = nfact(n) / (nfact(a) * nfact(b));
            const right = nmult([a, b, c]);
            return {
                topic: TOPIC.traps,
                questionText: `For the coefficient of $x^{${a}}y^{${b}}z^{${c}}$ in $(x+y+z)^{${n}}$ a student writes $\\frac{${n}!}{${a}!\\,${b}!} = ${wrong}$. Correct answer?`,
                mathText: '',
                ...makeOptions(`$\\frac{${n}!}{${a}!\\,${b}!\\,${c}!} = ${right}$: every block's factorial goes in the denominator`, [`$${wrong}$ is correct`, `$\\binom{${n}}{${a}} = ${nbin(n, a)}$`, `$${n}! = ${nfact(n)}$`, `$\\frac{${n}!}{${c}!} = ${nfact(n) / nfact(c)}$`]),
                isTextOptions: true,
                explanation: `The multinomial coefficient divides by <em>all</em> the block factorials, including $${c}!$ for $z$: $\\binom{${n}}{${a},${b},${c}} = ${right}$. Forgetting one block over-counts by a factor of $${c}! = ${nfact(c)}$.`
            };
        }
    ]
};

/* --------------------------------------------------------------------------
 * Custom-mode pools
 * -------------------------------------------------------------------------- */
const MatchingQuestions = [
    { desc: 'Factorial formula for a binomial coefficient', formula: '\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!}', exp: 'Ordered selections $n!/(n-k)!$, each unordered one counted $k!$ times.' },
    { desc: 'Symmetry of binomial coefficients', formula: '\\binom{n}{k} = \\binom{n}{n-k}', exp: 'Choosing what to keep is choosing what to leave out.' },
    { desc: "Pascal's rule", formula: '\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}', exp: 'A $k$-subset contains a fixed element or it does not.' },
    { desc: 'Absorption identity', formula: 'k\\binom{n}{k} = n\\binom{n-1}{k-1}', exp: 'Committee-then-chair equals chair-then-committee.' },
    { desc: 'Hockey-stick identity', formula: '\\sum_{j=k}^{n}\\binom{j}{k} = \\binom{n+1}{k+1}', exp: 'Classify $(k+1)$-subsets by their largest element.' },
    { desc: 'Binomial theorem', formula: '(x+y)^n = \\sum_{k=0}^{n}\\binom{n}{k}x^{n-k}y^{k}', exp: 'Choose which $k$ factors contribute $y$.' },
    { desc: 'General term of $(x+y)^n$', formula: 'T_{k+1} = \\binom{n}{k}x^{n-k}y^{k}', exp: 'Terms are indexed from $k = 0$.' },
    { desc: 'Alternating binomial expansion', formula: '(x-y)^n = \\sum_{k=0}^{n}(-1)^k\\binom{n}{k}x^{n-k}y^{k}', exp: 'Replace $y$ by $-y$; the sign is $(-1)^k$.' },
    { desc: 'Row sum of Pascal\'s triangle', formula: '\\sum_{k=0}^{n}\\binom{n}{k} = 2^n', exp: 'Put $x = y = 1$; or count all subsets.' },
    { desc: 'Alternating row sum', formula: '\\sum_{k=0}^{n}(-1)^k\\binom{n}{k} = 0 \\quad (n\\ge 1)', exp: 'Put $x = 1$, $y = -1$.' },
    { desc: 'Even-sized subsets of an $n$-set', formula: '\\sum_{k\\text{ even}}\\binom{n}{k} = 2^{n-1}', exp: 'Average of the row sum and the alternating sum.' },
    { desc: 'Weighted row sum', formula: '\\sum_{k=0}^{n}k\\binom{n}{k} = n\\,2^{n-1}', exp: 'Differentiate $(1+x)^n$ and put $x = 1$, or absorb.' },
    { desc: 'Second weighted row sum', formula: '\\sum_{k=0}^{n}k(k-1)\\binom{n}{k} = n(n-1)\\,2^{n-2}', exp: 'Differentiate twice.' },
    { desc: 'Sum with powers of 2', formula: '\\sum_{k=0}^{n}\\binom{n}{k}2^k = 3^n', exp: 'Put $x = 2$ in $(1+x)^n$.' },
    { desc: 'Integrated binomial sum', formula: '\\sum_{k=0}^{n}\\frac{1}{k+1}\\binom{n}{k} = \\frac{2^{n+1}-1}{n+1}', exp: 'Integrate $(1+x)^n$ from $0$ to $1$.' },
    { desc: "Vandermonde's identity", formula: '\\sum_{k=0}^{r}\\binom{m}{k}\\binom{n}{r-k} = \\binom{m+n}{r}', exp: 'Coefficient of $x^r$ in $(1+x)^m(1+x)^n$.' },
    { desc: 'Sum of squares of a row', formula: '\\sum_{k=0}^{n}\\binom{n}{k}^2 = \\binom{2n}{n}', exp: 'Vandermonde with $m = n = r$ after using symmetry.' },
    { desc: 'Freshman\'s dream modulo a prime', formula: '(x+y)^p \\equiv x^p + y^p \\pmod p', exp: '$p \\mid \\binom pk$ for $0 < k < p$.' },
    { desc: 'Multinomial coefficient', formula: '\\binom{n}{n_1,\\dots,n_m} = \\frac{n!}{n_1!\\cdots n_m!}', exp: 'Arrangements of $n$ objects with $n_i$ identical of type $i$.' },
    { desc: 'Multinomial coefficient as a product of binomials', formula: '\\binom{n}{n_1,\\dots,n_m} = \\binom{n}{n_1}\\binom{n-n_1}{n_2}\\cdots', exp: 'Fill the blocks one at a time.' },
    { desc: 'Multinomial theorem', formula: '(x_1+\\cdots+x_m)^n = \\sum_{n_1+\\cdots+n_m=n}\\binom{n}{n_1,\\dots,n_m}x_1^{n_1}\\cdots x_m^{n_m}', exp: 'Choose which factors contribute which variable.' },
    { desc: 'Sum of all multinomial coefficients', formula: '\\sum_{n_1+\\cdots+n_m=n}\\binom{n}{n_1,\\dots,n_m} = m^n', exp: 'Put every $x_i = 1$.' },
    { desc: 'Number of terms of $(x_1+\\cdots+x_m)^n$', formula: '\\#\\{(n_1,\\dots,n_m): n_i\\ge 0,\\ \\textstyle\\sum n_i = n\\} = \\binom{n+m-1}{m-1}', exp: 'Exponent vectors = stars and bars.' },
    { desc: 'Multinomial Pascal rule', formula: '\\binom{n}{n_1,\\dots,n_m} = \\sum_{i}\\binom{n-1}{n_1,\\dots,n_i-1,\\dots,n_m}', exp: 'Classify by the block containing element $n$.' },
    { desc: 'Lattice paths to $(a,b)$', formula: '\\binom{a+b}{a}', exp: 'Strings of $a$ R\'s and $b$ U\'s.' },
    { desc: 'Positive-integer solutions of $x_1+\\cdots+x_m = n$ (each $x_i \\ge 1$)', formula: '\\binom{n-1}{m-1}', exp: 'Give each variable one first, then stars and bars.' },
    { desc: 'First-order approximation', formula: '(1+x)^n \\approx 1 + nx \\quad (|x|\\ll 1)', exp: 'Keep the first two terms of the expansion.' },
    { desc: 'Central binomial coefficient', formula: '\\binom{2n}{n} = \\frac{(2n)!}{(n!)^2}', exp: 'Largest entry of row $2n$.' }
];

const ConceptPairs = [
    { name: 'Binomial theorem', condition: 'n \\ge 0 \\text{ an integer}, \\; x, y \\text{ commute}', conclusion: '(x+y)^n = \\sum_k\\binom nk x^{n-k}y^k', exp: 'Valid in any commutative ring; the coefficients are subset counts.' },
    { name: 'Multinomial theorem', condition: 'n \\ge 0, \\; m \\text{ variables}', conclusion: '(x_1+\\cdots+x_m)^n = \\sum\\binom{n}{n_1,\\dots,n_m}\\prod x_i^{n_i}', exp: 'Sum over all exponent vectors adding to $n$.' },
    { name: "Pascal's rule", condition: '1 \\le k \\le n-1', conclusion: '\\binom nk = \\binom{n-1}{k-1}+\\binom{n-1}{k}', exp: 'Contains a fixed element or not.' },
    { name: 'Symmetry', condition: '0 \\le k \\le n', conclusion: '\\binom nk = \\binom n{n-k}', exp: 'Keep versus discard.' },
    { name: 'Absorption', condition: '1 \\le k \\le n', conclusion: 'k\\binom nk = n\\binom{n-1}{k-1}', exp: 'Committee and chair.' },
    { name: 'Hockey stick', condition: '0 \\le k \\le n', conclusion: '\\sum_{j=k}^{n}\\binom jk = \\binom{n+1}{k+1}', exp: 'Largest element classification.' },
    { name: 'Row sum', condition: 'x = y = 1 \\text{ in } (x+y)^n', conclusion: '\\sum_k\\binom nk = 2^n', exp: 'All subsets.' },
    { name: 'Alternating sum', condition: 'x = 1, \\; y = -1 \\text{ in } (x+y)^n, \\; n \\ge 1', conclusion: '\\sum_k(-1)^k\\binom nk = 0', exp: 'Even and odd subsets balance.' },
    { name: 'Weighted sum', condition: '\\tfrac{d}{dx}(1+x)^n \\text{ at } x = 1', conclusion: '\\sum_k k\\binom nk = n2^{n-1}', exp: 'Or absorb $k\\binom nk = n\\binom{n-1}{k-1}$.' },
    { name: 'Integrated sum', condition: '\\int_0^1(1+x)^n\\,dx', conclusion: '\\sum_k\\frac{1}{k+1}\\binom nk = \\frac{2^{n+1}-1}{n+1}', exp: 'Term-by-term integration.' },
    { name: "Vandermonde's identity", condition: '[x^r]\\,(1+x)^m(1+x)^n', conclusion: '\\sum_k\\binom mk\\binom n{r-k} = \\binom{m+n}{r}', exp: 'Women-and-men committee.' },
    { name: 'Sum of squares', condition: 'm = n = r \\text{ in Vandermonde}', conclusion: '\\sum_k\\binom nk^2 = \\binom{2n}{n}', exp: 'Uses symmetry first.' },
    { name: 'Prime divisibility', condition: 'p \\text{ prime}, \\; 0 < k < p', conclusion: 'p \\mid \\binom pk', exp: '$p$ in the numerator, not in the denominator.' },
    { name: 'Sum of multinomial coefficients', condition: '\\text{all } x_i = 1', conclusion: '\\sum\\binom{n}{n_1,\\dots,n_m} = m^n', exp: 'Strings over $m$ letters.' },
    { name: 'Number of terms (multinomial)', condition: 'm \\text{ variables, degree } n', conclusion: '\\binom{n+m-1}{m-1} \\text{ terms}', exp: 'Stars and bars.' },
    { name: 'Lattice-path count', condition: '\\text{steps R or U from } (0,0) \\text{ to } (a,b)', conclusion: '\\binom{a+b}{a} \\text{ paths}', exp: 'Positions of the R steps.' }
];

const SetupQuestions = [
    { situation: 'You need the coefficient of $x^7$ in $(2x-3)^{10}$.', q: 'Which term of the expansion do you evaluate?', options: ['$\\binom{10}{3}(2x)^7(-3)^3$', '$\\binom{10}{7}(2x)^3(-3)^7$', '$\\binom{10}{3}(2)^3(-3x)^7$', '$\\binom{10}{7}(2x)^7(3)^3$'], correctIdx: 0, exp: 'Write $\\binom{10}{k}(2x)^{10-k}(-3)^k$ and set $10-k = 7$, so $k = 3$. The $-3$ keeps its sign, giving $-27\\cdot 128\\cdot 120$.' },
    { situation: 'You want the term independent of $x$ in $\\left(x^3 + \\frac{2}{x}\\right)^{8}$.', q: 'What equation determines $k$?', options: ['$3(8-k) - k = 0$', '$3k - (8-k) = 0$', '$3(8-k) + k = 0$', '$8 - k = 0$'], correctIdx: 0, exp: 'The general term is $\\binom 8k (x^3)^{8-k}(2x^{-1})^k = \\binom 8k 2^k x^{24-4k}$; set $24 - 4k = 0$, $k = 6$.' },
    { situation: 'You must evaluate $\\sum_{k=0}^{n}\\binom nk 5^k$.', q: 'What is the fastest route?', options: ['Put $x = 5$ in $(1+x)^n$ to get $6^n$', 'Put $x = 6$ in $(1+x)^n$', 'Differentiate $(1+x)^n$ at $x = 5$', 'Use Vandermonde with $m = 5$'], correctIdx: 0, exp: 'The summand $\\binom nk x^k$ matches with $x = 5$; the value is $(1+5)^n = 6^n$.' },
    { situation: 'You must evaluate $\\sum_{k=0}^{n} k\\binom nk 3^{k}$.', q: 'Which manipulation works?', options: ['Differentiate $(1+x)^n$, multiply by $x$, put $x = 3$', 'Put $x = 3$ in $(1+x)^n$', 'Integrate $(1+x)^n$ from $0$ to $3$', 'Put $x = 1$ in $(3+x)^n$'], correctIdx: 0, exp: '$x\\frac{d}{dx}(1+x)^n = \\sum_k k\\binom nk x^k = nx(1+x)^{n-1}$; at $x = 3$ this is $3n\\cdot 4^{n-1}$.' },
    { situation: 'You need the coefficient of $x^4$ in $(1+x)^{6}(1+x)^{9}$.', q: 'What is the cleanest way?', options: ['Combine to $(1+x)^{15}$ and read $\\binom{15}{4}$', 'Multiply the two expansions term by term', 'Add $\\binom 64$ and $\\binom 94$', 'Use the multinomial theorem with three variables'], correctIdx: 0, exp: 'The product is $(1+x)^{15}$, so the coefficient is $\\binom{15}{4} = 1365$. The term-by-term multiplication is exactly Vandermonde and gives the same number.' },
    { situation: 'A word has 9 letters: three A\'s, two B\'s, and four other distinct letters.', q: 'How do you count its rearrangements?', options: ['$\\dfrac{9!}{3!\\,2!}$', '$\\dfrac{9!}{3!\\,2!\\,4!}$', '$\\binom{9}{3}\\binom{9}{2}$', '$9!$'], correctIdx: 0, exp: 'Divide $9!$ by the factorial of each repeated multiplicity: $3!$ for the A\'s and $2!$ for the B\'s. The four distinct letters each have multiplicity $1$ and $1! = 1$.' },
    { situation: 'You need the coefficient of $x^2y^3z^2$ in $(x - 2y + z)^7$.', q: 'Which expression?', options: ['$\\binom{7}{2,3,2}\\cdot(-2)^3$', '$\\binom{7}{2,3,2}\\cdot(-2)^2$', '$\\binom{7}{2}\\binom{7}{3}\\cdot(-2)^3$', '$\\binom{7}{2,3,2}\\cdot 2^3$'], correctIdx: 0, exp: 'Exponents $2+3+2 = 7$ ✓. Coefficient $= \\frac{7!}{2!3!2!}\\cdot 1^2(-2)^3 1^2 = 210\\cdot(-8) = -1680$.' },
    { situation: 'You need the number of terms in $(a+b+c+d)^{6}$.', q: 'Which count?', options: ['$\\binom{6+4-1}{4-1} = \\binom{9}{3}$', '$4^6$', '$6+1 = 7$', '$\\binom{6}{4}$'], correctIdx: 0, exp: 'Terms ↔ exponent vectors $(n_1,n_2,n_3,n_4)$ adding to $6$: stars and bars gives $\\binom 93 = 84$. $4^6$ is the coefficient sum.' },
    { situation: 'You want to prove $\\binom{n}{k} = \\binom{n-1}{k-1}+\\binom{n-1}{k}$ combinatorially.', q: 'What do you classify the $k$-subsets by?', options: ['Whether they contain one fixed element', 'Their largest element', 'Their sum', 'Whether $k$ is even'], correctIdx: 0, exp: 'Subsets containing the fixed element: $\\binom{n-1}{k-1}$. Not containing it: $\\binom{n-1}{k}$. (Classifying by largest element gives the hockey stick.)' },
    { situation: 'You want to prove $\\sum_{j=k}^{n}\\binom jk = \\binom{n+1}{k+1}$ combinatorially.', q: 'What do you classify the $(k+1)$-subsets of $\\{1,\\dots,n+1\\}$ by?', options: ['Their largest element $j+1$', 'Whether they contain $1$', 'Their smallest element only when it is $1$', 'Their size'], correctIdx: 0, exp: 'If the largest element is $j+1$, the other $k$ elements are chosen from $\\{1,\\dots,j\\}$: $\\binom jk$ ways. Summing over $j$ gives the identity.' },
    { situation: 'You want $\\sum_{k}\\binom{n}{k}^2$.', q: 'What is the first rewrite?', options: ['$\\binom nk^2 = \\binom nk\\binom n{n-k}$, then Vandermonde', 'Square the row sum: $(2^n)^2$', 'Differentiate $(1+x)^n$ twice', 'Put $x = 2$ in $(1+x)^{2n}$'], correctIdx: 0, exp: 'After symmetry the sum is $\\sum_k\\binom nk\\binom n{n-k} = \\binom{2n}{n}$ by Vandermonde with $m = n$, $r = n$. Squaring the row sum gives $4^n$, which is wrong.' },
    { situation: 'A student expands $(x-y)^5$ and gets all positive coefficients.', q: 'What was forgotten?', options: ['The factor $(-1)^k$ on the term with $y^k$', 'Symmetry of the coefficients', 'The middle term', 'That $5$ is odd'], correctIdx: 0, exp: '$(x-y)^5 = \\sum_k\\binom 5k x^{5-k}(-y)^k$; the signs alternate $+,-,+,-,+,-$.' },
    { situation: '$10$ students are divided into a group of $4$ and a group of $6$ for two different tasks.', q: 'How many ways?', options: ['$\\binom{10}{4} = 210$', '$\\binom{10}{4}\\binom{10}{6}$', '$\\binom{10}{4}/2$', '$10!/(4!\\,6!\\,2!)$'], correctIdx: 0, exp: 'The groups are labelled (different tasks), so $\\binom{10}{4,6} = \\binom{10}{4} = 210$. Dividing by $2$ would only be right for two unlabelled groups of equal size.' },
    { situation: 'You need the coefficient of $x^5$ in $(1 + x + x^2)^{4}$.', q: 'Which setup?', options: ['Sum $\\binom{4}{a,b,c}$ over $a+b+c = 4$ with $b + 2c = 5$', 'Read $\\binom{4}{5} = 0$', 'Use $\\binom{4}{2}$ since $x^2$ appears', 'Put $x = 1$'], correctIdx: 0, exp: 'A term $1^a x^b (x^2)^c$ has degree $b + 2c$. Solve $a+b+c = 4$, $b+2c = 5$: $(a,b,c) = (0,3,1)$ or $(1,1,2)$, giving $\\binom{4}{0,3,1}+\\binom{4}{1,1,2} = 4 + 12 = 16$.' },
    { situation: 'Estimate $0.98^{10}$ by hand.', q: 'Which approximation?', options: ['$(1-0.02)^{10} \\approx 1 - 0.2 + 45(0.0004) = 0.818$', '$1 - 10\\cdot 0.98$', '$0.98\\cdot 10$', '$1 - 0.02^{10}$'], correctIdx: 0, exp: 'Take the first terms of $(1+x)^{10}$ with $x = -0.02$: $1 + 10x + 45x^2 = 0.818$; the true value is $0.8171$.' },
    { situation: 'You must count paths from $(0,0)$ to $(5,4)$ that pass through $(2,1)$.', q: 'Which product?', options: ['$\\binom{3}{2}\\binom{6}{3}$', '$\\binom{9}{5}$', '$\\binom{3}{2}+\\binom{6}{3}$', '$\\binom{5}{2}\\binom{4}{1}$'], correctIdx: 0, exp: 'Paths to $(2,1)$: $\\binom 32$. Then from $(2,1)$ to $(5,4)$ is $3$ right and $3$ up: $\\binom 63$. Multiply: $3\\cdot 20 = 60$.' },
    { situation: 'You want $\\sum_{k=0}^{n}\\binom nk\\frac{(-1)^k}{k+1}$.', q: 'Which manipulation?', options: ['Integrate $(1-x)^n$ from $0$ to $1$', 'Differentiate $(1-x)^n$', 'Put $x = -1$ in $(1+x)^n$', 'Use symmetry then Vandermonde'], correctIdx: 0, exp: '$\\int_0^1(1-x)^n\\,dx = \\frac{1}{n+1}$ and term by term the integral is $\\sum_k\\binom nk(-1)^k\\frac{1}{k+1}$.' }
];

const FinalBlueprint = [
    ['coefCompute'], ['coefCompute', 'coefIdentity'], ['coefIdentity'], ['coefIdentity'],
    ['expandTerm'], ['expandTerm'], ['expandSpecific'], ['expandSpecific'],
    ['sumIdentities'], ['sumIdentities'], ['calcIdentities'], ['calcIdentities'],
    ['multiCoef'], ['multiTheorem'], ['multiTheorem'], ['counting'], ['proofs'], ['traps']
];

const QuizModes = {
    standard: { label: 'Standard (10 questions from selected topics)', kind: 'topics', count: 10 },
    long: { label: 'Long drill (20 questions from selected topics)', kind: 'topics', count: 20 },
    matching: { label: 'Identity matching (name ↔ formula)', kind: 'custom', build: () => generateMatchingQuiz(MatchingQuestions, 'Identity Matching', 12) },
    concepts: { label: 'Hypothesis ↔ conclusion', kind: 'custom', build: () => generateConceptQuiz(ConceptPairs, 'Concept ↔ Statement', 10) },
    setup: { label: 'Setup & strategy problems', kind: 'custom', build: () => generateSetupQuiz(SetupQuestions, 'Setup & Strategy', 10) },
    final: { label: 'Full test (18 questions, every topic)', kind: 'custom', build: () => generateBlueprintQuiz(FinalBlueprint) }
};
