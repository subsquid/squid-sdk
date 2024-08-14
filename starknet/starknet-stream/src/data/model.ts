import type * as data from '@subsquid/starknet-normalization'
import type {GetFields, Select, Selector, Simplify, TrueFields} from './util'
import type {
    BlockRequiredFields,
    EventRequiredFields,
    TransactionRequiredFields
} from './data-partial'

export type FELT = string


export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    transaction?: Selector<Exclude<keyof data.Transaction, TransactionRequiredFields>>
    event?: Selector<Exclude<keyof data.Event, EventRequiredFields> | 'keys'>
}

export const DEFAULT_FIELDS = {
    block: {
        timestamp: true
    },
    transaction: {},
    event: {}
} as const

type Item<
    Data,
    RequiredFields extends keyof Data,
    F extends FieldSelection,
    K extends keyof FieldSelection
> = Simplify<
    Pick<Data, RequiredFields> &
    Select<Data, GetFields<FieldSelection, typeof DEFAULT_FIELDS, F, K>>
>

export type BlockHeader<F extends FieldSelection = {}> = Item<
    data.BlockHeader,
    BlockRequiredFields,
    F,
    'block'
>

export type Transaction<F extends FieldSelection = {}> = Item<
    data.Transaction,
    TransactionRequiredFields,
    F,
    'transaction'
>

export type Event<F extends FieldSelection = {}> = Item<
    data.Event,
    EventRequiredFields | 'key0' | 'key1' | 'key2' | 'key3' | 'restKeys',
    F,
    'event'
>

export interface Block<F extends FieldSelection = {}> {
    header: BlockHeader<F>
    transactions: Transaction<F>[]
    events: Event<F>[]
}
