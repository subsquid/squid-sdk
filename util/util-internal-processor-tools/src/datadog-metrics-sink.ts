import https from 'https'
import type { Registry } from 'prom-client'
import { MetricsSink } from './prometheus'


interface DatadogSeries {
    metric: string
    type: number
    points: { timestamp: number; value: number }[]
    tags: string[]
}

export interface DatadogConfig {
    apiKey: string
    site?: string
    tags?: string[]
    pushIntervalMs?: number;
}

export class DatadogMetricsSink implements MetricsSink {
    private registry?: Registry
    private apiKey: string
    private site: string
    private baseTags: string[]
    private pushIntervalMs?: number
    private timer?: NodeJS.Timeout

    constructor(config: DatadogConfig) {
        this.apiKey = config.apiKey
        this.site = config.site || 'datadoghq.com'
        this.baseTags = config.tags ?? []
        if (!config.pushIntervalMs || config.pushIntervalMs < 0)
            this.pushIntervalMs = 15_000
        else
            this.pushIntervalMs = config.pushIntervalMs
    }

    register(registry: Registry): void {
        this.registry = registry
        this.timer = setInterval(() => this.push(), this.pushIntervalMs)
        this.timer.unref()
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = undefined
        }
    }

    private async push(): Promise<void> {
        try {
            let metrics = await this.registry!.getMetricsAsJSON()
            let timestamp = Math.floor(Date.now() / 1000)
            let series: DatadogSeries[] = []

            for (let metric of metrics) {
                for (let val of metric.values) {
                    let tags = this.baseTags.slice()
                    for (let [k, v] of Object.entries(val.labels)) {
                        tags.push(`${k}:${v}`)
                    }
                    series.push({
                        metric: metric.name,
                        type: 3,
                        points: [{ timestamp, value: val.value }],
                        tags,
                    })
                }
            }

            if (series.length > 0) {
                this.submit(series)
            }
        }
        catch { }
    }

    private submit(series: DatadogSeries[]): void {
        let body = JSON.stringify({ series })
        let req = https.request({
            hostname: `api.${this.site}`,
            path: '/api/v2/series',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'DD-API-KEY': this.apiKey,
                'Content-Length': Buffer.byteLength(body),
            },
        })
        req.on('error', () => { })
        req.write(body)
        req.end()
    }
}
