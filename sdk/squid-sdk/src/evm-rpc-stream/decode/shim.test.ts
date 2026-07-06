import {describe, expect, it} from 'vitest'

import {shimWireBlock} from './shim'

describe('shimWireBlock', () => {
    it('rewrites the selfdestruct trace tag to suicide', () => {
        let block = shimWireBlock({
            traces: [
                {type: 'selfdestruct', action: {address: '0xa', refundAddress: '0xb', balance: '0x1'}},
                {type: 'call', action: {to: '0xc'}},
            ],
        })

        expect(block.traces[0].type).toBe('suicide')
        // Action fields already match the schema and are left untouched.
        expect(block.traces[0].action).toEqual({address: '0xa', refundAddress: '0xb', balance: '0x1'})
        expect(block.traces[1].type).toBe('call')
    })

    it('renames the reward action field rewardType to type', () => {
        let block = shimWireBlock({
            traces: [{type: 'reward', action: {author: '0xa', value: '0x1', rewardType: 'block'}}],
        })

        expect(block.traces[0].type).toBe('reward')
        expect(block.traces[0].action).toEqual({author: '0xa', value: '0x1', type: 'block'})
        expect('rewardType' in block.traces[0].action).toBe(false)
    })

    it('leaves create/call traces and blocks without traces untouched', () => {
        expect(shimWireBlock({header: {number: 1}})).toEqual({header: {number: 1}})

        let create = shimWireBlock({traces: [{type: 'create', action: {from: '0xa'}}]})
        expect(create.traces[0]).toEqual({type: 'create', action: {from: '0xa'}})
    })
})
