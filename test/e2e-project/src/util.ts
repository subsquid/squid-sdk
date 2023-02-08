import type {Entity, Store} from '@subsquid/typeorm-store'
import {HttpClient} from '@subsquid/util-internal-http-client'


export async function getOrCreate<T extends Entity>(
    constructor: { new(props?: { id?: string }): T },
    id: string,
    store: Store
): Promise<T> {
    let entity: T | undefined = await store.get<T>(constructor, id)
    if (entity === undefined) {
        entity = new constructor({id})
    }
    return entity
}


export function getDataSource(): {archive: string, chain: string} {
    if (process.env.ARCHIVE_ENDPOINT && process.env.CHAIN_ENDPOINT) {
        return {
            archive: process.env.ARCHIVE_ENDPOINT,
            chain: process.env.CHAIN_ENDPOINT
        }
    } else {
        throw new Error('ARCHIVE_ENDPOINT and CHAIN_ENDPOINT must be set')
    }
}


export async function waitForGateway(): Promise<void> {
    let gateway = new HttpClient({
        baseUrl: getDataSource().archive,
        retryAttempts: 10,
        retrySchedule: [1000]
    })

    await gateway.graphqlRequest(`query {status {head}}`)
}
