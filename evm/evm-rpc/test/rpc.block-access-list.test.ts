import {describe, expect, it, vi} from 'vitest'
import {loadBlock, loadBlockAccessList} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'
import {Rpc} from '../src/rpc'
import {toQty} from '../src/util'


const SEPOLIA_AMSTERDAM_BLOCK = 11856337


function sepoliaClient(accessList: unknown) {
    const block = loadBlock('ethereum-sepolia', SEPOLIA_AMSTERDAM_BLOCK)
    const client = new MockRpcClient()
    client.setFixture('eth_chainId', undefined, '0xaa36a7')
    client.setFixture('eth_getBlockByNumber', [toQty(SEPOLIA_AMSTERDAM_BLOCK), true], block)
    client.setFixture('eth_getBlockAccessListByBlockHash', [block.hash], accessList)
    return {block, client}
}


describe('Block access lists (EIP-7928)', () => {
    it('fetches and verifies the access list of an Amsterdam block', async () => {
        const accessList = loadBlockAccessList('ethereum-sepolia', SEPOLIA_AMSTERDAM_BLOCK)
        const {client} = sepoliaClient(accessList)
        const rpc = new Rpc({
            client: client as any,
            verifyBlockHash: true,
            verifyBlockAccessListHash: true
        })

        const blocks = await rpc.getBlockBatch([SEPOLIA_AMSTERDAM_BLOCK], {
            transactions: true,
            blockAccessLists: true
        })

        expect(blocks.length).toEqual(1)
        expect(blocks[0]._isInvalid).toBeUndefined()
        expect(blocks[0].blockAccessList).toEqual(accessList)
    })

    it('marks the block invalid when the access list does not match the header', async () => {
        const accessList = loadBlockAccessList('ethereum-sepolia', SEPOLIA_AMSTERDAM_BLOCK)
        const account = accessList.find(a => a.balanceChanges.length > 0)!
        account.balanceChanges[0].value = '0x1'
        const {client} = sepoliaClient(accessList)
        const rpc = new Rpc({client: client as any, verifyBlockAccessListHash: true})

        const blocks = await rpc.getBlockBatch([SEPOLIA_AMSTERDAM_BLOCK], {
            transactions: true,
            blockAccessLists: true
        })

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toMatch(/blockAccessListHash/)
        expect(blocks[0].blockAccessList).toBeUndefined()
    })

    it('keeps an unverified access list when verification is off', async () => {
        const accessList = loadBlockAccessList('ethereum-sepolia', SEPOLIA_AMSTERDAM_BLOCK)
        accessList.pop()
        const {client} = sepoliaClient(accessList)
        const rpc = new Rpc({client: client as any})

        const blocks = await rpc.getBlockBatch([SEPOLIA_AMSTERDAM_BLOCK], {
            transactions: true,
            blockAccessLists: true
        })

        expect(blocks[0]._isInvalid).toBeUndefined()
        expect(blocks[0].blockAccessList).toEqual(accessList)
    })

    it('does not request access lists of pre-Amsterdam blocks', async () => {
        const block = loadBlock('ethereum', 18000000)
        const client = new MockRpcClient()
        client.setFixture('eth_chainId', undefined, '0x1')
        client.setFixture('eth_getBlockByNumber', [toQty(18000000), true], block)
        const call = vi.spyOn(client, 'call')
        const rpc = new Rpc({client: client as any, verifyBlockAccessListHash: true})

        const blocks = await rpc.getBlockBatch([18000000], {transactions: true, blockAccessLists: true})

        expect(blocks.length).toEqual(1)
        expect(blocks[0].blockAccessList).toBeUndefined()
        expect(call.mock.calls.map(c => c[0])).not.toContain('eth_getBlockAccessListByBlockHash')
    })
})
