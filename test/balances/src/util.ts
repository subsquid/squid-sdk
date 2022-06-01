import type {Store, EntityClass} from "@subsquid/typeorm-store"


export async function getOrCreate<T extends {id: string}>(
    store: Store,
    entityClass: EntityClass<T>,
    id: string
): Promise<T> {

    let e = await store.get<T>(entityClass, id)

    if (e == null) {
        e = new entityClass()
        e.id = id
    }

    return e
}
