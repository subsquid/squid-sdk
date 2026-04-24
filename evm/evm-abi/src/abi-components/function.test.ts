import {describe, expect, it} from 'vitest'
import {array, bool, bytes4, fixedSizeArray, int32, Sink, string, struct, uint256} from '@subsquid/evm-codec'
import {fun} from '..'

describe('Function', () => {
    it('encodes/decodes simple args', () => {
        const simpleFunction = fun('0x12345678', {
            foo: uint256,
            _1: int32,
            _2: bool,
        })
        const calldata = simpleFunction.encode({
            foo: 100n,
            _1: -420,
            _2: true,
        })
        // Pinned expected hex — ABI-spec anchor so a change to the static
        // layout is loud, independent of any cross-library round-trip.
        expect(calldata).toBe(
            '0x123456780000000000000000000000000000000000000000000000000000000000000064fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe5c0000000000000000000000000000000000000000000000000000000000000001',
        )
        expect(simpleFunction.decode(calldata)).toStrictEqual({
            foo: 100n,
            _1: -420,
            _2: true,
        })
    })

    it('encodes/decodes dynamic args (round-trip)', () => {
        const staticStruct = struct({
            foo: uint256,
            bar: bytes4,
        })
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
                str: {
                    foo: 123n,
                    bar: '0x12345678',
                },
            },
            arg4: {
                foo: 100n,
                bar: '0x12345678',
            },
        }

        const calldata = dynamicFunction.encode(args)
        expect(calldata.startsWith('0x423917ce')).toBe(true)
        expect(dynamicFunction.decode(calldata)).toStrictEqual(args)
    })

    it('return simple type', () => {
        const simpleFunction = fun(
            '0x12345678',
            {
                foo: uint256,
            },
            int32,
        )
        const sink = new Sink(1)
        int32.encode(sink, -420)
        expect(simpleFunction.decodeResult(sink.toString())).toBe(-420)
    })

    it('return tuple (round-trip through Sink)', () => {
        // Hand-build the ABI-encoded return blob using Sink so the test
        // doesn't depend on a third-party encoder.
        const sink = new Sink(1)
        sink.newStaticDataArea()
        sink.u256(100n)
        sink.string('hello')
        sink.endCurrentDataArea()

        const _fun = fun('0x12345678', {}, struct({_0: uint256, b: string}))
        expect(_fun.decodeResult(sink.toString())).toStrictEqual({_0: 100n, b: 'hello'})
    })
})
