import type {RpcMetrics} from '@subsquid/rpc-client'
import type {ListeningServer} from '@subsquid/util-internal-prometheus-server'
import {afterEach, describe, expect, it} from 'vitest'
import {PrometheusServer} from './prometheus'

function metrics(url: string, partial: Partial<RpcMetrics> = {}): RpcMetrics {
    return {
        url,
        requestsServed: 0,
        connectionErrors: 0,
        notificationsReceived: 0,
        avg_response_time: partial.avgResponseTime ?? 0,
        avgResponseTime: 0,
        retriedErrors: {},
        ...partial,
    }
}

let server: ListeningServer | undefined

afterEach(async () => {
    await server?.close()
    server = undefined
})

async function scrape(prometheus: PrometheusServer): Promise<string> {
    server ??= await prometheus.serve()
    let res = await fetch(`http://127.0.0.1:${server.port}/metrics`)
    return res.text()
}

describe('PrometheusServer RPC metrics', () => {
    it('exports every RPC metric from the metrics source, for each endpoint', async () => {
        let prometheus = new PrometheusServer(0, async () => [
            metrics('http://a/', {
                requestsServed: 7,
                connectionErrors: 2,
                avgResponseTime: 0.25,
                retriedErrors: {retry: 3, internal: 1},
            }),
            metrics('http://b/', {requestsServed: 1}),
        ])

        let text = await scrape(prometheus)
        expect(text).toContain('sqd_rpc_request_count{url="http://a/",kind="success"} 7')
        expect(text).toContain('sqd_rpc_request_count{url="http://a/",kind="failure"} 2')
        expect(text).toContain('sqd_chain_rpc_requests_served_total{url="http://a/"} 7')
        expect(text).toContain('sqd_chain_rpc_requests_served_total{url="http://b/"} 1')
        expect(text).toContain('sqd_chain_avg_response_time_seconds{url="http://a/"} 0.25')
        expect(text).toContain('sqd_chain_rpc_connection_errors_total{url="http://a/"} 2')
        expect(text).toContain('sqd_chain_rpc_retried_errors_total{url="http://a/",kind="retry"} 3')
        expect(text).toContain('sqd_chain_rpc_retried_errors_total{url="http://a/",kind="internal"} 1')
    })

    it('reads the source once per scrape', async () => {
        let reads = 0
        let prometheus = new PrometheusServer(0, async () => {
            reads += 1
            return [metrics('http://a/', {requestsServed: reads})]
        })

        await scrape(prometheus)
        expect(reads).toBe(1)
        let text = await scrape(prometheus)
        expect(reads).toBe(2)
        expect(text).toContain('sqd_chain_rpc_requests_served_total{url="http://a/"} 2')
    })

    it('keeps the last values when the source fails', async () => {
        let fail = false
        let prometheus = new PrometheusServer(0, async () => {
            if (fail) throw new Error('worker terminated')
            return [metrics('http://a/', {requestsServed: 4, retriedErrors: {retry: 2}})]
        })
        await scrape(prometheus)

        fail = true
        let text = await scrape(prometheus)
        expect(text).toContain('sqd_chain_rpc_requests_served_total{url="http://a/"} 4')
        expect(text).toContain('sqd_chain_rpc_retried_errors_total{url="http://a/",kind="retry"} 2')
    })
})
