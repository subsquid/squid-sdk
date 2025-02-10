import {assertNotNull, last} from '@subsquid/util-internal'
import assert from 'assert'


export interface BlockRef {
    number: number
    hash: string
}


export interface Query<B> {
    stream(nextBlock: number, prevBlockHash?: string): Promise<BlockStream<B>>
}


/**
 * The `BlockStream` is essentially an async iterator of block batches,
 * annotated with some additional properties indicating its progress and state.
 *
 * The block stream ends when either
 *  1. the entire range of blocks requested by the query was fetched and finalized
 *  2. fork occurs
 *
 * All blocks returned by the stream are guaranteed to belong to the same chain.
 *
 * The stream may return empty block batches to indicate `.finalizedHead` updates.
 *
 * This stream never throws an error.
 */
export interface BlockStream<B> extends AsyncIterable<B[]> {
    /*
     * The number of the last block returned by the stream.
     *
     * Equals to `nextBlock - 1` at the beginning and hence can be negative.
     */
    readonly lastBlockNumber: number
    /*
     * The hash of the last block returned by the stream.
     *
     * Equals to `prevBlockHash` at the beginning.
     */
    readonly lastBlockHash: string | undefined
    /**
     * Finalized head of the source chain.
     *
     * The head reported here is never above `.lastBlockNumber`,
     * i.e. it is always true, that `this.finalizedHead.number <= this.lastBlockNumber`
     */
    readonly finalizedHead?: BlockRef
    /**
     * Equals to `true` when the entire range of blocks requested by the query was fetched and finalized.
     */
    readonly finished: boolean
    /**
     * When stream has ended because of a fork,
     * this property will contain non-empty continues list of blocks currently present on chain.
     *
     * Its contents may be described with the following SQL query
     *
     * SELECT number, hash
     * FROM blocks
     * WHERE number <= this.lastBlockNumber AND number > (this.lastBlockNumber - MAX_LEN)
     * ORDER BY number ASC
     */
    readonly forked?: BlockRef[]
    /**
     * Extracts block number property
     */
    getBlockNumber(block: B): number
    /**
     * Extracts block hash property
     */
    getBlockHash(block: B): string
}


export interface Database<S> {
    /**
     * Last commited block
     */
    getHead(): Promise<BlockRef | undefined>
    /**
     * Last commited finalized head
     */
    getFinalizedHead(): Promise<BlockRef | undefined>
    /**
     * Get the list of unfinalized blocks such as `block.number <= top`.
     *
     * Implementations may limit the number of returned blocks
     * and are not required to give all at once.
     *
     * Block sequence returned by this method may have gaps.
     */
    getUnfinalizedBlocks(top: number): Promise<BlockRef[]>;
    /**
     * Perform database transaction.
     *
     * Callback might be called multiple times due to optimistic update conflict
     * or any other retryable error.
     */
    transact(cb: (tx: DatabaseTransaction<S>) => Promise<void>): Promise<void>
}


export interface DatabaseTransaction<S> {
    /**
     * Last finalized head at the start of transaction
     */
    readonly prevFinalizedHead: BlockRef | undefined
    /**
     * Last commited block at the start of transaction
     */
    readonly prevHead: BlockRef | undefined
    /**
     * Revert database to the state, that it had after `baseBlock` were processed.
     *
     * Pass `-1` to revert everything
     */
    revert(baseBlock: number): Promise<void>
    /**
     * Move the finalized head to `head`
     *
     * `.submitFinalizedBlockBatch()` should be called instead of this method to achieve the same effect,
     * when there are final blocks to commit, that lie above the current database head.
     */
    finalize(head: BlockRef): Promise<void>
    /**
     * Persist updates from a batch of finalized blocks where the last block is `lastBlock`.
     *
     * Moves both the head and finalized head to `lastBlock`.
     */
    processFinalizedBlocks(lastBlock: BlockRef, cb: (store: S) => Promise<void>): Promise<void>
    /**
     * Persist updates from a batch of unfinalized blocks where the last block is `lastBlock`.
     *
     * Moves the database head to `block`.
     */
    processUnfinalizedBlocks(block: BlockRef, cb: (store: S) => Promise<void>): Promise<void>
}


/**
 * Processor sketch
 */
export async function run<B, S>(
    query: Query<B>,
    db: Database<S>,
    mapping: (ctx: {blocks: B[], store: S}) => Promise<void>
): Promise<void>
{
    let head = await db.getHead()
    let prevBlockNumber = head?.number ?? -1
    let prevBlockHash = head?.hash

    while (true) {
        let stream = await query.stream(prevBlockNumber + 1, prevBlockHash)

        for await (let batch of stream) {
            await db.transact(async tx => {
                assert.deepEqual(
                    tx.prevHead,
                    head,
                    'seems like more than one concurrent process tries to modify this database'
                )

                if (
                    tx.prevHead &&
                    batch.length > 0 &&
                    stream.getBlockNumber(batch[0]) <= tx.prevHead.number
                ) {
                    // we've got a fork
                    await tx.revert(prevBlockNumber)
                }

                let firstHotBlockPos = 0

                if (stream.finalizedHead) {
                    if (batch.length == 0) {
                        await tx.finalize(stream.finalizedHead)
                        return
                    }

                    if (stream.getBlockNumber(batch[0]) < stream.finalizedHead.number) {
                        if (
                            tx.prevFinalizedHead == null ||
                            tx.prevFinalizedHead.number < stream.finalizedHead.number
                        ) {
                            await tx.finalize(stream.finalizedHead)
                        }
                    } else {
                        let finalizedEnd = batch.findIndex(
                            block => stream.getBlockNumber(block) > stream.finalizedHead!.number
                        )
                        if (finalizedEnd < 0) {
                            finalizedEnd = batch.length
                        }
                        assert(finalizedEnd > 0)

                        firstHotBlockPos = finalizedEnd
                        let finalizedBlocks = batch.slice(0, finalizedEnd)

                        await tx.processFinalizedBlocks(stream.finalizedHead, async store => {
                            return mapping({
                                blocks: finalizedBlocks,
                                store
                            })
                        })
                    }
                }

                if (firstHotBlockPos < batch.length) {
                    let blocks = batch.slice(firstHotBlockPos)

                    let lastRef = {
                        number: stream.getBlockNumber(last(blocks)),
                        hash: stream.getBlockHash(last(blocks))
                    }

                    await tx.processUnfinalizedBlocks(lastRef, async store => {
                        return mapping({
                            blocks,
                            store
                        })
                    })
                }
            })

            // after successful execution of update transaction,
            // the head is always on `stream.lastBlockNumber`.
            // Save it, to check, that no-one else modifies the database
            head = stream.lastBlockHash == null ? undefined : {
                number: stream.lastBlockNumber,
                hash: stream.lastBlockHash
            }
        }

        if (stream.finished) {
            return
        }

        assert(stream.forked?.length, 'there must be a fork')

        let forkBase = await computeForkBase(db, stream)
        if (forkBase == null) {
            // rollback all blocks
            prevBlockNumber = -1
            prevBlockHash = undefined
        } else {
            prevBlockNumber = forkBase.number
            prevBlockHash = forkBase.hash
        }
    }
}


async function computeForkBase(
    db: Database<unknown>,
    stream: BlockStream<unknown>
): Promise<BlockRef | undefined>
{
    assert(stream.forked?.length)
    let tail = stream.forked.slice()

    while (true) {
        let commited = await db.getUnfinalizedBlocks(last(tail).number)
        if (commited.length == 0) return checkFinalizedHeadAsForkBase(db, stream)

        for (let i = commited.length - 1; i >= 0 ; i--) {
            let h = commited[i]

            while (tail.length > 0 && last(tail).number > h.number) {
                tail.pop()
            }

            if (tail.length == 0) return h

            let t = last(tail)
            if (t.number == h.number && t.hash == h.hash) return h
        }
    }
}


async function checkFinalizedHeadAsForkBase(
    db: Database<unknown>,
    stream: BlockStream<unknown>
): Promise<BlockRef | undefined>
{
    let head = await db.getFinalizedHead()
    if (head == null) return undefined

    assert(stream.forked?.length)
    if (stream.forked[0].number > head.number) return head

    let headOnChain = stream.forked.find(b => b.number == head!.number)
    if (headOnChain == null || headOnChain.hash !== head.hash) {
        if (stream.finalizedHead && stream.finalizedHead.number >= head.number) {
            throw new Error(`finalized block ${head.number}#${head.hash} was not found on chain`)
        } else {
            // something with the data source, perhaps the request was balanced to the server,
            // that was behind the prev one.
            // just try again from where we've stopped
            return {
                number: stream.lastBlockNumber,
                hash: assertNotNull(stream.lastBlockHash)
            }
        }
    }

    return head
}
