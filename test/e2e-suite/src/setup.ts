import {assertNotNull} from "@subsquid/util"
import {Client} from "gql-test-client"
import fetch from "node-fetch"
import * as process from "process"


export const gql = new Client(assertNotNull(process.env.GQL_ENDPOINT))


export async function getProcessorHeight(): Promise<number> {
    let endpoint = assertNotNull(process.env.PROCESSOR_PROMETHEUS_ENDPOINT)
    let response = await fetch(new URL('/metrics/substrate_processor:last_processed_block', endpoint))
    let text = await response.text()
    if (!response.ok) {
        throw new Error(
            `Got http ${response.status}, body: ${text}`
        )
    }
    let lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim()
        let [metric, value] = line.split(/\s+/)
        if (metric == 'substrate_processor:last_processed_block') {
            return Number.parseInt(value)
        }
    }
    throw new Error('substrate_processor:last_processed_block metric not found')
}


export async function waitForHeight(height: number): Promise<void> {
    while ((await getProcessorHeight()) < height) {
        await new Promise(resolve => {
            setTimeout(resolve, 100)
        })
    }
}


async function start(timeout: number): Promise<void> {
    try {
        await waitForHeight(1)
    } catch(e: any) {
        if (timeout > 0 && e.toString().startsWith('FetchError')) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            return start(timeout - 1)
        } else {
            console.error(e.stack)
            process.exit(1)
        }
    }
    run()
}


start(80).catch(() => {})
