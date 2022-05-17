import {createPrometheusServer, ListeningServer} from "@subsquid/util-internal-prometheus-server"
import {collectDefaultMetrics, Registry} from "prom-client"


export class Metrics {
    private registry = new Registry()

    constructor() {
        collectDefaultMetrics({register: this.registry})
    }

    serve(port?: string | number): Promise<ListeningServer> {
        return createPrometheusServer(this.registry, port)
    }
}
