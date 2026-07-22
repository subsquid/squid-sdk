import {describe, it, expect} from 'vitest'
import {GetBlock} from './rpc-data'

// The Optimism deposit transaction (type 0x7e) from the failing block reported by the
// evm-dump ingester. eRPC returned it WITHOUT a `nonce` field, which used to make the
// `Transaction` validator reject the whole block.
const DEPOSIT_TX_WITHOUT_NONCE = {
    type: '0x7e',
    sourceHash: '0xeb1bfc9ea6670dacf9263b6d05954b6e4c41a2d809975c31d6ee2d0d848f1a7a',
    from: '0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001',
    to: '0x4200000000000000000000000000000000000015',
    mint: '0x0',
    value: '0x0',
    gas: '0xf4240',
    input: '0x3db6be2b',
    hash: '0x6a5ab9998b916b0419b70d31f91d351032f0d622e3fb38feaba0e3915e4a8d8a',
    r: '0x0',
    s: '0x0',
    yParity: '0x0',
    v: '0x0',
    blockHash: '0xa12f85c9c1bfd0879f3745ecc2b968e3357139173d185c6fc1cdace08f8d4575',
    blockNumber: '0x93570fd',
    transactionIndex: '0x0',
    gasPrice: '0x0',
    // note: no `nonce`
}

function mkBlock(transactions: unknown[]) {
    return {
        number: '0x93570fd',
        hash: '0xa12f85c9c1bfd0879f3745ecc2b968e3357139173d185c6fc1cdace08f8d4575',
        parentHash: '0x' + '00'.repeat(32),
        extraData: '0x',
        gasLimit: '0x1c9c380',
        gasUsed: '0xf4240',
        sha3Uncles: '0x' + '00'.repeat(32),
        logsBloom: '0x' + '00'.repeat(256),
        transactionsRoot: '0x' + '00'.repeat(32),
        receiptsRoot: '0x' + '00'.repeat(32),
        stateRoot: '0x' + '00'.repeat(32),
        miner: '0x' + '00'.repeat(20),
        size: '0x100',
        timestamp: '0x6a5ebbb3',
        // eth_getBlockByNumber returns `transactions` as a bare array; the
        // GetBlock validator's oneOf picks justHashes vs fullTransactions from it.
        transactions,
        uncles: [],
    }
}

describe('Transaction validation', () => {
    it('accepts an Optimism deposit transaction (0x7e) without a nonce field', () => {
        let block = mkBlock([DEPOSIT_TX_WITHOUT_NONCE])
        expect(GetBlock.validate(block)).toBeUndefined()
    })

    it('still rejects a regular transaction missing a required field (e.g. from)', () => {
        let {from, ...noFrom} = DEPOSIT_TX_WITHOUT_NONCE
        let block = mkBlock([noFrom])
        expect(GetBlock.validate(block)).toBeDefined()
    })
})
