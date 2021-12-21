import {ApiPromise, WsProvider} from "@polkadot/api"
import {createTestKeyring} from "@polkadot/keyring"
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


export function chain(): ApiPromise {
    let api = new ApiPromise({
        provider: new WsProvider(assertNotNull(process.env.CHAIN_ENDPOINT)),
        typesSpec: {
            'node-template': {
                Address: 'AccountId',
                LookupSource: 'AccountId',
                AccountInfo: 'AccountInfoWithRefCount'
            }
        }
    })
    before(() => api.isReady)
    after(() => api.disconnect())
    return api
}


export async function transfer(api: ApiPromise, from: string, to: string, amount: number): Promise<number> {
    let keyring = createTestKeyring()
    let sender = keyring.getPair(from)

    let blockHash: any = await new Promise((resolve, reject) => {
        let unsub = () => {
            /* dummy */
        }
        api.tx.balances
            .transfer(to, amount)
            .signAndSend(sender, (result) => {
                console.log(`Status of transfer: ${result.status.type}`)
                if (result.isFinalized) {
                    unsub()
                    resolve(result.status.asFinalized)
                    return
                }
                if (result.isError) {
                    unsub()
                    reject(
                        result.dispatchError ||
                        result.internalError ||
                        new Error('Failed to perform transfer')
                    )
                }
            }).then(u => (unsub = u), reject)
    })

    let header = await api.rpc.chain.getHeader(blockHash)
    return header.number.toNumber()
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
