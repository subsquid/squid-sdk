import type {Block as RpcBlock} from '@subsquid/solana-rpc'
import {describe, expect, it} from 'vitest'

import {mapRawBlock} from './data-source'

const VOTE_PROGRAM = 'Vote111111111111111111111111111111111111111'
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const HASH = 'Cmq7nXTbRpWkAQjwrh7hbZsSEdYUYtN86uZoDiD1BJH3'
const SIG_VOTE = '5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW'
const SIG_SWAP = '4VvparxhgReCNHE7kRxHh9Kcxs1AwB1pN1ynT1fbyutVzpw1VYohTycdezfxAnVHHqh7sFRrSZSnio6KvtzDDeL3'

function tx(signature: string, program: string, feePayer: string) {
    return {
        version: 'legacy' as const,
        transaction: {
            signatures: [signature],
            message: {
                accountKeys: [feePayer, program],
                addressTableLookups: [],
                header: {
                    numReadonlySignedAccounts: 0,
                    numReadonlyUnsignedAccounts: 1,
                    numRequiredSignatures: 1,
                },
                instructions: [{accounts: [0], data: '1', programIdIndex: 1, stackHeight: null}],
                recentBlockhash: HASH,
            },
        },
        meta: {
            computeUnitsConsumed: 150n,
            costUnits: undefined,
            err: null,
            fee: 5000n,
            preBalances: [1000000n, 0n],
            postBalances: [995000n, 0n],
            preTokenBalances: [],
            postTokenBalances: [],
            innerInstructions: [],
            loadedAddresses: {readonly: [], writable: []},
            logMessages: [`Program ${program} invoke [1]`, `Program ${program} success`],
            returnData: undefined,
        },
    }
}

function rawBlock(): RpcBlock {
    return {
        slot: 100,
        block: {
            blockhash: HASH,
            blockHeight: 90,
            blockTime: 1787239776,
            parentSlot: 99,
            previousBlockhash: HASH,
            transactions: [
                // A vote precedes the payload transaction in the raw getBlock order.
                tx(SIG_VOTE, VOTE_PROGRAM, 'Fd7btgySsrjuo25CJCj7oE7VPMyezDhnx7pZkj2v69Nk'),
                tx(SIG_SWAP, TOKEN_PROGRAM, '3ASmhghwKKZjN9VEGfM6KiEogYaxtjfsSHqidEAYagSi'),
            ],
        },
    } as unknown as RpcBlock
}

describe('mapRawBlock', () => {
    it('strips vote transactions but preserves original transaction numbering, like the Portal', () => {
        let block = mapRawBlock(
            rawBlock(),
            {transaction: {signatures: true}, instruction: {programId: true}},
            {transactions: [{}], instructions: [{}]},
        )

        expect(block.transactions.map((t) => t.signatures[0])).toEqual([SIG_SWAP])
        // The Portal datasets number transactions by their position in the raw block,
        // votes included — index 1, not a post-filter 0.
        expect(block.transactions.map((t) => t.transactionIndex)).toEqual([1])
        expect(block.instructions.map((i) => i.transactionIndex)).toEqual([1])
    })
})
