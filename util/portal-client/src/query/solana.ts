import type {Select, Selector, Trues, Base58, Base64, Simplify, PortalBlock, PortalQuery} from './common'

export type BlockHeaderFields = {
    hash: Base58
    number: number
    height: number
    parentSlot: number
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
    loadedAddresses: {
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
    error?: string
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
    message: Base64
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

export type BlockHeaderFieldSelection = Simplify<Selector<keyof BlockHeaderFields> & {number: true}>
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
export type Discriminator = string & {}

export type InstructionRequest = {
    programId?: Base58[]
    d1?: Discriminator[]
    d2?: Discriminator[]
    d3?: Discriminator[]
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

export type Query = Simplify<
    PortalQuery & {
        type: 'solana'
        fields: FieldSelection
    } & DataRequest
>

export type Block<F extends FieldSelection> = Simplify<{
    header: BlockHeader<F['block'] & {}>
    transactions?: Transaction<F['transaction'] & {}>[]
    instructions?: Instruction<F['instruction'] & {}>[]
    logs?: LogMessage<F['log'] & {}>[]
    balances?: Balance<F['balance'] & {}>[]
    tokenBalances?: TokenBalance<F['tokenBalance'] & {}>[]
    rewards?: Reward<F['reward'] & {}>[]
}>
