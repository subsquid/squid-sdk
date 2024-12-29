import {
    BchBlockHeader,
    BchTransaction
} from './bch.js'


type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


type Selector<Props extends string, Exclusion> = {
    [P in Exclude<Props, Exclusion>]?: boolean
}

export type BlockRequiredFields = 'height' | 'hash' | 'parentHash'
export type TransactionRequiredFields = 'transactionIndex'


export interface FieldSelection {
    block?: Selector<keyof BchBlockHeader, BlockRequiredFields>
    transaction?: Selector<keyof BchTransaction, TransactionRequiredFields>
}


export const DEFAULT_FIELDS = {
    block: {
        timestamp: true,
        size: true,
    },
    transaction: {
        hash: true,
        size: true,
        inputs: true,
        outputs: true,
        version: true,
        locktime: true,
    },
} as const


type DefaultFields = typeof DEFAULT_FIELDS


type ExcludeUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {}


type MergeDefault<T, D> = Simplify<
    undefined extends T ? D : Omit<D, keyof ExcludeUndefined<T>> & ExcludeUndefined<T>
>


type TrueFields<F> = keyof {
    [K in keyof F as true extends F[K] ? K : never]: true
}


type GetFields<F extends FieldSelection, P extends keyof DefaultFields>
    = TrueFields<MergeDefault<F[P], DefaultFields[P]>>


type Select<T, F> = T extends any ? Simplify<Pick<T, Extract<keyof T, F>>> : never


export type BlockHeader<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<BchBlockHeader, BlockRequiredFields> &
    Select<BchBlockHeader, GetFields<F, 'block'>>
>


export type Transaction<F extends FieldSelection = {}> = Simplify<
    {id: string} &
    Pick<BchTransaction, TransactionRequiredFields> &
    Select<BchTransaction, GetFields<F, 'transaction'>> &
    {
        block: BlockHeader<F>
    }
>

type RemovePrefix<Prefix extends string, T>
    = T extends `${Prefix}${infer S}`
        ? Uncapitalize<S>
        : never




type RemoveEmptyObjects<T> = {
    [K in keyof T as {} extends T[K] ? never : K]: T[K]
}




export type BlockData<F extends FieldSelection = {}> = {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
}


export type AllFields = {
    block: Trues<FieldSelection['block']>
    transaction: Trues<FieldSelection['transaction']>
}


type Trues<T> = {
    [K in keyof Exclude<T, undefined>]-?: true
}
