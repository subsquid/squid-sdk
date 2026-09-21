import assert from 'assert'
import { describe, test } from 'vitest'
import { HexSink, Sink } from './sink'
import { Src } from './src'


function testCompact(hex: string, val: number | bigint): void {
    let src = new Src(hex)
    assert.strictEqual(src.compact(), val)
    src.assertEOF()
    let sink = new HexSink()
    sink.compact(val)
    assert.strictEqual(sink.toHex(), hex)
}


describe('compact codec', () => {
    test('0', () => testCompact('0x00', 0))
    test('1', () => testCompact('0x04', 1))
    test('42', () => testCompact('0xa8', 42))
    test('69', () => testCompact('0x1501', 69))
    test('65535', () => testCompact('0xfeff0300', 65535))
    test('100000000000000', () => testCompact('0x0b00407a10f35a', 100000000000000))
    test('124000000000000000000n', () => testCompact('0x1700007014057fd8b806', 124000000000000000000n))
})


type ArgOf<M extends keyof Sink> = Sink[M] extends (arg: infer T) => void ? T : never
function ed<M extends keyof Sink>(method: M, arg: ArgOf<M>): void {
    let sink = new HexSink()
    ;(sink as any)[method](arg)
    let src = new Src(sink.toHex())
    let decoded = (src as any)[method]()
    assert.strictEqual(decoded, arg)
}


describe('encode/decode', () => {
    test('u8 5', () => ed('u8', 5))
    test('u8 255', () => ed('u8', 255))
    test('i8 -100', () => ed('i8', -100))
    test('i8 100', () => ed('i8', 100))
    test('bool true', () => ed('bool', true))
    test('bool false', () => ed('bool', false))
    test('u128', () => ed('u128', 7777777331098293847977777773n))
    test('u256', () => ed('u256', 77777773310982938479777777737777777331098293847977777773n))
    test('str hello', () => ed('str', 'hello'))
    test('str unicode', () => ed('str', 'привет'))
})
