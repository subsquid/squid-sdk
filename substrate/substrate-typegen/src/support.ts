import type {BitSequence, Bytes, QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import {Option, Result} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'


export {sts, Bytes, BitSequence, Option, Result}


type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export interface RuntimeCtx {
    _runtime: Runtime
}


export interface Block extends RuntimeCtx {
    hash: Bytes
    height: number
}


interface Event {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}


interface Call {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}


export class UnknownVersionError extends Error {
    constructor(name: string) {
        super(`Got unknown version for ${name}`)
    }
}


export interface VersionedType<T = unknown> {
    is(block: RuntimeCtx): boolean
    at(block: RuntimeCtx): T
}


export type GetVersionedItemEntries<V extends Record<string, VersionedType>> = Simplify<
    {[K in keyof V]: [item: V[K] extends VersionedType<infer R> ? R : never, version: K]}[keyof V]
>


export class VersionedItem<V extends Record<string, VersionedType>> {
    isExists: (block: RuntimeCtx) => boolean

    constructor(
        readonly name: string,
        protected versions: V,
        isExists: (this: VersionedItem<V>, block: RuntimeCtx) => boolean,
        protected NoVersionError: new (...args: any[]) => Error = UnknownVersionError
    ) {
        this.isExists = isExists.bind(this)
    }

    at<T>(block: RuntimeCtx, cb: (this: this, ...args: GetVersionedItemEntries<V>) => T): T {
        this.at = this.createMatchVersion()
        return this.at(block, cb)
    }

    private createMatchVersion(): any {
        let body = ''
        for (let key in this.versions) {
            let version = `this.versions['${key}']`
            body += `if (${version}.is(block)) return cb.call(this, ${version}.at(block), '${key}')\n`
        }
        body += `throw new this.NoVersionError(this.name)\n`
        return new Function('block', 'cb', body)
    }
}


export class EventAtBlockType<T extends sts.Type> {
    constructor(private event: EventType<T>, private block: RuntimeCtx) {}

    decode(event: Omit<Event, 'block'>): sts.GetType<T> {
        return this.event.decode(this.block, event)
    }
}


export class EventType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.events.checkType(this.name, this.type)
    }

    is(block: RuntimeCtx): boolean
    is(event: Event): boolean
    is(blockOrEvent: RuntimeCtx | Event): boolean {
        let [block, name] = 'block' in blockOrEvent ? [blockOrEvent.block, blockOrEvent.name] : [blockOrEvent, null]
        return (name == null || this.name == name) && this.matches(block)
    }

    decode(block: RuntimeCtx, event: Omit<Event, 'block'>): sts.GetType<T>
    decode(event: Event): sts.GetType<T>
    decode(blockOrEvent: RuntimeCtx | Event, event?: Omit<Event, 'block'>) {
        if ('block' in blockOrEvent) {
            assert(this.is(blockOrEvent))
            return blockOrEvent.block._runtime.decodeJsonEventRecordArguments(blockOrEvent)
        } else {
            assert(this.is(blockOrEvent))
            assert(event != null)
            return blockOrEvent._runtime.decodeJsonEventRecordArguments(event)
        }
    }

    at(block: RuntimeCtx): EventAtBlockType<T> {
        return new EventAtBlockType(this, block)
    }
}


export type VersionedEvent<
    T extends Record<string, sts.Type>,
    R extends Record<string, VersionedType> = {
        [K in keyof T]: EventType<T[K]>
    }
> = Simplify<VersionedItem<R> & R>


export function event<V extends Record<string, sts.Type>>(name: string, versions: V): VersionedEvent<V> {
    let items: any = {}
    for (let prop in versions) {
        items[prop] = new EventType(name, versions[prop])
    }
    return Object.assign(new VersionedItem(name, items, (b) => b._runtime.hasEvent(name)), items)
}


export class CallAtBlockType<T extends sts.Type> {
    constructor(private call: CallType<T>, private block: RuntimeCtx) {}

    decode(call: Omit<Call, 'block'>): sts.GetType<T> {
        return this.call.decode(this.block, call)
    }
}


export class CallType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.calls.checkType(this.name, this.type)
    }

    is(block: RuntimeCtx): boolean
    is(call: Call): boolean
    is(blockOrCall: RuntimeCtx | Call): boolean {
        let [block, name] = 'block' in blockOrCall ? [blockOrCall.block, blockOrCall.name] : [blockOrCall, null]
        return (name == null || this.name == name) && this.matches(block)
    }

    decode(block: RuntimeCtx, call: Omit<Call, 'block'>): sts.GetType<T>
    decode(call: Call): sts.GetType<T>
    decode(blockOrCall: RuntimeCtx | Call, call?: Omit<Call, 'block'>) {
        if ('block' in blockOrCall) {
            assert(this.is(blockOrCall))
            return blockOrCall.block._runtime.decodeJsonCallRecordArguments(blockOrCall)
        } else {
            assert(this.is(blockOrCall))
            assert(call != null)
            return blockOrCall._runtime.decodeJsonCallRecordArguments(call)
        }
    }

    at(block: RuntimeCtx): CallAtBlockType<T> {
        return new CallAtBlockType(this, block)
    }
}


export type VersionedCall<
    T extends Record<string, sts.Type>,
    R extends Record<string, VersionedType> = {
        [K in keyof T]: CallType<T[K]>
    }
> = Simplify<VersionedItem<R> & R>


export function call<V extends Record<string, sts.Type>>(name: string, versions: V): VersionedCall<V> {
    let items: any = {}
    for (let prop in versions) {
        items[prop] = new EventType(name, versions[prop])
    }
    return Object.assign(new VersionedItem(name, items, (b) => b._runtime.hasCall(name)), items)
}


export class ConstantAtBlockType<T extends sts.Type> {
    constructor(private constant: ConstantType<T>, private block: RuntimeCtx) {}

    get(): sts.GetType<T> {
        return this.constant.get(this.block)
    }
}


export class ConstantType<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(block: RuntimeCtx): boolean {
        return block._runtime.checkConstantType(this.name, this.type)
    }

    get(block: RuntimeCtx): sts.GetType<T> {
        assert(this.is(block))
        return block._runtime.getConstant(this.name)
    }

    at(block: RuntimeCtx): ConstantAtBlockType<T> {
        return new ConstantAtBlockType(this, block)
    }
}


export type VersionedConstant<
    T extends Record<string, sts.Type>,
    R extends Record<string, VersionedType> = {
        [K in keyof T]: ConstantType<T[K]>
    }
> = Simplify<VersionedItem<R> & R>


export function constant<V extends Record<string, sts.Type>>(name: string, versions: V): VersionedConstant<V> {
    let items: any = {}
    for (let prop in versions) {
        items[prop] = new ConstantType(name, versions[prop])
    }
    return Object.assign(new VersionedItem(name, items, (b) => b._runtime.hasConstant(name)), items)
}


export class StorageAtBlockType {
    constructor(private storage: StorageType, private block: Block) {}

    get(...key: any[]): Promise<any> {
        return this.storage.get(this.block, ...key)
    }

    getAll(): Promise<any[]> {
        return this.storage.getAll(this.block)
    }

    getMany(keys: any[]): Promise<any[]> {
        return this.storage.getMany(this.block, keys)
    }

    getKeys(...args: any[]): Promise<any[]> {
        return this.storage.getKeys(this.block, ...args)
    }

    getRawKeys(...args: any[]): Promise<Bytes[]> {
        return this.storage.getRawKeys(this.block, ...args)
    }

    getKeysPaged(pageSize: number, ...args: any[]): AsyncIterable<any[]> {
        return this.storage.getKeysPaged(pageSize, this.block, ...args)
    }

    getPairs(...args: any[]): Promise<[key: any, value: any][]> {
        return this.storage.getPairs(this.block, ...args)
    }

    getPairsPaged(pageSize: number, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        return this.storage.getPairsPaged(pageSize, this.block, ...args)
    }

    getDefault(): any {
        return this.storage.getDefault(this.block)
    }
}



type EnumerateKeys<K, V, Extra extends any[] = []> = K extends [...infer A, any]
    ? EnumerateKeys<A, V, Extra> & ((...args: [...Extra, ...K]) => V)
    : ((...args: Extra) => V)


export type StorageMethods<
    K extends any[],
    V,
    M extends 'Required' | 'Optional' | 'Default',
    D extends boolean,
    Extra extends any[] = [],
    ReturnValue = M extends 'Required' ? V : V | undefined,
    Key = K extends readonly [any] ? K[0] : K
> = Simplify<
    {
        get(...args: [...Extra, ...K]): Promise<ReturnValue>
    } & (M extends 'Default'
        ? {
              getDefault(...args: Extra): V
          }
        : {}) &
        ([] extends K
            ? {}
            : {
                  getAll(...args: Extra): Promise<V[]>
                  getMany(...args: [...Extra, keys: Key[]]): Promise<ReturnValue[]>
              } & (D extends false
                  ? {}
                  : {
                        getKeys: EnumerateKeys<K, Promise<Key[]>, Extra>
                        getKeysPaged: EnumerateKeys<K, AsyncIterable<Key[]>, [pageSize: number, ...Extra]>
                        getPairs: EnumerateKeys<K, Promise<[key: K, value: V][]>, Extra>
                        getPairsPaged: EnumerateKeys<
                            K,
                            AsyncIterable<[key: K, value: V][]>,
                            [pageSize: number, ...Extra]
                        >
                    }))
>


export type GetStorageType<
    K extends any[],
    V,
    M extends 'Required' | 'Optional' | 'Default',
    D extends boolean
> = Simplify<
    Pick<StorageType, 'name' | 'is'> & {
        at(block: Block): StorageMethods<K, V, M, D>
    } & StorageMethods<K, V, M, D, [block: Block]>
>


export class StorageType {
    constructor(
        readonly name: QualifiedName,
        private modifier: 'Required' | 'Optional' | 'Default',
        private key: sts.Type[],
        private value: sts.Type,
    ) {}

    is(block: RuntimeCtx): boolean {
        return block._runtime.checkStorageType(this.name, this.modifier, this.key, this.value)
    }

    async get(block: Block, ...key: any[]): Promise<any> {
        assert(this.is(block))
        return block._runtime.getStorage(block.hash, this.name, ...key)
    }

    async getAll(block: Block): Promise<any[]> {
        assert(this.is(block))
        return block._runtime.queryStorage(block.hash, this.name)
    }

    async getMany(block: Block, keys: any[]): Promise<any[]> {
        assert(this.is(block))
        return block._runtime.queryStorage(block.hash, this.name, keys)
    }

    async getKeys(block: Block, ...args: any[]): Promise<any[]> {
        assert(this.is(block))
        return block._runtime.getStorageKeys(block.hash, this.name, ...args)
    }

    async getRawKeys(block: Block, ...args: any[]): Promise<Bytes[]> {
        assert(this.is(block))
        return block._runtime.getStorageRawKeys(block.hash, this.name, ...args)
    }

    getKeysPaged(pageSize: number, block: Block, ...args: any[]): AsyncIterable<any[]> {
        assert(this.is(block))
        return block._runtime.getStorageKeysPaged(pageSize, block.hash, this.name, ...args)
    }

    async getPairs(block: Block, ...args: any[]): Promise<[key: any, value: any][]> {
        assert(this.is(block))
        return block._runtime.getStoragePairs(block.hash, this.name, ...args)
    }

    getPairsPaged(pageSize: number, block: Block, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        assert(this.is(block))
        return block._runtime.getStoragePairsPaged(pageSize, block.hash, this.name, ...args)
    }

    getDefault(block: Block): any {
        assert(this.modifier == 'Default')
        assert(this.is(block))
        return block._runtime.getStorageFallback(this.name)
    }

    at(block: Block): StorageAtBlockType {
        return new StorageAtBlockType(this, block)
    }
}


export type StorageOptions<
    K extends sts.Type[],
    V extends sts.Type,
    M extends 'Required' | 'Optional' | 'Default',
    D extends boolean
> = {key: K, value: V, modifier: M, isKeyDecodable: D}


export type VersionedStorage<
    T extends Record<string, StorageOptions<any, any, any, any>>,
    R extends Record<string, VersionedType> = {
        [K in keyof T]: GetStorageType<sts.GetTupleType<T[K]['key']>, sts.GetType<T[K]['value']>, T[K]['modifier'], T[K]['isKeyDecodable']>
    }
> = Simplify<VersionedItem<R> & R>


export function storage<V extends Record<string, StorageOptions<any, any, any, any>>>(
    name: string,
     versions: V
): VersionedStorage<V> {
    let items: any = {}
    for (let prop in versions) {
        let {modifier, key, value} = versions[prop]
        items[prop] = new StorageType(name, modifier, key, value)
    }
    return Object.assign(new VersionedItem(name, items, (b) => b._runtime.hasStorage(name), items))
}
