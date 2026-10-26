import type {RpcRetriedErrors} from './metrics'

export interface RpcMetricsSource {
    getRpcMetrics(): Promise<RpcRetriedErrors>
}

/**
 * Sums retried RPC errors over the RPC clients of worker threads, keeping the
 * final counts of closed workers so that the total never goes down.
 */
export class RpcMetricsCollector {
    // the last sample read from each live worker
    private live = new Map<RpcMetricsSource, RpcRetriedErrors | undefined>()
    private finished = new Map<string, Record<string, number>>()

    constructor(private timeoutMs = 1000) {}

    add(source: RpcMetricsSource): void {
        this.live.set(source, undefined)
    }

    /**
     * Call before closing the worker: its counts are read one last time.
     */
    async remove(source: RpcMetricsSource): Promise<void> {
        await this.refresh(source)

        let last = this.live.get(source)
        this.live.delete(source)
        if (last) {
            addTo(this.finished, last)
        }
    }

    async collect(): Promise<RpcRetriedErrors[]> {
        await Promise.all([...this.live.keys()].map((source) => this.refresh(source)))

        // Summed after all reads: a worker removed meanwhile is already in `finished`.
        let totals = new Map<string, Record<string, number>>()
        for (let [url, retriedErrors] of this.finished) {
            addTo(totals, {url, retriedErrors})
        }
        for (let last of this.live.values()) {
            if (last) addTo(totals, last)
        }

        return [...totals].map(([url, retriedErrors]) => ({url, retriedErrors}))
    }

    // A failed read keeps the previous sample, or the worker would drop out of the total.
    private async refresh(source: RpcMetricsSource): Promise<void> {
        let sample = await this.read(source)
        if (sample && this.live.has(source)) {
            this.live.set(source, sample)
        }
    }

    // A busy or dying worker must not hang a scrape or its own shutdown.
    private async read(source: RpcMetricsSource): Promise<RpcRetriedErrors | undefined> {
        let timer: NodeJS.Timeout | undefined
        let timeout = new Promise<undefined>((resolve) => {
            timer = setTimeout(() => resolve(undefined), this.timeoutMs)
        })
        try {
            return await Promise.race([source.getRpcMetrics().catch(() => undefined), timeout])
        } finally {
            clearTimeout(timer)
        }
    }
}

function addTo(totals: Map<string, Record<string, number>>, metrics: RpcRetriedErrors): void {
    let byKind = totals.get(metrics.url)
    if (byKind == null) {
        byKind = {}
        totals.set(metrics.url, byKind)
    }
    for (let [kind, count] of Object.entries(metrics.retriedErrors)) {
        byKind[kind] = (byKind[kind] ?? 0) + count
    }
}
