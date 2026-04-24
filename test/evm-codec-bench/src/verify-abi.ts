/**
 * Ad-hoc end-to-end sanity check for the new `AbiFunction` / `AbiEvent`
 * JIT-inline path. Replays the core scenarios from the (unrunnable in
 * this env) evm-abi vitest suite and asserts byte-for-byte / deep-equal
 * parity with viem so we don't silently regress when swapping the
 * per-field JS loop for `StructCodec.encodeInline` / `decodeInline`.
 */
import * as assert from 'node:assert/strict'
import {address, array, bool, bytes4, fixedSizeArray, int32, BytesSink, string, struct, uint256} from '@subsquid/evm-codec'
import {event, func, indexed} from '@subsquid/evm-abi'
import {encodeEventTopics, encodeFunctionData, parseAbiItem} from 'viem'

function check(name: string, run: () => void) {
    try {
        run()
        console.log(`  OK    ${name}`)
    } catch (e: any) {
        console.log(`  FAIL  ${name}`)
        console.log(`        ${e.stack || e.message}`)
        process.exitCode = 1
    }
}

// ---------- functions ----------

check('simple static function round-trips', () => {
    const simple = func('0x12345678', {
        foo: uint256,
        _1: int32,
        _2: bool,
    })
    const calldata = simple.encode({foo: 100n, _1: -420, _2: true})
    assert.equal(
        calldata,
        '0x123456780000000000000000000000000000000000000000000000000000000000000064fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe5c0000000000000000000000000000000000000000000000000000000000000001',
    )
    assert.deepEqual(simple.decode(calldata), {foo: 100n, _1: -420, _2: true})
})

check('dynamic function matches viem byte-for-byte', () => {
    const staticStruct = struct({foo: uint256, bar: bytes4})
    const dynamic = func('0x423917ce', {
        arg1: array(uint256),
        arg2: fixedSizeArray(array(uint256), 10),
        arg3: struct({
            foo: uint256,
            bar: array(uint256),
            str: staticStruct,
        }),
        arg4: staticStruct,
    })
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
    const calldata = dynamic.encode(args)
    const expected = encodeFunctionData({
        abi: [
            {
                name: 'foo',
                type: 'function',
                inputs: [
                    {name: 'arg1', type: 'uint256[]'},
                    {name: 'arg2', type: 'uint256[][10]'},
                    {
                        name: 'arg3',
                        type: 'tuple',
                        components: [
                            {name: 'foo', type: 'uint256'},
                            {name: 'bar', type: 'uint256[]'},
                            {
                                name: 'str',
                                type: 'tuple',
                                components: [
                                    {name: 'foo', type: 'uint256'},
                                    {name: 'bar', type: 'bytes4'},
                                ],
                            },
                        ],
                    },
                    {
                        name: 'arg4',
                        type: 'tuple',
                        components: [
                            {name: 'foo', type: 'uint256'},
                            {name: 'bar', type: 'bytes4'},
                        ],
                    },
                ],
            },
        ],
        functionName: 'foo',
        args: Object.values(args) as any,
    })
    assert.equal(calldata, expected)
    assert.deepEqual(dynamic.decode(calldata), args)
})

check('function with single non-struct return decodes', () => {
    const simple = func('0x12345678', {foo: uint256}, int32)
    const sink = new BytesSink(1)
    int32.encode(sink, -420)
    assert.equal(simple.decodeResult(sink.toString()), -420)
})

check('function with multi-value (struct) return decodes', () => {
    const _func = func('0x12345678', {}, struct({_0: uint256, b: string}))
    const output =
        '0x0000000000000000000000000000000000000000000000000000000000000064' +
        '0000000000000000000000000000000000000000000000000000000000000040' +
        '0000000000000000000000000000000000000000000000000000000000000005' +
        '68656c6c6f000000000000000000000000000000000000000000000000000000'
    assert.deepEqual(_func.decodeResult(output), {_0: 100n, b: 'hello'})
})

// ---------- events ----------

check('indexed event matches viem topic layout and decodes', () => {
    const abiItem = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)')
    const addrFrom = '0x1111111111111111111111111111111111111111'
    const addrTo = '0x2222222222222222222222222222222222222222'
    const topicsViem = encodeEventTopics({
        abi: [abiItem],
        args: {from: addrFrom, to: addrTo},
    })

    const Transfer = event(topicsViem[0]!, {
        from: indexed(address),
        to: indexed(address),
        value: uint256,
    })

    const encoded = Transfer.encode({from: addrFrom, to: addrTo, value: 42n})
    assert.deepEqual(encoded.topics, topicsViem)
    assert.equal(encoded.data, `0x${42n.toString(16).padStart(64, '0')}`)

    const decoded = Transfer.decode(encoded)
    assert.deepEqual(decoded, {from: addrFrom, to: addrTo, value: 42n})
})

check('event with mixed indexed + non-indexed dynamic data decodes', () => {
    // Custom event with 1 indexed address and a 2-field dynamic data tuple
    // (uint256, string). We use a made-up topic; we only care about the
    // data-section round-trip.
    const topic = `0x${'ab'.repeat(32)}`
    const E = event(topic, {
        sender: indexed(address),
        amount: uint256,
        memo: string,
    })
    const sample = {
        sender: '0x1234567890123456789012345678901234567890',
        amount: 123_456n,
        memo: 'hello world',
    }
    const encoded = E.encode(sample)
    assert.deepEqual(E.decode(encoded), sample)
})

if (!process.exitCode) console.log('\nverify-abi: all checks passed')
