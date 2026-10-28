import {describe, expect, it} from 'vitest'
import {type LineFormat, readHeaders, readLine} from './message'
import {linkOf, makeChain, makeMessage, type ToyBlock, toyFormat} from './test-util'

const chain = makeChain(10, 12)
const block = chain[2]

describe('readHeaders', () => {
    it('gives the parent link of a matching message', () => {
        expect(readHeaders(makeMessage(block), linkOf(block), toyFormat)).toEqual({parent: linkOf(chain[1])})
    })

    it.each(['10', '12', ''])('misses on a parent at height "%s"', (parentNumber) => {
        let msg = makeMessage(block, {parent_number: parentNumber})
        expect(readHeaders(msg, linkOf(block), toyFormat)).toEqual({miss: 'link'})
    })

    it('misses on a parent hash the format does not take', () => {
        let msg = makeMessage(block, {parent_hash: 'raw.>'})
        expect(readHeaders(msg, linkOf(block), toyFormat)).toEqual({miss: 'link'})
    })

    it('misses on a schema of another chain', () => {
        let msg = makeMessage(block, {schema: 'evm-raw-line-zstd/1'})
        expect(readHeaders(msg, linkOf(block), toyFormat)).toEqual({miss: 'schema'})
    })
})

describe('readLine', () => {
    it('gives the block of a consistent message', () => {
        expect(readLine(makeMessage(block), linkOf(block), block.parentHash, toyFormat)).toMatchObject({block})
    })

    it('compares hashes in their case', () => {
        let lower = {...linkOf(block), hash: block.hash.toLowerCase()}
        expect(readLine(makeMessage(block), lower, block.parentHash, toyFormat)).toEqual({miss: 'link'})
    })

    it('misses on a line that does not say where it is', () => {
        let format: LineFormat<ToyBlock> = {...toyFormat, getRef: () => undefined}
        expect(readLine(makeMessage(block), linkOf(block), block.parentHash, format)).toEqual({miss: 'link'})
    })
})
