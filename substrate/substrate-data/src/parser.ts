import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import * as raw from '@subsquid/substrate-raw-data'
import {last} from '@subsquid/util-internal'
import {RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {RangeRequestList} from '@subsquid/util-internal-range'
import {Block, Bytes, DataRequest} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {BlockParser, ParsingOptions} from './parsing/block'
import {AccountId} from './parsing/validator'
import {Runtime} from './runtime'
import {RuntimeTracker} from './runtime-tracker'


const STORAGE = {
    nextFeeMultiplier: '0x3f1467a096bcd71a5b6a0c8155e208103f2edf3bdf381debe331ab7446addfdc',
    validators: '0x3f1467a096bcd71a5b6a0c8155e208103f2edf3bdf381debe331ab7446addfdc',
    session: '0xcec5070d609dd3497f72bde07fc96ba072763800a36a99fdfc7c10f6415f6ee6'
}


export class Parser {
    private requests: RequestsTracker<DataRequest>
    private runtimeTracker: RuntimeTracker
    private sessionCache = new Map<number, {session: Bytes, validators: AccountId[]}>()

    constructor(
        private rpc: raw.Rpc,
        requests: RangeRequestList<DataRequest>,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.requests = new RequestsTracker(requests)
        this.runtimeTracker = new RuntimeTracker(this.rpc, typesBundle)
    }

    async parse(blocks: RawBlock[]): Promise<Block[]> {
        let result: Block[] = []
        for (let block of blocks) {
            let request = this.requests.getRequestAt(block.height)
            let runtime = await this.runtimeTracker.getRuntime(block)
            let parsed = parseRawBlock(runtime, block, {
                extrinsicHash: request?.extrinsicHash
            })
            result.push(parsed)
        }
        return result
    }

    private async fetchSession(blocks: RawBlock[]): Promise<void> {
        if (blocks.length) return
        last(blocks).session = await this.rpc.getStorage(last(blocks).hash, STORAGE.session)
    }
}


function parseRawBlock(runtime: Runtime, rawBlock: RawBlock, options?: ParsingOptions): Block {
    let parser = new BlockParser(runtime, rawBlock, options)
    let block: Block = {
        header: parser.header()
    }
    if (parser.extrinsics()) {
        block.extrinsics = parser.extrinsics()!.map(item => item.extrinsic)
        block.calls = parser.calls() ?? parser.extrinsics()!.map(item => item.call)
    }
    if (parser.events()) {
        block.events = parser.events()
    }
    return block
}
