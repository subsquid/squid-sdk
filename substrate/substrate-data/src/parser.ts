import * as raw from '@subsquid/substrate-data-raw'
import {HashAndHeight, Prev, runtimeVersionEquals} from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-metadata'
import {annotateAsyncError, annotateSyncError, assertNotNull, groupBy, last} from '@subsquid/util-internal'
import {RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, Bytes, DataRequest} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {BlockParser} from './parsing/block'
import {supportsFeeCalc} from './parsing/fee'
import {AccountId} from './parsing/validator'
import {Runtime} from './runtime'


const STORAGE = {
    nextFeeMultiplier: '0x3f1467a096bcd71a5b6a0c8155e208103f2edf3bdf381debe331ab7446addfdc',
    validators: '0xcec5070d609dd3497f72bde07fc96ba088dcde934c658227ee1dfafcd6e16903',
    session: '0xcec5070d609dd3497f72bde07fc96ba072763800a36a99fdfc7c10f6415f6ee6'
}


export class Parser {
    private requests: RequestsTracker<DataRequest>
    private prevValidators = new Prev<{session: Bytes, validators: AccountId[]}>()
    private prevRuntime = new Prev<Runtime>()

    constructor(
        private rpc: raw.Rpc,
        requests: RangeRequestList<DataRequest>,
        private typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.requests = new RequestsTracker(requests)
    }

    async parse(blocks: RawBlock[]): Promise<Block[]> {
        if (blocks.length == 0) return []

        await this.setRuntime(blocks)

        let result = []

        for (let batch of this.requests.splitBlocksByRequest(blocks, b => b.height)) {
            if (batch.request?.blockValidator) {
                await this.setValidators(batch.blocks)
            }

            if (batch.request?.extrinsicFee && batch.request.calls) {
                for (let [runtime, blocks] of groupBy(batch.blocks, b => b.runtime!).entries()) {
                    if (!runtime.hasEvent('TransactionPayment.TransactionFeePaid') && supportsFeeCalc(runtime)) {
                        await this.setFeeMultiplier(blocks)
                    }
                }
            }

            for (let block of batch.blocks) {
                let parsed = this.parseBlock(block, batch.request)
                result.push(parsed)
            }
        }

        return result
    }

    @annotateSyncError(getRefCtx)
    private parseBlock(rawBlock: RawBlock, options?: DataRequest): Block {
        let parser = new BlockParser(rawBlock, options)

        let block = new Block(
            assertNotNull(rawBlock.runtime),
            assertNotNull(rawBlock.runtimeOfPrevBlock),
            parser.header()
        )

        if (options?.blockTimestamp && parser.timestamp()) {
            block.header.timestamp = parser.timestamp()
        }

        if (options?.blockValidator && parser.validator()) {
            block.header.validator = parser.validator()
        }

        if (options?.calls) {
            block.extrinsics = parser.extrinsics()?.map(item => item.extrinsic)
            block.calls = parser.calls()
        }

        if (options?.events) {
            block.events = parser.events()
        }

        if (options?.extrinsicFee) {
            if (parser.runtime.hasEvent('TransactionPayment.TransactionFeePaid')) {
                parser.setExtrinsicFeesFromPaidEvent()
            } else {
                parser.calcExtrinsicFees()
            }
        }

        return block
    }

    private async setRuntime(blocks: RawBlock[]): Promise<void> {
        if (blocks.length == 0) return

        let parentParentHeight = Math.max(0, blocks[0].height - 2)
        let prev = this.prevRuntime.getItem(parentParentHeight)
        if (prev == null) {
            prev = await this.fetchRuntime(await this.getParent(getParent(blocks[0])))
        }

        if (runtimeVersionEquals(prev.value, assertNotNull(blocks[0].runtimeVersion)) || prev.height == parentParentHeight) {
            blocks[0].runtimeOfPrevBlock = prev.value
        } else {
            prev = await this.fetchRuntime(await this.getParent(getParent(blocks[0])))
            blocks[0].runtimeOfPrevBlock = prev.value
        }

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (runtimeVersionEquals(prev.value, assertNotNull(block.runtimeVersion))) {
                block.runtime = prev.value
                prev = {
                    height: block.height,
                    value: prev.value
                }
            } else if (prev.height == getParent(block).height) {
                block.runtime = prev.value
            } else {
                prev = await this.fetchRuntime(getParent(block))
                block.runtime = prev.value
            }
            if (i > 0) {
                assert(blocks[i-1].height + 1 == block.height)
                block.runtimeOfPrevBlock = blocks[i-1].runtime
            }
        }
    }

    private async getParent(ref: HashAndHeight): Promise<HashAndHeight> {
        if (ref.height == 0) return ref
        let header = await this.rpc.getBlockHeader(ref.hash)
        return {
            height: ref.height - 1,
            hash: header.parentHash
        }
    }

    @annotateAsyncError(getRefCtx)
    private async fetchRuntime(
        ref: HashAndHeight
    ): Promise<{height: number, value: Runtime}> {
        let [runtimeVersion, metadata] = await Promise.all([
            this.rpc.getRuntimeVersion(ref.hash),
            this.rpc.getMetadata(ref.hash)
        ])
        let runtime = new Runtime(runtimeVersion, metadata, this.typesBundle)
        this.prevRuntime.set(ref.height, runtime)
        return {height: ref.height, value: runtime}
    }

    private async setValidators(blocks: RawBlock[]): Promise<void> {
        if (blocks.length == 0) return

        let prev = this.prevValidators.get(blocks[0].height)
        if (prev == null) {
            prev = await this.fetchValidators(blocks[0])
        }

        let lastBlock = last(blocks)
        if (lastBlock.session == null) {
            lastBlock.session = await this.rpc.getStorage(lastBlock.hash, STORAGE.session)
        }

        for (let block of blocks) {
            block.session = prev.session == lastBlock.session
                ? prev.session
                : await this.rpc.getStorage(block.hash, STORAGE.session)

            if (prev.session == block.session) {
                block.session = prev.session
                block.validators = prev.validators
            } else {
                prev = await this.fetchValidators(block)
            }
        }
    }

    @annotateAsyncError(getRefCtx)
    private async fetchValidators(block: RawBlock): Promise<{session: Bytes, validators: AccountId[]}> {
        let [session, data] = await Promise.all([
            block.session ? Promise.resolve(block.session) : this.rpc.getStorage(block.hash, STORAGE.session),
            this.rpc.getStorage(block.hash, STORAGE.validators)
        ])
        let runtime = assertNotNull(block.runtime)
        let validators = runtime.decodeStorageValue('Session.Validators', data)
        assert(Array.isArray(validators))
        block.session = session
        block.validators = validators
        let item = {session, validators}
        this.prevValidators.set(block.height, item)
        return item
    }

    private async setFeeMultiplier(blocks: RawBlock[]): Promise<void> {
        let call = blocks.map(b => {
            let parentHash = b.height == 0 ? b.hash : b.block.block.header.parentHash
            return {
                method: 'state_getStorageAt',
                params: [STORAGE.nextFeeMultiplier, parentHash]
            }
        })
        let values: Bytes[] = await this.rpc.batchCall(call)
        for (let i = 0; i < blocks.length; i++) {
            blocks[i].feeMultiplier = values[i]
        }
    }
}


function getParent(block: RawBlock): HashAndHeight {
    if (block.height == 0) return block
    return {
        height: block.height - 1,
        hash: block.block.block.header.parentHash
    }
}


function getRefCtx(ref: RawBlock | HashAndHeight) {
    return {
        blockHeight: ref.height,
        blockHash: ref.hash
    }
}
