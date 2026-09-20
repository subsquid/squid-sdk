import type {BlockLink, StreamMessage} from './message'
import type {StreamConnection} from './source'

export interface NatsStreamOptions {
    url: string
    dataset: string
    connectTimeout: number
    requestTimeout: number
}

// A dataset name is a single subject token, that is also fit for a stream name
const DATASET_NAME = /^[\w-]+$/

export function isDatasetName(value: string): boolean {
    return DATASET_NAME.test(value)
}

export function getStreamName(dataset: string): string {
    return 'raw-' + dataset
}

export function getBlockSubject(dataset: string, block: BlockLink): string {
    return `raw.${dataset}.${block.number}.${block.hash}`
}

export async function connectNatsStream(options: NatsStreamOptions): Promise<StreamConnection> {
    // The client is loaded only when a stream is actually used
    let {connect} = await import('@nats-io/transport-node')
    let {jetstreamManager} = await import('@nats-io/jetstream')

    let url = new URL(options.url)
    let user = decodeURIComponent(url.username)
    let pass = decodeURIComponent(url.password)
    let hasUserAndPass = user.length > 0 && pass.length > 0
    let hasToken = user.length > 0 && pass.length == 0

    let nc = await connect({
        name: 'evm-dump',
        servers: url.host,
        tls: url.protocol == 'tls:' ? {} : undefined,
        user: hasUserAndPass ? user : undefined,
        pass: hasUserAndPass ? pass : undefined,
        token: hasToken ? user : undefined,
        timeout: options.connectTimeout,
        // A broken connection is replaced by the caller, pending requests must fail right away
        reconnect: false,
    })

    let stream = getStreamName(options.dataset)

    try {
        let jsm = await jetstreamManager(nc, {
            checkAPI: false,
            timeout: options.requestTimeout,
        })

        return {
            async get(block: BlockLink): Promise<StreamMessage | undefined> {
                let subject = getBlockSubject(options.dataset, block)

                let msg = await jsm.direct.getMessage(stream, {last_by_subj: subject})
                if (msg == null) return undefined

                let header = msg.header
                return {
                    headers: {
                        get: (name) => (header.has(name) ? header.get(name) : undefined),
                    },
                    data: msg.data,
                }
            },
            isClosed: () => nc.isClosed(),
            close: () => nc.close(),
        }
    } catch (err: any) {
        await nc.close().catch(() => {})
        throw err
    }
}
