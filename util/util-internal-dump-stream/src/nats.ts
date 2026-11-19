import type {BlockLink, StreamMessage} from './message'
import type {StreamConnection} from './source'

const DEFAULT_CONNECT_TIMEOUT = 5000
const DEFAULT_REQUEST_TIMEOUT = 5000

export interface NatsStreamOptions {
    /**
     * A server URL or a comma separated list of the servers of one cluster, see `parseServers()`
     */
    url: string
    dataset: string
    /**
     * Client name the server shows the connection under
     */
    name: string
    connectTimeout?: number
    requestTimeout?: number
}

// A dataset name is a single subject token, that is also fit for a stream name
const DATASET_NAME = /^[\w-]+$/

export function isDatasetName(value: string): boolean {
    return DATASET_NAME.test(value)
}

export function getStreamName(dataset: string): string {
    return `raw-${dataset}`
}

export function getBlockSubject(dataset: string, block: BlockLink): string {
    return `raw.${dataset}.${block.number}.${block.hash}`
}

export interface NatsServers {
    hosts: string[]
    tls: boolean
    user: string
    pass: string
}

/**
 * Parses `nats://` or `tls://` URLs separated by commas, e.g. `nats://a:4222,nats://b:4222`.
 * A connection has one scheme and one set of credentials, so all of them must share these.
 *
 * URLs carry credentials, so an error names a server by its position only.
 */
export function parseServers(value: string): NatsServers {
    let urls = value.split(',').map((item, i) => parseServer(item.trim(), i + 1))
    let first = urls[0]

    for (let i = 1; i < urls.length; i++) {
        let isSameScheme = urls[i].protocol == first.protocol
        let isSameAuth = urls[i].username == first.username && urls[i].password == first.password
        if (!isSameScheme || !isSameAuth) {
            throw new Error(`server ${i + 1} must have the scheme and the credentials of the first one`)
        }
    }

    return {
        hosts: urls.map((url) => url.host),
        tls: first.protocol == 'tls:',
        user: decodeURIComponent(first.username),
        pass: decodeURIComponent(first.password),
    }
}

function parseServer(value: string, position: number): URL {
    let url: URL
    try {
        url = new URL(value)
    } catch {
        throw new Error(`server ${position} is not a valid URL`)
    }

    let isSupported = url.protocol == 'nats:' || url.protocol == 'tls:'
    if (!isSupported) throw new Error(`server ${position} must be a nats:// or tls:// URL`)

    if (url.host == '') throw new Error(`server ${position} has no host`)

    return url
}

export async function connectNatsStream(options: NatsStreamOptions): Promise<StreamConnection> {
    // The client is loaded only when a stream is actually used
    let {connect} = await import('@nats-io/transport-node')
    let {jetstreamManager} = await import('@nats-io/jetstream')

    let {hosts, tls, user, pass} = parseServers(options.url)
    let hasUserAndPass = user.length > 0 && pass.length > 0
    let hasToken = user.length > 0 && pass.length == 0

    // The client tries the servers in random order until one answers, each within the timeout
    let nc = await connect({
        name: options.name,
        servers: hosts,
        tls: tls ? {} : undefined,
        user: hasUserAndPass ? user : undefined,
        pass: hasUserAndPass ? pass : undefined,
        token: hasToken ? user : undefined,
        timeout: options.connectTimeout ?? DEFAULT_CONNECT_TIMEOUT,
        // A broken connection is replaced by the caller, pending requests must fail right away
        reconnect: false,
    })

    let stream = getStreamName(options.dataset)

    try {
        let jsm = await jetstreamManager(nc, {
            checkAPI: false,
            timeout: options.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT,
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
