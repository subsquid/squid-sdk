import {
    object,
    array,
    STRING,
    NAT,
    nullable,
    GetSrcType,
    BYTES,
    tuple,
    oneOf,
    constant,
    option,
    ANY
} from '@subsquid/util-internal-validation'


export const Signature = object({
    r: BYTES,
    s: BYTES,
    v: NAT,
})


export type Signature = GetSrcType<typeof Signature>


export const Action = object({
    type: STRING,
})


export type Action = GetSrcType<typeof Action>


export const SignedAction = object({
    signature: Signature,
    action: Action,
    nonce: NAT,
    vaultAddress: option(BYTES),
})


export type SignedAction = GetSrcType<typeof SignedAction>


export const SignedActions = object({
    signed_actions: array(SignedAction),
})


export type SignedActions = GetSrcType<typeof SignedActions>


export const HardforkInfo = object({
    version: NAT,
    round: NAT,
})


export type HardforkInfo = GetSrcType<typeof HardforkInfo>


export const AbciBlock = object({
    time: STRING,
    round: NAT,
    parent_round: NAT,
    proposer: BYTES,
    signed_action_bundles: array(tuple(BYTES, SignedActions)), // (BundleHash, BundleData)
    hardfork: HardforkInfo,
})


export type AbciBlock = GetSrcType<typeof AbciBlock>


export const Status = oneOf({
    ok: constant('ok'),
    err: constant('err'),
})


export type Status = GetSrcType<typeof Status>


export const ActionResponse = object({
    status: Status,
    response: ANY,
})


export type ActionResponse = GetSrcType<typeof ActionResponse>


export const Response = object({
    user: nullable(BYTES),
    res: ActionResponse,
})


export type Response = GetSrcType<typeof Response>


export const FullResponse = object({
    Full: array(tuple(BYTES, array(Response))), // (BundleHash, BundleResponses)
})


export type FullResponse = GetSrcType<typeof FullResponse>


export const ReplicaBlock = object({
    abci_block: AbciBlock,
    resps: FullResponse,
})


export type ReplicaBlock = GetSrcType<typeof ReplicaBlock>


export interface Block {
    height: number
    block: ReplicaBlock
}
