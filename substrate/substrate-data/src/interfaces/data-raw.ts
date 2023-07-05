import type {BlockData, Bytes} from '@subsquid/substrate-raw-data'
import {AccountId} from '../parsing/validator'


export interface RawBlock extends BlockData {
    validators?: AccountId[]
    session?: Bytes
}
