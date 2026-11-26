import {describe, expect, it} from 'vitest'
import {ChainUtils} from '../src/chain-utils'
import {Rpc} from '../src/rpc'
import type {Transaction} from '../src/rpc-data'
import type {DataRequest} from '../src/types'
import {calculateStateSyncTxHash} from '../src/verification'
import {loadBlock} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'

const FOREIGN = `0x${'ab'.repeat(32)}`

describe.each(['frames', 'diffs'] as const)('debug %s transaction membership', (kind) => {
    async function fetch(chain: string, change: (entries: any[], transactions: Transaction[]) => void) {
        const block = loadBlock('ethereum', 18000000)
        const transactions = block.transactions.slice(0, 2) as Transaction[]
        if (chain !== '0x1') {
            transactions.push({
                ...transactions[1],
                hash: calculateStateSyncTxHash(block.number, block.hash),
                transactionIndex: '0x2',
            })
        }
        block.transactions = transactions
        const entries = transactions.map((tx) => ({
            txHash: tx.hash,
            result:
                kind === 'diffs'
                    ? {pre: {}, post: {}}
                    : {type: 'CALL', from: tx.from, to: tx.to, input: tx.input, gas: tx.gas, gasUsed: '0x0'},
        }))
        change(entries, transactions)
        const client = new MockRpcClient()
        client.setFixture('eth_chainId', undefined, chain)
        client.setFixture('eth_getBlockByNumber', undefined, block)
        client.setFixture('debug_traceBlockByNumber', undefined, entries)
        const request: DataRequest = {
            transactions: true,
            traces: kind === 'frames',
            stateDiffs: kind === 'diffs',
            useDebugApiForStateDiffs: true,
            useDebugTraceBlockByNumber: true,
        }
        const blocks = await new Rpc({client: client as any, callFrameValidation: 'off'}).getBlockBatch(
            [Number(block.number)],
            request,
        )
        return blocks[0]
    }

    it('accepts positional responses without labels', async () => {
        const block = await fetch('0x1', (entries) => {
            for (const entry of entries) entry.txHash = undefined
        })
        expect(block._isInvalid).toBeFalsy()
    })

    it.each([
        ['foreign', /names transaction 0x(ab)+, which is not in this block/],
        ['duplicate', /duplicate debug .* for transaction 0x/],
        ['unlabelled', /unlabelled debug .* entry/],
    ] as const)('rejects an extra %s entry', async (damage, message) => {
        const block = await fetch('0x1', (entries) => {
            const entry = {...entries[0]}
            if (damage === 'foreign') entry.txHash = FOREIGN
            if (damage === 'unlabelled') entry.txHash = undefined
            entries.push(entry)
        })
        expect(block._isInvalid).toBe(true)
        expect(block._errorMessage).toMatch(message)
    })

    it('rejects a duplicate that differs only by hex case', async () => {
        const block = await fetch('0x1', (entries) => {
            entries.push({...entries[0], txHash: entries[0].txHash.toUpperCase().replace('0X', '0x')})
        })
        expect(block._isInvalid).toBe(true)
        expect(block._errorMessage).toMatch(/duplicate debug/)
    })

    it.each(['0x89', '0x13882', '0x6d'])('rejects an unlabelled response without the state-sync entry on %s', async (chain) => {
        const block = await fetch(chain, (entries) => {
            entries.pop()
            for (const entry of entries) entry.txHash = undefined
        })
        expect(block._isInvalid).toBe(true)
        expect(block._errorMessage).toMatch(/unlabelled debug .* entry/)
    })

    it('rejects a positional response labelled with another transaction', async () => {
        const block = await fetch('0x1', (entries) => {
            entries[0].txHash = FOREIGN
        })
        expect(block._isInvalid).toBe(true)
    })

    it.each(['0x89', '0x13882', '0x6d'])('allows the omitted state-sync transaction on %s', async (chain) => {
        const block = await fetch(chain, (entries) => {
            entries.pop()
            entries[0].txHash = entries[0].txHash.toUpperCase().replace('0X', '0x')
        })
        expect(block._isInvalid).toBeFalsy()
        const result = kind === 'frames' ? block.debugFrames : block.debugStateDiffs
        expect(result).toHaveLength(3)
        expect(result?.[0]).toBeDefined()
        expect(result?.[2]).toBeUndefined()
    })

    it.each(['0x89', '0x13882', '0x6d'])('requires regular transactions on %s', async (chain) => {
        const block = await fetch(chain, (entries) => {
            entries.shift()
        })
        expect(block._isInvalid).toBe(true)
        expect(block._errorMessage).toMatch(/no debug/)
    })
})

// Polygon mainnet block 74999968: its last transaction is Bor's state-sync transaction, the only one
// debug_traceBlockByNumber leaves out
describe('state-sync transaction', () => {
    const block = {number: '0x47868a0', hash: '0xfa5e818cf5f3facc2a42d96b0d0318492fa5bf7c852b0ad53bb24e109ae113a8'}
    const stateSync = '0x0fb6fa71c91147f44b26cd9d33b37c897939ada82d68bcd49ee7732fdb43d2d4'

    it.each(['0x89', '0x13882', '0x6d'])('is recognised by its derived hash on %s', (chain) => {
        const utils = new ChainUtils(chain)
        expect(utils.getStateSyncTxHash(block)).toBe(stateSync)
        expect(utils.isStateSyncTransaction(block, stateSync.toUpperCase().replace('0X', '0x'))).toBe(true)
        expect(utils.isStateSyncTransaction(block, FOREIGN)).toBe(false)
    })

    it('does not exist on other chains', () => {
        const utils = new ChainUtils('0x1')
        expect(utils.getStateSyncTxHash(block)).toBeUndefined()
        expect(utils.isStateSyncTransaction(block, stateSync)).toBe(false)
    })
})
