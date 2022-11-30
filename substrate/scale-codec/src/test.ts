import assert from "assert"
import {HexSink, Sink} from "./sink"
import {Src} from "./src"


function testCompact(hex: string, val: number | bigint): void {
    let src = new Src(hex)
    assert.strictEqual(src.compact(), val)
    src.assertEOF()
    let sink = new HexSink()
    sink.compact(val)
    assert.strictEqual(sink.toHex(), hex)
}


testCompact('0x00', 0)
testCompact('0x04', 1)
testCompact('0xa8', 42)
testCompact('0x1501', 69)
testCompact('0xfeff0300', 65535)
testCompact('0x0b00407a10f35a', 100000000000000)
testCompact('0x1700007014057fd8b806', 124000000000000000000n)


type ArgOf<M extends keyof Sink> = Sink[M] extends (arg: infer T) => void ? T : never
function ed<M extends keyof Sink>(method: M, arg: ArgOf<M>): void {
    let sink = new HexSink()
    ;(sink as any)[method](arg)
    let src = new Src(sink.toHex())
    let decoded = (src as any)[method]()
    assert.strictEqual(decoded, arg)
}


ed('u8', 5)
ed('u8', 255)
ed('i8', -100)
ed('i8', 100)
ed('bool', true)
ed('bool', false)
ed('u128', 7777777331098293847977777773n)
ed('u256', 77777773310982938479777777737777777331098293847977777773n)
ed('str', 'hello')
ed('str', 'привет')


console.log('ok')
