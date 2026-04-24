/**
 * Non-vitest runner for evm/evm-abi/test/function.test.ts plus a few
 * extra checks targeting the new bookmark-per-field JIT in
 * `AbiFunction.decode` / `decodeResult`. The project's vitest@4.1.5
 * has a broken native-binding loader unrelated to our changes, so we
 * re-run the same assertions using node:assert.
 */
import {strict as assert} from 'node:assert'
import {encodeFunctionData, encodeFunctionResult, parseAbiItem} from 'viem'

const repo = '/home/belopash/subsquid/squid-sdk'
const {array, bool, bytes4, fixedSizeArray, int32, Sink, string, struct, uint256} = await import(
    `${repo}/evm/evm-codec/lib/index.js`
)
const {fun} = await import(`${repo}/evm/evm-abi/lib/index.js`)
const {FunctionCalldataDecodeError, FunctionResultDecodeError, FunctionInvalidSignatureError} = await import(
    `${repo}/evm/evm-abi/lib/errors.js`
)

function runTest(name, fn) {
    try {
        fn()
        console.log(`ok  ${name}`)
    } catch (e) {
        console.error(`FAIL ${name}`)
        console.error(e)
        process.exitCode = 1
    }
}

runTest('encodes/decodes simple args', () => {
    const simpleFunction = fun('0x12345678', {
        foo: uint256,
        _1: int32,
        _2: bool,
    })
    const calldata = simpleFunction.encode({foo: 100n, _1: -420, _2: true})
    assert.equal(
        calldata,
        '0x123456780000000000000000000000000000000000000000000000000000000000000064fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe5c0000000000000000000000000000000000000000000000000000000000000001',
    )
    assert.deepEqual(simpleFunction.decode(calldata), {foo: 100n, _1: -420, _2: true})
})

runTest('encodes/decodes dynamic args (viem parity)', () => {
    const staticStruct = struct({foo: uint256, bar: bytes4})
    const dynamicFunction = fun('0x423917ce', {
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
    const viemArgs = Object.values(args)
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
        args: viemArgs,
    })
    assert.equal(dynamicFunction.encode(args), expected)
    assert.deepEqual(dynamicFunction.decode(expected), args)
})

runTest('single return type', () => {
    const simpleFunction = fun('0x12345678', {foo: uint256}, int32)
    const sink = new Sink(1)
    int32.encode(sink, -420)
    assert.equal(simpleFunction.decodeResult(sink.toString()), -420)
})

runTest('tuple return type (viem parity)', () => {
    const data = encodeFunctionResult({
        abi: [parseAbiItem('function foo() external returns (uint256, string memory b)')],
        functionName: 'foo',
        result: [100n, 'hello'],
    })
    const _fun = fun('0x12345678', {}, struct({_0: uint256, b: string}))
    assert.deepEqual(_fun.decodeResult(data), {_0: 100n, b: 'hello'})
})

runTest('invalid selector throws FunctionInvalidSignatureError', () => {
    const f = fun('0x12345678', {a: uint256})
    const calldata = '0xdeadbeef' + '00'.repeat(32)
    assert.throws(() => f.decode(calldata), (e) => e instanceof FunctionInvalidSignatureError)
})

runTest('bad arg bytes surface FunctionCalldataDecodeError with right field name', () => {
    // Dynamic string arg with a garbage out-of-range offset so that when
    // the JIT's `__d1(src)` runs we throw inside the codec. The
    // bookmark should point at `arg2`, not arg1.
    const f = fun('0x12345678', {arg1: uint256, arg2: string})
    // arg1 = 1, arg2 offset = huge -> will overflow the input when read.
    const arg1 = '0000000000000000000000000000000000000000000000000000000000000001'
    const arg2Offset = 'f'.repeat(64)
    const calldata = '0x12345678' + arg1 + arg2Offset

    let caught = null
    try {
        f.decode(calldata)
    } catch (e) {
        caught = e
    }
    assert.ok(caught instanceof FunctionCalldataDecodeError, `expected FunctionCalldataDecodeError, got ${caught}`)
    assert.match(caught.message, /argument arg2 of function/, `expected arg2 in message, got:\n${caught.message}`)
})

runTest('bad result bytes surface FunctionResultDecodeError with right field name', () => {
    const f = fun('0x12345678', {}, struct({a: uint256, b: string}))
    // a = 1, then bogus huge offset for `b`.
    const a = '0000000000000000000000000000000000000000000000000000000000000001'
    const bOffset = 'f'.repeat(64)
    const output = '0x' + a + bOffset

    let caught = null
    try {
        f.decodeResult(output)
    } catch (e) {
        caught = e
    }
    assert.ok(caught instanceof FunctionResultDecodeError, `expected FunctionResultDecodeError, got ${caught}`)
    assert.match(caught.message, /argument b of function/, `expected b in message, got:\n${caught.message}`)
})

runTest('no-return function: decodeResult -> undefined', () => {
    const f = fun('0x12345678', {a: uint256})
    assert.equal(f.decodeResult('0x'), undefined)
})
