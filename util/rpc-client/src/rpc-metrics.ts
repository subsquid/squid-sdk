import type {RpcMetrics} from './client'

/** Anything that can report the metrics of an RPC client, e.g. a worker thread that owns one. */
export interface RpcMetricsSource {
    getRpcMetrics(): Promise<RpcMetrics>
}

/**
 * Sums the metrics of RPC clients that live elsewhere - typically in worker threads - per
 * endpoint URL, keeping the final counts of removed sources so that totals never go down.
 * Each source is read on every {@link collect}; a source that does not answer within the timeout
 * keeps its previous sample, so a busy or dying worker neither hangs a scrape nor drops out of it.
 */
export class RpcMetricsCollector {
    // the last sample read from each live source
    private live = new Map<RpcMetricsSource, RpcMetrics | undefined>()
    private finished: RpcMetrics[] = []

    constructor(private timeoutMs = 1000) {}

    add(source: RpcMetricsSource): void {
        this.live.set(source, undefined)
    }

    /**
     * Call before closing the source: its metrics are read one last time.
     */
    async remove(source: RpcMetricsSource): Promise<void> {
        await this.refresh(source)

        let last = this.live.get(source)
        this.live.delete(source)
        if (last) {
            this.finished = mergeRpcMetrics([...this.finished, last])
        }
    }

    async collect(): Promise<RpcMetrics[]> {
        await Promise.all([...this.live.keys()].map((source) => this.refresh(source)))

        // Merged after all reads: a source removed meanwhile is already in `finished`.
        let samples = [...this.finished]
        for (let last of this.live.values()) {
            if (last) samples.push(last)
        }
        return mergeRpcMetrics(samples)
    }

    // A failed read keeps the previous sample, or the source would drop out of the total.
    private async refresh(source: RpcMetricsSource): Promise<void> {
        let sample = await this.read(source)
        if (sample && this.live.has(source)) {
            this.live.set(source, sample)
        }
    }

    private async read(source: RpcMetricsSource): Promise<RpcMetrics | undefined> {
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

/**
 * Combine metrics of several clients into one entry per endpoint URL: counters are summed and the
 * average response time is weighted by the requests each client served. Entries keep the order in
 * which their URL first appears.
 */
export function mergeRpcMetrics(samples: RpcMetrics[]): RpcMetrics[] {
    let byUrl = new Map<string, RpcMetrics & {totalResponseTime: number}>()
    for (let s of samples) {
        let m = byUrl.get(s.url)
        if (m == null) {
            m = {
                url: s.url,
                requestsServed: 0,
                connectionErrors: 0,
                notificationsReceived: 0,
                avg_response_time: 0,
                avgResponseTime: 0,
                retriedErrors: {},
                totalResponseTime: 0,
            }
            byUrl.set(s.url, m)
        }
        m.requestsServed += s.requestsServed ?? 0
        m.connectionErrors += s.connectionErrors ?? 0
        m.notificationsReceived += s.notificationsReceived ?? 0
        m.totalResponseTime += (s.avgResponseTime ?? 0) * (s.requestsServed ?? 0)
        for (let [kind, count] of Object.entries(s.retriedErrors ?? {})) {
            m.retriedErrors[kind] = (m.retriedErrors[kind] ?? 0) + count
        }
    }
    return [...byUrl.values()].map(({totalResponseTime, ...m}) => {
        let avg = m.requestsServed > 0 ? totalResponseTime / m.requestsServed : 0
        return {...m, avg_response_time: avg, avgResponseTime: avg}
    })
}
