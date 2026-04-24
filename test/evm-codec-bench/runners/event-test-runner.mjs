/**
 * Non-vitest runner for evm/evm-abi/test/event.test.ts — the repo's
 * vitest@4.1.5 has a broken ESM config loader that's unrelated to our
 * changes. We re-run the exact same assertions using node's assert.
 *
 * Kept in `runners/` (not `lib/`) so it survives the bench package's
 * `rm -rf lib && tsc` build step.
 */
import {strict as assert} from 'node:assert'
import {encodeAbiParameters, encodeEventTopics, parseAbiItem} from 'viem'

const repo = '/home/belopash/subsquid/squid-sdk'
const {bool, bytes, string, struct, uint256, address, bytes32, int128, bytes4} = await import(
    `${repo}/evm/evm-codec/lib/index.js`
)
const {event: _event, indexed} = await import(`${repo}/evm/evm-abi/lib/index.js`)

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

runTest('decodes simple args', () => {
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event Test(uint256 indexed a, uint256 b)')],
        eventName: 'Test',
        args: {a: 123n},
    })
    const event = _event(topics[0], {a: indexed(uint256), b: uint256})
    const decoded = event.decode({
        topics,
        data: encodeAbiParameters([{type: 'uint256'}], [100n]),
    })
    assert.deepEqual(decoded, {a: 123n, b: 100n})
})

runTest('decodes complex args (indexed string, bool etc.)', () => {
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event Test(string indexed a, string b, bytes c, (uint256, string) d, bool indexed e)')],
        eventName: 'Test',
        args: {a: 'xdxdxd', e: true},
    })
    const event = _event(topics[0], {
        a: indexed(string),
        b: string,
        c: bytes,
        d: struct({_0: uint256, _1: string}),
        e: indexed(bool),
    })
    const decoded = event.decode({
        topics,
        data: encodeAbiParameters(
            [
                {type: 'string'},
                {type: 'bytes'},
                {type: 'tuple', components: [{type: 'uint256'}, {type: 'string'}]},
            ],
            ['hello', '0x1234', [100n, 'world']],
        ),
    })
    assert.deepEqual(decoded, {
        a: topics[1],
        b: 'hello',
        c: '0x1234',
        d: {_0: 100n, _1: 'world'},
        e: true,
    })
})

runTest('address indexed topic', () => {
    // viem's encodeEventTopics rejects non-checksummed addresses; we
    // want to exercise our lowercase output, so build the topic
    // directly from the known signature + left-padded address word.
    const ADDR = '0xabcdef0123456789abcdef0123456789abcdef01'
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event T(address indexed x)')],
        eventName: 'T',
    })
    topics.push('0x' + '00'.repeat(12) + ADDR.slice(2))
    const e = _event(topics[0], {x: indexed(address)})
    const {x} = e.decode({topics, data: '0x'})
    assert.equal(x, ADDR)
})

runTest('bool indexed topic (true and false)', () => {
    // viem treats `false` as "arg not specified" and emits `null`, so
    // synthesise the ABI word directly (`0x…00` / `0x…01`).
    const sig = encodeEventTopics({
        abi: [parseAbiItem('event T(bool indexed x)')],
        eventName: 'T',
    })[0]
    for (const v of [true, false]) {
        const word = '0x' + '00'.repeat(31) + (v ? '01' : '00')
        const topics = [sig, word]
        const e = _event(sig, {x: indexed(bool)})
        assert.equal(e.decode({topics, data: '0x'}).x, v)
    }
})

runTest('uint256 indexed topic (large)', () => {
    const V = (2n ** 200n) - 7n
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event T(uint256 indexed x)')],
        eventName: 'T',
        args: {x: V},
    })
    const e = _event(topics[0], {x: indexed(uint256)})
    assert.equal(e.decode({topics, data: '0x'}).x, V)
})

runTest('int128 indexed topic (negative, sign-extended by ABI)', () => {
    const V = -(2n ** 100n) - 3n
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event T(int128 indexed x)')],
        eventName: 'T',
        args: {x: V},
    })
    const e = _event(topics[0], {x: indexed(int128)})
    assert.equal(e.decode({topics, data: '0x'}).x, V)
})

runTest('bytes4 indexed topic (selector)', () => {
    const V = '0xdeadbeef'
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event T(bytes4 indexed x)')],
        eventName: 'T',
        args: {x: V},
    })
    const e = _event(topics[0], {x: indexed(bytes4)})
    assert.equal(e.decode({topics, data: '0x'}).x, V)
})

runTest('bytes32 indexed topic (identity)', () => {
    const V = '0x' + '11'.repeat(32)
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event T(bytes32 indexed x)')],
        eventName: 'T',
        args: {x: V},
    })
    const e = _event(topics[0], {x: indexed(bytes32)})
    assert.equal(e.decode({topics, data: '0x'}).x, V)
})

runTest('event with only indexed topics -> no dataSrc allocated', () => {
    const A = '0x1111111111111111111111111111111111111111'
    const B = '0x2222222222222222222222222222222222222222'
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event T(address indexed a, address indexed b, uint256 indexed v)')],
        eventName: 'T',
        args: {a: A, b: B, v: 42n},
    })
    const e = _event(topics[0], {a: indexed(address), b: indexed(address), v: indexed(uint256)})
    const d = e.decode({topics, data: '0x'})
    assert.equal(d.a.toLowerCase(), A)
    assert.equal(d.b.toLowerCase(), B)
    assert.equal(d.v, 42n)
})

runTest('topic count / signature guards still throw', () => {
    const topics = encodeEventTopics({
        abi: [parseAbiItem('event Test(uint256 indexed a, uint256 b)')],
        eventName: 'Test',
        args: {a: 123n},
    })
    const e = _event(topics[0], {a: indexed(uint256), b: uint256})
    assert.throws(() =>
        e.decode({topics: [topics[0]], data: encodeAbiParameters([{type: 'uint256'}], [100n])}),
    )
    assert.throws(() =>
        e.decode({
            topics: ['0x' + '00'.repeat(32), topics[1]],
            data: encodeAbiParameters([{type: 'uint256'}], [100n]),
        }),
    )
    assert.throws(() => e.decode({topics: [], data: '0x'}))
})
