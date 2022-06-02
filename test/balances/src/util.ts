import type {EntityClass, Store} from "@subsquid/typeorm-store"


export async function getOrCreate<T extends {id: string}>(
    store: Store,
    entityClass: EntityClass<T>,
    id: string
): Promise<T> {

    let e = await store.findOne<T>(entityClass, id)

    if (e == null) {
        e = new entityClass()
        e.id = id
    }

    return e
}
