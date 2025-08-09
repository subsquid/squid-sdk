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

export type Distribute<T> = T extends any ? T : never

export type ConditionalKeys<T, V> = {
    [Key in keyof T]-?: T[Key] extends V ? (T[Key] extends never ? (V extends never ? Key : never) : Key) : never
}[keyof T]

export type ConditionalPick<T, V> = Simplify<Pick<T, ConditionalKeys<T, V>>>

export type ConditionalOmit<T, V> = Simplify<Omit<T, ConditionalKeys<T, V>>>

export type Selector<Props extends string | number | symbol = string> = {
    [P in Props]?: boolean
}

export type Select<T, S> = S extends never
    ? never
    : {
          [K in keyof T as K extends keyof S ? (S[K] extends true ? K : never) : never]: T[K]
      }

export type Selection = {
    [P in string]?: boolean | Selection
}

export type Trues<T extends Selection> = Simplify<{
    [K in keyof T]-?: [T[K] & {}] extends [Selection] ? Trues<T[K] & {}> : true
}>

export type PortalQuery = {
    type: string
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
