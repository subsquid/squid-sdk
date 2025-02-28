import { GetSrcType, object, STRING, INT, array, nullable } from '@subsquid/util-internal-validation'

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
    max_amount: Qty,
    max_price_per_unit: Qty
})
type ResourceBounds = GetSrcType<typeof ResourceBounds>

const ResourceBoundsMap = object({
    l1_gas: ResourceBounds,
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

const ExecutionResources = object({
    steps: INT,
    memory_holes: INT,
    range_check_builtin_applications: INT,
    pedersen_builtin_applications: INT,
    poseidon_builtin_applications: INT,
    ec_op_builtin_applications: INT,
    ecdsa_builtin_applications: INT,
    bitwise_builtin_applications: INT,
    keccak_builtin_applications: INT,
    segment_arena_builtin: INT
})
type ExecutionResources = GetSrcType<typeof ExecutionResources>

const Transaction = object({
    transaction_hash: Hash32,
    contract_address: nullable(FELT),
    entry_point_selector: nullable(FELT),
    calldata: nullable(array(FELT)),
    max_fee: nullable(FELT),
    version: STRING,
    signature: nullable(array(FELT)),
    nonce: nullable(FELT),
    type: STRING,
    sender_address: nullable(FELT),
    class_hash: nullable(Hash32),
    compiled_class_hash: nullable(Hash32),
    contract_address_salt: nullable(FELT),
    constructor_calldata: nullable(array(STRING)),
    resource_bounds: nullable(ResourceBoundsMap),
    tip: nullable(FELT),
    paymaster_data: nullable(array(FELT)),
    account_deployment_data: nullable(array(FELT)),
    nonce_data_availability_mode: nullable(STRING),
    fee_data_availability_mode: nullable(STRING)
})
type Transaction = GetSrcType<typeof Transaction>

const Receipt = object({
    transaction_hash: Hash32,
    actual_fee: ActualFee,
    execution_status: STRING,
    finality_status: STRING,
    block_hash: Hash32,
    block_number: INT,
    messages_sent: array(MessageToL1),
    revert_reason: nullable(STRING),
    events: array(EventContent),
    execution_resources: ExecutionResources,
    type: STRING,
    contract_address: nullable(FELT),
    message_hash: nullable(Hash32)
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
    block_number: INT,
    block_hash: Hash32,
    parent_hash: Hash32,
    status: STRING,
    new_root: Hash32,
    timestamp: INT,
    sequencer_address: FELT,
    transactions: array(PackedTransaction),
    starknet_version: STRING,
    l1_gas_price: ResourcePrice,
    events: nullable(array(Event))
})
type Block = GetSrcType<typeof Block>

const EventPage = object({
    events: array(Event),
    continuation_token: nullable(STRING)
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
    Event,
    Block,
    EventPage
}
