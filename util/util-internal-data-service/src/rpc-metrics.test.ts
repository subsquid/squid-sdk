import {describe, expect, it} from 'vitest'
import {Metrics, type RpcRetriedErrors} from './metrics'
import {RpcMetricsCollector, type RpcMetricsSource} from './rpc-metrics'

function worker(
    retriedErrors: Record<string, number>,
    url = 'http://rpc',
): RpcMetricsSource & {retriedErrors: Record<string, number>} {
    return {
        retriedErrors,
        async getRpcMetrics() {
            return {url, retriedErrors: {...this.retriedErrors}}
        },
    }
}

const hung: RpcMetricsSource = {
    getRpcMetrics: () => new Promise(() => {}),
}

const dead: RpcMetricsSource = {
    getRpcMetrics: () => Promise.reject(new Error('worker terminated')),
}

describe('RpcMetricsCollector', () => {
    it('sums the workers of one endpoint', async () => {
        let collector = new RpcMetricsCollector()
        collector.add(worker({rate_limit: 2}))
        collector.add(worker({rate_limit: 1, transient: 3}))
        collector.add(worker({transient: 1}, 'http://other'))

        expect(await collector.collect()).toEqual([
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

        expect(await collector.collect()).toEqual([{url: 'http://rpc', retriedErrors: {transient: 6}}])
    })

    it('skips a worker that hangs or has died', async () => {
        let collector = new RpcMetricsCollector(10)
        collector.add(worker({no_result: 1}))
        collector.add(hung)
        collector.add(dead)

        expect(await collector.collect()).toEqual([{url: 'http://rpc', retriedErrors: {no_result: 1}}])
        await collector.remove(hung)
    })

    it('keeps the last counts of a worker that stops answering', async () => {
        let collector = new RpcMetricsCollector(10)
        let busy = worker({transient: 3})
        collector.add(worker({transient: 1}))
        collector.add(busy)
        await collector.collect()

        busy.getRpcMetrics = hung.getRpcMetrics
        expect(await collector.collect()).toEqual([{url: 'http://rpc', retriedErrors: {transient: 4}}])

        busy.getRpcMetrics = dead.getRpcMetrics
        await collector.remove(busy)
        expect(await collector.collect()).toEqual([{url: 'http://rpc', retriedErrors: {transient: 4}}])
    })

    it('counts a worker removed during a scrape once', async () => {
        let collector = new RpcMetricsCollector(10)
        let finalized = worker({transient: 2})
        collector.add(finalized)
        await collector.collect()

        let scrape = collector.collect()
        await collector.remove(finalized)
        expect(await scrape).toEqual([{url: 'http://rpc', retriedErrors: {transient: 2}}])
    })
})

describe('Metrics', () => {
    it('exports retried RPC errors on scrape', async () => {
        let metrics = new Metrics()
        let clients: RpcRetriedErrors[] = [{url: 'http://rpc', retriedErrors: {rate_limit: 4, transient: 1}}]
        metrics.setRpcMetricsSource(async () => clients)

        let text = await metrics.registry.metrics()
        expect(text).toContain('sqd_chain_rpc_retried_errors_total{url="http://rpc",kind="rate_limit"} 4')
        expect(text).toContain('sqd_chain_rpc_retried_errors_total{url="http://rpc",kind="transient"} 1')
    })

    it('keeps the last values when the source fails', async () => {
        let metrics = new Metrics()
        let fail = false
        metrics.setRpcMetricsSource(async () => {
            if (fail) throw new Error('worker terminated')
            return [{url: 'http://rpc', retriedErrors: {transient: 2}}]
        })
        await metrics.registry.metrics()

        fail = true
        let text = await metrics.registry.metrics()
        expect(text).toContain('sqd_chain_rpc_retried_errors_total{url="http://rpc",kind="transient"} 2')
    })

    it('counts ingestion restarts by reason', async () => {
        let metrics = new Metrics()
        metrics.incIngestionRestarts('RpcError')
        metrics.incIngestionRestarts('RpcError')
        metrics.incIngestionRestarts('fork')

        let text = await metrics.registry.metrics()
        expect(text).toContain('sqd_hotblocks_ingestion_restarts_total{reason="RpcError"} 2')
        expect(text).toContain('sqd_hotblocks_ingestion_restarts_total{reason="fork"} 1')
    })
})
