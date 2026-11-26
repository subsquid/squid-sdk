import type * as rpc from '@subsquid/evm-rpc'
import {calculateStateSyncTxHash} from '@subsquid/evm-rpc'
import {describe, expect, it} from 'vitest'
import {toRawBlock} from './raw'


const BLOCK_NUMBER = '0x23c3480'
const BLOCK_HASH = '0x' + 'ab'.repeat(32)
const TX_HASH = '0x' + '1a'.repeat(32)


function block(txHashes: string[], replayHashes: string[]): rpc.Block {
    return {
        number: parseInt(BLOCK_NUMBER),
        hash: BLOCK_HASH,
        block: {
            number: BLOCK_NUMBER,
            hash: BLOCK_HASH,
            transactions: txHashes.map((hash, i) => ({hash, transactionIndex: `0x${i.toString(16)}`})),
        },
        traceReplays: replayHashes.map(transactionHash => ({transactionHash, trace: []})),
    } as unknown as rpc.Block
}


describe('toRawBlock with trace replays', () => {
    const stateSync = calculateStateSyncTxHash(BLOCK_NUMBER, BLOCK_HASH)

    it('stores the derived state-sync transaction without a replay', () => {
        const raw = toRawBlock(block([TX_HASH, stateSync], [TX_HASH]))
        expect(raw.transactions[0].traceReplay_).toMatchObject({transactionHash: TX_HASH})
        expect(raw.transactions[1].traceReplay_).toBeUndefined()
    })

    it('matches replays to transactions regardless of hex case', () => {
        const raw = toRawBlock(block([TX_HASH.toUpperCase().replace('0X', '0x')], [TX_HASH]))
        expect(raw.transactions[0].traceReplay_).toMatchObject({transactionHash: TX_HASH})
    })

    it('fails, naming the transaction, when any other replay is missing', () => {
        expect(() => toRawBlock(block([TX_HASH, stateSync], [stateSync]))).toThrow(
            `no trace replay for transaction ${TX_HASH}`
        )
    })
})
