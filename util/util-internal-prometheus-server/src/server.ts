import {createHttpServer, HttpContext, ListeningServer} from "@subsquid/util-internal-http-server"
import type {Registry} from "prom-client"


export {ListeningServer}


export function createPrometheusServer(registry: Registry, port?: number | string): Promise<ListeningServer> {
    return createHttpServer(
        ctx => requestHandler(registry, ctx),
        port
    )
}


async function requestHandler(registry: Registry, ctx: HttpContext): Promise<void> {
    let path = ctx.url.pathname.slice(1).split('/')
    if (path[0] != 'metrics') return ctx.send(404)
    let metricName = path[1]
    if (metricName) {
        if (registry.getSingleMetric(metricName)) {
            let value = await registry.getSingleMetricAsString(metricName)
            return ctx.send(200, value)
        } else {
            return ctx.send(404, 'requested metric not found')
        }
    } else if (ctx.url.searchParams.get('json') == 'true') {
        let value = await registry.getMetricsAsJSON()
        return ctx.send(200, value)
    } else {
        let value = await registry.metrics()
        return ctx.send(200, value, registry.contentType)
    }
}
