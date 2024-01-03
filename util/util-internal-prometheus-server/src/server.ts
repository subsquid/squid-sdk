import {HttpApp, ListeningServer} from '@subsquid/util-internal-http-server'
import type {Registry} from 'prom-client'


export {ListeningServer}


export function createPrometheusServer(registry: Registry, port?: number | string): Promise<ListeningServer> {
    let app = new HttpApp()
    app.setLoggingNamespace('sqd:prometheus')
    app.add('/metrics', {
        async GET(ctx) {
            if (ctx.url.searchParams.get('json') === 'true') {
                let value = await registry.getMetricsAsJSON()
                ctx.send(200, value)
            } else {
                let value = await registry.metrics()
                ctx.send(200, value, registry.contentType)
            }
        }
    })
    app.add('/metrics/{name}', {
        async GET(ctx) {
            if (registry.getSingleMetric(ctx.params.name)) {
                let value = await registry.getSingleMetricAsString(ctx.params.name)
                ctx.send(200, value)
            } else {
                ctx.send(404, 'requested metric not found')
            }
        }
    })
    return app.listen(port)
}
