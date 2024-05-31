import {
    array,
    constant,
    GetSrcType,
    INT,
    object,
    BYTES,
    taggedUnion,
    nullable,
    STRING,
    STRING_NAT,
    BOOLEAN,
    oneOf,
    option,
    BIG_NAT
} from '@subsquid/util-internal-validation'


export const LatestBlockHeight = object({
    chain: object({
        latestBlock: object({
            header: object({
                height: STRING_NAT,
            })
        })
    })
})


export type LatestBlockHeight = GetSrcType<typeof LatestBlockHeight>


export const GetBlockHash = object({
    block: option(object({
        id: STRING
    }))
})


export type GetBlockHash = GetSrcType<typeof GetBlockHash>


export const BlockHeader = object({
    id: BYTES,
    height: STRING_NAT,
    daHeight: BIG_NAT,
    transactionsRoot: BYTES,
    transactionsCount: STRING_NAT,
    messageReceiptCount: STRING_NAT,
    prevRoot: BYTES,
    time: BIG_NAT,
    applicationHash: BYTES,
    consensusParametersVersion: STRING_NAT,
    stateTransitionBytecodeVersion: STRING_NAT,
    eventInboxRoot: BYTES,
    messageOutboxRoot: BYTES,
})


export type BlockHeader = GetSrcType<typeof BlockHeader>


export const GetBlockHeader = object({
    block: option(object({
        header: BlockHeader
    }))
})


export type GetBlockHeader = GetSrcType<typeof GetBlockHeader>


export const TransactionInput = taggedUnion('__typename', {
    InputCoin: object({
        utxoId: BYTES,
        owner: BYTES,
        amount: BIG_NAT,
        assetId: BYTES,
        txPointer: STRING,
        witnessIndex: INT,
        predicateGasUsed: BIG_NAT,
        predicate: BYTES,
        predicateData: BYTES,
    }),
    InputContract: object({
        utxoId: BYTES,
        balanceRoot: BYTES,
        stateRoot: BYTES,
        txPointer: STRING,
        contractId: BYTES,
    }),
    InputMessage: object({
        sender: BYTES,
        recipient: BYTES,
        amount: BIG_NAT,
        nonce: BYTES,
        witnessIndex: STRING_NAT,
        predicateGasUsed: BIG_NAT,
        data: BYTES,
        predicate: BYTES,
        predicateData: BYTES,
    }),
})


export type TransactionInput = GetSrcType<typeof TransactionInput>


export const TransactionOutput = taggedUnion('__typename', {
    CoinOutput: object({
        to: BYTES,
        amount: BIG_NAT,
        assetId: BYTES,
    }),
    ContractOutput: object({
        inputIndex: STRING_NAT,
        balanceRoot: BYTES,
        stateRoot: BYTES,
    }),
    ChangeOutput: object({
        to: BYTES,
        amount: BIG_NAT,
        assetId: BYTES,
    }),
    VariableOutput: object({
        to: BYTES,
        amount: BIG_NAT,
        assetId: BYTES,
    }),
    ContractCreated: object({
        contract: BYTES,
        stateRoot: BYTES,
    }),
})


export type TransactionOutput = GetSrcType<typeof TransactionOutput>


export const Receipt = object({
    id: nullable(BYTES),
    pc: nullable(BIG_NAT),
    is: nullable(BIG_NAT),
    to: nullable(BYTES),
    toAddress: nullable(BYTES),
    amount: nullable(BIG_NAT),
    assetId: nullable(BYTES),
    gas: nullable(BIG_NAT),
    param1: nullable(BIG_NAT),
    param2: nullable(BIG_NAT),
    val: nullable(BIG_NAT),
    ptr: nullable(BIG_NAT),
    digest: nullable(BYTES),
    reason: nullable(BIG_NAT),
    ra: nullable(BIG_NAT),
    rb: nullable(BIG_NAT),
    rc: nullable(BIG_NAT),
    rd: nullable(BIG_NAT),
    len: nullable(BIG_NAT),
    receiptType: oneOf({
        CALL: constant('CALL'),
        RETURN: constant('RETURN'),
        RETURN_DATA: constant('RETURN_DATA'),
        PANIC: constant('PANIC'),
        REVERT: constant('REVERT'),
        LOG: constant('LOG'),
        LOG_DATA: constant('LOG_DATA'),
        TRANSFER: constant('TRANSFER'),
        TRANSFER_OUT: constant('TRANSFER_OUT'),
        SCRIPT_RESULT: constant('SCRIPT_RESULT'),
        MESSAGE_OUT: constant('MESSAGE_OUT'),
        MINT: constant('MINT'),
        BURN: constant('BURN'),
    }),
    result: nullable(BIG_NAT),
    gasUsed: nullable(BIG_NAT),
    data: nullable(BYTES),
    sender: nullable(BYTES),
    recipient: nullable(BYTES),
    nonce: nullable(BYTES),
    contractId: nullable(BYTES),
    subId: nullable(BYTES),
})


export type Receipt = GetSrcType<typeof Receipt>


export const TransactionStatus = taggedUnion('__typename', {
    SubmittedStatus: object({time: BIG_NAT}),
    SuccessStatus: object({
        transactionId: BYTES,
        time: BIG_NAT,
        programState: nullable(object({
            returnType: oneOf({
                return: constant('RETURN'),
                returnData: constant('RETURN_DATA'),
                revert: constant('REVERT'),
            }),
            data: BYTES,
        })),
        receipts: option(array(Receipt)),
        totalGas: BIG_NAT,
        totalFee: BIG_NAT,
    }),
    SqueezedOutStatus: object({reason: STRING}),
    FailureStatus: object({
        transactionId: BYTES,
        time: BIG_NAT,
        reason: STRING,
        programState: nullable(object({
            returnType: oneOf({
                RETURN: constant('RETURN'),
                RETURN_DATA: constant('RETURN_DATA'),
                REVERT: constant('REVERT'),
            }),
            data: BYTES,
        })),
        receipts: option(array(Receipt)),
        totalGas: BIG_NAT,
        totalFee: BIG_NAT,
    })
})


export type TransactionStatus = GetSrcType<typeof TransactionStatus>


export const Policies = object({
    tip: nullable(BIG_NAT),
    witnessLimit: nullable(BIG_NAT),
    maturity: nullable(STRING_NAT),
    maxFee: nullable(BIG_NAT),
})


export type Policies = GetSrcType<typeof Policies>


export const UpgradePurpose = taggedUnion('__typename', {
    ConsensusParametersPurpose: object({
        witnessIndex: STRING_NAT,
        checksum: BYTES,
    }),
    StateTransitionPurpose: object({
        root: BYTES,
    }),
})


export type UpgradePurpose = GetSrcType<typeof UpgradePurpose>


export const Transaction = object({
    id: BYTES,
    inputAssetIds: nullable(array(BYTES)),
    inputContracts: nullable(array(BYTES)),
    inputContract: nullable(object({
        utxoId: BYTES,
        balanceRoot: BYTES,
        stateRoot: BYTES,
        txPointer: STRING,
        contractId: BYTES
    })),
    policies: nullable(Policies),
    scriptGasLimit: nullable(BIG_NAT),
    maturity: nullable(STRING_NAT),
    mintAmount: nullable(BIG_NAT),
    mintAssetId: nullable(BYTES),
    mintGasPrice: nullable(BIG_NAT),
    txPointer: nullable(STRING),
    isScript: BOOLEAN,
    isCreate: BOOLEAN,
    isMint: BOOLEAN,
    isUpgrade: BOOLEAN,
    isUpload: BOOLEAN,
    inputs: option(array(TransactionInput)),
    outputs: option(array(TransactionOutput)),
    outputContract: nullable(object({
        inputIndex: STRING_NAT,
        balanceRoot: BYTES,
        stateRoot: BYTES,
    })),
    witnesses: nullable(array(BYTES)),
    receiptsRoot: nullable(BYTES),
    status: TransactionStatus,
    script: nullable(BYTES),
    scriptData: nullable(BYTES),
    salt: nullable(BYTES),
    storageSlots: nullable(array(BYTES)),
    rawPayload: nullable(BYTES),
    bytecodeWitnessIndex: nullable(STRING_NAT),
    bytecodeRoot: nullable(BYTES),
    subsectionIndex: nullable(STRING_NAT),
    subsectionsNumber: nullable(STRING_NAT),
    proofSet: nullable(array(BYTES)),
    upgradePurpose: nullable(UpgradePurpose),
})


export type Transaction = GetSrcType<typeof Transaction>


export const Block = object({
    header: BlockHeader,
    transactions: array(Transaction),
})


export type Block = GetSrcType<typeof Block>


export const Blocks = object({
    blocks: object({
        nodes: array(Block),
    }),
})


export type Blocks = GetSrcType<typeof Blocks>


export interface BlockData {
    hash: string
    height: number
    block: Block
}


export interface DataRequest {
    transactions?: boolean
    inputs?: boolean
    outputs?: boolean
    receipts?: boolean
}
