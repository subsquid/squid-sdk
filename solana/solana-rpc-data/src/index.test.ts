import {describe, expect, it} from 'vitest'
import {type GetBlock, isVoteTransaction, removeVoteTransactions, type Transaction} from './index'

const VOTE_PROGRAM = 'Vote111111111111111111111111111111111111111'
const SYSTEM_PROGRAM = '11111111111111111111111111111111'

// Instruction data of mainnet consensus votes.
const VOTE = '37u9WtQpcm6ULa3WFVYxP5jAXEYb8QvsuPaDccrAwdXbsq6uEHa6WmHzib6vwbfQXseo7wJX'
const VOTE_SWITCH =
    '2PrpzHhnCKEU1HQ8X48DNTkrkupsS47BwYSZUJsygMsGL11DRcaWAeS4hsg4uTsZkc2bmaJogzRatMPqzNkKfTNVJcTmPgwUZHxfwcDURgjnBAFPw93Pj7iVCoBgsSP'
const COMPACT_UPDATE_VOTE_STATE =
    'Fk63PgWqNK9epWMffdUCzRjUyM2VfYga9hoEkdbSvqiLyXyk6D6ThvgkNPT6QthwFV7GuubGphY2GcvEsud8qKK84bignwxSaQqnjY9JVxYbAYSLKQ1gWQeBbhMWp3zCbpTcXVRh6VEH2RiXNAzjAMVXEKjs3u'
const TOWER_SYNC =
    '7vR1SRcTZHMDVDwzJQSZFzcjeic5BmRJ9vBnyVv9J3b72tZwGCWavQdexaem52wtxGWpa457AwZZrJJbLpnEHunpRtprFXDrNuatiHv3qcFdu57S42DnwwWDqSz1pmaZ27E7bnQ7q52eta6jw7K5Ukk6uVoaEKfZxB2Rd6bbWiB1PW7xQ5rBSy9agMriLkD'

// Vote account management.
const WITHDRAW = '4HSo5VvAgagdWvxo' // Withdraw(1 SOL)
const AUTHORIZE = '3t9dCbzwtx1BqWz6xrQiZ2VCzGzHKiXjN3Z9nn4gbTkiGKvTKzbuod' // Authorize(_, Withdrawer)
const UPDATE_COMMISSION = 'Zif9iZ' // UpdateCommission(10)

function transaction(program: string, ...data: string[]): Transaction {
    return {
        transaction: {
            message: {
                accountKeys: ['validator', 'voteAccount', program],
                instructions: data.map((data) => ({accounts: [1, 0], data, programIdIndex: 2, stackHeight: null})),
            },
        },
    } as Transaction
}

describe('isVoteTransaction', () => {
    it('holds for a consensus vote', () => {
        for (let data of [VOTE, VOTE_SWITCH, COMPACT_UPDATE_VOTE_STATE, TOWER_SYNC]) {
            expect(isVoteTransaction(transaction(VOTE_PROGRAM, data)), data).toBe(true)
        }
    })

    it('does not hold for vote account management', () => {
        for (let data of [WITHDRAW, AUTHORIZE, UPDATE_COMMISSION]) {
            expect(isVoteTransaction(transaction(VOTE_PROGRAM, data)), data).toBe(false)
        }
    })

    it('does not hold for other programs or several instructions', () => {
        expect(isVoteTransaction(transaction(SYSTEM_PROGRAM, TOWER_SYNC))).toBe(false)
        expect(isVoteTransaction(transaction(VOTE_PROGRAM, TOWER_SYNC, TOWER_SYNC))).toBe(false)
    })
})

describe('removeVoteTransactions', () => {
    it('keeps vote account management and the original positions', () => {
        let block = {
            transactions: [
                transaction(VOTE_PROGRAM, TOWER_SYNC),
                transaction(VOTE_PROGRAM, WITHDRAW),
                transaction(VOTE_PROGRAM, TOWER_SYNC),
                transaction(VOTE_PROGRAM, AUTHORIZE),
                transaction(SYSTEM_PROGRAM, WITHDRAW),
            ],
        } as GetBlock

        removeVoteTransactions(block)

        expect(block.transactions!.map((tx) => tx._index)).toEqual([1, 3, 4])
    })
})
