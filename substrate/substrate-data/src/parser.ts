import {Prev, Rpc} from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {addErrorContext, annotateAsyncError, assertNotNull, groupBy} from '@subsquid/util-internal'
import {assertIsValid, HashAndHeight, setInvalid, trimInvalid} from '@subsquid/util-internal-ingest-tools'
import {RangeRequestList, splitBlocksByRequest} from '@subsquid/util-internal-range'
import {Block, Bytes, DataRequest} from './interfaces/data'
import {RawBlock, SessionIndex} from './interfaces/data-raw'
import {parseBlock} from './parsing/block'
import {supportsFeeCalc} from './parsing/fee/calc'
import {AccountId} from './parsing/validator'
import {RuntimeTracker} from './runtime-tracker'
import {STORAGE} from './storage'


export class Parser {
    private prevValidators = new Prev<{session: SessionIndex, validators: AccountId[]}>()
    private runtimeTracker: RuntimeTracker<RawBlock>

    constructor(
        private rpc: Rpc,
        private requests: RangeRequestList<DataRequest>,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.runtimeTracker = new RuntimeTracker<RawBlock>(
            this.rpc,
            block => ({
                height: block.height,
                hash: block.hash,
                parentHash: block.block.block.header.parentHash
            }),
            block => assertNotNull(block.runtimeVersion),
            typesBundle
        )
    }

    async parseCold(blocks: RawBlock[]): Promise<Block[]> {
        await this.parse(blocks)
        assertIsValid(blocks)
        return blocks.map(b => assertNotNull(b.parsed))
    }

    async parse(blocks: RawBlock[]): Promise<void> {
        if (blocks.length == 0) return

        await this.runtimeTracker.setRuntime(blocks)
        blocks = trimInvalid(blocks)

        for (let batch of splitBlocksByRequest(this.requests, blocks, b => b.height)) {
            let batchBlocks = batch.blocks

            if (batch.request?.blockValidator) {
                await this.setValidators(batchBlocks)
                batchBlocks = trimInvalid(batchBlocks)
            }

            if (batch.request?.extrinsics?.fee) {
                for (let [runtime, blocks] of groupBy(batchBlocks, b => b.runtime!).entries()) {
                    if (!runtime.hasEvent('TransactionPayment.TransactionFeePaid') && supportsFeeCalc(runtime)) {
                        await this.setFeeMultiplier(blocks)
                    }
                }
                batchBlocks = trimInvalid(batchBlocks)
            }

            for (let block of batchBlocks) {
                await this.parseBlock(block, batch.request)
                if (block._isInvalid) return
            }
        }
    }

    private async parseBlock(rawBlock: RawBlock, options?: DataRequest): Promise<void> {
        while (true) {
            try {
                rawBlock.parsed = parseBlock(rawBlock, options ?? {})
                return
            } catch(err: any) {
                if (err instanceof MissingStorageValue) {
                    let val = await this.rpc.getStorage(err.key, rawBlock.block.block.header.parentHash)
                    if (val === undefined) {
                        rawBlock._isInvalid = true
                        return
                    }
                    let storage = rawBlock.storage || (rawBlock.storage = {})
                    storage[err.key] = val
                } else {
                    throw addErrorContext(err, getRefCtx(rawBlock))
                }
            }
        }
    }

    private async setValidators(blocks: RawBlock[]): Promise<void> {
        blocks = blocks.filter(b => STORAGE.validators.isDefined(b))

        if (blocks.length == 0 || blocks[0]._isInvalid) return

        let prev: {session: SessionIndex, validators: AccountId[]}
        let maybePrev = this.prevValidators.get(blocks[0].height)
        if (maybePrev == null) {
            maybePrev = await this.fetchValidators(blocks[0])
            if (maybePrev == null) return setInvalid(blocks)
            prev = maybePrev
        } else {
            prev = maybePrev
        }

        let last = blocks.length - 1
        let lastBlock: RawBlock | undefined
        while (last >= 0) {
            lastBlock = blocks[last]
            if (lastBlock.session == null) {
                let session = await STORAGE.sessionIndex.get(this.rpc, lastBlock)
                if (session === undefined) {
                    last -= 1
                } else {
                    lastBlock.session = session
                    break
                }
            } else {
                break
            }
        }

        if (lastBlock == null) return setInvalid(blocks)

        for (let i = 0; i <= last; i++) {
            let block = blocks[i]
            if (prev.session == lastBlock.session) {
                block.session = prev.session
            } else {
                let session = await STORAGE.sessionIndex.get(this.rpc, block)
                if (session === undefined) return setInvalid(blocks, i)
                block.session = session
            }
            if (prev.session == block.session) {
                block.session = prev.session
                block.validators = prev.validators
            } else {
                let maybePrev = await this.fetchValidators(block)
                if (maybePrev == null) return setInvalid(blocks, i)
                prev = maybePrev
            }
        }

        if (last + 1 < blocks.length) {
            setInvalid(blocks, last + 1)
        }
    }

    @annotateAsyncError(getRefCtx)
    private async fetchValidators(block: RawBlock): Promise<{session: SessionIndex, validators: AccountId[]} | undefined> {
        let [session, validators] = await Promise.all([
            block.session ? Promise.resolve(block.session) : STORAGE.sessionIndex.get(this.rpc, block),
            STORAGE.validators.get(this.rpc, block)
        ])
        if (session === undefined || validators === undefined) return
        block.session = session
        block.validators = validators
        let item = {session, validators}
        this.prevValidators.set(block.height, item)
        return item
    }

    private async setFeeMultiplier(blocks: RawBlock[]): Promise<void> {
        let values = await this.rpc.getStorageMany(blocks.map(b => {
            let parentHash = b.height == 0 ? b.hash : b.block.block.header.parentHash
            return [STORAGE.nextFeeMultiplier.key(), parentHash]
        }))
        for (let i = 0; i < blocks.length; i++) {
            let value = values[i]
            let block = blocks[i]
            if (value === undefined) {
                block._isInvalid = true
            } else {
                block.feeMultiplier = STORAGE.nextFeeMultiplier.decode(block, value)
            }
        }
    }
}


function getRefCtx(ref: HashAndHeight) {
    return {
        blockHeight: ref.height,
        blockHash: ref.hash
    }
}


export class MissingStorageValue extends Error {
    constructor(
        public readonly key: Bytes
    ) {
        super()
    }

    get name() {
        return 'MissingStorageValue'
    }
}
