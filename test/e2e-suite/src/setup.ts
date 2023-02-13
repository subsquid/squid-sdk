import {ApiPromise, WsProvider} from "@polkadot/api"
import {createTestKeyring} from "@polkadot/keyring"
import {Header} from "@polkadot/types/interfaces/runtime"
import {assertNotNull} from "@subsquid/util-internal"
import {HttpClient} from '@subsquid/util-internal-http-client'
import {Client} from "gql-test-client"
import * as process from "process"


export const gql = new Client(assertNotNull(process.env.GQL_ENDPOINT))


export async function getProcessorHeight(): Promise<number> {
    let http = new HttpClient({
        baseUrl: assertNotNull(process.env.PROCESSOR_PROMETHEUS_ENDPOINT),
        retryAttempts: 4
    })
    let text: string = await http.get('/metrics/sqd_processor_last_block')
    let lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim()
        let [metric, value] = line.split(/\s+/)
        if (metric == 'sqd_processor_last_block') {
            return Number.parseInt(value)
        }
    }
    throw new Error('sqd_processor_last_block metric not found')
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

    let header: Header = await api.rpc.chain.getHeader(blockHash)
    return header.number.toNumber()
}


waitForHeight(1).then(
    () => run(),
    err => {
        console.error(err.stack)
        process.exit(1)
    }
)
