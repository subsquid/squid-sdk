import {ArrayValidator} from './composite/array'
import {ConstantValidator} from './composite/constant'
import {Default} from './composite/default'
import {GetKeyTaggedUnionCast, GetKeyTaggedUnionSrc, KeyTaggedUnionValidator} from './composite/key-tagged-union'
import {NullableValidator} from './composite/nullable'
import {GetPropsCast, GetPropsSrc, ObjectValidator} from './composite/object'
import {GetOneOfCast, GetOneOfSrc, OneOfValidator} from './composite/one-of'
import {OptionValidator} from './composite/option'
import {RecordValidator} from './composite/record'
import {RefValidator} from './composite/ref'
import {Sentinel} from './composite/sentinel'
import {GetTaggedUnionCast, GetTaggedUnionSrc, TaggedUnion} from './composite/tagged-union'
import {TupleValidator} from './composite/tuple'
import {DataValidationError, ValidationFailure} from './error'
import {GetCastType, GetSrcType, Validator} from './interface'


export function object<Props extends Record<string, Validator<any> | undefined>>(
    props: Props
): Validator<GetPropsCast<Props>, GetPropsSrc<Props>> {
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
): Validator<
    Record<GetCastType<K>, GetCastType<V>>,
    Record<GetSrcType<K>, GetSrcType<V>>
> {
    return new RecordValidator(key, value)
}


export function taggedUnion<F extends string, U extends Record<string, Validator<any>>>(
    field: F,
    variants: U
): Validator<GetTaggedUnionCast<F, U>, GetTaggedUnionSrc<F, U>> {
    return new TaggedUnion(field, variants)
}


export function keyTaggedUnion<U extends Record<string, Validator<any>>>(
    variants: U
): Validator<GetKeyTaggedUnionCast<U>, GetKeyTaggedUnionSrc<U>> {
    return new KeyTaggedUnionValidator(variants)
}


export function tuple<T extends Validator<any>>(t: T): Validator<[GetCastType<T>], [GetSrcType<T>]>
export function tuple<T1 extends Validator<any>, T2 extends Validator<any>>(t1: T1, t2: T2): Validator<[GetCastType<T1>, GetCastType<T2>], [GetSrcType<T1>, GetSrcType<T2>]>
export function tuple<T1 extends Validator<any>, T2 extends Validator<any>, T3 extends Validator<any>>(t1: T1, t2: T2, t3: T3): Validator<[GetCastType<T1>, GetCastType<T2>, GetCastType<T3>], [GetSrcType<T1>, GetSrcType<T2>, GetSrcType<T3>]>
export function tuple(...tuple: Validator<any>[]): Validator<any[]> {
    return new TupleValidator(tuple)
}


export function array<V extends Validator<any>>(item: V): Validator<GetCastType<V>[], GetSrcType<V>[]> {
    return new ArrayValidator(item)
}


export function option<V extends Validator<any>>(item: V): Validator<
    GetCastType<V> | undefined,
    GetSrcType<V> | undefined | null
> {
    return new OptionValidator(item)
}


export function nullable<V extends Validator<any>>(item: V): Validator<
    GetCastType<V> | null,
    GetSrcType<V> | null
> {
    return new NullableValidator(item)
}


export function withSentinel<V extends Validator<any>>(
    label: string,
    value: GetCastType<V>,
    validator: V
): Validator<GetCastType<V>, GetSrcType<V> | undefined | null> {
    return new Sentinel(label, value, validator)
}


export function withDefault<V extends Validator<any>>(
    value: GetCastType<V>,
    validator: V
): Validator<GetCastType<V>, GetSrcType<V> | undefined | null> {
    return new Default(value, validator)
}


export function ref<V extends Validator<any>>(get: () => V): Validator<GetCastType<V>, GetSrcType<V>> {
    return new RefValidator(get)
}


export function oneOf<P extends Record<string, Validator<any>>>(
    patterns: P
): Validator<GetOneOfCast<P>, GetOneOfSrc<P>> {
    return new OneOfValidator(patterns)
}


export function constant<const T>(value: T, equals?: (a: unknown, b: T) => boolean) {
    return new ConstantValidator(value, equals)
}


export function cast<V extends Validator<any>>(validator: V, value: unknown): GetCastType<V> {
    let result = validator.cast(value)
    if (result instanceof ValidationFailure) throw new DataValidationError(result.toString())
    return result
}


export function assertValidity<V extends Validator<any>>(
    validator: V,
    value: unknown
): asserts value is GetSrcType<V> {
    let err = validator.validate(value)
    if (err) throw new DataValidationError(err.toString())
}
