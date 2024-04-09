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


export class EventType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.events.checkType(this.name, this.type)
    }

    is(event: Event): boolean {
        return this.name == event.name && this.matches(event.block)
    }

    decode(event: Event): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeJsonEventRecordArguments(event)
    }
}


export class CallType<T extends sts.Type> {
    constructor(public readonly name: QualifiedName, private type: T) {}

    matches(block: RuntimeCtx): boolean {
        return block._runtime.calls.checkType(this.name, this.type)
    }

    is(call: Call): boolean {
        return this.name == call.name && this.matches(call.block)
    }

    decode(call: Call): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeJsonCallRecordArguments(call)
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
