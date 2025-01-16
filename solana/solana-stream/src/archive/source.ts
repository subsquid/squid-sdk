import {BlockHeader} from '@subsquid/solana-normalization'
import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {assertNotNull} from '@subsquid/util-internal'
import {ArchiveClient} from '@subsquid/util-internal-archive-client'
import {archiveIngest} from '@subsquid/util-internal-ingest-tools'
import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {array, cast} from '@subsquid/util-internal-validation'
import assert from 'assert'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
import {getDataSchema} from './schema'


export class SolanaArchive {
    constructor(private client: ArchiveClient) {}

    getFinalizedHeight(): Promise<number> {
        return this.client.getHeight()
    }

    async getBlockHash(height: number): Promise<Base58Bytes | undefined> {
        let blocks = await this.client.query({
            type: 'solana',
            fromBlock: height,
            toBlock: height,
            fields: {
                block: {
                    hash: true,
                }
            },
            includeAllBlocks: true
        })
        assert(blocks.length == 1)
        return blocks[0].header.hash
    }

    async getBlockHeader(height: number): Promise<BlockHeader> {
        let blocks = await this.client.query({
            type: 'solana',
            fromBlock: height,
            toBlock: height,
            includeAllBlocks: true,
            fields: {
                block: {
                    hash: true,
                    number: true,
                    slot: true,
                    parentSlot: true,
                    parentHash: true,
                    timestamp: true
                }
            }
        })
        assert(blocks.length == 1)
        let {number, ...rest} = blocks[0].header
        return {
            height: number,
            ...rest
        } as BlockHeader
    }

    async *getBlockStream(requests: RangeRequestList<DataRequest>, stopOnHead?: boolean | undefined): AsyncIterable<PartialBlock[]> {
        let archiveRequests = mapRangeRequestList(requests, req => {
            let {fields, includeAllBlocks, ...items} = req
            let archiveItems: any = {}
            let key: keyof typeof items
            for (key in items) {
                archiveItems[key] = items[key]?.map(it => ({...it.where, ...it.include}))
            }
            return {
                type: 'solana',
                fields: {
                    block: {parentHash: true, ...fields?.block},
                    transaction: fields?.transaction,
                    instruction: fields?.instruction,
                    log: {instructionAddress: true, ...fields?.log},
                    balance: fields?.balance,
                    tokenBalance: fields?.tokenBalance,
                    reward: fields?.reward
                },
                includeAllBlocks,
                ...archiveItems
            }
        })

        for await (let batch of archiveIngest({
            client: this.client,
            requests: archiveRequests,
            stopOnHead
        })) {
            let req = getRequestAt(requests, batch.blocks[0].header.number)

            let blocks = cast(
                array(getDataSchema(assertNotNull(req?.fields))),
                batch.blocks
            ).map(b => {
                let {header: {number, ...hdr}, ...items} = b
                return {
                    header: {height: number, ...hdr},
                    transactions: items.transactions || [],
                    instructions: items.instructions || [],
                    logs: items.logs || [],
                    balances: items.balances || [],
                    tokenBalances: items.tokenBalances || [],
                    rewards: items.rewards || []
                }
            })

            yield blocks
        }
    }
}
