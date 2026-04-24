#!/usr/bin/env node
/**
 * Runs struct + ABI benchmarks 3x on Node, 3x on Bun. Parses median ops/s
 * for new / old (loop) / viem (Node) and reports explicit ratios. Bun rows
 * show new-only (JIT) for runtime A/B vs Node. Rewrites README.md markers.
 */
import {execFileSync} from 'node:child_process'
import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const N = 3

const variantRe = /^\s*(new \(JIT\)|old \(loop\)|viem)\s+[\d.]+\s+ms\s+([\d,]+)\s+ops\/s/

function median(nums) {
    const a = nums.filter((x) => x != null && !Number.isNaN(x)).sort((x, y) => x - y)
    if (a.length === 0) return NaN
    if (a.length === 1) return a[0]
    if (a.length === 2) return (a[0] + a[1]) / 2
    return a[1]
}

/**
 * @returns {Record<string, number>}
 */
function parseVariantBlock(sub) {
    const o = {}
    for (const line of sub.split('\n')) {
        const m = line.match(variantRe)
        if (m) o[m[1]] = parseInt(m[2].replace(/,/g, ''), 10)
    }
    return o
}

const jitRe = /^\s*new \(JIT\)\s+[\d.]+\s+ms\s+([\d,]+)\s+ops\/s/m

/**
 * @returns {Array<{title: string, encode: Record<string, number>, decode: Record<string, number>}>}
 */
function parseStructBenchFull(output) {
    const out = []
    const blocks = output.split(/\n(?==== )/)
    for (const block of blocks) {
        const m = block.match(/^=== (.+?) \(\d[,\d]* iters\) ===/m)
        if (!m) continue
        const title = m[1].trim()
        const enc = block.indexOf('  encode:')
        const dec = block.indexOf('  decode:')
        if (enc === -1 || dec === -1) continue
        const encMap = parseVariantBlock(block.slice(enc, dec))
        const decMap = parseVariantBlock(block.slice(dec))
        if (Object.keys(encMap).length >= 2 && Object.keys(decMap).length >= 2) {
            out.push({title, encode: encMap, decode: decMap})
        }
    }
    return out
}

/**
 * @returns {Array<{title: string, encode: Record<string, number> | null, decode: Record<string, number>}>}
 */
function parseAbiBenchFull(output) {
    const blocks = output.split(/\n(?==== )/)
    const rows = []
    for (const block of blocks) {
        const m = block.match(/^=== (.+?) \(\d[,\d]* iters\) ===/m)
        if (!m) continue
        const title = m[1].trim()
        if (title.startsWith('AbiEvent')) {
            const dec = block.indexOf('  decode:')
            if (dec === -1) continue
            const decMap = parseVariantBlock(block.slice(dec))
            if (Object.keys(decMap).length >= 2) {
                rows.push({title, encode: null, decode: decMap})
            }
        } else {
            const enc = block.indexOf('  encode:')
            const dec = block.indexOf('  decode:')
            if (enc === -1 || dec === -1) continue
            const encMap = parseVariantBlock(block.slice(enc, dec))
            const decMap = parseVariantBlock(block.slice(dec))
            if (Object.keys(encMap).length >= 2 && Object.keys(decMap).length >= 2) {
                rows.push({title, encode: encMap, decode: decMap})
            }
        }
    }
    return rows
}

/** new-only, for Bun / Node A/B (single variant) */
function parseStructBenchNewOnly(output) {
    const out = []
    const full = parseStructBenchFull(output)
    for (const row of full) {
        out.push({
            title: row.title,
            encode: row.encode['new (JIT)'] ?? 0,
            decode: row.decode['new (JIT)'] ?? 0,
        })
    }
    return out
}

function parseAbiBenchNewOnly(output) {
    const out = []
    const blocks = output.split(/\n(?==== )/)
    for (const block of blocks) {
        const m = block.match(/^=== (.+?) \(\d[,\d]* iters\) ===/m)
        if (!m) continue
        const title = m[1].trim()
        if (title.startsWith('AbiEvent')) {
            const dec = block.indexOf('  decode:')
            if (dec === -1) continue
            const d = block.slice(dec).match(jitRe)
            if (d) out.push({title, encode: null, decode: parseInt(d[1].replace(/,/g, ''), 10)})
        } else {
            const enc = block.indexOf('  encode:')
            const dec = block.indexOf('  decode:')
            if (enc === -1 || dec === -1) continue
            const e = block.slice(enc, dec).match(jitRe)
            const d = block.slice(dec).match(jitRe)
            if (e && d) {
                out.push({title, encode: parseInt(e[1].replace(/,/g, ''), 10), decode: parseInt(d[1].replace(/,/g, ''), 10)})
            }
        }
    }
    return out
}

/**
 * @template T
 * @param {() => T[]} parseOne
 * @param {(runs: T[][]) => T} mergeRow
 */
function runN(cmd, args, parseOne, mergeRows) {
    const runs = []
    for (let i = 0; i < N; i++) {
        const out = execFileSync(cmd, args, {encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'pipe']})
        runs.push(parseOne(out))
    }
    const n = runs[0].length
    if (!runs.every((r) => r.length === n)) {
        throw new Error('parse length mismatch between runs')
    }
    return runs[0].map((_, j) => mergeRows(runs.map((r) => r[j])))
}

function mergeNewOnly(runs) {
    const a = runs[0]
    return {
        title: a.title,
        encode: a.encode == null ? null : median(runs.map((x) => x.encode)),
        decode: median(runs.map((x) => x.decode)),
    }
}

/**
 * @param {number} num
 * @param {number} den
 * @returns {string}
 */
function ratio(num, den) {
    if (den == null || den === 0 || Number.isNaN(den) || Number.isNaN(num)) return '—'
    return `${(num / den).toFixed(2)}×`
}

function fmt(n) {
    if (n == null || Number.isNaN(n)) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(2)} k`
    return String(Math.round(n))
}

function tableStructNodeCompare(rows) {
    const head =
        '| Scenario | new enc | old enc | viem enc | **new ÷ old** (enc) | **new ÷ viem** (enc) | new dec | old dec | viem dec | **new ÷ old** (dec) | **new ÷ viem** (dec) |'
    const sep = '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|'
    const lines = [head, sep]
    for (const r of rows) {
        const e = r.encode
        const d = r.decode
        lines.push(
            `| ${r.title} | ${fmt(e.n)} | ${fmt(e.o)} | ${fmt(e.v)} | ${ratio(e.n, e.o)} | ${ratio(e.n, e.v)} | ` +
                `${fmt(d.n)} | ${fmt(d.o)} | ${fmt(d.v)} | ${ratio(d.n, d.o)} | ${ratio(d.n, d.v)} |`,
        )
    }
    return lines.join('\n')
}

function tableAbiNodeCompare(rows) {
    const lines = [
        '| Scenario | new enc | old enc | viem enc | new÷old (enc) | new÷viem (enc) | new dec | old dec | viem dec | new÷old (dec) | new÷viem (dec) |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|',
    ]
    for (const r of rows) {
        if (r.encode == null) {
            const d = r.decode
            lines.push(
                `| ${r.title} | — | — | — | — | — | ` +
                    `${fmt(d.n)} | ${fmt(d.o)} | ${fmt(d.v)} | ${ratio(d.n, d.o)} | ${ratio(d.n, d.v)} |`,
            )
        } else {
            const e = r.encode
            const d = r.decode
            lines.push(
                `| ${r.title} | ${fmt(e.n)} | ${fmt(e.o)} | ${fmt(e.v)} | ${ratio(e.n, e.o)} | ${ratio(e.n, e.v)} | ` +
                    `${fmt(d.n)} | ${fmt(d.o)} | ${fmt(d.v)} | ${ratio(d.n, d.o)} | ${ratio(d.n, d.v)} |`,
            )
        }
    }
    return lines.join('\n')
}

function tableRuntimeBunNode(structNodeNew, structBunNew, abiNodeNew, abiBunNew) {
    const lines = [
        '| Source | Scenario | new encode (JIT) | new decode (JIT) | Bun ÷ Node (enc) | Bun ÷ Node (dec) |',
        '|---|---|---:|---:|---:|---:|',
    ]
    for (let i = 0; i < structNodeNew.length; i++) {
        const a = structNodeNew[i]
        const b = structBunNew[i]
        lines.push(
            `| \`lib/bench.js\` | ${a.title} | ${fmt(a.encode)} | ${fmt(a.decode)} | ` +
                `${ratio(b.encode, a.encode)} | ${ratio(b.decode, a.decode)} |`,
        )
    }
    for (let i = 0; i < abiNodeNew.length; i++) {
        const a = abiNodeNew[i]
        const b = abiBunNew[i]
        const encA = a.encode == null ? '—' : fmt(a.encode)
        const encB = b.encode == null ? '—' : fmt(b.encode)
        const encR = a.encode == null && b.encode == null ? '—' : ratio(b.encode, a.encode)
        lines.push(
            `| \`lib/bench-abi.js\` | ${a.title} | ${encA} | ${fmt(a.decode)} | ${encR} | ${ratio(b.decode, a.decode)} |`,
        )
    }
    return lines.join('\n')
}

const nodeV = execFileSync('node', ['-v'], {encoding: 'utf8'}).trim()
let bunV = '(not found)'
try {
    bunV = execFileSync('bun', ['-v'], {encoding: 'utf8'}).trim()
} catch {
    console.error('bun not in PATH; runtime table will be incomplete')
}

console.error('StructCodec full parse, Node x3…')
const structNodeCompare = (() => {
    const runs = []
    for (let i = 0; i < N; i++) {
        const out = execFileSync('node', ['lib/bench.js'], {encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'pipe']})
        runs.push(parseStructBenchFull(out))
    }
    return runs[0].map((_, j) => {
        return {
            title: runs[0][j].title,
            encode: {
                n: median(runs.map((r) => r[j].encode['new (JIT)'])),
                o: median(runs.map((r) => r[j].encode['old (loop)'])),
                v: median(runs.map((r) => r[j].encode.viem)),
            },
            decode: {
                n: median(runs.map((r) => r[j].decode['new (JIT)'])),
                o: median(runs.map((r) => r[j].decode['old (loop)'])),
                v: median(runs.map((r) => r[j].decode.viem)),
            },
        }
    })
})()

console.error('StructCodec new-only, Node x3, Bun x3…')
const structNodeNew = runN('node', ['lib/bench.js'], parseStructBenchNewOnly, mergeNewOnly)
let structBunNew
try {
    structBunNew = runN('bun', ['lib/bench.js'], parseStructBenchNewOnly, mergeNewOnly)
} catch (e) {
    structBunNew = structNodeNew.map((r) => ({title: r.title, encode: NaN, decode: NaN}))
    console.error('Bun struct:', e.message)
}

console.error('ABI full parse, Node x3…')
const abiNodeCompare = (() => {
    const runs = []
    for (let i = 0; i < N; i++) {
        const out = execFileSync('node', ['lib/bench-abi.js'], {encoding: 'utf8', cwd: root, stdio: ['ignore', 'pipe', 'pipe']})
        runs.push(parseAbiBenchFull(out))
    }
    return runs[0].map((_, j) => {
        if (runs[0][j].encode == null) {
            return {
                title: runs[0][j].title,
                encode: null,
                decode: {
                    n: median(runs.map((r) => r[j].decode['new (JIT)'])),
                    o: median(runs.map((r) => r[j].decode['old (loop)'])),
                    v: median(runs.map((r) => r[j].decode.viem)),
                },
            }
        }
        return {
            title: runs[0][j].title,
            encode: {
                n: median(runs.map((r) => r[j].encode['new (JIT)'])),
                o: median(runs.map((r) => r[j].encode['old (loop)'])),
                v: median(runs.map((r) => r[j].encode.viem)),
            },
            decode: {
                n: median(runs.map((r) => r[j].decode['new (JIT)'])),
                o: median(runs.map((r) => r[j].decode['old (loop)'])),
                v: median(runs.map((r) => r[j].decode.viem)),
            },
        }
    })
})()

console.error('ABI new-only, Node x3, Bun x3…')
const abiNodeNew = runN('node', ['lib/bench-abi.js'], parseAbiBenchNewOnly, mergeNewOnly)
let abiBunNew
try {
    abiBunNew = runN('bun', ['lib/bench-abi.js'], parseAbiBenchNewOnly, mergeNewOnly)
} catch (e) {
    abiBunNew = abiNodeNew.map((r) => ({title: r.title, encode: r.encode, decode: NaN}))
    console.error('Bun abi:', e.message)
}

const date = new Date().toISOString().slice(0, 10)
let uname = ''
try {
    uname = execFileSync('uname', ['-sr'], {encoding: 'utf8'}).trim()
} catch {
    uname = '(unknown)'
}

const legend = `
**How to read the tables**

- **Throughput** columns (\`k\` / \`M\` ops/s) = higher is faster.
- **new ÷ old** and **new ÷ viem** = \`new (JIT)\` ops/s divided by the baseline. **Values above 1×** mean the local JIT implementation is *faster*; **below 1×** it is slower (same for **Bun ÷ Node**).
- All numbers are **medians of ${N} consecutive runs** on one machine.`

const block = `<!-- BENCH-RESULTS:AUTO -->
_Last updated: ${date} — ${N} runs per series._

| | |
|---|---|
| **Node (library comparison)** | \`${nodeV}\` — used for **new** vs **old (loop)** vs **viem** |
| **Bun (runtime A/B only)** | \`${bunV}\` — compared to Node for **\`new (JIT)\` only** (same build) |
| **Kernel** | ${uname} |

${legend}

### 1) Node — three-way **library** comparison (ops/s, median)

\`**new**\` = local @subsquid, \`old\` = \`evm-codec-old\` / \`evm-abi-old\` on npm, \`viem\` = [viem](https://github.com/wevm/viem) ABI encode/decode.

#### \`lib/bench.js\` (StructCodec)

${tableStructNodeCompare(structNodeCompare)}

#### \`lib/bench-abi.js\` (AbiEvent / AbiFunction)

${tableAbiNodeCompare(abiNodeCompare)}

### 2) **Bun** vs **Node** — \`new (JIT)\` only (same code; runtime differs)

${tableRuntimeBunNode(structNodeNew, structBunNew, abiNodeNew, abiBunNew)}
<!-- :BENCH-RESULTS:AUTO -->`

const readmePath = join(root, 'README.md')
const prev = readFileSync(readmePath, 'utf8')
const re = /<!-- BENCH-RESULTS:AUTO -->[\s\S]*?<!-- :BENCH-RESULTS:AUTO -->/
if (!re.test(prev)) {
    console.error('README.md missing BENCH-RESULTS markers; appending block.')
    writeFileSync(readmePath, prev.trimEnd() + '\n\n' + block + '\n')
} else {
    writeFileSync(readmePath, prev.replace(re, block))
}
console.error('Wrote', readmePath)
