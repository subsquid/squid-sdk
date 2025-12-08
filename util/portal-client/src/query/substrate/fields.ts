import type {GetFields, Select, Selector, Simplify} from '../type-util'
import type * as data from './data'

type BlockRequiredFields = 'number' | 'hash'

export interface FieldSelection {
    block?: Selector<Exclude<keyof data.BlockHeader, BlockRequiredFields>>
    extrinsic?: Selector<keyof data.Extrinsic>
    call?: Selector<keyof data.Call>
    event?: Selector<keyof data.Event>
}

export type BlockHeader<F extends FieldSelection> = Simplify<
    Pick<data.BlockHeader, BlockRequiredFields> & Select<data.BlockHeader, GetFields<F['block']>>
>

type Item<T, F extends FieldSelection, K extends keyof F> = Select<T, GetFields<F[K]>>

export type Extrinsic<F extends FieldSelection> = Item<data.Extrinsic, F, 'extrinsic'>

export type Call<F extends FieldSelection> = Item<data.Call, F, 'call'>

export type Event<F extends FieldSelection> = Item<data.Event, F, 'event'>

export interface Block<F extends FieldSelection> {
    header: BlockHeader<F>
    extrinsics: Extrinsic<F>[]
    calls: Call<F>[]
    events: Event<F>[]
}
