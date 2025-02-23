export interface BlockRef {
    number: number
    hash: string
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
    rollback(baseBlock: number): Promise<void>
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
    commit(cb: (tx: DatabaseTransaction<S>) => Promise<void>): Promise<void>
}