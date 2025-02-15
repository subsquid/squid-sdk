import assert from 'assert'
import * as wrk from 'worker_threads'
import {TransferListItem} from 'worker_threads'
import {Client} from './client'
import {Server} from './server'
import {Transfer} from './transfer'


export {
    Client,
    Server,
    Transfer
}


let server: Server | undefined


export function getServer(): Server {
    assert(!wrk.isMainThread && wrk.parentPort, 'not a worker thread')
    if (server) return server
    return server = new Server(wrk.parentPort)
}


export function getServerArguments<T = unknown>(): T {
    assert(!wrk.isMainThread, 'not a worker thread')
    return wrk.workerData
}


export interface WorkerOptions {
    script: string | URL
    args?: any
    transferList?: TransferListItem[]
    name?: string
}


export function createWorker(options: WorkerOptions): Client {
    let worker = new wrk.Worker(options.script, {
        workerData: options.args,
        transferList: options.transferList,
        name: options.name,
        env: {
            ...process.env,
            FORCE_PRETTY_LOGGER: process.env.FORCE_PRETTY_LOGGER ?? (process.stdout.isTTY ? '1' : undefined)
        }
    })
    return new Client(worker)
}
