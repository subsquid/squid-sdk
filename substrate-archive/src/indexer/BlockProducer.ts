import {Hash, Header} from '@polkadot/types/interfaces'
import Debug from 'debug'
import pRetry from 'p-retry'
import pTimeout, {TimeoutError} from 'p-timeout'
import pWaitFor from 'p-wait-for'
import {BlockData} from '../model'
import {getConfig} from '../node'
import {eventEmitter, IndexerEvents} from '../node/event-emitter'
import {getSubstrateService, ISubstrateService} from '../substrate'
import {FIFOCache} from "../util/FIFOCache"
import {IBlockProducer} from './IBlockProducer'

const DEBUG_TOPIC = 'hydra-indexer:producer'

const debug = Debug(DEBUG_TOPIC)

export class BlockProducer implements IBlockProducer<BlockData> {
    private _started: boolean

    private _blockToProduceNext: number

    private _chainHeight: number

    private _headerCache = new FIFOCache<number, Header>(
        getConfig().HEADER_CACHE_CAPACITY
    )

    private substrateService!: ISubstrateService

    constructor() {
        debug(`Creating Block Producer`)
        this._started = false
        this._blockToProduceNext = 0
        this._chainHeight = 0
    }

    async start(atBlock: number): Promise<void> {
        debug(`Starting Block Producer`)
        if (this._started) throw Error(`Cannot start when already started.`)
        this.substrateService = await getSubstrateService()

        // mark as started
        this._started = true

        // Try to get initial header right away
        const finalizedHeadHash = await this.substrateService.getFinalizedHead()
        const header = await this.substrateService.getHeader(finalizedHeadHash)
        this._chainHeight = header.number.toNumber()

        // We cache block headers to save on API calls
        eventEmitter.on(IndexerEvents.NEW_FINALIZED_HEAD, ({header, height}) => {
            debug(`New finalized head: ${JSON.stringify(header)}, height: ${height}`)
            this._headerCache.put(height, header)
            this._chainHeight = header.number.toNumber()
        })

        this._blockToProduceNext = atBlock
        debug(
            `Starting the block producer, next block: ${this._blockToProduceNext.toString()}`
        )
        if (atBlock > this._chainHeight) {
            debug(
                `Current finalized head ${this._chainHeight} is behind the start block ${atBlock}. Waiting...`
            )
            await pWaitFor(() => this._chainHeight >= atBlock)
        }
    }

    async stop(): Promise<void> {
        if (!this._started) {
            debug('Block producer is not started')
            return
        }

        debug('Block producer has been stopped')
        this._started = false
    }

    public async fetchBlock(height: number): Promise<BlockData> {
        if (height > this._chainHeight) {
            throw new Error(
                `Cannot fetch block at height ${height}, current chain height is ${this._chainHeight}`
            )
        }
        debug(`Fetching block #${height.toString()}`)
        const targetHash = await this.getBlockHash(height)
        // retry if the there was an error for some reason
        return pRetry(() => this._doBlockProduce(targetHash), {
            retries: getConfig().BLOCK_PRODUCER_FETCH_RETRIES,
        })
    }

    public async* blockHeights(): AsyncGenerator<number> {
        while (this._started) {
            await this.checkHeightOrWait()
            debug(`Yield: ${this._blockToProduceNext.toString()}`)
            yield this._blockToProduceNext
            this._blockToProduceNext++
        }
    }

    /**
     * This sub-routine does the actual fetching and block processing.
     * It can throw errors which should be handled by the top-level code
     */
    private async _doBlockProduce(targetHash: Hash): Promise<BlockData> {
        debug(`\tHash ${targetHash.toString()}.`)

        const blockData = await this.substrateService.getBlockData(targetHash)
        if (getConfig().VERBOSE) {
            debug(`Received block data: ${JSON.stringify(blockData, null, 2)}`)
        }
        debug(`Produced query event block.`)

        return blockData
    }

    private async checkHeightOrWait(): Promise<void> {
        return pTimeout(
            pWaitFor(
                // when to resolve
                () => this._blockToProduceNext <= this._chainHeight
            ),
            getConfig().NEW_BLOCK_TIMEOUT_MS,
            new TimeoutError(
                `Timed out: no block has been produced within last ${
                    getConfig().NEW_BLOCK_TIMEOUT_MS
                } seconds`
            )
        )
    }

    /**
     * Returns the canonical block at the given height. Currently, only finalized blocks are processed,
     * and thus we can identify the block hash in a non-ambigous way. This method should replaced with a more
     * robust hash-only indexing in the future.
     *
     * @param h - height of the block
     * @returns Hash of the canonical block at this height
     */
    private async getBlockHash(h: number): Promise<Hash> {
        const cachedHeader = this._headerCache.get(h)

        if (cachedHeader) {
            debug(`Cached header ${cachedHeader.toString()} at height ${h} `)
            return cachedHeader.hash
        }
        // wait for finality threshold to be on the safe side
        const isFinal = () => this._chainHeight - h > getConfig().FINALITY_THRESHOLD
        if (!isFinal()) {
            debug(
                `Block number: ${h}, current chain height: ${
                    this._chainHeight
                }. Waiting for the finality threshold: ${getConfig().FINALITY_THRESHOLD}.`
            )
            await pWaitFor(isFinal)
        }

        return await this.substrateService.getBlockHash(h.toString())
    }
}
