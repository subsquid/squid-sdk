import type {BlockData, Bytes} from '@subsquid/substrate-raw-data'
import {AccountId} from '../parsing/validator'
import {Runtime} from '../runtime'


export interface RawBlock extends BlockData {
    validators?: AccountId[]
    session?: Bytes
    runtime?: Runtime
}
