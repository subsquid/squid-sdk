import type {Store} from "@subsquid/substrate-processor"


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
