import expect from 'expect'
import {gql, waitForHeight} from './setup'

describe('block hooks', () => {
    let hooks: {type: string; blockNumber: number}[] = []

    before(async () => {
        await waitForHeight(4)
        await gql.query(`
            query {
                blockHooks(orderBy: blockNumber_ASC) {
                    blockNumber
                    type
                }
            }
        `).then(res => {
            expect(res.data).toHaveProperty('blockHooks')
            hooks = res.data.blockHooks
        })
    })

    it('pre', async () => {
        let preHooks = hooks
            .filter(h => h.type === 'PRE')
            .map(h => h.blockNumber)
        expect(preHooks).toEqual([0])
    })

    it('post', async () => {
        const postHooks = hooks
            .filter(h => h.type === 'POST')
            .map(h => h.blockNumber)
        expect(postHooks).toEqual([2, 3])
    })
})
