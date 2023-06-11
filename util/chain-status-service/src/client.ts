import type {Logger} from '@subsquid/logger'
import {RpcClient} from '@subsquid/rpc-client'
import {addErrorContext} from '@subsquid/util-internal'
import {addTimeout, TimeoutError} from '@subsquid/util-timeout'
import assert from 'assert'
import {createFuture, Future} from './util'


export interface ChainStatus {
    lastFinalizedBlock: {
        height: number
        hash: string
    }
}


async function fetchStatus(client: RpcClient): Promise<ChainStatus> {
    let hash = await client.call('chain_getFinalizedHead')
    let header: {number: string} = await client.call('chain_getHeader', [hash])
    return {
        lastFinalizedBlock:  {
            height: parseInt(header.number),
            hash
        }
    }
}


type RequestId = number
interface Request extends Future<ChainStatus> {
    id: RequestId
}


/**
 * Chain client for fetching {@link ChainStatus}
 *
 * Operates on following principles:
 *  1. All endpoints race to provide status
 *  2. Each endpoint executes at most 1 fetch operation at a time
 *  3. Client overall executes at most 1 fetch operation at a time
 *  4. The result is allowed to be stale by at most 10 seconds, otherwise timeout error will be raised.
 */
export class Client {
    private requestCounter = 0
    private requestWaiter = createFuture<RequestId>()
    private request?: Request
    private lastStatus?: ChainStatus

    constructor(endpoints: string[], private log?: Logger) {
        assert(endpoints.length > 0)
        endpoints.forEach(url => {
            this.fetchLoop(url).catch()
        })
    }

    private async fetchLoop(url: string): Promise<void> {
        let client = this.newClient(url)
        let req = 0
        while (true) {
            req = await this.nextRequest(req)
            try {
                let status = await addTimeout(fetchStatus(client), 10_000)
                this.provide(req, status)
            } catch(err: any) {
                if (err instanceof TimeoutError) {
                    this.rejectWithTimeout(req, err)
                }
                this.log?.error(addErrorContext(err, {req}))
                client.close()
                client = this.newClient(url)
            }
        }
    }

    private newClient(url: string): RpcClient {
        return new RpcClient({
            url,
            retryAttempts: 0,
            log: this.log?.child({endpoint: url})
        })
    }

    private async nextRequest(prev: RequestId): Promise<RequestId> {
        if (this.request && this.request.id != prev) return this.request.id
        return this.requestWaiter.promise()
    }

    private provide(req: number, status: ChainStatus): void {
        if (this.request?.id !== req) return
        if (this.lastStatus && this.lastStatus.lastFinalizedBlock.height > status.lastFinalizedBlock.height) {
            status = this.lastStatus
        } else {
            this.lastStatus = status
        }
        this.request.resolve(status)
        this.request = undefined
    }

    private rejectWithTimeout(req: number, err: TimeoutError): void {
        if (this.request?.id !== req) return
        this.request.reject(err)
        this.request = undefined
    }

    getStatus(): Promise<ChainStatus> {
        if (this.request) return this.request.promise()

        this.request = {
            id: this.requestCounter += 1,
            ...createFuture()
        }

        this.requestWaiter.resolve(this.request.id)
        this.requestWaiter = createFuture()
        return this.request.promise()
    }
}

