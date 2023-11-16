import {annotateSyncError, assertNotNull} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {
    archiveIngest,
    Batch,
    DataSource,
    PollingHeightTracker,
    RangeRequest,
    RangeRequestList
} from '@subsquid/util-internal-processor-tools'
import {DEFAULT_FIELDS, FieldSelection} from './interfaces/data'
import {ArchiveBlock, ArchiveBlockHeader} from './interfaces/data-partial'
import {DataRequest} from './interfaces/data-request'
import {Block, BlockHeader, InternalTransaction, Log, Transaction} from './mapping'
import {HttpApi} from '@subsquid/tron-dump/lib/http'


interface ArchiveQuery extends DataRequest {
    type: 'tron'
    fromBlock: number
    toBlock?: number
}


export interface SubstrateArchiveOptions {
    client: ArchiveClient
    httpApi: HttpApi
}


export class TronArchive implements DataSource<Block, DataRequest> {
    private client: ArchiveClient
    private httpApi: HttpApi

    constructor(options: SubstrateArchiveOptions) {
        this.client = options.client
        this.httpApi = options.httpApi
    }

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    getBlockHash(height: number): Promise<string> {
        return this.httpApi.getBlock(height, false).then(block => block.blockID)
    }

    getFinalizedBlocks(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean): AsyncIterable<Batch<Block>> {
        return archiveIngest({
            requests,
            heightTracker: new PollingHeightTracker(() => this.getFinalizedHeight(), 30_000),
            query: async s => {
                let blocks = await this.query(s)
                return blocks.map(b => this.mapBlock(b))
            },
            stopOnHead
        })
    }

    private query(req: RangeRequest<DataRequest>): Promise<ArchiveBlock[]> {
        let {fields, ...items} = req.request

        let q: ArchiveQuery = {
            type: 'tron',
            fromBlock: req.range.from,
            toBlock: req.range.to,
            fields: getFields(fields),
            ...items
        }

        return this.client.query(q)
    }

    @annotateSyncError((src: ArchiveBlock) => ({blockHeight: src.header.number, blockHash: src.header.hash}))
    private mapBlock(src: ArchiveBlock): Block {
        let block = new Block(new BlockHeader(
            {
                height: src.header.number,
                ...src.header
            }
        ))

        if (src.transactions) {
            for (let s of src.transactions) {
                let tx = new Transaction(block.header, 0)
                if (s.hash != null) {
                    tx.hash = s.hash
                }
                block.transactions.push(tx)
            }
        }

        if (src.internalTransactions) {
            for (let s of src.internalTransactions) {
                let tx = new InternalTransaction(block.header, 0)
                block.internalTransactions.push(tx)
            }
        }

        if (src.logs) {
            for (let s of src.logs) {
                let log = new Log(block.header, s.logIndex)

                if (s.transactionHash != null) {
                    log.transactionHash = s.transactionHash
                }

                if (s.address != null) {
                    log.address = s.address
                }

                if (s.data != null) {
                    log.data = s.data
                }

                if (s.topics != null) {
                    log.topics = s.topics
                }

                block.logs.push(log)
            }
        }

        // setUpItems(block)
        return block
    }
}


type Selector<Keys extends string> = {
    [K in Keys]?: boolean
}


function mergeFields<Keys extends string>(def: Selector<Keys>, requested?: Selector<Keys>, required?: Selector<Keys>): Selector<Keys> {
    let fields: Selector<Keys> = {...def}
    for (let key in requested) {
        fields[key] = requested[key]
    }
    Object.assign(fields, required)
    return fields
}


function getFields(fields: FieldSelection | undefined): FieldSelection {
    return {
        block: mergeFields(DEFAULT_FIELDS.block, fields?.block),
        transaction: mergeFields(DEFAULT_FIELDS.transaction, fields?.transaction),
        internalTransaction: mergeFields(DEFAULT_FIELDS.internalTransaction, fields?.internalTransaction),
        log: mergeFields(DEFAULT_FIELDS.log, fields?.log),
    }
}
