import { Input, Output, TransactionCommon } from '@bitauth/libauth'
import {Bytes32} from './base.js'


export interface BchBlockHeader {
    height: number
    hash: Bytes32
    parentHash: Bytes32
    nonce: number
    difficulty: number
    size: number
    timestamp: number
}

type TransactionBCH = TransactionCommon<Input<string,string>, Output<string,string,bigint>>

export type OutputWithAddress = TransactionBCH["outputs"][0] & { address: string }

export interface BchTransaction extends TransactionBCH {
    hash: string
    transactionIndex: number
    size: number
    outputs: OutputWithAddress[]
    sourceOutputs: OutputWithAddress[]
    fee: number
}
