import {describe, expect, it} from 'vitest'
import {FakeStream, getLineSize, linkOf, makeChain, type ToyBlock, toyFormat, verifyToyLine} from './test-util'
import {walk, type WalkRequest} from './walk'

const chain = makeChain(10, 15)

function request(stream: FakeStream, from: number): WalkRequest<ToyBlock> {
    return {
        get: stream.get,
        format: toyFormat,
        verify: verifyToyLine,
        top: linkOf(chain[5]),
        from,
        payloadBudget: 1_000_000,
    }
}

describe('walk', () => {
    it('follows the parent links down to the bottom of the range', async () => {
        let stream = new FakeStream().putChain(chain)

        let res = await walk(request(stream, 12))

        expect(res.miss).toBeUndefined()
        expect(res.blocks.map((b) => b.getBlock())).toEqual(chain.slice(2))
        expect(stream.requests.map((r) => r.number)).toEqual([15, 14, 13, 12])
    })

    it('tells the decompressed size and the parent of each block', async () => {
        let stream = new FakeStream().putChain(chain)

        let res = await walk(request(stream, 14))

        expect(res.blocks.map((b) => b.size)).toEqual([getLineSize(chain[4]), getLineSize(chain[5])])
        expect(res.blocks[0].parentHash).toBe(chain[3].hash)
    })

    it('stops at an absent block', async () => {
        let stream = new FakeStream().putChain(chain).remove(chain[3])

        let res = await walk(request(stream, 10))

        expect(res.miss).toMatchObject({number: 13, reason: 'not_found'})
        expect(res.blocks.map((b) => b.number)).toEqual([14, 15])
    })
})
