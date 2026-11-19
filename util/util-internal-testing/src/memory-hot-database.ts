/**
 * An in-memory hot database for end-to-end processor tests, with TypeormDatabase's rollback
 * semantics: rows above `baseHead` are undone before new blocks are written, `baseHead` must be a
 * block the database actually holds, and finalized blocks leave the hot set. `connect()` returns the
 * same state, so a second processor can resume where the first stopped.
 *
 * Structurally compatible with `HotDatabase<MemoryStore>` from `@subsquid/batch-processor`; the
 * handler writes one row per block through `store.write(height, hash)`.
 */

export interface HashAndHeight {
    height: number
    hash: string
}

export interface MemoryStore {
    write(height: number, hash: string): void
}

export class MemoryHotDatabase {
    readonly supportsHotBlocks = true as const
    /** One row per handled block: height -> block hash. */
    readonly rows = new Map<number, string>()
    private finalized: HashAndHeight = {height: -1, hash: '0x'}
    private top: HashAndHeight[] = []

    get head(): HashAndHeight {
        return this.top[this.top.length - 1] ?? this.finalized
    }

    get finalizedHeight(): number {
        return this.finalized.height
    }

    async connect(): Promise<HashAndHeight & {top: HashAndHeight[]}> {
        return {...this.finalized, top: [...this.top]}
    }

    async transact(
        info: {prevHead: HashAndHeight; nextHead: HashAndHeight},
        cb: (store: MemoryStore) => Promise<unknown>,
    ): Promise<void> {
        this.assertHolds(info.prevHead)
        this.rollbackTo(info.prevHead.height)
        await cb(this.store())
        this.finalized = info.nextHead
        this.top = []
    }

    async transactHot2(
        info: {finalizedHead: HashAndHeight; baseHead: HashAndHeight; newBlocks: HashAndHeight[]},
        cb: (store: MemoryStore, sliceBeg: number, sliceEnd: number) => Promise<unknown>,
    ): Promise<void> {
        this.assertHolds(info.baseHead)
        this.rollbackTo(info.baseHead.height)
        await cb(this.store(), 0, info.newBlocks.length)
        this.top.push(...info.newBlocks)
        if (info.finalizedHead.height > this.finalized.height) {
            this.finalized = info.finalizedHead
            this.top = this.top.filter((b) => b.height > info.finalizedHead.height)
        }
    }

    private assertHolds(ref: HashAndHeight): void {
        if (ref.height < 0) return
        let held = ref.height === this.finalized.height ? this.finalized : this.top.find((b) => b.height === ref.height)
        if (held?.hash !== ref.hash) throw new Error(`database does not hold base block ${ref.height}#${ref.hash}`)
    }

    private rollbackTo(height: number): void {
        for (let h of [...this.rows.keys()]) if (h > height) this.rows.delete(h)
        this.top = this.top.filter((b) => b.height <= height)
    }

    private store(): MemoryStore {
        return {write: (height, hash) => this.rows.set(height, hash)}
    }
}
