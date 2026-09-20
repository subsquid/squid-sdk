import zlib from 'zlib'
import {describe, expect, it} from 'vitest'
import {getComponentsRule} from './components'
import {getPayloadCrc, MAX_LINE_SIZE, readHeaders, readLine, type StreamMessage} from './message'
import {linkOf, makeBlock, makeHash, makeMessage} from './test-util'

const rule = getComponentsRule({})
const block = makeBlock(100)
const expected = linkOf(block)

function withPayload(msg: StreamMessage, data: Uint8Array): StreamMessage {
    return {
        headers: {
            get: (name) => (name == 'payload_crc32' ? getPayloadCrc(data) : msg.headers.get(name)),
        },
        data,
    }
}

describe('readHeaders', () => {
    it('gives the parent link of a matching message', () => {
        expect(readHeaders(makeMessage(block), expected, rule)).toEqual({
            parent: {
                number: 99,
                hash: block.parentHash,
            },
        })
    })

    it('misses on an unknown schema', () => {
        let msg = makeMessage(block, {schema: 'evm-raw-line-zstd/2'})
        expect(readHeaders(msg, expected, rule)).toEqual({miss: 'schema'})
    })

    it('misses on components the dumper can not take', () => {
        let msg = makeMessage(block, {components: 'receipts'})
        expect(readHeaders(msg, expected, rule)).toEqual({miss: 'components'})
    })

    it('misses when the message is about another block', () => {
        let msg = makeMessage(block, {hash: makeHash('other')})
        expect(readHeaders(msg, expected, rule)).toEqual({miss: 'link'})
    })

    it('misses on a parent that is not right below', () => {
        let msg = makeMessage(block, {parent_number: '98'})
        expect(readHeaders(msg, expected, rule)).toEqual({miss: 'link'})
    })

    it('misses on a malformed parent hash', () => {
        let msg = makeMessage(block, {parent_hash: 'raw.>'})
        expect(readHeaders(msg, expected, rule)).toEqual({miss: 'link'})
    })
})

describe('readLine', () => {
    it('gives the block of a consistent message', () => {
        let res = readLine(makeMessage(block), expected, block.parentHash)
        expect(res).toMatchObject({block})
    })

    it('misses on a payload that does not match its checksum', () => {
        let msg = makeMessage(block, {payload_crc32: '00000000'})
        expect(readLine(msg, expected, block.parentHash)).toEqual({miss: 'crc'})
    })

    it('compares the checksum as 8 lowercase hex digits', () => {
        expect(getPayloadCrc(Buffer.from('hello'))).toBe('3610a686')
        expect(getPayloadCrc(Buffer.from('e'))).toHaveLength(8)
    })

    it('misses on a payload that is not a zstd frame', () => {
        let msg = withPayload(makeMessage(block), Buffer.from('{"hash": "0x00"}\n'))
        expect(readLine(msg, expected, block.parentHash)).toEqual({miss: 'parse'})
    })

    it('misses on a line that is not JSON', () => {
        let msg = withPayload(makeMessage(block), zlib.zstdCompressSync(Buffer.from('not a block\n')))
        expect(readLine(msg, expected, block.parentHash)).toEqual({miss: 'parse'})
    })

    it('misses when the line holds another block than the headers tell', () => {
        let other = makeBlock(100, 'fork', 'main')
        let msg = withPayload(makeMessage(block), makeMessage(other).data)
        expect(readLine(msg, expected, block.parentHash)).toEqual({miss: 'link'})
    })

    it('misses when the line has another number', () => {
        let line = {...block, number: '0x65'}
        let msg = withPayload(makeMessage(block), makeMessage(line).data)
        expect(readLine(msg, expected, block.parentHash)).toEqual({miss: 'link'})
    })

    it('misses when the line has another parent than the headers tell', () => {
        let line = {...block, parentHash: makeHash('other parent')}
        let msg = withPayload(makeMessage(block), makeMessage(line).data)
        expect(readLine(msg, expected, block.parentHash)).toEqual({miss: 'link'})
    })

    it('misses on a line above the size limit', () => {
        let msg = makeMessage(block)
        let lineSize = JSON.stringify(block).length + 1

        expect(readLine(msg, expected, block.parentHash, lineSize)).toMatchObject({block})
        expect(readLine(msg, expected, block.parentHash, lineSize - 1)).toEqual({miss: 'parse'})
    })

    it('does not inflate a decompression bomb', async () => {
        let inflatedSize = 1_073_741_824 // 1 GiB
        let bomb = await compressZeros(inflatedSize)
        let msg = withPayload(makeMessage(block), bomb)

        expect(MAX_LINE_SIZE).toBe(268_435_456)
        expect(bomb.length).toBeLessThan(1_048_576)

        let before = process.memoryUsage.rss()
        let res = readLine(msg, expected, block.parentHash)
        let growth = process.memoryUsage.rss() - before

        expect(res).toEqual({miss: 'parse'})

        // memory is not returned right away, so what is held now is close to the peak
        expect(growth).toBeLessThan(2 * MAX_LINE_SIZE)
    })
})

async function compressZeros(size: number): Promise<Buffer> {
    let chunk = Buffer.alloc(1_048_576) // 1 MiB
    let compress = zlib.createZstdCompress()
    let out: Buffer[] = []

    compress.on('data', (data) => out.push(data))
    let finished = new Promise((resolve, reject) => {
        compress.on('end', resolve)
        compress.on('error', reject)
    })

    for (let written = 0; written < size; written += chunk.length) {
        let canWriteMore = compress.write(chunk)
        if (!canWriteMore) {
            await new Promise((resolve) => compress.once('drain', resolve))
        }
    }
    compress.end()

    await finished
    return Buffer.concat(out)
}
