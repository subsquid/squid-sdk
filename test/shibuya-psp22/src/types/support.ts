import type {Bytes, QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import {Result} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'


export {sts, Result, Bytes}


export type Option<T> = sts.ValueCase<'Some', T> | {__kind: 'None'}


interface RuntimeCtx {
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


export class EventType<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(event: Event): boolean
    is(block: RuntimeCtx): boolean
    is(eventOrBlock: Event | RuntimeCtx): boolean {
        let runtime: Runtime
        if ('_runtime' in eventOrBlock) {
            runtime = eventOrBlock._runtime
        } else {
            if (eventOrBlock.name !== this.name) return false
            runtime = eventOrBlock.block._runtime
        }
        return runtime.events.checkType(this.name, this.type)
    }

    decode(event: Event): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeEventRecordArguments(event)
    }
}


export class CallType<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(call: Call): boolean
    is(block: RuntimeCtx): boolean
    is(callOrBlock: Call | RuntimeCtx): boolean {
        let runtime: Runtime
        if ('_runtime' in callOrBlock) {
            runtime = callOrBlock._runtime
        } else {
            if (callOrBlock.name !== this.name) return false
            runtime = callOrBlock.block._runtime
        }
        return runtime.events.checkType(this.name, this.type)
    }

    decode(call: Call): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeCallRecordArguments(call)
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
}


export class StorageType {
    constructor(
        private name: QualifiedName,
        private modifier: 'Required' | 'Optional' | 'Default',
        private key: sts.Type[],
        private value: sts.Type
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
}
