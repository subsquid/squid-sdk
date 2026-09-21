import {Block} from '@subsquid/starknet-normalization'
import {project} from '../data/fields'
import {FieldSelection} from '../data/model'
import {PartialBlock} from '../data/data-partial'

export function projectFields(block: Block, fields: FieldSelection): PartialBlock {
    return {
        header: {
            height: block.header.height,
            hash: block.header.hash,
            ...project(fields.block, block.header)
        },
        transactions: block.transactions.map(tx => {
            return {
                transactionIndex: tx.transactionIndex,
                ...project(fields.transaction, tx)
            }
        }),
        events: block.events.map(event => {
            return {
                transactionIndex: event.transactionIndex,
                eventIndex: event.eventIndex,
                ...project(fields.event, event)
            }
        })
    }
}