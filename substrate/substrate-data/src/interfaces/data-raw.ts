import type {BlockData, Bytes} from '@subsquid/substrate-data-raw'
import {AccountId} from '../parsing/validator'
import {Runtime} from '../runtime'


export interface RawBlock extends BlockData {
    validators?: AccountId[]
    session?: Bytes
    runtime?: Runtime
    runtimeOfPreviousBlock?: Runtime
}
