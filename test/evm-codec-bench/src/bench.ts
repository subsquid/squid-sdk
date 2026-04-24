/**
 * StructCodec-level encode/decode benchmark.
 *
 * Three variants go through the same timing loop:
 *   - `new (JIT)`  — locally built `@subsquid/evm-codec`
 *   - `old (loop)` — last published baseline from npm (alias `evm-codec-old`)
 *   - `viem`       — `encodeAbiParameters` / `decodeAbiParameters`
 *
 * Each variant exposes the same `encode(value) => hex` / `decode(hex) => value`
 * surface so the timing harness doesn't need to care which library is under
 * test.
 */
import * as NEW from '@subsquid/evm-codec'
import * as OLD from 'evm-codec-old'
import {type AbiParameter, decodeAbiParameters, encodeAbiParameters} from 'viem'

interface Variant {
    label: string
    encode(value: any): `0x${string}`
    decode(data: `0x${string}`): any
}

interface Bench {
    name: string
    iterations: number
    value: any
    variants(): Variant[]
}

const ADDR = '0x1234567890123456789012345678901234567890'

type SquidLib = typeof NEW

function squidVariant(label: string, lib: SquidLib, buildCodec: (lib: SquidLib) => any): Variant {
    const codec = buildCodec(lib)
    const slots = codec.slotsCount ?? 1
    // The old published baseline doesn't expose `HexSrc` / `HexSink`, so
    // its encode has to go through `Sink` + bytes→hex conversion and its
    // decode through `Src` + hex→bytes conversion (both matching what
    // the old AbiFunction did internally anyway).
    const HexSinkCtor = (lib as any).HexSink
    const HexSrcCtor = (lib as any).HexSrc
    const BytesSinkCtor: typeof lib.BytesSink = lib.BytesSink ?? (lib as any).Sink
    const BytesSrcCtor: typeof lib.BytesSrc = lib.BytesSrc ?? (lib as any).Src
    return {
        label,
        encode(value) {
            if (HexSinkCtor) {
                const sink = new HexSinkCtor(slots)
                codec.encode(sink, value)
                return sink.toString() as `0x${string}`
            }
            const sink = new BytesSinkCtor(slots)
            codec.encode(sink, value)
            return sink.toString() as `0x${string}`
        },
        decode(data) {
            if (HexSrcCtor) return codec.decode(new HexSrcCtor(data))
            const buf = Buffer.from(data.slice(2), 'hex')
            return codec.decode(new BytesSrcCtor(buf))
        },
    }
}

/**
 * Wrap the struct definition in a top-level tuple so encoding one struct
 * value maps cleanly onto viem's `(params, values)` signature.
 */
function viemVariant(components: AbiParameter[]): Variant {
    const params: AbiParameter[] = [{type: 'tuple', components}]
    return {
        label: 'viem',
        encode(value) {
            return encodeAbiParameters(params, [value])
        },
        decode(data) {
            return decodeAbiParameters(params, data)[0]
        },
    }
}

const benches: Bench[] = [
    {
        name: 'static struct (ERC20 Transfer event args)',
        iterations: 200_000,
        value: {from: ADDR, to: ADDR, value: 123_456_789_012_345n},
        variants() {
            const build = (lib: SquidLib) =>
                lib.struct({from: lib.address, to: lib.address, value: lib.uint256})
            return [
                squidVariant('new (JIT)', NEW, build),
                squidVariant('old (loop)', OLD as any, build),
                viemVariant([
                    {name: 'from', type: 'address'},
                    {name: 'to', type: 'address'},
                    {name: 'value', type: 'uint256'},
                ]),
            ]
        },
    },
    {
        name: 'dynamic struct (bytes + array)',
        iterations: 100_000,
        value: {
            target: ADDR,
            callData: `0x${'ab'.repeat(100)}`,
            amounts: Array.from({length: 32}, (_, i) => BigInt(i + 1) * 1000n),
        },
        variants() {
            const build = (lib: SquidLib) =>
                lib.struct({target: lib.address, callData: lib.bytes, amounts: lib.array(lib.uint256)})
            return [
                squidVariant('new (JIT)', NEW, build),
                squidVariant('old (loop)', OLD as any, build),
                viemVariant([
                    {name: 'target', type: 'address'},
                    {name: 'callData', type: 'bytes'},
                    {name: 'amounts', type: 'uint256[]'},
                ]),
            ]
        },
    },
    {
        name: 'nested tuple (uniswap-style swap call)',
        iterations: 50_000,
        value: {
            path: Array.from({length: 5}, () => ADDR),
            amounts: [1n, 2n, 3n, 4n],
            payload: {
                foo: 42n,
                bar: [10n, 20n, 30n, 40n, 50n],
                str: {a: 9999n, b: '0xdeadbeef'},
            },
        },
        variants() {
            const build = (lib: SquidLib) => {
                const inner = lib.struct({
                    foo: lib.uint256,
                    bar: lib.array(lib.uint256),
                    str: lib.struct({a: lib.uint256, b: lib.bytes4}),
                })
                return lib.struct({
                    path: lib.array(lib.address),
                    amounts: lib.fixedSizeArray(lib.uint256, 4),
                    payload: inner,
                })
            }
            return [
                squidVariant('new (JIT)', NEW, build),
                squidVariant('old (loop)', OLD as any, build),
                viemVariant([
                    {name: 'path', type: 'address[]'},
                    {name: 'amounts', type: 'uint256[4]'},
                    {
                        name: 'payload',
                        type: 'tuple',
                        components: [
                            {name: 'foo', type: 'uint256'},
                            {name: 'bar', type: 'uint256[]'},
                            {
                                name: 'str',
                                type: 'tuple',
                                components: [
                                    {name: 'a', type: 'uint256'},
                                    {name: 'b', type: 'bytes4'},
                                ],
                            },
                        ],
                    },
                ]),
            ]
        },
    },
    {
        name: 'aggregate-like struct (multicall tryAggregate output)',
        iterations: 30_000,
        value: {
            results: Array.from({length: 25}, (_, i) => ({
                success: i % 3 !== 0,
                returnData: `0x${i.toString(16).padStart(2, '0') + '00'.repeat(40)}`,
            })),
        },
        variants() {
            const build = (lib: SquidLib) => {
                const call = lib.struct({success: lib.bool, returnData: lib.bytes})
                return lib.struct({results: lib.array(call)})
            }
            return [
                squidVariant('new (JIT)', NEW, build),
                squidVariant('old (loop)', OLD as any, build),
                viemVariant([
                    {
                        name: 'results',
                        type: 'tuple[]',
                        components: [
                            {name: 'success', type: 'bool'},
                            {name: 'returnData', type: 'bytes'},
                        ],
                    },
                ]),
            ]
        },
    },
]

function timeIt(label: string, iters: number, fn: () => void): number {
    for (let i = 0; i < Math.min(1000, iters); i++) fn()
    const t0 = process.hrtime.bigint()
    for (let i = 0; i < iters; i++) fn()
    const t1 = process.hrtime.bigint()
    const ms = Number(t1 - t0) / 1e6
    const opsPerSec = Math.round((iters / ms) * 1000)
    console.log(`  ${label.padEnd(14)} ${ms.toFixed(2).padStart(8)} ms  ${opsPerSec.toLocaleString().padStart(12)} ops/s`)
    return opsPerSec
}

const asJson = (x: unknown) => JSON.stringify(x, (_, v) => (typeof v === 'bigint' ? `${v.toString()}n` : v))

function runBench(b: Bench): void {
    console.log(`\n=== ${b.name} (${b.iterations.toLocaleString()} iters) ===`)

    const variants = b.variants()

    // Encode parity: all variants should produce the same hex for the
    // same value. Decode parity: all variants should recover the same
    // shape (up to bigint wrapping).
    const encoded: Record<string, `0x${string}`> = {}
    for (const v of variants) encoded[v.label] = v.encode(b.value)
    const encodeMatch = new Set(Object.values(encoded).map((s) => s.toLowerCase())).size === 1
    const reference = encoded[variants[0].label]
    const decoded: Record<string, unknown> = {}
    for (const v of variants) decoded[v.label] = v.decode(reference)
    const decodeMatch = new Set(Object.values(decoded).map(asJson)).size === 1
    console.log(
        `  encode parity: ${encodeMatch ? 'OK' : 'MISMATCH'}   decode parity: ${decodeMatch ? 'OK' : 'MISMATCH'}`,
    )
    if (!encodeMatch) {
        for (const [k, h] of Object.entries(encoded)) console.log(`    ${k.padEnd(12)}: ${h.slice(0, 130)}...`)
    }
    if (!decodeMatch) {
        for (const [k, d] of Object.entries(decoded)) console.log(`    ${k.padEnd(12)}: ${asJson(d).slice(0, 200)}`)
    }

    console.log('  encode:')
    const encOps: Record<string, number> = {}
    for (const v of variants) {
        encOps[v.label] = timeIt(v.label, b.iterations, () => {
            v.encode(b.value)
        })
    }

    console.log('  decode:')
    const decOps: Record<string, number> = {}
    for (const v of variants) {
        decOps[v.label] = timeIt(v.label, b.iterations, () => {
            v.decode(reference)
        })
    }

    console.log('  speedup (new vs baseline):')
    const baselines = ['old (loop)', 'viem']
    for (const base of baselines) {
        if (!(base in encOps)) continue
        console.log(
            `    vs ${base.padEnd(12)} encode ${(encOps['new (JIT)'] / encOps[base]).toFixed(2)}x   ` +
                `decode ${(decOps['new (JIT)'] / decOps[base]).toFixed(2)}x`,
        )
    }
}

for (const b of benches) runBench(b)
