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


interface IEvent {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}


interface ICall {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}


export function createEvent<T extends Record<string, sts.Type>>(...args: ConstructorParameters<typeof EventVersions<T>>) {
    return new EventVersions(...args) as EventVersions<T> & {[k in keyof T]: Event<T[k]>}
}


export class EventVersions<T extends Record<string, sts.Type>> {
    constructor (readonly name: QualifiedName, versions: T) {
        for (let v in versions) {
            Object.defineProperty(this, v, {value: new Event(this.name, versions[v])})
        }
    }

    [k: `v${number}`]: Event<sts.Type>
}


export class Event<T extends sts.Type> {
    constructor(readonly name: QualifiedName, readonly type: T) {}

    is(event: IEvent): boolean {
        return event.name === this.name && event.block._runtime.checkEventType(this.name, this.type)
    }

    decode(event: IEvent): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeEventRecordArguments(event)
    }
}


export class Call<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(call: ICall): boolean {
        return call.name === this.name && call.block._runtime.checkCallType(this.name, this.type)
    }

    decode(call: ICall): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeCallRecordArguments(call)
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


export class Storage {
    constructor(
        private name: QualifiedName,
        private modifier: 'Required' | 'Optional' | 'Default',
        private key: sts.Type[],
        private value: sts.Type
    ) {}

    is(block: RuntimeCtx): boolean {
        return block._runtime.checkStorageType(this.name, this.modifier, this.key, this.value)
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
        assert(this.modifier == 'Default')
        assert(this.is(block))
        return block._runtime.getStorageFallback(this.name)
    }
}
