import { GetSrcType, object, STRING, ANY_INT, INT, array, option, QTY } from '@subsquid/util-internal-validation'

const FELT = STRING
type FELT = GetSrcType<typeof FELT>

const Hash32 = FELT
type Hash32 = GetSrcType<typeof Hash32>

const Qty = STRING
type Qty = GetSrcType<typeof Qty>

const ResourcePrice = object({
    price_in_fri: FELT,
    price_in_wei: FELT
})
type ResourcePrice = GetSrcType<typeof ResourcePrice>

const ResourceBounds = object({
    max_amount: QTY,
    max_price_per_unit: QTY
})
type ResourceBounds = GetSrcType<typeof ResourceBounds>

const ResourceBoundsMap = object({
    l1_gas: ResourceBounds,
    l1_data_gas: option(ResourceBounds),
    l2_gas: ResourceBounds
})
type ResourceBoundsMap = GetSrcType<typeof ResourceBoundsMap>

const ActualFee = object({
    amount: Qty,
    unit: STRING
})
type ActualFee = GetSrcType<typeof ActualFee>

const MessageToL1 = object({
    from_address: FELT,
    to_address: FELT,
    payload: array(FELT)
})
type MessageToL1 = GetSrcType<typeof MessageToL1>

const EventContent = object({
    from_address: FELT,
    keys: array(FELT),
    data: array(FELT)
})
type EventContent = GetSrcType<typeof EventContent>

const DataAvailability = object({
    l1_gas: INT,
    l1_data_gas: INT,
})
type DataAvailability = GetSrcType<typeof DataAvailability>

const ExecutionResources = object({
    data_availability: DataAvailability,
    steps: INT,
    memory_holes: option(INT),
    range_check_builtin_applications: option(INT),
    pedersen_builtin_applications: option(INT),
    poseidon_builtin_applications: option(INT),
    ec_op_builtin_applications: option(INT),
    ecdsa_builtin_applications: option(INT),
    bitwise_builtin_applications: option(INT),
    keccak_builtin_applications: option(INT),
    segment_arena_builtin: option(INT)
})
type ExecutionResources = GetSrcType<typeof ExecutionResources>

const Transaction = object({
    contract_address: option(FELT),
    entry_point_selector: option(FELT),
    calldata: option(array(FELT)),
    max_fee: option(FELT),
    version: STRING,
    signature: option(array(FELT)),
    nonce: option(FELT),
    type: STRING,
    sender_address: option(FELT),
    class_hash: option(Hash32),
    compiled_class_hash: option(Hash32),
    contract_address_salt: option(FELT),
    constructor_calldata: option(array(STRING)),
    resource_bounds: option(ResourceBoundsMap),
    tip: option(FELT),
    paymaster_data: option(array(FELT)),
    account_deployment_data: option(array(FELT)),
    nonce_data_availability_mode: option(STRING),
    fee_data_availability_mode: option(STRING)
})
type Transaction = GetSrcType<typeof Transaction>

const Receipt = object({
    transaction_hash: Hash32,
    actual_fee: ActualFee,
    execution_status: option(STRING),
    finality_status: STRING,
    messages_sent: array(MessageToL1),
    revert_reason: option(STRING),
    events: array(EventContent),
    execution_resources: ExecutionResources,
    type: STRING,
    contract_address: option(FELT),
    message_hash: option(Hash32)
})
type Receipt = GetSrcType<typeof Receipt>

const PackedTransaction = object({
    transaction: Transaction,
    receipt: Receipt
})
type PackedTransaction = GetSrcType<typeof PackedTransaction>

const Event = object({
    block_number: INT,
    block_hash: Hash32,
    transaction_hash: Hash32,
    from_address: FELT,
    keys: array(FELT),
    data: array(FELT)
})
type Event = GetSrcType<typeof Event>

const Block = object({
    status: STRING,
    block_hash: Hash32,
    parent_hash: Hash32,
    block_number: INT,
    new_root: Hash32,
    timestamp: INT,
    sequencer_address: FELT,
    l1_gas_price: option(ResourcePrice),
    l2_gas_price: option(ResourcePrice),
    l1_data_gas_price: option(ResourcePrice),
    l1_da_mode: STRING,
    starknet_version: STRING,
    transactions: array(PackedTransaction)
})
type Block = GetSrcType<typeof Block>

const BlockWithTxHashes = object({
    status: STRING,
    block_hash: Hash32,
    parent_hash: Hash32,
    block_number: INT,
    new_root: Hash32,
    timestamp: INT,
    sequencer_address: FELT,
    l1_gas_price: ResourcePrice,
    l2_gas_price: option(ResourcePrice),
    l1_data_gas_price: ResourcePrice,
    l1_da_mode: STRING,
    starknet_version: STRING,
    transactions: array(Hash32)
})
type BlockWithTxHashes = GetSrcType<typeof BlockWithTxHashes>

const EventPage = object({
    events: array(Event),
    continuation_token: option(STRING)
})
type EventPage = GetSrcType<typeof EventPage>

export {
    FELT,
    Hash32,
    Qty,
    ResourcePrice,
    ResourceBounds,
    ResourceBoundsMap,
    ActualFee,
    MessageToL1,
    EventContent,
    ExecutionResources,
    Transaction,
    Receipt,
    PackedTransaction,
    Event,
    Block,
    BlockWithTxHashes,
    EventPage
}
