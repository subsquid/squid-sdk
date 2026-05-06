/**
 * Facade-level benchmark for `AbiEvent.encode` / `AbiEvent.decode` and
 * `AbiFunction.encode` / `AbiFunction.decode`.
 *
 * Three variants go through the same timing loop:
 *   - `new (JIT)`  — locally built `@subsquid/evm-abi`
 *   - `old (loop)` — last published baseline from npm (alias `evm-abi-old`)
 *   - `viem`       — `encodeEventTopics` + `encodeAbiParameters` /
 *                    `decodeEventLog` / `encodeFunctionData` /
 *                    `decodeFunctionData`
 */
import * as NEW_ABI from '@subsquid/evm-abi'
import * as NEW_CODEC from '@subsquid/evm-codec'
import * as OLD_ABI from 'evm-abi-old'
import * as OLD_CODEC from 'evm-codec-old'
import {strict as assert} from 'node:assert'
import {
    type AbiEvent as ViemAbiEvent,
    type AbiFunction as ViemAbiFunction,
    encodeAbiParameters,
    decodeEventLog,
    decodeFunctionData,
    encodeEventTopics,
    encodeFunctionData,
    parseAbiItem,
} from 'viem'

interface Variant {
    label: string
    encode?(value: any): any
    decode(input: any): any
}

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

function printSpeedup(
    ops: Record<string, Record<string, number>>,
    baseLabels: readonly string[],
    metrics: readonly string[],
): void {
    console.log('  speedup (new vs baseline):')
    for (const base of baseLabels) {
        const parts: string[] = []
        for (const m of metrics) {
            const cur = ops[m]
            if (cur == null || !(base in cur) || !('new (JIT)' in cur)) continue
            parts.push(`${m} ${(cur['new (JIT)'] / cur[base]).toFixed(2)}x`)
        }
        if (parts.length) console.log(`    vs ${base.padEnd(12)} ${parts.join('   ')}`)
    }
}

// ----------------------------------------------------------------------
// AbiEvent.decode: ERC-20 Transfer
// ----------------------------------------------------------------------

const ADDR_FROM = '0x1111111111111111111111111111111111111111'
const ADDR_TO = '0x2222222222222222222222222222222222222222'
const ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
const TRANSFER_EVENT = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
) as ViemAbiEvent
const TRANSFER_DATA_PARAMS = [{type: 'uint256'}] as const

function buildEventVariants(): Variant[] {
    const newEvent = NEW_ABI.event(ERC20_TRANSFER_TOPIC, {
        from: NEW_ABI.indexed(NEW_CODEC.address),
        to: NEW_ABI.indexed(NEW_CODEC.address),
        value: NEW_CODEC.uint256,
    })
    // API drift: old `event(topic, signature, args)`.
    const oldEvent = (OLD_ABI.event as any)(ERC20_TRANSFER_TOPIC, 'Transfer(address,address,uint256)', {
        from: (OLD_ABI as any).indexed((OLD_CODEC as any).address),
        to: (OLD_ABI as any).indexed((OLD_CODEC as any).address),
        value: (OLD_CODEC as any).uint256,
    })

    return [
        {label: 'new (JIT)', encode: (args: any) => newEvent.encode(args), decode: (rec: any) => newEvent.decode(rec)},
        {label: 'old (loop)', decode: (rec: any) => oldEvent.decode(rec)},
        {
            label: 'viem',
            encode: (args: any) => ({
                topics: encodeEventTopics({
                    abi: [TRANSFER_EVENT],
                    eventName: 'Transfer',
                    args: {from: args.from, to: args.to},
                }),
                data: encodeAbiParameters(TRANSFER_DATA_PARAMS, [args.value]),
            }),
            decode: (rec: any) => {
                const {args} = decodeEventLog({abi: [TRANSFER_EVENT], topics: rec.topics, data: rec.data})
                return args
            },
        },
    ]
}

function benchTransferEventDecode(): void {
    console.log('\n=== AbiEvent.encode/decode: ERC-20 Transfer (200,000 iters) ===')
    const iters = 200_000
    const args = {
        from: ADDR_FROM,
        to: ADDR_TO,
        value: 123_456_789_012_345n,
    }

    const variants = buildEventVariants()

    const encodeVariants = variants.filter((v) => v.encode)
    const encodedAll: Record<string, {topics: string[]; data: string}> = {}
    for (const v of encodeVariants) encodedAll[v.label] = v.encode!(args)
    const encodeParity =
        new Set(Object.values(encodedAll).map((rec) => asJson({
            topics: rec.topics.map((topic) => topic.toLowerCase()),
            data: rec.data.toLowerCase(),
        }))).size === 1
    console.log(`  encode parity: ${encodeParity ? 'OK' : 'MISMATCH'}`)
    if (!encodeParity) {
        for (const [k, rec] of Object.entries(encodedAll)) console.log(`    ${k}: ${asJson(rec)}`)
    }

    console.log('  encode:')
    const encOps: Record<string, number> = {}
    for (const v of encodeVariants) {
        encOps[v.label] = timeIt(v.label, iters, () => {
            v.encode!(args)
        })
    }

    const rec = encodedAll['new (JIT)']

    // Parity: all three must produce deep-equal decoded args. viem
    // returns lowercase addresses with checksum mixing — so compare by
    // numeric/string values only.
    const decodedAll = variants.map((v) => v.decode(rec))
    const normalize = (d: any) => ({
        from: String(d.from).toLowerCase(),
        to: String(d.to).toLowerCase(),
        value: BigInt(d.value).toString(),
    })
    const parity = new Set(decodedAll.map((d) => asJson(normalize(d)))).size === 1
    console.log(`  decode parity: ${parity ? 'OK' : 'MISMATCH'}`)
    if (!parity) {
        for (let i = 0; i < variants.length; i++) {
            console.log(`    ${variants[i].label}: ${asJson(decodedAll[i])}`)
        }
    }

    console.log('  decode:')
    const decOps: Record<string, number> = {}
    for (const v of variants) {
        decOps[v.label] = timeIt(v.label, iters, () => {
            v.decode(rec)
        })
    }
    printSpeedup({encode: encOps, decode: decOps}, ['old (loop)', 'viem'], ['encode', 'decode'])
}

// ----------------------------------------------------------------------
// AbiFunction.encode/decode: dynamic 4-arg call
// ----------------------------------------------------------------------

const DYNAMIC_SELECTOR = '0x423917ce'
const DYNAMIC_FUNCTION = parseAbiItem(
    'function foo(uint256[] arg1, uint256[][10] arg2, (uint256 foo, uint256[] bar, (uint256 foo, bytes4 bar) str) arg3, (uint256 foo, bytes4 bar) arg4) external',
) as ViemAbiFunction

function buildDynamicFunctionVariants() {
    const staticStruct = NEW_CODEC.struct({foo: NEW_CODEC.uint256, bar: NEW_CODEC.bytes4})
    const newFn = NEW_ABI.func(DYNAMIC_SELECTOR, {
        arg1: NEW_CODEC.array(NEW_CODEC.uint256),
        arg2: NEW_CODEC.fixedSizeArray(NEW_CODEC.array(NEW_CODEC.uint256), 10),
        arg3: NEW_CODEC.struct({
            foo: NEW_CODEC.uint256,
            bar: NEW_CODEC.array(NEW_CODEC.uint256),
            str: staticStruct,
        }),
        arg4: staticStruct,
    })

    const oldStaticStruct = (OLD_CODEC as any).struct({
        foo: (OLD_CODEC as any).uint256,
        bar: (OLD_CODEC as any).bytes4,
    })
    // API drift: old `fun(selector, signature, args, retType?)`.
    const oldFn = (OLD_ABI as any).fun(
        DYNAMIC_SELECTOR,
        'foo(uint256[],uint256[][10],(uint256,uint256[],(uint256,bytes4)),(uint256,bytes4))',
        {
            arg1: (OLD_CODEC as any).array((OLD_CODEC as any).uint256),
            arg2: (OLD_CODEC as any).fixedSizeArray((OLD_CODEC as any).array((OLD_CODEC as any).uint256), 10),
            arg3: (OLD_CODEC as any).struct({
                foo: (OLD_CODEC as any).uint256,
                bar: (OLD_CODEC as any).array((OLD_CODEC as any).uint256),
                str: oldStaticStruct,
            }),
            arg4: oldStaticStruct,
        },
    )

    const encodeVariants: Variant[] = [
        {label: 'new (JIT)', encode: (args: any) => newFn.encode(args), decode: (d: any) => newFn.decode(d)},
        {label: 'old (loop)', encode: (args: any) => oldFn.encode(args), decode: (d: any) => oldFn.decode(d)},
        {
            label: 'viem',
            encode: (args: any) =>
                encodeFunctionData({
                    abi: [DYNAMIC_FUNCTION],
                    functionName: 'foo',
                    args: Object.values(args) as any,
                }),
            decode: (d: any) => decodeFunctionData({abi: [DYNAMIC_FUNCTION], data: d}).args,
        },
    ]
    return {newFn, encodeVariants}
}

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

    const {encodeVariants: variants} = buildDynamicFunctionVariants()

    // Encode parity: all three must produce the same calldata.
    const encodedAll: Record<string, string> = {}
    for (const v of variants) encodedAll[v.label] = v.encode!(args)
    const parity = new Set(Object.values(encodedAll).map((s) => s.toLowerCase())).size === 1
    console.log(`  encode parity: ${parity ? 'OK' : 'MISMATCH'}`)
    if (!parity) {
        for (const [k, h] of Object.entries(encodedAll)) console.log(`    ${k.padEnd(12)}: ${h.slice(0, 130)}...`)
    } else {
        // smoke check: make sure our canonical encoding round-trips through viem's decoder.
        const viem = variants.find((v) => v.label === 'viem')!
        const roundTripped = viem.decode(encodedAll['new (JIT)']) as readonly unknown[]
        assert.equal(roundTripped.length, Object.keys(args).length)
    }

    console.log('  encode:')
    const encOps: Record<string, number> = {}
    for (const v of variants) {
        encOps[v.label] = timeIt(v.label, iters, () => {
            v.encode!(args)
        })
    }

    console.log('  decode:')
    const decOps: Record<string, number> = {}
    const reference = encodedAll['new (JIT)']
    for (const v of variants) {
        decOps[v.label] = timeIt(v.label, iters, () => {
            v.decode(reference)
        })
    }

    printSpeedup({encode: encOps, decode: decOps}, ['old (loop)', 'viem'], ['encode', 'decode'])
}

benchTransferEventDecode()
benchDynamicFunction()
