import type {BitSequence, Bytes, QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import {Option, Result} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'


export {sts, Bytes, BitSequence, Option, Result}


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

export interface VersionedType {
    is(block: RuntimeCtx): boolean
    isExists(block: RuntimeCtx): boolean
}


export class UnknownVersionError extends Error {
    constructor(name: string) {
        super(`Got unknown version for ${name}`)
    }
}


export class VersionedItem<V extends Record<string, VersionedType>> {
    at: (block: RuntimeCtx) => {[K in keyof V]: V[K] & {__version: K}}[keyof V]
    isExists: (block: RuntimeCtx) => boolean

    constructor(readonly name: string, protected versions: V) {
        this.at = this.createGetVersion()
        this.isExists = this.createIsExists()
        for (let key in this.versions) {
            Object.defineProperty(this.versions[key], '__version', {value: key})
        }
    }

    private createGetVersion(): any {
        let body = ''
        for (let key in this.versions) {
            let version = `this.versions['${key}']`
            body += `if (${version}.is(block)) return ${version}\n`
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


export class EventType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.events.checkType(this.name, this.type)
    }

    isExists(block: RuntimeCtx) {
        return block._runtime.hasEvent(this.name)
    }

    is(block: RuntimeCtx): boolean
    is(event: Event): boolean
    is(blockOrEvent: RuntimeCtx | Event): boolean {
        let [block, name] = 'block' in blockOrEvent ? [blockOrEvent.block, blockOrEvent.name] : [blockOrEvent, null]
        return (name == null || this.name == name) && this.matches(block)
    }

    decode(event: Event): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeJsonEventRecordArguments(event)
    }
}


export function event<V extends Record<string, EventType<any>>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
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

    decode(call: Call): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeJsonCallRecordArguments(call)
    }
}


export function call<V extends Record<string, CallType<any>>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
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
}


export function constant<V extends Record<string, ConstantType<any>>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
}


export class StorageType {
    constructor(
        private name: QualifiedName,
        private modifier: 'Required' | 'Optional' | 'Default',
        private key: sts.Type[],
        private value: sts.Type
    ) {}

    isExists(block: RuntimeCtx) {
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
}


export function storage<V extends Record<string, StorageType>>(name: string, versions: V): VersionedItem<V> & V {
    return Object.assign(new VersionedItem(name, versions), versions)
}
