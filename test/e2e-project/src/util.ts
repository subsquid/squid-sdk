import {Store} from "@subsquid/substrate-processor"


export function decodeHex(s: string): Buffer {
    return Buffer.from(s.slice(2), 'hex')
}


export async function getOrCreate<T>(
    constructor: { new(props?: { id?: string }): T },
    id: string,
    store: Store
): Promise<T> {
    let entity: T | undefined = await store.get<T>(constructor, {
        where: {id},
    })
    if (entity === undefined) {
        entity = new constructor({id})
    }
    return entity
}
