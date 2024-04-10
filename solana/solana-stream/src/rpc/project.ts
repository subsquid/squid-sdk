import {Block} from '@subsquid/solana-normalization'
import {project} from '../data/fields'
import {FieldSelection} from '../data/model'
import {PartialBlock} from '../data/partial'


export function projectFields(block: Block, fields: FieldSelection): PartialBlock {
    return {
        header: {
            height: block.header.height,
            hash: block.header.hash,
            parentHash: block.header.parentHash,
            ...project(fields.block, block.header)
        },
        transactions: block.transactions.map(tx => {
            return {
                transactionIndex: tx.transactionIndex,
                ...project(fields.transaction, tx)
            }
        }),
        instructions: block.instructions.map(i => {
            return {
                transactionIndex: i.transactionIndex,
                instructionAddress: i.instructionAddress,
                ...project(fields.instruction, i)
            }
        }),
        logs: block.logs.map(log => {
            return {
                transactionIndex: log.transactionIndex,
                logIndex: log.logIndex,
                instructionAddress: log.instructionAddress,
                ...project(fields.log, log)
            }
        }),
        balances: block.balances.map(b => {
            return {
                transactionIndex: b.transactionIndex,
                account: b.account,
                ...project(fields.balance, b)
            }
        }),
        tokenBalances: block.tokenBalances.map(b => {
            return {
                transactionIndex: b.transactionIndex,
                account: b.account,
                ...project(fields.tokenBalance, b)
            }
        }),
        rewards: block.rewards.map(r => {
            return {
                pubkey: r.pubkey,
                ...project(fields.reward, r)
            }
        })
    }
}
