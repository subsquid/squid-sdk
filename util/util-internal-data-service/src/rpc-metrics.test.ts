import {describe, expect, it} from 'vitest'
import {Metrics, type RpcRetriedErrors} from './metrics'

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
