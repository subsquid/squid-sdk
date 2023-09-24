import {HashAndHeight, Prev, Rpc} from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {addErrorContext, annotateAsyncError, assertNotNull, groupBy, last} from '@subsquid/util-internal'
import {RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Block, Bytes, DataRequest} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {parseBlock} from './parsing/block'
import {supportsFeeCalc} from './parsing/fee/calc'
import {AccountId} from './parsing/validator'
import {RuntimeTracker} from './runtime-tracker'


const STORAGE = {
    nextFeeMultiplier: '0x3f1467a096bcd71a5b6a0c8155e208103f2edf3bdf381debe331ab7446addfdc',
    validators: '0xcec5070d609dd3497f72bde07fc96ba088dcde934c658227ee1dfafcd6e16903',
    session: '0xcec5070d609dd3497f72bde07fc96ba072763800a36a99fdfc7c10f6415f6ee6'
}


export class Parser {
    private requests: RequestsTracker<DataRequest>
    private prevValidators = new Prev<{session: Bytes, validators: AccountId[]}>()
    private runtimeTracker: RuntimeTracker<RawBlock>

    constructor(
        private rpc: Rpc,
        requests: RangeRequestList<DataRequest>,
        typesBundle?: OldTypesBundle | OldSpecsBundle
    ) {
        this.requests = new RequestsTracker(requests)

        this.runtimeTracker = new RuntimeTracker<RawBlock>(
            block => ({
                height: block.height,
                hash: block.hash,
                parentHash: block.block.block.header.parentHash
            }),
            block => assertNotNull(block.runtimeVersion),
            this.rpc,
            typesBundle
        )
    }

    async parse(blocks: RawBlock[]): Promise<Block[]> {
        if (blocks.length == 0) return []

        await this.runtimeTracker.setRuntime(blocks)

        let result = []

        for (let batch of this.requests.splitBlocksByRequest(blocks, b => b.height)) {
            if (batch.request?.blockValidator) {
                await this.setValidators(batch.blocks)
            }

            if (batch.request?.extrinsics?.fee) {
                for (let [runtime, blocks] of groupBy(batch.blocks, b => b.runtime!).entries()) {
                    if (!runtime.hasEvent('TransactionPayment.TransactionFeePaid') && supportsFeeCalc(runtime)) {
                        await this.setFeeMultiplier(blocks)
                    }
                }
            }

            for (let block of batch.blocks) {
                let parsed = await this.parseBlock(block, batch.request)
                result.push(parsed)
            }
        }

        return result
    }

    private async parseBlock(rawBlock: RawBlock, options?: DataRequest): Promise<Block> {
        while (true) {
            try {
                return parseBlock(rawBlock, options ?? {})
            } catch(err: any) {
                if (err instanceof MissingStorageValue) {
                    let val = await this.rpc.getStorage(rawBlock.block.block.header.parentHash, err.key)
                    let storage = rawBlock.storage || (rawBlock.storage = {})
                    storage[err.key] = val
                } else {
                    throw addErrorContext(err, getRefCtx(rawBlock))
                }
            }
        }
    }

    private async setValidators(blocks: RawBlock[]): Promise<void> {
        blocks = blocks.filter(b => b.runtime!.hasStorageItem('Session.Validators'))

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
