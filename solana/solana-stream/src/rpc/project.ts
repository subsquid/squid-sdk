import {Block} from '@subsquid/solana-normalization'
import {project} from '../data/fields'
import {FieldSelection} from '../data/model'
import {PartialBlock} from '../data/partial'
import {D8_SYM, DATA_SYM} from '../instruction'


export function projectFields(block: Block, fields: FieldSelection): PartialBlock {
    return {
        header: {
            number: block.header.number,
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
            let ins = {
                transactionIndex: i.transactionIndex,
                instructionAddress: i.instructionAddress,
                ...project(fields.instruction, i)
            }
            ;(ins as any)[D8_SYM] = (i as any)[D8_SYM]
            ;(ins as any)[DATA_SYM] = (i as any)[DATA_SYM]
            return ins
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
