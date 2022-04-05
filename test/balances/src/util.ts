import type {Store} from "@subsquid/substrate-processor"


export type EntityConstructor<T> = {
    new(...args: any[]): T
}


export async function getOrCreate<T extends {id: string}>(
    store: Store,
    entityConstructor: EntityConstructor<T>,
    id: string
): Promise<T> {

    let e = await store.get<T>(entityConstructor, {
        where: {id}
    })

    if (e == null) {
        e = new entityConstructor()
        e.id = id
    }

    return e
}
