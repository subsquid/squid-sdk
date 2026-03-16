import https from 'https'
import type { Registry } from 'prom-client'


interface DatadogSeries {
    metric: string
    type: number
    points: { timestamp: number; value: number }[]
    tags: string[]
}


export function isDatadogEnabled(): boolean {
    let flag = process.env.DATADOG_METRICS_ENABLED
    return (flag === '1' || flag === 'true') && !!process.env.DATADOG_API_KEY
}


export class DatadogMetrics {
    private apiKey: string
    private site: string
    private baseTags: string[]
    private registry: Registry
    private timer?: NodeJS.Timeout

    constructor(registry: Registry) {
        this.registry = registry
        this.apiKey = process.env.DATADOG_API_KEY!
        this.site = process.env.DATADOG_SITE || 'datadoghq.com'
        this.baseTags = process.env.DATADOG_TAGS
            ? process.env.DATADOG_TAGS.split(',').map(t => t.trim()).filter(Boolean)
            : []
    }

    start(): void {
        let interval = Number(process.env.DATADOG_PUSH_INTERVAL)
        if (!(interval > 0)) interval = 15_000
        this.timer = setInterval(() => this.push(), interval)
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
            let metrics = await this.registry.getMetricsAsJSON()
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
