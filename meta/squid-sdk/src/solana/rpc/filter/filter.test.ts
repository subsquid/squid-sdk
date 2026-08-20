import type {Block} from '@subsquid/solana-normalization'
import {getInstructionDescriptor} from '@subsquid/solana-stream'
import {describe, expect, it} from 'vitest'

import {filterBlockItems} from './filter'

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const OTHER_PROGRAM = 'ComputeBudget111111111111111111111111111111'
const FEE_PAYER = 'FeePayer1111111111111111111111111111111111'

// Minimal normalized block stub: only the fields the filter engine touches are populated.
function mkBlock(): Block {
    return {
        header: {} as Block['header'],
        transactions: [
            {transactionIndex: 0, accountKeys: [FEE_PAYER, 'x']},
            {transactionIndex: 1, accountKeys: ['someone-else', 'y']},
        ],
        instructions: [
            // tx 0: a token instruction with one inner instruction
            {transactionIndex: 0, instructionAddress: [0], programId: TOKEN_PROGRAM, accounts: ['acc0', 'acc1'], data: '3Bxs4h24hBtQy9rw', isCommitted: true},
            {transactionIndex: 0, instructionAddress: [0, 0], programId: OTHER_PROGRAM, accounts: ['acc2'], data: '11', isCommitted: true},
            // tx 1: an unrelated top-level instruction
            {transactionIndex: 1, instructionAddress: [0], programId: OTHER_PROGRAM, accounts: [], data: '11', isCommitted: true},
        ],
        logs: [
            {transactionIndex: 0, logIndex: 0, instructionAddress: [0], programId: TOKEN_PROGRAM, kind: 'log'},
            {transactionIndex: 0, logIndex: 1, instructionAddress: [0, 0], programId: OTHER_PROGRAM, kind: 'log'},
            {transactionIndex: 1, logIndex: 0, instructionAddress: [0], programId: OTHER_PROGRAM, kind: 'log'},
        ],
        balances: [
            {transactionIndex: 0, account: 'acc0'},
            {transactionIndex: 1, account: 'acc9'},
        ],
        tokenBalances: [
            {transactionIndex: 0, account: 'acc1', postMint: 'mint-a'},
            {transactionIndex: 1, account: 'acc9', postMint: 'mint-b'},
        ],
        rewards: [{pubkey: 'validator-1'}, {pubkey: 'validator-2'}],
    } as unknown as Block
}

describe('filterBlockItems', () => {
    it('keeps only matching instructions and drops everything unrequested', () => {
        let block = mkBlock()
        filterBlockItems(block, {instructions: [{where: {programId: [TOKEN_PROGRAM]}}]})

        expect(block.instructions.map((i) => i.programId)).toEqual([TOKEN_PROGRAM])
        expect(block.transactions).toEqual([])
        expect(block.logs).toEqual([])
        expect(block.balances).toEqual([])
        expect(block.tokenBalances).toEqual([])
        expect(block.rewards).toEqual([])
    })

    it('matches instructions by discriminator prefix', () => {
        let block = mkBlock()
        let d = getInstructionDescriptor(block.instructions[0] as any)

        filterBlockItems(block, {instructions: [{where: {d1: [d.slice(0, 4)]}}]})
        expect(block.instructions.map((i) => i.programId)).toEqual([TOKEN_PROGRAM])

        let block2 = mkBlock()
        filterBlockItems(block2, {instructions: [{where: {discriminator: ['0xffff']}}]})
        expect(block2.instructions).toEqual([])
    })

    it('includes instruction relations: parent transaction, inner instructions, and own logs', () => {
        let block = mkBlock()
        filterBlockItems(block, {
            instructions: [
                {
                    where: {programId: [TOKEN_PROGRAM]},
                    include: {transaction: true, innerInstructions: true, logs: true},
                },
            ],
        })

        expect(block.transactions.map((tx) => tx.transactionIndex)).toEqual([0])
        // the matched instruction plus its inner instruction, in address order
        expect(block.instructions.map((i) => i.instructionAddress)).toEqual([[0], [0, 0]])
        // logs of the instruction itself AND of its inner instructions
        expect(block.logs.map((l) => l.instructionAddress)).toEqual([[0], [0, 0]])
    })

    it('filters transactions by fee payer and pulls their items via include', () => {
        let block = mkBlock()
        filterBlockItems(block, {
            transactions: [{where: {feePayer: [FEE_PAYER]}, include: {instructions: true, balances: true}}],
        })

        expect(block.transactions.map((tx) => tx.transactionIndex)).toEqual([0])
        expect(block.instructions.map((i) => i.transactionIndex)).toEqual([0, 0])
        expect(block.balances.map((b) => b.account)).toEqual(['acc0'])
        expect(block.tokenBalances).toEqual([])
    })

    it('filters logs and navigates to their instruction', () => {
        let block = mkBlock()
        filterBlockItems(block, {
            logs: [{where: {programId: [TOKEN_PROGRAM]}, include: {instruction: true, transaction: true}}],
        })

        expect(block.logs.map((l) => l.transactionIndex)).toEqual([0])
        expect(block.instructions.map((i) => i.instructionAddress)).toEqual([[0]])
        expect(block.transactions.map((tx) => tx.transactionIndex)).toEqual([0])
    })

    it('filters token balances and rewards by their own keys', () => {
        let block = mkBlock()
        filterBlockItems(block, {
            tokenBalances: [{where: {postMint: ['mint-a']}}],
            rewards: [{where: {pubkey: ['validator-2']}}],
        })

        expect(block.tokenBalances.map((b) => b.account)).toEqual(['acc1'])
        expect(block.rewards.map((r) => r.pubkey)).toEqual(['validator-2'])
    })

    it('a match-all filter for an item type keeps every item of that type', () => {
        let block = mkBlock()
        filterBlockItems(block, {balances: [{}]})

        expect(block.balances).toHaveLength(2)
        expect(block.transactions).toEqual([])
    })

    it('an empty request drops all items', () => {
        let block = mkBlock()
        filterBlockItems(block, {})

        expect(block.transactions).toEqual([])
        expect(block.instructions).toEqual([])
        expect(block.logs).toEqual([])
        expect(block.rewards).toEqual([])
    })
})
