import {HashAndHeight, Prev, Rpc} from '@subsquid/substrate-data-raw'
import {OldSpecsBundle, OldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {annotateAsyncError, annotateSyncError, assertNotNull, groupBy, last} from '@subsquid/util-internal'
import {RequestsTracker} from '@subsquid/util-internal-ingest-tools'
import {RangeRequestList} from '@subsquid/util-internal-range'
import assert from 'assert'
import {setEmittedContractAddress} from './extension/contracts'
import {setGearProgramId} from './extension/gear'
import {Block, Bytes, DataRequest} from './interfaces/data'
import {RawBlock} from './interfaces/data-raw'
import {BlockParser} from './parsing/block'
import {supportsFeeCalc} from './parsing/fee/calc'
import {setEthereumTransact, setEvmLog} from './extension/evm'
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
            if (block.calls) {
                for (let call of block.calls!) {
                    setEthereumTransact(block.runtime, call)
                }
            }
        }

        if (options?.events) {
            block.events = parser.events()
            if (block.events) {
                for (let event of block.events!) {
                    setEvmLog(block.runtime, event)
                    setEmittedContractAddress(block.runtime, event)
                    setGearProgramId(block.runtime, event)
                }
            }
        }

        if (options?.extrinsicFee) {
            if (block.runtime.hasEvent('TransactionPayment.TransactionFeePaid')) {
                parser.setExtrinsicFeesFromPaidEvent()
            } else {
                parser.calcExtrinsicFees()
            }
        }

        return block
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


function getRefCtx(ref: HashAndHeight) {
    return {
        blockHeight: ref.height,
        blockHash: ref.hash
    }
}
