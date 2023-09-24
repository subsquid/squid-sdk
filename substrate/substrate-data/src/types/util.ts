import {CallRecord, EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {StorageItem} from '@subsquid/substrate-runtime/lib/metadata'
import {GetType, Type} from '@subsquid/substrate-runtime/lib/sts'
import {QualifiedName} from '../interfaces/data'


export function isEvent<T extends Type>(
    runtime: Runtime,
    ty: T,
    event: EventRecord
): event is EventRecord<GetType<T>> {
    return runtime.checkEventType(event.name, ty)
}


export function isCall<T extends Type>(
    runtime: Runtime,
    ty: T,
    call: CallRecord
): call is CallRecord<GetType<T>> {
    return runtime.checkCallType(call.name, ty)
}


export class UnexpectedEventType extends Error {
    constructor(name: QualifiedName) {
        super(`${name} event has unexpected type`)
    }
}


export class UnexpectedCallType extends Error {
    constructor(name: QualifiedName) {
        super(`${name} call has unexpected type`)
    }
}


export class UnexpectedStorageType extends Error {
    constructor(name: QualifiedName) {
        super(`${name} storage has unexpected type`)
    }
}


export function assertEvent<T extends Type>(
    runtime: Runtime,
    ty: T,
    event: EventRecord
): asserts event is EventRecord<GetType<T>> {
    if (!runtime.checkEventType(event.name, ty)) throw new UnexpectedEventType(event.name)
}


export function assertCall<T extends Type>(
    runtime: Runtime,
    ty: T,
    event: EventRecord
): asserts event is CallRecord<GetType<T>> {
    if (!runtime.checkCallType(event.name, ty)) throw new UnexpectedCallType(event.name)
}


export function assertStorage(
    runtime: Runtime,
    name: QualifiedName,
    allowedModifiers: StorageItem['modifier'][],
    key: Type[],
    value: Type
): void {
    if (!runtime.checkStorageType(name, allowedModifiers, key, value)) throw new UnexpectedStorageType(name)
}
