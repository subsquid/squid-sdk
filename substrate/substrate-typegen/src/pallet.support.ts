import type {Bytes, QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import {Result} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'

export {sts, Result, Bytes}

export type Option<T> = sts.ValueCase<'Some', T> | {__kind: 'None'}

interface RuntimeCtx {
    _runtime: Runtime
}

export interface IBlock extends RuntimeCtx {
    hash: Bytes
    height: number
}

interface EventRecord {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}

interface CallRecord {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}

export function VersionedEvent<V extends Record<string, sts.Type>>(name: string, versions: V) {
    return new VersionedItem(name, Event, versions) as VersionedEvent<V>
}

export type VersionedEvent<V extends Record<string, sts.Type>> = VersionedItem<any, any> & {[K in keyof V]: Event<V[K]>}

export function VersionedCall<V extends Record<string, sts.Type>>(name: string, versions: V) {
    return new VersionedItem(name, Call, versions) as VersionedCall<V>
}

export type VersionedCall<V extends Record<string, sts.Type>> = VersionedItem<any, any> & {[K in keyof V]: Call<V[K]>}

export function VersionedConstant<V extends Record<string, sts.Type>>(name: string, versions: V) {
    return new VersionedItem(name, Call, versions) as VersionedConstant<V>
}

export type VersionedConstant<V extends Record<string, sts.Type>> = VersionedItem<any, any> & {
    [K in keyof V]: Constant<V[K]>
}

export function VersionedStorage<V extends Record<string, any>>(
    name: string,
    versions: Record<string, StorageOptions>
) {
    return new VersionedItem(name, Storage, versions) as VersionedStorage<V>
}

export type VersionedStorage<V extends Record<string, any>> = VersionedItem<any, any> & {
    [K in keyof V]: V[K]
}

export class VersionedItem<I, T> {
    constructor(readonly name: QualifiedName, item: new (name: string, type: T) => I, versions: Record<string, T>) {
        for (let version in versions) {
            Object.defineProperty(this, version, {value: new item(this.name, versions[version])})
        }
    }
}

export class Event<T extends sts.Type> {
    constructor(readonly name: QualifiedName, private type: T) {}

    is(event: EventRecord): boolean {
        return event.name === this.name && event.block._runtime.checkEventType(this.name, this.type)
    }

    decode(event: EventRecord): any {
        return event.block._runtime.decodeEventArguments(this.name, event.args)
    }
}

export class Call<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(call: CallRecord): boolean {
        return call.name === this.name && call.block._runtime.checkCallType(this.name, this.type)
    }

    decode(call: CallRecord): sts.GetType<T> {
        return call.block._runtime.decodeCallArguments(this.name, call.args)
    }
}

export class Constant<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(block: RuntimeCtx): boolean {
        return block._runtime.checkConstantType(this.name, this.type)
    }

    get(block: RuntimeCtx): sts.GetType<T> {
        assert(this.is(block))
        return block._runtime.getConstant(this.name)
    }
}

export interface StorageOptions {
    keys: sts.Type[]
    value: sts.Type
    modifier: 'Optional' | 'Required' | 'Default'
}

export class Storage {
    private keys: sts.Type[]
    private value: sts.Type
    private modifier: 'Optional' | 'Required' | 'Default'

    constructor(private name: QualifiedName, options: StorageOptions) {
        this.keys = options.keys
        this.value = options.value
        this.modifier = options.modifier
    }

    is(block: RuntimeCtx): boolean {
        return block._runtime.checkStorageType(this.name, this.modifier, this.keys, this.value)
    }

    async get(block: IBlock, ...key: any[]): Promise<any> {
        assert(this.is(block))
        return block._runtime.getStorage(block.hash, this.name, ...key)
    }

    async getAll(block: IBlock): Promise<any[]> {
        assert(this.is(block))
        return block._runtime.queryStorage(block.hash, this.name)
    }

    async getMany(block: IBlock, keys: any[]): Promise<any[]> {
        assert(this.is(block))
        return block._runtime.queryStorage(block.hash, this.name, keys)
    }

    async getKeys(block: IBlock, ...args: any[]): Promise<any[]> {
        assert(this.is(block))
        return block._runtime.getStorageKeys(block.hash, this.name, ...args)
    }

    async getRawKeys(block: IBlock, ...args: any[]): Promise<Bytes[]> {
        assert(this.is(block))
        return block._runtime.getStorageRawKeys(block.hash, this.name, ...args)
    }

    getKeysPaged(pageSize: number, block: IBlock, ...args: any[]): AsyncIterable<any[]> {
        assert(this.is(block))
        return block._runtime.getStorageKeysPaged(pageSize, block.hash, this.name, ...args)
    }

    async getPairs(block: IBlock, ...args: any[]): Promise<[key: any, value: any][]> {
        assert(this.is(block))
        return block._runtime.getStoragePairs(block.hash, this.name, ...args)
    }

    getPairsPaged(pageSize: number, block: IBlock, ...args: any[]): AsyncIterable<[key: any, value: any][]> {
        assert(this.is(block))
        return block._runtime.getStoragePairsPaged(pageSize, block.hash, this.name, ...args)
    }

    getDefault(block: IBlock): any {
        assert(this.is(block))
        return block._runtime.getStorageFallback(this.name)
    }
}
