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
    isExists(block: RuntimeCtx): boolean
    at(block: RuntimeCtx): T
}


export class VersionedItem<V extends Record<string, VersionedType>> {
    at: <T>(
        block: RuntimeCtx,
        cb: (
            ...args: Simplify<
                {[K in keyof V]: [event: V[K] extends VersionedType<infer R> ? R : never, version: K]}[keyof V]
            >
        ) => T
    ) => T
    isExists: (block: RuntimeCtx) => boolean

    constructor(readonly name: string, protected versions: V) {
        this.at = this.createGetVersion()
        this.isExists = this.createIsExists()
    }

    private createGetVersion(): any {
        let body = ''
        for (let key in this.versions) {
            let version = `this.versions['${key}']`
            body += `if (${version}.is(block)) return ${version}.at(block)\n`
        }
        body += `throw new UnknownVersionError(this.name)\n`
        return new Function('block', body)
    }

    private createIsExists(): any {
        let body = ''
        for (let key in this.versions) {
            let version = `this.versions['${key}']`
            body += `if (${version}.isExists(block)) return true\n`
        }
        body += `return false`
        return new Function('block', body)
    }
}


export class EventAtBlockType<T extends sts.Type> {
    constructor(private event: EventType<T>, private block: RuntimeCtx) {}

    isExists(): boolean {
        return this.event.isExists(this.block)
    }

    decode(event: Omit<Event, 'block'>): sts.GetType<T> {
        return this.event.decode(this.block, event)
    }
}


export class EventType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.events.checkType(this.name, this.type)
    }

    isExists(block: RuntimeCtx): boolean {
        return block._runtime.hasEvent(this.name)
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


export function event<V extends Record<string, EventType<any>>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
}


export class CallAtBlockType<T extends sts.Type> {
    constructor(private call: CallType<T>, private block: RuntimeCtx) {}

    isExists(): boolean {
        return this.call.isExists(this.block)
    }

    decode(call: Omit<Call, 'block'>): sts.GetType<T> {
        return this.call.decode(this.block, call)
    }
}


export class CallType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.calls.checkType(this.name, this.type)
    }

    isExists(block: RuntimeCtx) {
        return block._runtime.hasCall(this.name)
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


export function call<V extends Record<string, CallType<any>>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
}


export class ConstantAtBlockType<T extends sts.Type> {
    constructor(private constant: ConstantType<T>, private block: RuntimeCtx) {}

    isExists(): boolean {
        return this.constant.isExists(this.block)
    }

    get(): sts.GetType<T> {
        return this.constant.get(this.block)
    }
}


export class ConstantType<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    isExists(block: RuntimeCtx) {
        return block._runtime.hasConstant(this.name)
    }

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


export function constant<V extends Record<string, ConstantType<any>>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
}

type A = Partial<Simplify<Pick<
StorageType,
| 'get'
| 'getAll'
| 'getDefault'
| 'getKeys'
| 'getKeysPaged'
| 'getMany'
| 'getPairs'
| 'getPairsPaged'
| 'getRawKeys'
>>>


export type GetStorageAtBlockType<
    S extends Partial<
        Pick<
            StorageType,
            | 'get'
            | 'getAll'
            | 'getDefault'
            | 'getKeys'
            | 'getKeysPaged'
            | 'getMany'
            | 'getPairs'
            | 'getPairsPaged'
            | 'getRawKeys'
        >
    >
> = Simplify<
    (S['get'] extends {(...args: [any, ...infer A]): infer R} ? {get(...args: A): R} : {}) &
    (S['getAll'] extends {(...args: [any]): infer R} ? {getAll(): R} : {}) &
    (S['getMany'] extends {(keys: infer A): infer R} ? {getMany(keys: A): R} : {}) &
    (S['getKeys'] extends {(...args: [any, ...infer A]): infer R} ? {getKeys(...args: A): R} : {}) &
    (S['getKeysPaged'] extends {(...args: [number, any, ...infer A]): infer R}
        ? {getKeysPaged(pageSize: number, ...args: A): R}
        : {}) &
    (S['getRawKeys'] extends {(...args: [any, ...infer A]): infer R} ? {getRawKeys(...args: A): R} : {}) &
    (S['getPairs'] extends {(...args: [any, ...infer A]): infer R} ? {getPairs(...args: A): R} : {}) &
    (S['getPairsPaged'] extends {(...args: [number, any, ...infer A]): infer R}
        ? {getPairsPaged(pageSize: number, ...args: A): R}
        : {}) &
    (S['getDefault'] extends {(...args: [any, ...infer A]): infer R} ? {getDefault(...args: A): R} : {})
>


export class StorageAtBlockType {
    constructor(private storage: StorageType, private block: Block) {}

    isExists(): boolean {
        return this.storage.isExists(this.block)
    }

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


export class StorageType {
    constructor(
        private name: QualifiedName,
        private modifier: 'Required' | 'Optional' | 'Default',
        private key: sts.Type[],
        private value: sts.Type
    ) {}

    isExists(block: RuntimeCtx): boolean {
        return block._runtime.hasStorage(this.name)
    }

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


export function storage<V extends Record<string, VersionedType>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
}
