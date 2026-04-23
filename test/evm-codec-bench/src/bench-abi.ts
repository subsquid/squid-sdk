/**
 * Facade-level benchmark that exercises `AbiEvent.decode` and
 * `AbiFunction.encode/decode` against the last published npm baseline.
 *
 * Before the recent change these facades unwrapped the `StructCodec`
 * they were given and ran a per-field JS loop — exactly like the old
 * (pre-JIT) baseline. They now hit the JIT body directly (either via
 * `StructCodec.encodeInline/decodeInline` for functions, or a bespoke
 * JIT in `AbiEvent`), so the speedup should be visible end-to-end.
 *
 * Note: `AbiEvent.encode` only exists in the new version, so we bench
 * it separately without a baseline comparison.
 */
import * as NEW_ABI from '@subsquid/evm-abi'
import * as NEW_CODEC from '@subsquid/evm-codec'
import * as OLD_ABI from 'evm-abi-old'
import * as OLD_CODEC from 'evm-codec-old'
import {strict as assert} from 'node:assert'

interface Variant {
    label: string
    abi: typeof NEW_ABI
    codec: typeof NEW_CODEC
}

const variants: Variant[] = [
    {label: 'new (JIT)', abi: NEW_ABI, codec: NEW_CODEC},
    {label: 'old (loop)', abi: OLD_ABI as any, codec: OLD_CODEC as any},
]

function timeIt(label: string, iters: number, fn: () => void): number {
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

const ADDR_FROM = '0x1111111111111111111111111111111111111111'
const ADDR_TO = '0x2222222222222222222222222222222222222222'
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

function makeTransfer(v: Variant) {
    const params: any = {
        from: v.abi.indexed(v.codec.address),
        to: v.abi.indexed(v.codec.address),
        value: v.codec.uint256,
    }
    // API drift across versions: old `event(topic, signature, args)`,
    // new `event(topic, args)`.
    return v.label === 'new (JIT)'
        ? v.abi.event(ERC20_TRANSFER_TOPIC, params)
        : (v.abi.event as any)(ERC20_TRANSFER_TOPIC, 'Transfer(address,address,uint256)', params)
}

// ---------- AbiEvent decode ----------

function benchTransferEventDecode(): void {
    console.log('\n=== AbiEvent.decode: ERC-20 Transfer (200,000 iters) ===')
    const iters = 200_000

    // Build a realistic log record (hand-encoded to be independent of
    // either version).
    const rec = {
        topics: [
            ERC20_TRANSFER_TOPIC,
            '0x' + '00'.repeat(12) + ADDR_FROM.slice(2),
            '0x' + '00'.repeat(12) + ADDR_TO.slice(2),
        ],
        data: '0x' + (123_456_789_012_345n).toString(16).padStart(64, '0'),
    }

    // parity check
    const decodedBoth: Record<string, any> = {}
    for (const v of variants) {
        decodedBoth[v.label] = makeTransfer(v).decode(rec)
    }
    const asJson = (x: any) => JSON.stringify(x, (_, y) => (typeof y === 'bigint' ? y.toString() + 'n' : y))
    assert.equal(asJson(decodedBoth['new (JIT)']), asJson(decodedBoth['old (loop)']))
    console.log('  decode parity: OK')

    console.log('  decode:')
    const decOps: Record<string, number> = {}
    for (const v of variants) {
        const T = makeTransfer(v)
        decOps[v.label] = timeIt(v.label, iters, () => {
            T.decode(rec)
        })
    }
    console.log(`  speedup: decode ${(decOps['new (JIT)'] / decOps['old (loop)']).toFixed(2)}x`)
}

// ---------- AbiFunction: dynamic multi-arg call ----------

function benchDynamicFunction(): void {
    console.log('\n=== AbiFunction.encode/decode: dynamic 4-arg call (50,000 iters) ===')
    const iters = 50_000
    const args = {
        arg1: [100n, 2n],
        arg2: [[], [1n], [], [], [100n, 2n, 3n], [], [], [1337n], [], []],
        arg3: {
            foo: 100n,
            bar: [1n, 2n, 3n],
            str: {foo: 123n, bar: '0x12345678'},
        },
        arg4: {foo: 100n, bar: '0x12345678'},
    }

    function makeFn(v: Variant) {
        const staticStruct = v.codec.struct({foo: v.codec.uint256, bar: v.codec.bytes4})
        const argsDesc: any = {
            arg1: v.codec.array(v.codec.uint256),
            arg2: v.codec.fixedSizeArray(v.codec.array(v.codec.uint256), 10),
            arg3: v.codec.struct({
                foo: v.codec.uint256,
                bar: v.codec.array(v.codec.uint256),
                str: staticStruct,
            }),
            arg4: staticStruct,
        }
        // API drift: old `fun(selector, signature, args, retType?)`,
        // new `fun(selector, args, retType?)`.
        return v.label === 'new (JIT)'
            ? v.abi.fun('0x423917ce', argsDesc)
            : (v.abi.fun as any)('0x423917ce', 'foo(uint256[],uint256[][10],...)', argsDesc)
    }

    const encs: Record<string, string> = {}
    for (const v of variants) {
        encs[v.label] = makeFn(v).encode(args)
    }
    assert.equal(encs['new (JIT)'], encs['old (loop)'])
    console.log('  encode parity: OK')

    console.log('  encode:')
    const encOps: Record<string, number> = {}
    for (const v of variants) {
        const fn = makeFn(v)
        encOps[v.label] = timeIt(v.label, iters, () => {
            fn.encode(args)
        })
    }
    console.log('  decode:')
    const decOps: Record<string, number> = {}
    for (const v of variants) {
        const fn = makeFn(v)
        const calldata = fn.encode(args)
        decOps[v.label] = timeIt(v.label, iters, () => {
            fn.decode(calldata)
        })
    }
    console.log(
        `  speedup: encode ${(encOps['new (JIT)'] / encOps['old (loop)']).toFixed(2)}x   decode ${(decOps['new (JIT)'] / decOps['old (loop)']).toFixed(2)}x`,
    )
}

benchTransferEventDecode()
benchDynamicFunction()
