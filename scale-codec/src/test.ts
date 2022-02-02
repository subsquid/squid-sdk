import assert from "assert"
import {Src} from "./src"


function testCompact(hex: string, val: number | bigint): void {
    let src = new Src(hex)
    assert.strictEqual(src.compact(), val)
    src.assertEOF()
}


testCompact('0x00', 0)
testCompact('0x04', 1)
testCompact('0xa8', 42)
testCompact('0x1501', 69)
testCompact('0xfeff0300', 65535)
testCompact('0x0b00407a10f35a', 100000000000000)
testCompact('0x1700007014057fd8b806', 124000000000000000000n)
