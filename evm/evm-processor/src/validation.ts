import {def} from '@subsquid/util-internal'
import {Bytes, Qty} from './interfaces/base'


export class ValidationFailure {
    path: (string | number)[] = []
    message: string

    constructor(message: string) {
        this.message = message
    }

    toString(): string {
        if (this.path.length) {
            return `invalid value at ${this.printPath()}: ${this.message}`
        } else {
            return this.message
        }
    }

    printPath(): string {
        let s = ''
        for (let i = this.path.length - 1; i >= 0; i--) {
            s += '/' + this.path[i]
        }
        return s
    }
}


export function print(val: unknown): string {
    if (val === undefined) return 'undefined'
    return JSON.stringify(val)
}


export interface Validator<T, S=T> {
    cast(value: unknown): T | ValidationFailure
    validate(value: unknown): ValidationFailure | undefined
    phantom(): S
}


export type GetCastType<V> = V extends Validator<infer T, infer S>
    ? T
    : V extends undefined ? undefined : never


export type GetSrcType<V> = V extends Validator<infer T, infer S>
    ? S
    : V extends undefined ? undefined : never


type AddOptionToUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
    [K in keyof T as undefined extends T[K] ? K : never]+?: T[K]
}


type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


type GetObjectType<Props> = Simplify<AddOptionToUndefined<{
    [K in keyof Props]: GetCastType<Props[K]>
}>>


type GetSrcObjectType<Props> = Simplify<AddOptionToUndefined<{
    [K in keyof Props]: GetSrcType<Props[K]>
}>>


export class ObjectValidator<Props extends Record<string, Validator<any>>>
    implements Validator<GetObjectType<Props>, GetSrcObjectType<Props>>
{
    constructor(public readonly props: Props) {}

    cast(object: any): ValidationFailure | GetObjectType<Props> {
        if (typeof object != 'object' || !object) return new ValidationFailure(`${print(object)} is not an object`)
        let result: any = {}
        for (let key in this.props) {
            let val = this.props[key].cast(object[key])
            if (val === undefined) continue
            if (val instanceof ValidationFailure) {
                val.path.push(key)
                return val
            }
            result[key] = val
        }
        return result
    }

    validate(object: any): ValidationFailure | undefined {
        if (typeof object != 'object' || !object) return new ValidationFailure(`${print(object)} is not an object`)
        for (let key in this.props) {
            let err = this.props[key].validate(object[key])
            if (err) {
                err.path.push(key)
                return err
            }
        }
    }

    phantom(): GetSrcObjectType<Props> {
        throw new Error()
    }
}


type GetUnionType<F extends string, U> = Simplify<{
    [C in keyof U]: GetCastType<U[C]> & {[T in F]: C}
}[keyof U]>


type GetSrcUnionType<F extends string, U> = Simplify<{
    [C in keyof U]: GetSrcType<U[C]> & {[T in F]: C}
}[keyof U]>


export class TaggedUnion<F extends string, U extends Record<string, Validator<any>>>
    implements Validator<GetUnionType<F, U>, GetSrcUnionType<F, U>>
{
    constructor(
        public readonly tagField: F,
        public readonly variants: U
    ) {}

    cast(value: any): ValidationFailure | GetUnionType<F, U> {
        let variant = this.getVariant(value)
        if (variant instanceof ValidationFailure) return variant
        let result = variant.cast(value)
        result[this.tagField] = value[this.tagField]
        return result
    }

    validate(value: unknown): ValidationFailure | undefined {
        let variant = this.getVariant(value)
        if (variant instanceof ValidationFailure) return variant
        return variant.validate(value)
    }

    private getVariant(obj: any): Validator<any>| ValidationFailure {
        if (typeof obj != 'object' || !obj) return new ValidationFailure(`${print(obj)} is not an object`)
        let tag = obj[this.tagField]
        let variant = this.variants[tag]
        if (variant) return variant
        let failure = new ValidationFailure(`expected one of ${print(Object.keys(this.variants))}, but got ${print(tag)}`)
        failure.path.push(this.tagField)
        return failure
    }

    phantom(): GetSrcUnionType<F, U> {
        throw new Error()
    }
}


export class RecordValidator<K extends Validator<string>, V extends Validator<any>>
    implements Validator<Record<string, GetCastType<V>>, Record<string, GetSrcType<V>>>
{
    constructor(public readonly key: K, public readonly value: V) {}

    cast(record: unknown): ValidationFailure | Record<string, GetCastType<V>> {
        if (typeof record != 'object' || !record) return new ValidationFailure(`${print(record)} is not an object`)
        let result: any = {}
        for (let key in record) {
            let k = this.key.cast(key)
            if (k instanceof ValidationFailure) {
                k.path.push(key)
                return k
            }
            let v = this.value.cast((record as any)[key])
            if (v instanceof ValidationFailure) {
                v.path.push(key)
                return v
            }
            result[k] = v
        }
        return result
    }

    validate(record: unknown): ValidationFailure | undefined {
        if (typeof record != 'object' || !record) return new ValidationFailure(`${print(record)} is not an object`)
        for (let key in record) {
            let err = this.key.validate(key) || this.value.validate((record as any)[key])
            if (err) {
                err.path.push(key)
                return err
            }
        }
    }

    phantom(): Record<string, GetSrcType<V>> {
        throw new Error()
    }
}


export class ArrayValidator<V extends Validator<any>> implements Validator<GetCastType<V>[], GetSrcType<V>[]> {
    constructor(public readonly item: V) {}

    cast(array: unknown): ValidationFailure | GetCastType<V>[] {
        if (!Array.isArray(array)) return new ValidationFailure(`${print(array)} is not an array`)
        let result: any[] = new Array(array.length)
        for (let i = 0; i < array.length; i++) {
            let val = this.item.cast(array[i])
            if (val instanceof ValidationFailure) {
                val.path.push(i)
                return val
            } else {
                result[i] = val
            }
        }
        return result
    }

    validate(array: unknown): ValidationFailure | undefined {
        if (!Array.isArray(array)) return new ValidationFailure(`${print(array)} is not an array`)
        for (let i = 0; i < array.length; i++) {
            let err = this.item.validate(array[i])
            if (err) {
                err.path.push(i)
                return err
            }
        }
    }

    phantom(): GetSrcType<V>[] {
        throw new Error()
    }
}


export class SentinelValidator<T, S> implements Validator<T, S | undefined | null> {
    constructor(
        public readonly value: Validator<T, S>,
        public readonly sentinel: T
    ) {}

    cast(value: unknown): ValidationFailure | T {
        if (value == null) {
            return this.sentinel
        } else {
            return this.value.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value != null) return this.value.validate(value)
    }

    phantom(): S | undefined | null {
        throw new Error()
    }
}


export class OptionValidator<T, S> implements Validator<T | undefined, S | undefined | null> {
    constructor(public readonly value: Validator<T, S>) {}

    cast(value: unknown): ValidationFailure | T | undefined {
        if (value == null) {
            return undefined
        } else {
            return this.value.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value != null) return this.value.validate(value)
    }

    phantom(): S | undefined | null {
        throw new Error()
    }
}


export class NullableValidator<T, S> implements Validator<T | null, S | null> {
    constructor(public readonly value: Validator<T, S>) {}

    cast(value: unknown): ValidationFailure | T | null {
        if (value === null) {
            return null
        } else {
            return this.value.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value === null) return
        return this.value.validate(value)
    }

    phantom(): S | null {
        return null
    }

}


export class RefValidator<T, S> implements Validator<T, S> {
    constructor(private get: () => Validator<T, S>) {}

    @def
    validator(): Validator<T, S> {
        return this.get()
    }

    cast(value: unknown): ValidationFailure | T {
        return this.validator().cast(value)
    }

    validate(value: unknown): ValidationFailure | undefined {
        return this.validator().validate(value)
    }

    phantom(): S {
        throw new Error()
    }
}


export class ConstantValidator<const T> implements Validator<T> {
    constructor(public readonly constant: T) {}

    cast(value: unknown): ValidationFailure | T {
        if (value === this.constant) {
            return this.constant
        } else {
            return new ValidationFailure(`expected ${print(this.constant)}, but got ${print(value)}`)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value !== this.constant)
            return new ValidationFailure(`expected ${print(this.constant)}, but got ${print(value)}`)
    }

    phantom(): T {
        return this.constant
    }
}


export const STRING: Validator<string> = {
    cast(value: unknown): ValidationFailure | string {
        return this.validate(value) || value as string
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value == 'string') return
        return new ValidationFailure(`${print(value)} is not a string`)
    },
    phantom(): string {
        return ''
    }
}


export const QTY: Validator<bigint, string> = {
    cast(value: unknown): ValidationFailure | bigint {
        return this.validate(value) || BigInt(value as string)
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value == 'string' && /^0x[0-9a-f]*$/.test(value)) return
        return new ValidationFailure(`${print(value)} is not a hex natural number`)
    },
    phantom(): string {
        return '0x'
    }
}


export const SMALL_QTY: Validator<number, string> = {
    cast(value: unknown): number | ValidationFailure {
        if (typeof value == 'string' && /^0x[0-9a-f]*$/.test(value)) {
            let val = parseInt(value)
            if (Number.isSafeInteger(val)) {
                return val
            } else {
                return new ValidationFailure(`${value} is not a safe integer`)
            }
        } else {
            return new ValidationFailure(`${print(value)} is not a natural hex number`)
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        let i = this.cast(value)
        if (i instanceof ValidationFailure) return i
    },
    phantom(): string {
        return '0x0'
    }
}


export const NAT: Validator<number> = {
    cast(value: unknown): number | ValidationFailure {
        return this.validate(value) || value as number
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value == 'number' && Number.isSafeInteger(value) && value >= 0) return
        return new ValidationFailure(`${print(value)} is not a natural number`)
    },
    phantom(): number {
        return 0
    }
}


export const SMALL_QTY_OR_NAT: Validator<number, number | Qty> = {
    cast(value: unknown): number | ValidationFailure {
        let nat: number
        switch(typeof value) {
            case 'number':
                nat = value
                break
            case 'string':
                if (/^0x[0-9a-f]*$/.test(value)) {
                    nat = parseInt(value)
                } else {
                    return new ValidationFailure(`${print(value)} is not a natural hex number`)
                }
                break
            default:
                return new ValidationFailure(`${print(value)} is not a natural number`)
        }
        if (Number.isSafeInteger(nat) && nat >= 0) {
            return nat
        } else {
            return new ValidationFailure(`${print(value)} is not a natural number`)
        }
    },
    validate(value: unknown): ValidationFailure | undefined {
        let nat = this.cast(value)
        if (typeof nat == 'number') return
        return nat
    },
    phantom(): Qty | number {
        throw new Error('Function not implemented.')
    }
}


export const BYTES: Validator<Bytes> = {
    cast(value: unknown): string | ValidationFailure {
        return this.validate(value) || value as Bytes
    },
    validate(value: unknown): ValidationFailure | undefined {
        if (typeof value == 'string' && /^0x[0-9a-f]*$/.test(value)) return
        return new ValidationFailure(`${print(value)} is not a binary hex string`)
    },
    phantom(): Bytes {
        return '0x'
    }
}


export function option<V extends Validator<any>>(
    item: V
): Validator<GetCastType<V> | undefined, GetSrcType<V> | undefined | null> {
    return new OptionValidator(item)
}


export function nullable<V extends Validator<any>>(
    item: V
): Validator<GetCastType<V> | null, GetSrcType<V> | null> {
    return new NullableValidator(item)
}


export function withSentinel<V extends Validator<any>>(
    sentinel: GetCastType<V>,
    item: V
): Validator<GetCastType<V>, GetSrcType<V> | undefined | null> {
    return new SentinelValidator(item, sentinel)
}


export function object<Props extends Record<string, Validator<any> | undefined>>(
    props: Props
): Validator<GetObjectType<Props>, GetSrcObjectType<Props>> {
    let presentProps: Record<string, Validator<any>> = {}
    for (let key in props) {
        let v = props[key]
        if (v) {
            presentProps[key] = v
        }
    }
    return new ObjectValidator(presentProps) as any
}


export function record<K extends Validator<string>, V extends Validator<any>>(
    key: K,
    value: V
): Validator<Record<string, GetCastType<V>>, Record<string, GetSrcType<V>>> {
    return new RecordValidator(key, value)
}


export function array<V extends Validator<any>>(item: V): Validator<GetCastType<V>[], GetSrcType<V>[]> {
    return new ArrayValidator(item)
}


export function taggedUnion<F extends string, U extends Record<string, Validator<any>>>(
    field: F,
    variants: U
): Validator<GetUnionType<F, U>, GetSrcUnionType<F, U>> {
    return new TaggedUnion(field, variants)
}


export function ref<T, S>(validator: () => Validator<T, S>): Validator<T, S> {
    return new RefValidator(validator)
}


export function constant<const T>(value: T): Validator<T> {
    return new ConstantValidator(value)
}


export function cast<V extends Validator<any>>(validator: V, value: unknown): GetCastType<V> {
    let val = validator.cast(value)
    if (val instanceof ValidationFailure) throw new ValidationError(val.toString())
    return val
}


export function assertValidity<V extends Validator<any>>(validator: V, value: unknown): asserts value is GetSrcType<V> {
    let err = validator.validate(value)
    if (err) throw new ValidationError(err.toString())
}


export class ValidationError extends Error {
    get name(): string {
        return 'ValidationError'
    }
}
