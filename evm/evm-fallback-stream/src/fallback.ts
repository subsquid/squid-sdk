import {BlockRef, BlockStream, DataSource, StreamRequest, isForkException} from '@subsquid/util-internal-data-source'
import {FiniteRange} from '@subsquid/util-internal-range'

import {SourceHealth} from './health'
import {AllSourcesDownError, FallbackPolicy, ResolvedPolicy, resolvePolicy} from './policy'
import {Selector} from './selector'

export interface RankedSource<B> {
    name: string
    source: DataSource<B>
    /** Full, infrequent capability probe — verifies the source can still serve the query's data. */
    probeCapability?: () => Promise<boolean>
}

export interface FallbackDataSourceOptions<B> {
    sources: RankedSource<B>[]
    /** Extracts a source's chain position from a yielded block (for resume after a switch). */
    getBlockRef: (block: B) => BlockRef
    policy?: FallbackPolicy
}

/**
 * A meta `DataSource<B>` built from an ordered list of sources. It drives the lowest-index
 * *healthy* (or, optimistically at startup, `unknown`) source; on a non-fork stream error it
 * marks that source unhealthy and resumes the *next* source from the last committed position.
 * Because position is a `{number, hash}` pair and the sources are stateless, a fork straddling a
 * switch is just an ordinary reorg: `ForkException` is propagated untouched and the consumer's
 * existing rollback machinery handles it (plan §3). `finalizedHead` is passed through unchanged —
 * the finalized high-watermark is the stateful target's job, not this stateless source's.
 */
export class FallbackDataSource<B> implements DataSource<B> {
    private sources: RankedSource<B>[]
    private getBlockRef: (block: B) => BlockRef
    readonly policy: ResolvedPolicy
    readonly health: SourceHealth[]
    private selector: Selector

    /** Observable state (for metrics, §4). */
    activeIndex: number | undefined
    switchCount = 0

    constructor(options: FallbackDataSourceOptions<B>) {
        if (options.sources.length === 0) {
            throw new Error('FallbackDataSource requires at least one source')
        }
        this.sources = options.sources
        this.getBlockRef = options.getBlockRef
        this.policy = resolvePolicy(options.policy)
        this.health = this.sources.map((s) => new SourceHealth(this.policy, !!s.probeCapability))
        this.selector = new Selector(this.health)
    }

    getStream(req: StreamRequest): BlockStream<B> {
        return this.runStream(req, false)
    }

    getFinalizedStream(req: StreamRequest): BlockStream<B> {
        return this.runStream(req, true)
    }

    private async *runStream(req: StreamRequest, finalized: boolean): BlockStream<B> {
        let lastNumber = req.from - 1
        let lastHash = req.parentHash
        let allDownSince: number | undefined

        while (true) {
            let active = this.selector.pickForFailover()
            if (active == null) {
                if (await this.waitAllDown(allDownSince ?? (allDownSince = this.policy.clock()))) continue
                throw new AllSourcesDownError()
            }
            allDownSince = undefined
            this.setActive(active)

            let streamReq: StreamRequest = {from: lastNumber + 1, to: req.to, parentHash: lastHash}
            let src = this.sources[active].source

            try {
                let iterator = (finalized ? src.getFinalizedStream(streamReq) : src.getStream(streamReq))[
                    Symbol.asyncIterator
                ]()
                try {
                    while (true) {
                        let next = await iterator.next()
                        if (next.done) return // bounded stream finished
                        let batch = next.value

                        this.health[active].onBatch()
                        yield batch

                        if (batch.blocks.length) {
                            let ref = this.getBlockRef(batch.blocks[batch.blocks.length - 1])
                            lastNumber = ref.number
                            lastHash = ref.hash
                        }

                        // Eager switch-up: reclaim a recovered higher-preference source at the
                        // batch boundary (never mid-batch).
                        if (this.policy.preferPrimary === 'eager' && this.selector.pickSwitchUp(active) != null) {
                            break
                        }
                    }
                } finally {
                    await safeReturn(iterator)
                }
            } catch (e) {
                if (isForkException(e)) throw e // propagate; do NOT switch (§3.4)
                this.health[active].onStreamError()
                // re-select and resume from lastCommitted on the next iteration
            }
        }
    }

    async getHead(): Promise<BlockRef> {
        return this.delegateHead((s) => s.getHead())
    }

    async getFinalizedHead(): Promise<BlockRef> {
        return this.delegateHead((s) => s.getFinalizedHead())
    }

    private async delegateHead(get: (s: DataSource<B>) => Promise<BlockRef>): Promise<BlockRef> {
        let allDownSince: number | undefined

        while (true) {
            let active = this.selector.pickForFailover()
            if (active == null) {
                if (await this.waitAllDown(allDownSince ?? (allDownSince = this.policy.clock()))) continue
                throw new AllSourcesDownError()
            }
            allDownSince = undefined

            try {
                return await get(this.sources[active].source)
            } catch {
                this.health[active].onStreamError()
            }
        }
    }

    getBlocksCountInRange(range: FiniteRange): number {
        for (let s of this.sources) {
            if (s.source.getBlocksCountInRange) return s.source.getBlocksCountInRange(range)
        }

        return 0
    }

    /** Returns true if it waited (should retry), false if the all-down timeout elapsed. */
    private async waitAllDown(since: number): Promise<boolean> {
        if (this.policy.allDownTimeoutMs != null && this.policy.clock() - since >= this.policy.allDownTimeoutMs) {
            return false
        }
        await sleep(this.policy.allDownPollMs)

        return true
    }

    private setActive(i: number): void {
        if (this.activeIndex !== i) {
            if (this.activeIndex !== undefined) this.switchCount++
            this.activeIndex = i
        }
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function safeReturn(it: AsyncIterator<unknown>): Promise<void> {
    try {
        await it.return?.()
    } catch {
        /* closing the old connection must not mask the real outcome */
    }
}
