import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {Batch, coldIngest} from '@subsquid/util-internal-ingest-tools'
import {Block} from '@subsquid/starknet-data'
import {DataRequest} from '../base'
import {Rpc} from '../rpc'


export interface IngestFinalizedBlocksOptions {
    requests: RangeRequestList<DataRequest>
    stopOnHead?: boolean
    rpc: Rpc
    headPollInterval: number
    splitSize: number
    concurrency: number
};

async function getSplitBlocks(rpc: Rpc, req: { range: { from: number, to: number }, request: DataRequest }): Promise<Block[]> {
    // Create a range request list for the range
    const rangeRequests: RangeRequestList<DataRequest> = [{
        range: {
            from: req.range.from,
            to: req.range.to
        },
        request: req.request
    }];

    // Get blocks using existing getBlockBatch method
    const blocks = await rpc.getBlockBatch(rangeRequests);
    
    // Filter out null/undefined values and return valid blocks
    return blocks.filter((block): block is Block => block != null);
}

export async function* ingestFinalizedBlocks(options: IngestFinalizedBlocksOptions, stopOnHead?: boolean): AsyncIterable<Batch<Block>> {
    return coldIngest({
        getFinalizedHeight: () => options.rpc.getFinalizedHeight(),
        getSplit: (req) => getSplitBlocks(options.rpc, req),
        requests: options.requests,
        concurrency: options.concurrency,
        splitSize: options.splitSize,
        stopOnHead,
        headPollInterval: options.headPollInterval
    });
}
