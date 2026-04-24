/**
 * Parity runner for `Src` / `HexSrc` / `hex()` / `staticHex()` /
 * `skip()`. See evm-codec/test/*.test.ts — we cannot run vitest
 * directly in this repo (pre-existing config loader bug), so this
 * file replays the critical coverage using node:assert.
 *
 * Kept in `runners/` (not `lib/`) so it survives the bench package's
 * `rm -rf lib && tsc` build step.
 */
import {strict as assert} from 'node:assert'
import {encodeAbiParameters, parseAbiItem} from 'viem'

const repo = '/home/belopash/subsquid/squid-sdk'
const codec = await import(`${repo}/evm/evm-codec/lib/index.js`)
const abi = await import(`${repo}/evm/evm-abi/lib/index.js`)

const {
    address,
    array,
    bool,
    bytes,
    bytes4,
    bytes32,
    HexSrc,
    int128,
    Sink,
    Src,
    string,
    struct,
    uint256,
} = codec
const {fun, viewFun} = abi

let passed = 0
let failed = 0
function t(name, fn) {
    try {
        fn()
        passed++
        console.log(`ok   ${name}`)
    } catch (e) {
        failed++
        console.error(`FAIL ${name}`)
        console.error(e)
    }
}

function toHex(u8) {
    return '0x' + Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength).toString('hex')
}

// ------------------------------------------------------------------
// Src.hex() / Src.staticHex() parity with toHex(src.bytes()/staticBytes())
// ------------------------------------------------------------------
t('Src.hex() matches toHex(src.bytes()) for dynamic bytes', () => {
    const payload = Buffer.alloc(137).fill('xd')
    const encoded = Buffer.from(
        encodeAbiParameters([{type: 'bytes'}], ['0x' + payload.toString('hex')]).slice(2),
        'hex',
    )
    const a = new Src(encoded)
    const b = new Src(encoded)
    assert.equal(a.hex(), toHex(b.bytes()))
})

t('Src.staticHex(n) matches toHex(src.staticBytes(n)) for bytesN', () => {
    const val = '0x12345678abcdef'
    const s = new Sink(1)
    s.staticBytes(7, Buffer.from(val.slice(2), 'hex'))
    const encoded = s.result()
    const a = new Src(encoded)
    const b = new Src(encoded)
    assert.equal(a.staticHex(7), toHex(b.staticBytes(7)))
})

// ------------------------------------------------------------------
// skip(n) — Src and HexSrc must behave identically
// ------------------------------------------------------------------
t('Src.skip(32) advances to the next word', () => {
    const s = new Sink(3)
    s.u256(111n)
    s.u256(222n)
    s.u256(333n)
    const src = new Src(s.result())
    src.skip(32)
    assert.equal(src.u256(), 222n)
    src.skip(0)
    assert.equal(src.u256(), 333n)
})

t('HexSrc.skip(32) advances identically to Src', () => {
    const s = new Sink(3)
    s.u256(111n)
    s.u256(222n)
    s.u256(333n)
    const src = new HexSrc(toHex(s.result()))
    src.skip(32)
    assert.equal(src.u256(), 222n)
    src.skip(0)
    assert.equal(src.u256(), 333n)
})

t('Src.skip throws on out-of-range', () => {
    const src = new Src(new Uint8Array(32))
    assert.throws(() => src.skip(64), /Cannot skip/)
    assert.throws(() => src.skip(-1), /Cannot skip/)
})

t('HexSrc.skip throws on out-of-range', () => {
    const src = new HexSrc('0x' + '00'.repeat(32))
    assert.throws(() => src.skip(64), /Cannot skip/)
    assert.throws(() => src.skip(-1), /Cannot skip/)
})

// ------------------------------------------------------------------
// Numeric parity
// ------------------------------------------------------------------
t('Src: negative numbers roundtrip', () => {
    const s = new Sink(6)
    s.i8(-1); s.i16(-123); s.i32(-123456)
    s.i64(-1234567890n); s.i128(-12345678901234567890n)
    s.i256(-1234567890123456789012345678901234567890n)
    const src = new Src(s.result())
    assert.equal(src.i8(), -1)
    assert.equal(src.i16(), -123)
    assert.equal(src.i32(), -123456)
    assert.equal(src.i64(), -1234567890n)
    assert.equal(src.i128(), -12345678901234567890n)
    assert.equal(src.i256(), -1234567890123456789012345678901234567890n)
})

t('HexSrc: negative numbers roundtrip (parity with Src)', () => {
    const s = new Sink(6)
    s.i8(-1); s.i16(-123); s.i32(-123456)
    s.i64(-1234567890n); s.i128(-12345678901234567890n)
    s.i256(-1234567890123456789012345678901234567890n)
    const src = new HexSrc(toHex(s.result()))
    assert.equal(src.i8(), -1)
    assert.equal(src.i16(), -123)
    assert.equal(src.i32(), -123456)
    assert.equal(src.i64(), -1234567890n)
    assert.equal(src.i128(), -12345678901234567890n)
    assert.equal(src.i256(), -1234567890123456789012345678901234567890n)
})

t('HexSrc: positive signed numbers roundtrip', () => {
    const s = new Sink(6)
    s.i8(1); s.i16(123); s.i32(123456)
    s.i64(1234567890n); s.i128(12345678901234567890n)
    s.i256(1234567890123456789012345678901234567890n)
    const src = new HexSrc(toHex(s.result()))
    assert.equal(src.i8(), 1)
    assert.equal(src.i16(), 123)
    assert.equal(src.i32(), 123456)
    assert.equal(src.i64(), 1234567890n)
    assert.equal(src.i128(), 12345678901234567890n)
    assert.equal(src.i256(), 1234567890123456789012345678901234567890n)
})

t('HexSrc: mixed static types roundtrip', () => {
    const s = new Sink(4)
    s.u8(1); s.i8(-2)
    s.address('0x1234567890123456789012345678901234567890')
    s.u256(3n)
    const src = new HexSrc(toHex(s.result()))
    assert.equal(src.u8(), 1)
    assert.equal(src.i8(), -2)
    assert.equal(src.address(), '0x1234567890123456789012345678901234567890')
    assert.equal(src.u256(), 3n)
})

// ------------------------------------------------------------------
// Dynamic types
// ------------------------------------------------------------------
t('HexSrc: mixed dynamic types (port of src.test.ts)', () => {
    const str1 = 'abc'.repeat(100)
    const bytes1 = Buffer.alloc(100).fill('321')
    const b7 = '0x1234567890abcd'
    const str2 = 'hello'
    const addr = '0xabc4567890123456789012345678901234567890'
    const hex = encodeAbiParameters(
        [
            {type: 'uint8'},
            {type: 'string'},
            {type: 'bytes7'},
            {type: 'int128'},
            {type: 'bytes'},
            {type: 'address'},
            {type: 'string'},
        ],
        [69, str1, b7, -21312312452243312424534213123123123123n, `0x${bytes1.toString('hex')}`, addr, str2],
    )
    const src = new HexSrc(hex)
    assert.equal(src.u8(), 69)
    assert.equal(src.string(), str1)
    assert.equal(src.staticHex(7), b7)
    assert.equal(src.i128(), -21312312452243312424534213123123123123n)
    assert.equal(src.hex(), '0x' + bytes1.toString('hex'))
    assert.equal(src.address(), addr)
    assert.equal(src.string(), str2)
})

for (const sample of ['hello', 'this string length is 32 bytes!!', 'this string length is 33 bytes!!!', 'привет 👍']) {
    t(`HexSrc.string() — "${sample}"`, () => {
        const hex = encodeAbiParameters([{type: 'string'}], [sample])
        assert.equal(new HexSrc(hex).string(), sample)
    })
}

// ------------------------------------------------------------------
// Error messages
// ------------------------------------------------------------------
t('string.decode: invalid pointer throws the right message', () => {
    const s = new Sink(1)
    uint256.encode(s, 1337)
    assert.throws(
        () => string.decode(new Src(s.result())),
        /Unexpected pointer location: 0x539/,
    )
    assert.throws(
        () => string.decode(new HexSrc(toHex(s.result()))),
        /Unexpected pointer location: 0x539/,
    )
})

t('string.decode: length overflow throws', () => {
    const s = new Sink(1)
    bytes32.encode(s, '0x4b45590000000000000000000000000000000000000000000000000000000000')
    assert.throws(
        () => string.decode(new Src(s.result())),
        /Unexpected end of input/,
    )
    assert.throws(
        () => string.decode(new HexSrc(toHex(s.result()))),
        /Unexpected end of input/,
    )
})

// ------------------------------------------------------------------
// Struct: static + dynamic tuples, both backends agree
// ------------------------------------------------------------------
t('struct dynamic tuple decodes identically on Src and HexSrc', () => {
    const s = struct({
        a: array(uint256),
        b: uint256,
        c: struct({d: array(uint256), e: address}),
    })
    const sink = new Sink(1)
    s.encode(sink, {
        a: [100n, 1n, 123n],
        b: 2n,
        c: {d: [3n, 4n], e: '0x1234567890123456789012345678901234567890'},
    })
    const bytes = sink.result()
    const expected = {
        a: [100n, 1n, 123n],
        b: 2n,
        c: {d: [3n, 4n], e: '0x1234567890123456789012345678901234567890'},
    }
    assert.deepEqual(s.decode(new Src(bytes)), expected)
    assert.deepEqual(s.decode(new HexSrc(toHex(bytes))), expected)
})

t('struct with bytes4 field decodes to identical hex string on both backends', () => {
    const s = struct({
        foo: uint256,
        bar: array(uint256),
        str: struct({foo: uint256, bar: bytes4}),
    })
    const sink = new Sink(1)
    s.encode(sink, {
        foo: 100n,
        bar: [1n, 2n, 3n],
        str: {foo: 123n, bar: Uint8Array.from([0x12, 0x34, 0x56, 0x78])},
    })
    const raw = sink.result()
    const expected = {
        foo: 100n,
        bar: [1n, 2n, 3n],
        str: {foo: 123n, bar: '0x12345678'},
    }
    assert.deepEqual(s.decode(new Src(raw)), expected)
    assert.deepEqual(s.decode(new HexSrc(toHex(raw))), expected)
})

// ------------------------------------------------------------------
// AbiFunction calldata roundtrip (hot path that now uses HexSrc)
// ------------------------------------------------------------------
t('AbiFunction: encode/decode roundtrip', () => {
    const transfer = fun('0xa9059cbb', {to: address, value: uint256}, bool)
    const calldata = transfer.encode({
        to: '0x1234567890123456789012345678901234567890',
        value: 10n ** 18n,
    })
    assert.ok(calldata.startsWith('0xa9059cbb'))
    const decoded = transfer.decode(calldata)
    assert.deepEqual(decoded, {
        to: '0x1234567890123456789012345678901234567890',
        value: 10n ** 18n,
    })
})

t('AbiFunction: decodeResult single-codec return type', () => {
    const totalSupply = viewFun('0x18160ddd', {}, uint256)
    const out = '0x' + (10n ** 30n).toString(16).padStart(64, '0')
    assert.equal(totalSupply.decodeResult(out), 10n ** 30n)
})

t('AbiFunction: complex args with bytes + string', () => {
    const complex = fun(
        '0xdeadbeef',
        {caller: address, payload: bytes, note: string, flag: bool, words: array(uint256)},
    )
    const calldata = complex.encode({
        caller: '0x1234567890123456789012345678901234567890',
        payload: '0xabcdef0123456789',
        note: 'hello world',
        flag: true,
        words: [1n, 2n, 3n, 4n, 5n],
    })
    assert.deepEqual(complex.decode(calldata), {
        caller: '0x1234567890123456789012345678901234567890',
        payload: '0xabcdef0123456789',
        note: 'hello world',
        flag: true,
        words: [1n, 2n, 3n, 4n, 5n],
    })
})

// ------------------------------------------------------------------
// bytes codec behavior under HexSrc (pure-slice fast path)
// ------------------------------------------------------------------
t('bytes codec returns hex string via src.hex() path', () => {
    const payload = '0x' + 'ab'.repeat(40)
    const hex = encodeAbiParameters([{type: 'bytes'}], [payload])
    assert.equal(bytes.decode(new Src(Buffer.from(hex.slice(2), 'hex'))), payload)
    assert.equal(bytes.decode(new HexSrc(hex)), payload)
})

t('bytesN codec uses src.staticHex(n)', () => {
    const payload = '0x1234567890abcdef'
    const hex = encodeAbiParameters([{type: 'bytes8'}], [payload])
    const bytes8Codec = codec.bytes8
    assert.equal(bytes8Codec.decode(new Src(Buffer.from(hex.slice(2), 'hex'))), payload)
    assert.equal(bytes8Codec.decode(new HexSrc(hex)), payload)
})

console.log('')
console.log(`${passed} passed, ${failed} failed`)
process.exitCode = failed === 0 ? 0 : 1
