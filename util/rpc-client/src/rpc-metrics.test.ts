import {describe, expect, it} from 'vitest'
import {type RpcMetrics, RpcClient} from './client'
import {mergeRpcMetrics, RpcMetricsCollector, type RpcMetricsSource} from './rpc-metrics'

function metrics(
    partial: Partial<RpcMetrics> & {retriedErrors?: Record<string, number>},
    url = 'http://rpc',
): RpcMetrics {
    let avg = partial.avgResponseTime ?? 0
    return {
        url,
        requestsServed: 0,
        connectionErrors: 0,
        notificationsReceived: 0,
        retriedErrors: {},
        ...partial,
        avg_response_time: avg,
        avgResponseTime: avg,
    }
}

function worker(
    retriedErrors: Record<string, number>,
    url = 'http://rpc',
): RpcMetricsSource & {retriedErrors: Record<string, number>} {
    return {
        retriedErrors,
        async getRpcMetrics() {
            return metrics({retriedErrors: {...this.retriedErrors}}, url)
        },
    }
}

const hung: RpcMetricsSource = {
    getRpcMetrics: () => new Promise(() => {}),
}

const dead: RpcMetricsSource = {
    getRpcMetrics: () => Promise.reject(new Error('worker terminated')),
}

const retried = (all: RpcMetrics[]) => all.map((m) => ({url: m.url, retriedErrors: m.retriedErrors}))

describe('RpcMetricsCollector', () => {
    it('sums the workers of one endpoint', async () => {
        let collector = new RpcMetricsCollector()
        collector.add(worker({rate_limit: 2}))
        collector.add(worker({rate_limit: 1, transient: 3}))
        collector.add(worker({transient: 1}, 'http://other'))

        expect(retried(await collector.collect())).toEqual([
            {url: 'http://rpc', retriedErrors: {rate_limit: 3, transient: 3}},
            {url: 'http://other', retriedErrors: {transient: 1}},
        ])
    })

    it('keeps the counts of a removed worker', async () => {
        let collector = new RpcMetricsCollector()
        let main = worker({transient: 1})
        let finalized = worker({transient: 2})
        collector.add(main)
        collector.add(finalized)

        finalized.retriedErrors.transient = 5
        await collector.remove(finalized)

        expect(retried(await collector.collect())).toEqual([{url: 'http://rpc', retriedErrors: {transient: 6}}])
    })

    it('skips a worker that hangs or has died', async () => {
        let collector = new RpcMetricsCollector(10)
        collector.add(worker({no_result: 1}))
        collector.add(hung)
        collector.add(dead)

        expect(retried(await collector.collect())).toEqual([{url: 'http://rpc', retriedErrors: {no_result: 1}}])
        await collector.remove(hung)
    })

    it('keeps the last counts of a worker that stops answering', async () => {
        let collector = new RpcMetricsCollector(10)
        let busy = worker({transient: 3})
        collector.add(worker({transient: 1}))
        collector.add(busy)
        await collector.collect()

        busy.getRpcMetrics = hung.getRpcMetrics
        expect(retried(await collector.collect())).toEqual([{url: 'http://rpc', retriedErrors: {transient: 4}}])

        busy.getRpcMetrics = dead.getRpcMetrics
        await collector.remove(busy)
        expect(retried(await collector.collect())).toEqual([{url: 'http://rpc', retriedErrors: {transient: 4}}])
    })

    it('counts a worker removed during a scrape once', async () => {
        let collector = new RpcMetricsCollector(10)
        let finalized = worker({transient: 2})
        collector.add(finalized)
        await collector.collect()

        let scrape = collector.collect()
        await collector.remove(finalized)
        expect(retried(await scrape)).toEqual([{url: 'http://rpc', retriedErrors: {transient: 2}}])
    })

    it('sums every counter, not only retried errors', async () => {
        let collector = new RpcMetricsCollector()
        collector.add({
            getRpcMetrics: async () => metrics({requestsServed: 3, connectionErrors: 1, avgResponseTime: 0.1}),
        })
        collector.add({
            getRpcMetrics: async () => metrics({requestsServed: 1, notificationsReceived: 2, avgResponseTime: 0.5}),
        })

        let [m] = await collector.collect()
        expect(m).toMatchObject({requestsServed: 4, connectionErrors: 1, notificationsReceived: 2})
        // weighted by requests served: (3 * 0.1 + 1 * 0.5) / 4
        expect(m.avgResponseTime).toBeCloseTo(0.2)
        expect(m.avg_response_time).toBeCloseTo(0.2)
    })
})

describe('mergeRpcMetrics', () => {
    it('reports a zero average when nothing was served', () => {
        expect(mergeRpcMetrics([metrics({}), metrics({})])).toEqual([metrics({})])
    })
})

describe('RpcClient.recordRetriedError', () => {
    it('counts a retry made on top of the client under the given kind', () => {
        let client = new RpcClient({url: 'http://127.0.0.1:1'})
        try {
            client.recordRetriedError('internal')
            client.recordRetriedError('internal')
            expect(client.getMetrics().retriedErrors).toEqual({internal: 2})
        } finally {
            client.close()
        }
    })
})
