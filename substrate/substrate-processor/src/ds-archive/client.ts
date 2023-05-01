import {maybeLast, withErrorContext} from '@subsquid/util-internal'
import {Output} from '@subsquid/util-internal-code-printer'
import {HttpClient} from '@subsquid/http-client'
import {ArchiveDataSource, BatchRequest, BatchResponse} from '@subsquid/util-internal-processor-tools'
import assert from 'assert'
import {BlockDataP, DataRequest} from '../interfaces/data'
import {SpecId, SpecMetadata} from '../interfaces/substrate'
import * as gw from './gateway'
import {printGqlArguments} from './gql'
import {mapGatewayBlock} from './mapping'


export class SubstrateArchive implements ArchiveDataSource<DataRequest> {
    constructor(private http: HttpClient) {}

    async getFinalizedBatch(request: BatchRequest<DataRequest>): Promise<BatchResponse> {
        let ctx = {}
        let {blocks, chainHeight, nextBlock} = await this
            .fetchBatch(request, ctx)
            .catch(withErrorContext(ctx))

        let batch: BatchResponse = {
            range: {from: request.range.from, to: nextBlock - 1},
            blocks,
            chainHeight
        }

        if (maybeLast(batch.blocks)?.header.height !== batch.range.to) {
            batch.blocks.push(
                await this.fetchBlock(batch.range.to)
            )
        }

        return batch
    }

    private fetchBlock(height: number): Promise<BlockDataP> {
        let ctx = {}
        return this.fetchBatch({
            range: {from: height, to: height},
            request: {
                includeAllBlocks: true
            }
        }, ctx).then(res => {
            assert(res.blocks.length == 1)
            return res.blocks[0]
        }).catch(
            withErrorContext(ctx)
        )
    }

    private async fetchBatch(
        request: BatchRequest<DataRequest>,
        ctx: {archiveQuery?: string}
    ): Promise<{
        blocks: BlockDataP[]
        nextBlock: number
        chainHeight: number
    }> {
        let query = ctx.archiveQuery = printBatchQuery(request)

        let res: {
            status: {head: number},
            batch: gw.BatchResponse,
        } = await this.http.graphqlRequest(query)

        let blocks = res.batch.data
            .map(mapGatewayBlock)
            .sort((a, b) => a.header.height - b.header.height)

        return {
            blocks,
            nextBlock: res.batch.nextBlock,
            chainHeight: res.status.head
        }
    }

    async getFinalizedHeight(): Promise<number> {
        let res: {status: {head: number}} = await this.http.graphqlRequest(
            `query { status { head } }`
        )
        let height = res.status.head
        if (height == 0) {
            height = -1
        }
        return height
    }

    async getSpecId(height: number): Promise<SpecId> {
        let res: {batch: {header: {specId: SpecId}}[]} = await this.http.graphqlRequest(`
            query {
                batch(fromBlock: ${height} toBlock: ${height} includeAllBlocks: true limit: 1) {
                    header {
                        specId
                    }
                }
            }
        `)
        if (res.batch.length == 0) throw new Error(`Block ${height} not found in archive`)
        assert(res.batch.length === 1)
        return res.batch[0].header.specId
    }

    async getSpecMetadata(specId: SpecId): Promise<SpecMetadata> {
        let res = await this.http.graphqlRequest<{metadataById: SpecMetadata | null}>(`
            query {
                metadataById(id: "${specId}") {
                    id
                    specName
                    specVersion
                    blockHeight
                    hex
                }
            }
        `)
        if (res.metadataById == null) {
            throw new Error(`Metadata for spec ${specId} not found in archive`)
        } else {
            return res.metadataById
        }
    }
}


function printBatchQuery(request: BatchRequest<DataRequest>): string {
    let from = request.range.from

    let args: gw.BatchRequest = {
        fromBlock: from
    }

    let to = request.range.to
    if (to != null) {
        assert(from <= to)
        args.toBlock = to
    }

    if (request.request.includeAllBlocks) {
        args.includeAllBlocks = true
    }

    args.events = request.request.events?.map(req => {
        return {
            name: req.name,
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.calls = request.request.calls?.map(req => {
        return {
            name: req.name,
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.evmLogs = request.request.evmLogs?.map(req => {
        return {
            contract: req.contract,
            filter: req.filter?.map(ensureArray),
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.ethereumTransactions = request.request.ethereumTransactions?.map(req => {
        return {
            contract: req.contract,
            sighash: req.sighash,
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.contractsEvents = request.request.contractsEvents?.map(req => {
        return {
            contract: req.contract,
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.gearMessagesEnqueued = request.request.gearMessagesEnqueued?.map(req => {
        return {
            program: req.program,
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.gearUserMessagesSent = request.request.gearUserMessagesSent?.map(req => {
        return {
            program: req.program,
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.acalaEvmExecuted = request.request.acalaEvmExecuted?.map(req => {
        return {
            contract: req.contract,
            logs: req.logs?.map(log => {
                return {
                    ...log,
                    filter: log.filter?.map(ensureArray)
                }
            }),
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    args.acalaEvmExecutedFailed = request.request.acalaEvmExecutedFailed?.map(req => {
        return {
            contract: req.contract,
            logs: req.logs?.map(log => {
                return {
                    ...log,
                    filter: log.filter?.map(ensureArray)
                }
            }),
            data: toGatewayFields(req.data, CONTEXT_NESTING_SHAPE)
        }
    })

    let q = new Output()
    q.block(`query`, () => {
        q.block(`status`, () => {
            q.line('head')
        })
        q.block(`batch(${printGqlArguments(args)})`, () => {
            q.block('header', () => {
                q.line('id')
                q.line('height')
                q.line('hash')
                q.line('parentHash')
                q.line('timestamp')
                q.line('specId')
                q.line('stateRoot')
                q.line('extrinsicsRoot')
                q.line('validator')
            })
            q.line('events')
            q.line('calls')
            q.line('extrinsics')
        })
    })
    return q.toString()
}


function toGatewayFields(req: any | undefined, shape: Record<string, any> | null): any | undefined {
    if (!req) return undefined
    if (req === true) return shape ? {_all: true} : true
    let fields: any = {}
    for (let key in req) {
        let val = toGatewayFields(req[key], shape?.[key])
        if (val != null) {
            fields[key] = val
        }
    }
    return fields
}


const CONTEXT_NESTING_SHAPE = (() => {
    let call = {
        parent: {}
    }
    let extrinsic = {
        call
    }
    return {
        event: {
            call,
            extrinsic
        },
        call,
        extrinsic
    }
})();


function ensureArray<T>(val?: T | T[] | null): T[] {
    if (Array.isArray(val)) return val
    if (val == null) return []
    return [val]
}
