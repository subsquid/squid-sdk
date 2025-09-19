import {Validator} from '@subsquid/util-internal-validation'

/**
 * @example '0x0123456789abcdef'
 */
export type Hex = string & {}

/**
 * @example '123456789ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
 */
export type Base58 = string & {}

/**
 * @example '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+/='
 */
export type Base64 = string & {}

export type Simplify<T> = {[K in keyof T]: T[K]} & {}

export type ConditionalKeys<T, V> = {
    [Key in keyof T]-?: T[Key] extends V ? (T[Key] extends never ? (V extends never ? Key : never) : Key) : never
}[keyof T]

export type ConditionalPick<T, V> = Simplify<Pick<T, ConditionalKeys<T, V>>>

export type ConditionalOmit<T, V> = Simplify<Omit<T, ConditionalKeys<T, V>>>

export type Selector<Props extends PropertyKey = PropertyKey, Required extends Props = never> = Simplify<
    {
        [P in Exclude<Props, Required>]?: boolean
    } & {
        [P in Required]-?: boolean
    }
>

export type Select<T, S> = S extends any
    ? {
          [K in keyof T as K extends keyof S ? (true extends S[K] ? K : never) : never]: T[K]
      }
    : never

export type Selection = {
    [P in string]?: boolean | Selection
}

export type Trues<T extends Selection> = Simplify<{
    [K in keyof T]-?: [T[K] & {}] extends [Selection] ? Trues<T[K] & {}> : true
}>

export type Selected<T, K extends keyof T> = NonNullable<T[K]>

export type SelectionOf<T> = {
    [K in keyof T]?: T[K] extends object ? true | SelectionOf<T[K]> : true
}

export type PortalQuery = {
    fromBlock?: number
    toBlock?: number
    parentBlockHash?: string
    [key: string]: unknown
}

export type PortalBlock = {
    header: {
        number: number
        hash: string
    }
}

export function project<T, S extends keyof T>(obj: T, fields: Selector<S> | undefined): Partial<T> {
    let result = {} as Partial<T>
    if (fields == null) return result
    let key: keyof T
    for (key in obj) {
        if (!(fields[key] as boolean)) continue
        result[key] = obj[key]
    }
    return result
}

export type ObjectValidatorShape<T> = Simplify<{
    [K in keyof T as [T[K]] extends [undefined] ? never : K]-?: Validator<T[K], any>
}>
