import {
    ANY,
    ANY_OBJECT,
    array,
    B58,
    BIG_NAT,
    BOOLEAN,
    constant,
    NAT,
    nullable,
    object,
    oneOf,
    option,
    STRING,
    Validator,
    withDefault,
} from '@subsquid/util-internal-validation'
import {
    type Select,
    type Selector,
    type Trues,
    type Base58,
    type Hex,
    type Simplify,
    type PortalQuery,
    project,
    type ObjectValidatorShape,
    type Selected,
} from './common'

export type BlockHeaderFields = {
    hash: Base58
    number: number
    height: number
    parentNumber: number
    parentHash: Base58
    timestamp: number
}

export type TransactionFields = {
    /**
     * Transaction position in block
     */
    transactionIndex: number
    version: 'legacy' | number
    // transaction message
    accountKeys: Base58[]
    addressTableLookups: AddressTableLookup[]
    numReadonlySignedAccounts: number
    numReadonlyUnsignedAccounts: number
    numRequiredSignatures: number
    recentBlockhash: Base58
    signatures: Base58[]
    // meta fields
    err: null | object
    computeUnitsConsumed: bigint
    fee: bigint
    loadedAddresses?: {
        readonly: Base58[]
        writable: Base58[]
    }
    hasDroppedLogMessages: boolean
}

export type AddressTableLookup = {
    accountKey: Base58
    readonlyIndexes: number[]
    writableIndexes: number[]
}

export type InstructionFields = {
    transactionIndex: number
    instructionAddress: number[]
    programId: Base58
    accounts: Base58[]
    data: Base58
    // execution result extracted from logs
    computeUnitsConsumed?: bigint
    error?: unknown
    /**
     * `true` when transaction completed successfully, `false` otherwise
     */
    isCommitted: boolean
    hasDroppedLogMessages: boolean
}

export type LogMessageFields = {
    transactionIndex: number
    logIndex: number
    instructionAddress: number[]
    programId: Base58
    kind: 'log' | 'data' | 'other'
    message: string
}

export type BalanceFields = {
    transactionIndex: number
    account: Base58
    pre: bigint
    post: bigint
}

export type PreTokenBalanceFields = {
    transactionIndex: number
    account: Base58

    preProgramId?: Base58
    preMint: Base58
    preDecimals: number
    preOwner?: Base58
    preAmount: bigint

    postProgramId?: undefined
    postMint?: undefined
    postDecimals?: undefined
    postOwner?: undefined
    postAmount?: undefined
}

export type PostTokenBalanceFields = {
    transactionIndex: number
    account: Base58

    preProgramId?: undefined
    preMint?: undefined
    preDecimals?: undefined
    preOwner?: undefined
    preAmount?: undefined

    postProgramId?: Base58
    postMint: Base58
    postDecimals: number
    postOwner?: Base58
    postAmount: bigint
}

export type PrePostTokenBalanceFields = {
    transactionIndex: number
    account: Base58
    preProgramId?: Base58
    preMint: Base58
    preDecimals: number
    preOwner?: Base58
    preAmount: bigint
    postProgramId?: Base58
    postMint: Base58
    postDecimals: number
    postOwner?: Base58
    postAmount: bigint
}

export type TokenBalanceFields = PreTokenBalanceFields | PostTokenBalanceFields | PrePostTokenBalanceFields

export type RewardFields = {
    pubkey: Base58
    lamports: bigint
    postBalance: bigint
    rewardType?: string
    commission?: number
}

export type BlockHeaderFieldSelection = Selector<keyof BlockHeaderFields, 'number' | 'hash'>
export type BlockHeader<F extends BlockHeaderFieldSelection = Trues<BlockHeaderFieldSelection>> = Select<
    BlockHeaderFields,
    F
>

export type TransactionFieldSelection = Selector<keyof TransactionFields>
export type Transaction<F extends TransactionFieldSelection = Trues<TransactionFieldSelection>> = Select<
    TransactionFields,
    F
>

export type InstructionFieldSelection = Selector<keyof InstructionFields>
export type Instruction<F extends InstructionFieldSelection = Trues<InstructionFieldSelection>> = Select<
    InstructionFields,
    F
>

export type LogMessageFieldSelection = Selector<keyof LogMessageFields>
export type LogMessage<F extends LogMessageFieldSelection = Trues<LogMessageFieldSelection>> = Select<
    LogMessageFields,
    F
>

export type BalanceFieldSelection = Selector<keyof BalanceFields>
export type Balance<F extends BalanceFieldSelection = Trues<BalanceFieldSelection>> = Select<BalanceFields, F>

export type TokenBalanceFieldSelection = Selector<keyof TokenBalanceFields>
export type TokenBalance<F extends TokenBalanceFieldSelection = Trues<TokenBalanceFieldSelection>> = Select<
    {[K in keyof TokenBalanceFields]: TokenBalanceFields[K]},
    F
>

export type RewardFieldSelection = Selector<keyof RewardFields>
export type Reward<F extends RewardFieldSelection = Trues<RewardFieldSelection>> = Select<RewardFields, F>

export type FieldSelection = {
    block?: BlockHeaderFieldSelection
    transaction?: TransactionFieldSelection
    instruction?: InstructionFieldSelection
    log?: LogMessageFieldSelection
    balance?: BalanceFieldSelection
    tokenBalance?: TokenBalanceFieldSelection
    reward?: RewardFieldSelection
}

export type DataRequest = {
    includeAllBlocks?: boolean
    transactions?: TransactionRequest[]
    instructions?: InstructionRequest[]
    logs?: LogRequest[]
    balances?: BalanceRequest[]
    tokenBalances?: TokenBalanceRequest[]
    rewards?: RewardRequest[]
}

export type TransactionRequest = {
    feePayer?: Base58[]

    instructions?: boolean
    logs?: boolean
}

/**
 * Hex encoded prefix of instruction data
 */
export type Discriminator = Hex

export type InstructionRequest = {
    programId?: Base58[]
    discriminator?: Discriminator[]
    d0?: Discriminator[]
    d1?: Discriminator[]
    d2?: Discriminator[]
    d4?: Discriminator[]
    d8?: Discriminator[]
    a0?: Base58[]
    a1?: Base58[]
    a2?: Base58[]
    a3?: Base58[]
    a4?: Base58[]
    a5?: Base58[]
    a6?: Base58[]
    a7?: Base58[]
    a8?: Base58[]
    a9?: Base58[]
    isCommitted?: boolean

    transaction?: boolean
    transactionBalances?: boolean
    transactionTokenBalances?: boolean
    transactionInstructions?: boolean
    logs?: boolean
    innerInstructions?: boolean
}

export type LogRequest = {
    programId?: Base58[]
    kind?: LogMessageFields['kind'][]

    transaction?: boolean
    instruction?: boolean
}

export type BalanceRequest = {
    account?: Base58[]

    transaction?: boolean
    transactionInstructions?: boolean
}

export type TokenBalanceRequest = {
    account?: Base58[]
    preProgramId?: Base58[]
    postProgramId?: Base58[]
    preMint?: Base58[]
    postMint?: Base58[]
    preOwner?: Base58[]
    postOwner?: Base58[]

    transaction?: boolean
    transactionInstructions?: boolean
}

export type RewardRequest = {
    pubkey?: Base58[]
}

export type Query<F extends FieldSelection = FieldSelection> = Simplify<
    PortalQuery & {
        type: 'solana'
        fields: F
    } & DataRequest
>

export type Block<F extends FieldSelection> = Simplify<{
    header: BlockHeader<Selected<F, 'block'>>
    transactions: Transaction<Selected<F, 'transaction'>>[]
    instructions: Instruction<Selected<F, 'instruction'>>[]
    logs: LogMessage<Selected<F, 'log'>>[]
    balances: Balance<Selected<F, 'balance'>>[]
    tokenBalances: TokenBalance<Selected<F, 'tokenBalance'>>[]
    rewards: Reward<Selected<F, 'reward'>>[]
}>

export function getBlockSchema<F extends FieldSelection>(fields: F): Validator<Block<F>, unknown> {
    let header = object(project(BlockHeaderShape, {...fields.block, number: true, hash: true}))

    let transaction = object(project(TransactionShape, fields.transaction))

    let instruction = object(project(InstructionShape, fields.instruction))

    let balance = object(project(BalanceShape, fields.balance))

    let tokenBalance = oneOf({
        pre: object(project(PreTokenBalanceShape, fields.tokenBalance)),
        post: object(project(PostTokenBalanceShape, fields.tokenBalance)),
        prePost: object(project(PrePostTokenBalanceShape, fields.tokenBalance)),
    })

    let logMessage = object(project(LogMessageShape, fields.log))

    let reward = object(project(RewardShape, fields.reward))

    return object({
        header,
        transactions: withDefault([], array(transaction)),
        instructions: withDefault([], array(instruction)),
        logs: withDefault([], array(logMessage)),
        balances: withDefault([], array(balance)),
        tokenBalances: withDefault([], array(tokenBalance)),
        rewards: withDefault([], array(reward)),
    }) as Validator<Block<F>, unknown>
}

const BlockHeaderShape: ObjectValidatorShape<BlockHeaderFields> = {
    hash: B58,
    number: NAT,
    height: NAT,
    parentNumber: NAT,
    parentHash: B58,
    timestamp: NAT,
}

const AddressTableLookup: Validator<AddressTableLookup> = object({
    accountKey: B58,
    readonlyIndexes: array(NAT),
    writableIndexes: array(NAT),
})

const TransactionShape: ObjectValidatorShape<TransactionFields> = {
    transactionIndex: NAT,
    version: oneOf({legacy: constant('legacy'), versionNumber: NAT}),
    accountKeys: array(B58),
    addressTableLookups: array(AddressTableLookup),
    numReadonlySignedAccounts: NAT,
    numReadonlyUnsignedAccounts: NAT,
    numRequiredSignatures: NAT,
    recentBlockhash: B58,
    signatures: array(B58),
    err: nullable(ANY_OBJECT),
    computeUnitsConsumed: BIG_NAT,
    fee: BIG_NAT,
    loadedAddresses: option(object({readonly: array(B58), writable: array(B58)})),
    hasDroppedLogMessages: BOOLEAN,
}

const InstructionShape: ObjectValidatorShape<InstructionFields> = {
    transactionIndex: NAT,
    instructionAddress: array(NAT),
    programId: B58,
    accounts: array(B58),
    data: B58,
    computeUnitsConsumed: option(BIG_NAT),
    error: ANY,
    isCommitted: BOOLEAN,
    hasDroppedLogMessages: BOOLEAN,
}

const LogMessageShape: ObjectValidatorShape<LogMessageFields> = {
    transactionIndex: NAT,
    logIndex: NAT,
    instructionAddress: array(NAT),
    programId: B58,
    kind: oneOf({log: constant('log'), data: constant('data'), other: constant('other')}),
    message: STRING,
}

const BalanceShape: ObjectValidatorShape<BalanceFields> = {
    transactionIndex: NAT,
    account: B58,
    pre: BIG_NAT,
    post: BIG_NAT,
}

const PreTokenBalanceShape: ObjectValidatorShape<PreTokenBalanceFields> = {
    transactionIndex: NAT,
    account: B58,
    preProgramId: option(B58),
    preMint: B58,
    preDecimals: NAT,
    preOwner: option(B58),
    preAmount: BIG_NAT,
}

const PostTokenBalanceShape: ObjectValidatorShape<PostTokenBalanceFields> = {
    transactionIndex: NAT,
    account: B58,
    postProgramId: option(B58),
    postMint: B58,
    postDecimals: NAT,
    postOwner: option(B58),
    postAmount: BIG_NAT,
}

const PrePostTokenBalanceShape: ObjectValidatorShape<PrePostTokenBalanceFields> = {
    transactionIndex: NAT,
    account: B58,
    preProgramId: option(B58),
    preMint: B58,
    preDecimals: NAT,
    preOwner: option(B58),
    preAmount: BIG_NAT,
    postProgramId: option(B58),
    postMint: B58,
    postDecimals: NAT,
    postOwner: option(B58),
    postAmount: BIG_NAT,
}

const RewardShape: ObjectValidatorShape<RewardFields> = {
    pubkey: B58,
    lamports: BIG_NAT,
    postBalance: BIG_NAT,
    rewardType: option(STRING),
    commission: option(NAT),
}
