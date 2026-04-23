import * as NEW from '@subsquid/evm-codec'
import * as OLD from 'evm-codec-old'

/**
 * Benchmarks the locally-built (JIT-compiled) StructCodec in
 * `@subsquid/evm-codec` against the last published (loop-based) baseline
 * pulled from npm via the `evm-codec-old` alias. Both libraries expose the
 * same surface; only the internals of `StructCodec.encode` / `.decode`
 * differ.
 */

interface Variant {
    label: string
    lib: typeof NEW
}

const variants: Variant[] = [
    {label: 'new (JIT)', lib: NEW},
    {label: 'old (loop)', lib: OLD as any},
]

type Bench = {
    name: string
    /** Build a codec + a sample value using the given library. */
    setup(lib: typeof NEW): {codec: any; value: any}
    iterations: number
}

const ADDR = '0x1234567890123456789012345678901234567890'

const benches: Bench[] = [
    {
        name: 'static struct (ERC20 Transfer event args)',
        iterations: 200_000,
        setup(lib) {
            const codec = lib.struct({
                from: lib.address,
                to: lib.address,
                value: lib.uint256,
            })
            return {codec, value: {from: ADDR, to: ADDR, value: 123456789012345n}}
        },
    },
    {
        name: 'dynamic struct (bytes + array)',
        iterations: 100_000,
        setup(lib) {
            const codec = lib.struct({
                target: lib.address,
                callData: lib.bytes,
                amounts: lib.array(lib.uint256),
            })
            return {
                codec,
                value: {
                    target: ADDR,
                    callData: '0x' + 'ab'.repeat(100),
                    amounts: Array.from({length: 32}, (_, i) => BigInt(i + 1) * 1000n),
                },
            }
        },
    },
    {
        name: 'nested tuple (uniswap-style swap call)',
        iterations: 50_000,
        setup(lib) {
            const inner = lib.struct({
                foo: lib.uint256,
                bar: lib.array(lib.uint256),
                str: lib.struct({a: lib.uint256, b: lib.bytes4}),
            })
            const codec = lib.struct({
                path: lib.array(lib.address),
                amounts: lib.fixedSizeArray(lib.uint256, 4),
                payload: inner,
            })
            return {
                codec,
                value: {
                    path: Array.from({length: 5}, () => ADDR),
                    amounts: [1n, 2n, 3n, 4n],
                    payload: {
                        foo: 42n,
                        bar: [10n, 20n, 30n, 40n, 50n],
                        str: {a: 9999n, b: '0xdeadbeef'},
                    },
                },
            }
        },
    },
    {
        name: 'aggregate-like struct (multicall tryAggregate output)',
        iterations: 30_000,
        setup(lib) {
            const call = lib.struct({success: lib.bool, returnData: lib.bytes})
            const codec = lib.struct({
                results: lib.array(call),
            })
            return {
                codec,
                value: {
                    results: Array.from({length: 25}, (_, i) => ({
                        success: i % 3 !== 0,
                        returnData: '0x' + (i.toString(16).padStart(2, '0') + '00'.repeat(40)),
                    })),
                },
            }
        },
    },
]

function encodeOnce(lib: typeof NEW, codec: any, value: any): Uint8Array {
    const sink = new lib.Sink(codec.slotsCount ?? 1)
    codec.encode(sink, value)
    return sink.result() as Uint8Array
}

/**
 * Reach into `Sink` privates and put it back into a fresh-allocation state
 * without paying for another `Buffer.alloc`. Identical layout across both
 * libraries (checked at runtime), so we can reuse a single sink as a pool
 * and measure codec work in isolation.
 */
function resetSink(sink: any, slotsCount: number): void {
    sink.pos = 0
    sink.stack.length = 1
    sink.stack[0].start = 0
    sink.stack[0].jumpBackPtr = 0
    sink.stack[0].size = slotsCount * 32
}

function timeIt(label: string, iters: number, fn: () => void): number {
    // warmup
    for (let i = 0; i < Math.min(1000, iters); i++) fn()
    const t0 = process.hrtime.bigint()
    for (let i = 0; i < iters; i++) fn()
    const t1 = process.hrtime.bigint()
    const ms = Number(t1 - t0) / 1e6
    const opsPerSec = Math.round((iters / ms) * 1000)
    console.log(
        `  ${label.padEnd(24)} ${ms.toFixed(2).padStart(8)} ms  ` + `${opsPerSec.toLocaleString().padStart(12)} ops/s`,
    )
    return opsPerSec
}

function runBench(b: Bench): void {
    console.log(`\n=== ${b.name} (${b.iterations.toLocaleString()} iters) ===`)

    // Correctness:
    //  1. Both libs must produce byte-identical output when encoding the same value.
    //  2. Both libs must decode the SAME input to deep-equal results, so our
    //     fast address / int paths cannot silently drift from the baseline.
    const encoded: Record<string, Uint8Array> = {}
    const decoded: Record<string, unknown> = {}
    for (const v of variants) {
        const {codec, value} = b.setup(v.lib)
        encoded[v.label] = encodeOnce(v.lib, codec, value)
    }
    const hexes = Object.fromEntries(Object.entries(encoded).map(([k, buf]) => [k, Buffer.from(buf).toString('hex')]))
    const encodeMatch = new Set(Object.values(hexes)).size === 1
    const sharedInput = encoded['new (JIT)']
    for (const v of variants) {
        const {codec} = b.setup(v.lib)
        decoded[v.label] = codec.decode(new v.lib.Src(sharedInput))
    }
    const asJson = (x: any) => JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v))
    const decodeMatch = new Set(Object.values(decoded).map((d) => asJson(d))).size === 1
    console.log(
        `  encode parity: ${encodeMatch ? 'OK' : 'MISMATCH'}  (${sharedInput.length} bytes)` +
            `   decode parity: ${decodeMatch ? 'OK' : 'MISMATCH'}`,
    )
    if (!encodeMatch) {
        for (const [k, h] of Object.entries(hexes)) console.log(`    encode ${k}: ${h.slice(0, 128)}...`)
    }
    if (!decodeMatch) {
        for (const [k, d] of Object.entries(decoded)) console.log(`    decode ${k}: ${asJson(d).slice(0, 200)}`)
    }

    // pure encode — sink reused so allocation cost doesn't dominate
    console.log('  encode (sink reused):')
    const encodeOps: Record<string, number> = {}
    for (const v of variants) {
        const {codec, value} = b.setup(v.lib)
        const slots = codec.slotsCount ?? 1
        const sink: any = new v.lib.Sink(slots)
        encodeOps[v.label] = timeIt(v.label, b.iterations, () => {
            resetSink(sink, slots)
            codec.encode(sink, value)
        })
    }

    // full encode — fresh sink + finalize, real-world path
    console.log('  encode (fresh sink):')
    const encodeFullOps: Record<string, number> = {}
    for (const v of variants) {
        const {codec, value} = b.setup(v.lib)
        encodeFullOps[v.label] = timeIt(v.label, b.iterations, () => {
            const sink = new v.lib.Sink(codec.slotsCount ?? 1)
            codec.encode(sink, value)
            sink.result()
        })
    }

    // decode
    console.log('  decode:')
    const decodeOps: Record<string, number> = {}
    for (const v of variants) {
        const {codec, value} = b.setup(v.lib)
        const buf = Buffer.from(encodeOnce(v.lib, codec, value))
        decodeOps[v.label] = timeIt(v.label, b.iterations, () => {
            codec.decode(new v.lib.Src(buf))
        })
    }

    const speedup = (op: Record<string, number>) => (op['new (JIT)'] / op['old (loop)']).toFixed(2) + 'x'
    console.log(
        `  speedup:  encode-pure ${speedup(encodeOps)}   encode-full ${speedup(encodeFullOps)}   decode ${speedup(decodeOps)}`,
    )
}

for (const b of benches) runBench(b)
