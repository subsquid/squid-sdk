import {EntityFilter, FilterBuilder} from '@subsquid/util-internal-processor-tools'
import {assertNotNull, groupBy, weakMemo} from '@subsquid/util-internal'
import {Block, Transaction, Event} from '@subsquid/starknet-normalization'
import {DataRequest} from '../data/data-request'

class IncludeSet {
    public readonly transactions = new Set<Transaction>()
    public readonly events = new Set<Event>()

    addTransaction(tx?: Transaction): void {
        if (tx) {
            this.transactions.add(tx)
        }
    }

    addEvent(event?: Event): void {
        if (event) {
            this.events.add(event)
        }
    }
}

interface TransactionRelations {
    events?: boolean
}

interface EventRelations {
    transaction?: boolean
}

function buildTransactionFilter(dataRequest: DataRequest): EntityFilter<Transaction, TransactionRelations> {
    let transactions = new EntityFilter<Transaction, TransactionRelations>()

    dataRequest.transactions?.forEach(req => {
        let filter = new FilterBuilder<Transaction>()
        filter.propIn('type', req.type)
        filter.propIn('contractAddress', req.contractAddress)
        filter.propIn('senderAddress', req.senderAddress)
        
        // Handle nonce range if specified
        if (req.firstNonce != null || req.lastNonce != null) {
            filter.getIn(tx => {
                if (tx.nonce == null) return false
                if (req.firstNonce != null && tx.nonce < req.firstNonce) return false
                if (req.lastNonce != null && tx.nonce > req.lastNonce) return false
                return true
            }, [true])
        }
        
        // Extract relations (events)
        const relations: TransactionRelations = {
            events: req.events
        }
        
        transactions.add(filter, relations)
    })

    return transactions
}

function buildEventFilter(dataRequest: DataRequest): EntityFilter<Event, EventRelations> {
    let events = new EntityFilter<Event, EventRelations>()

    dataRequest.events?.forEach(req => {
        let filter = new FilterBuilder<Event>()
        filter.propIn('fromAddress', req.fromAddress)
        
        // Filter by event keys
        filter.getIn(event => event.keys[0], req.key0)
        filter.getIn(event => event.keys[1], req.key1)
        filter.getIn(event => event.keys[2], req.key2)
        filter.getIn(event => event.keys[3], req.key3)
        
        // Extract relations (transaction)
        const relations: EventRelations = {
            transaction: req.transaction
        }
        
        events.add(filter, relations)
    })

    return events
}

const getItemFilter = weakMemo((dataRequest: DataRequest) => {
    return {
        transactions: buildTransactionFilter(dataRequest),
        events: buildEventFilter(dataRequest)
    }
})

export function filterBlock(block: Block, dataRequest: DataRequest): void {
    // Get filters for this request
    let items = getItemFilter(dataRequest)

    // Track entities to keep
    let include = new IncludeSet()

    // Create lookup maps
    let transactions = new Map(block.transactions.map(tx => [tx.transactionIndex, tx]))
    let eventsByTx = groupBy(block.events, event => event.transactionIndex)

    // Filter transactions
    if (items.transactions.present()) {
        for (let tx of block.transactions) {
            let rel = items.transactions.match(tx)
            if (rel == null) continue
            
            include.addTransaction(tx)
            
            // Add related events if requested
            if (rel.events) {
                let events = eventsByTx.get(tx.transactionIndex) || []
                for (let event of events) {
                    include.addEvent(event)
                }
            }
        }
    }

    // Filter events
    if (items.events.present()) {
        for (let event of block.events) {
            let rel = items.events.match(event)
            if (rel == null) continue
            
            include.addEvent(event)
            
            // Add related transaction if requested
            if (rel.transaction) {
                let tx = assertNotNull(transactions.get(event.transactionIndex))
                include.addTransaction(tx)
            }
        }
    }

    // Update block with filtered entities
    block.transactions = block.transactions.filter(tx => include.transactions.has(tx))
    block.events = block.events.filter(event => include.events.has(event))
}