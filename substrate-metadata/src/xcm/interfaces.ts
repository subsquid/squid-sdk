import type {Result} from './support'

export type VersionedXcm = VersionedXcm_V0 | VersionedXcm_V1 | VersionedXcm_V2

export interface VersionedXcm_V0 {
  __kind: 'V0'
  value: XcmV0
}

export interface VersionedXcm_V1 {
  __kind: 'V1'
  value: XcmV1
}

export interface VersionedXcm_V2 {
  __kind: 'V2'
  value: XcmV2
}

export type XcmV0 = XcmV0_WithdrawAsset | XcmV0_ReserveAssetDeposit | XcmV0_ReceiveTeleportedAsset | XcmV0_QueryResponse | XcmV0_TransferAsset | XcmV0_TransferReserveAsset | XcmV0_Transact | XcmV0_HrmpNewChannelOpenRequest | XcmV0_HrmpChannelAccepted | XcmV0_HrmpChannelClosing | XcmV0_RelayedFrom

export interface XcmV0_WithdrawAsset {
  __kind: 'WithdrawAsset'
  assets: MultiAssetV0[]
  effects: XcmOrderV0[]
}

export interface XcmV0_ReserveAssetDeposit {
  __kind: 'ReserveAssetDeposit'
  assets: MultiAssetV0[]
  effects: XcmOrderV0[]
}

export interface XcmV0_ReceiveTeleportedAsset {
  __kind: 'ReceiveTeleportedAsset'
  assets: MultiAssetV0[]
  effects: XcmOrderV0[]
}

export interface XcmV0_QueryResponse {
  __kind: 'QueryResponse'
  queryId: bigint
  response: ResponseV0
}

export interface XcmV0_TransferAsset {
  __kind: 'TransferAsset'
  assets: MultiAssetV0[]
  dest: MultiLocationV0
}

export interface XcmV0_TransferReserveAsset {
  __kind: 'TransferReserveAsset'
  assets: MultiAssetV0[]
  dest: MultiLocationV0
  effects: XcmOrderV0[]
}

export interface XcmV0_Transact {
  __kind: 'Transact'
  originType: OriginKindV0
  requireWeightAtMost: bigint
  call: Uint8Array
}

export interface XcmV0_HrmpNewChannelOpenRequest {
  __kind: 'HrmpNewChannelOpenRequest'
  sender: number
  maxMessageSize: number
  maxCapacity: number
}

export interface XcmV0_HrmpChannelAccepted {
  __kind: 'HrmpChannelAccepted'
  recipient: number
}

export interface XcmV0_HrmpChannelClosing {
  __kind: 'HrmpChannelClosing'
  initiator: number
  sender: number
  recipient: number
}

export interface XcmV0_RelayedFrom {
  __kind: 'RelayedFrom'
  who: MultiLocationV0
  message: XcmV0
}

export type XcmV1 = XcmV1_WithdrawAsset | XcmV1_ReserveAssetDeposit | XcmV1_ReceiveTeleportedAsset | XcmV1_QueryResponse | XcmV1_TransferAsset | XcmV1_TransferReserveAsset | XcmV1_Transact | XcmV1_HrmpNewChannelOpenRequest | XcmV1_HrmpChannelAccepted | XcmV1_HrmpChannelClosing | XcmV1_RelayedFrom

export interface XcmV1_WithdrawAsset {
  __kind: 'WithdrawAsset'
  assets: MultiAssetsV1
  effects: XcmOrderV1[]
}

export interface XcmV1_ReserveAssetDeposit {
  __kind: 'ReserveAssetDeposit'
  assets: MultiAssetsV1
  effects: XcmOrderV1[]
}

export interface XcmV1_ReceiveTeleportedAsset {
  __kind: 'ReceiveTeleportedAsset'
  assets: MultiAssetsV1
  effects: XcmOrderV1[]
}

export interface XcmV1_QueryResponse {
  __kind: 'QueryResponse'
  queryId: bigint
  response: ResponseV1
}

export interface XcmV1_TransferAsset {
  __kind: 'TransferAsset'
  assets: MultiAssetsV1
  dest: MultiLocationV1
}

export interface XcmV1_TransferReserveAsset {
  __kind: 'TransferReserveAsset'
  assets: MultiAssetsV1
  dest: MultiLocationV1
  effects: XcmOrderV1[]
}

export interface XcmV1_Transact {
  __kind: 'Transact'
  originType: OriginKindV0
  requireWeightAtMost: bigint
  call: Uint8Array
}

export interface XcmV1_HrmpNewChannelOpenRequest {
  __kind: 'HrmpNewChannelOpenRequest'
  sender: number
  maxMessageSize: number
  maxCapacity: number
}

export interface XcmV1_HrmpChannelAccepted {
  __kind: 'HrmpChannelAccepted'
  recipient: number
}

export interface XcmV1_HrmpChannelClosing {
  __kind: 'HrmpChannelClosing'
  initiator: number
  sender: number
  recipient: number
}

export interface XcmV1_RelayedFrom {
  __kind: 'RelayedFrom'
  who: MultiLocationV1
  message: XcmV1
}

export type InstructionV2 = InstructionV2_WithdrawAsset | InstructionV2_ReserveAssetDeposited | InstructionV2_ReceiveTeleportedAsset | InstructionV2_QueryResponse | InstructionV2_TransferAsset | InstructionV2_TransferReserveAsset | InstructionV2_Transact | InstructionV2_HrmpNewChannelOpenRequest | InstructionV2_HrmpChannelAccepted | InstructionV2_HrmpChannelClosing | InstructionV2_ClearOrigin | InstructionV2_DescendOrigin | InstructionV2_ReportError | InstructionV2_DepositAsset | InstructionV2_DepositReserveAsset | InstructionV2_ExchangeAsset | InstructionV2_InitiateReserveWithdraw | InstructionV2_InitiateTeleport | InstructionV2_QueryHolding | InstructionV2_BuyExecution | InstructionV2_RefundSurplus | InstructionV2_SetErrorHandler | InstructionV2_SetAppendix | InstructionV2_ClearError | InstructionV2_ClaimAsset | InstructionV2_Trap

export interface InstructionV2_WithdrawAsset {
  __kind: 'WithdrawAsset'
  value: MultiAssetsV1
}

export interface InstructionV2_ReserveAssetDeposited {
  __kind: 'ReserveAssetDeposited'
  value: MultiAssetsV1
}

export interface InstructionV2_ReceiveTeleportedAsset {
  __kind: 'ReceiveTeleportedAsset'
  value: MultiAssetsV1
}

export interface InstructionV2_QueryResponse {
  __kind: 'QueryResponse'
  queryId: bigint
  response: ResponseV2
  maxWeight: bigint
}

export interface InstructionV2_TransferAsset {
  __kind: 'TransferAsset'
  assets: MultiAssetsV1
  beneficiary: MultiLocationV1
}

export interface InstructionV2_TransferReserveAsset {
  __kind: 'TransferReserveAsset'
  assets: MultiAssetsV1
  dest: MultiLocationV1
  xcm: XcmV2
}

export interface InstructionV2_Transact {
  __kind: 'Transact'
  originType: OriginKindV0
  requireWeightAtMost: bigint
  call: Uint8Array
}

export interface InstructionV2_HrmpNewChannelOpenRequest {
  __kind: 'HrmpNewChannelOpenRequest'
  sender: number
  maxMessageSize: number
  maxCapacity: number
}

export interface InstructionV2_HrmpChannelAccepted {
  __kind: 'HrmpChannelAccepted'
  recipient: number
}

export interface InstructionV2_HrmpChannelClosing {
  __kind: 'HrmpChannelClosing'
  initiator: number
  sender: number
  recipient: number
}

export interface InstructionV2_ClearOrigin {
  __kind: 'ClearOrigin'
  value: null
}

export interface InstructionV2_DescendOrigin {
  __kind: 'DescendOrigin'
  value: JunctionsV1
}

export interface InstructionV2_ReportError {
  __kind: 'ReportError'
  queryId: bigint
  dest: MultiLocationV1
  maxResponseWeight: bigint
}

export interface InstructionV2_DepositAsset {
  __kind: 'DepositAsset'
  assets: MultiAssetFilterV1
  maxAssets: number
  beneficiary: MultiLocationV1
}

export interface InstructionV2_DepositReserveAsset {
  __kind: 'DepositReserveAsset'
  assets: MultiAssetFilterV1
  maxAssets: number
  dest: MultiLocationV1
  xcm: XcmV2
}

export interface InstructionV2_ExchangeAsset {
  __kind: 'ExchangeAsset'
  give: MultiAssetFilterV1
  receive: MultiAssetsV1
}

export interface InstructionV2_InitiateReserveWithdraw {
  __kind: 'InitiateReserveWithdraw'
  assets: MultiAssetFilterV1
  reserve: MultiLocationV1
  xcm: XcmV2
}

export interface InstructionV2_InitiateTeleport {
  __kind: 'InitiateTeleport'
  assets: MultiAssetFilterV1
  dest: MultiLocationV1
  xcm: XcmV2
}

export interface InstructionV2_QueryHolding {
  __kind: 'QueryHolding'
  queryId: bigint
  dest: MultiLocationV1
  assets: MultiAssetFilterV1
  maxResponseWeight: bigint
}

export interface InstructionV2_BuyExecution {
  __kind: 'BuyExecution'
  fees: MultiAssetV1
  weightLimit: WeightLimitV2
}

export interface InstructionV2_RefundSurplus {
  __kind: 'RefundSurplus'
  value: null
}

export interface InstructionV2_SetErrorHandler {
  __kind: 'SetErrorHandler'
  value: XcmV2
}

export interface InstructionV2_SetAppendix {
  __kind: 'SetAppendix'
  value: XcmV2
}

export interface InstructionV2_ClearError {
  __kind: 'ClearError'
  value: null
}

export interface InstructionV2_ClaimAsset {
  __kind: 'ClaimAsset'
  assets: MultiAssetsV1
  ticket: MultiLocationV1
}

export interface InstructionV2_Trap {
  __kind: 'Trap'
  value: bigint
}

export type XcmV2 = InstructionV2[]

export type MultiAssetV0 = MultiAssetV0_None | MultiAssetV0_All | MultiAssetV0_AllFungible | MultiAssetV0_AllNonFungible | MultiAssetV0_AllAbstractFungible | MultiAssetV0_AllAbstractNonFungible | MultiAssetV0_AllConcreteFungible | MultiAssetV0_AllConcreteNonFungible | MultiAssetV0_AbstractFungible | MultiAssetV0_AbstractNonFungible | MultiAssetV0_ConcreteFungible | MultiAssetV0_ConcreteNonFungible

export interface MultiAssetV0_None {
  __kind: 'None'
  value: null
}

export interface MultiAssetV0_All {
  __kind: 'All'
  value: null
}

export interface MultiAssetV0_AllFungible {
  __kind: 'AllFungible'
  value: null
}

export interface MultiAssetV0_AllNonFungible {
  __kind: 'AllNonFungible'
  value: null
}

export interface MultiAssetV0_AllAbstractFungible {
  __kind: 'AllAbstractFungible'
  value: Uint8Array
}

export interface MultiAssetV0_AllAbstractNonFungible {
  __kind: 'AllAbstractNonFungible'
  value: Uint8Array
}

export interface MultiAssetV0_AllConcreteFungible {
  __kind: 'AllConcreteFungible'
  value: MultiLocationV0
}

export interface MultiAssetV0_AllConcreteNonFungible {
  __kind: 'AllConcreteNonFungible'
  value: MultiLocationV0
}

export interface MultiAssetV0_AbstractFungible {
  __kind: 'AbstractFungible'
  id: Uint8Array
  instance: bigint
}

export interface MultiAssetV0_AbstractNonFungible {
  __kind: 'AbstractNonFungible'
  class: Uint8Array
  instance: AssetInstanceV0
}

export interface MultiAssetV0_ConcreteFungible {
  __kind: 'ConcreteFungible'
  id: MultiLocationV0
  amount: bigint
}

export interface MultiAssetV0_ConcreteNonFungible {
  __kind: 'ConcreteNonFungible'
  class: MultiLocationV0
  instance: AssetInstanceV0
}

export type XcmOrderV0 = XcmOrderV0_Null | XcmOrderV0_DepositAsset | XcmOrderV0_DepositReserveAsset | XcmOrderV0_ExchangeAsset | XcmOrderV0_InitiateReserveWithdraw | XcmOrderV0_InitiateTeleport | XcmOrderV0_QueryHolding | XcmOrderV0_BuyExecution

export interface XcmOrderV0_Null {
  __kind: 'Null'
  value: null
}

export interface XcmOrderV0_DepositAsset {
  __kind: 'DepositAsset'
  assets: MultiAssetV0[]
  dest: MultiLocationV0
}

export interface XcmOrderV0_DepositReserveAsset {
  __kind: 'DepositReserveAsset'
  assets: MultiAssetV0[]
  dest: MultiLocationV0
  effects: XcmOrderV0[]
}

export interface XcmOrderV0_ExchangeAsset {
  __kind: 'ExchangeAsset'
  give: MultiAssetV0[]
  receive: MultiAssetV0[]
}

export interface XcmOrderV0_InitiateReserveWithdraw {
  __kind: 'InitiateReserveWithdraw'
  assets: MultiAssetV0[]
  reserve: MultiLocationV0
  effects: XcmOrderV0[]
}

export interface XcmOrderV0_InitiateTeleport {
  __kind: 'InitiateTeleport'
  assets: MultiAssetV0[]
  dest: MultiLocationV0
  effects: XcmOrderV0[]
}

export interface XcmOrderV0_QueryHolding {
  __kind: 'QueryHolding'
  queryId: bigint
  dest: MultiLocationV0
  assets: MultiAssetV0[]
}

export interface XcmOrderV0_BuyExecution {
  __kind: 'BuyExecution'
  fees: MultiAssetV0
  weight: bigint
  debt: bigint
  haltOnError: boolean
  xcm: XcmV0[]
}

export type ResponseV0 = ResponseV0_Assets

export interface ResponseV0_Assets {
  __kind: 'Assets'
  value: MultiAssetV0[]
}

export type MultiLocationV0 = MultiLocationV0_Here | MultiLocationV0_X1 | MultiLocationV0_X2 | MultiLocationV0_X3 | MultiLocationV0_X4 | MultiLocationV0_X5 | MultiLocationV0_X6 | MultiLocationV0_X7 | MultiLocationV0_X8

export interface MultiLocationV0_Here {
  __kind: 'Here'
  value: null
}

export interface MultiLocationV0_X1 {
  __kind: 'X1'
  value: JunctionV0
}

export interface MultiLocationV0_X2 {
  __kind: 'X2'
  value: [JunctionV0, JunctionV0]
}

export interface MultiLocationV0_X3 {
  __kind: 'X3'
  value: [JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocationV0_X4 {
  __kind: 'X4'
  value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocationV0_X5 {
  __kind: 'X5'
  value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocationV0_X6 {
  __kind: 'X6'
  value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocationV0_X7 {
  __kind: 'X7'
  value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocationV0_X8 {
  __kind: 'X8'
  value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export type OriginKindV0 = OriginKindV0_Native | OriginKindV0_SovereignAccount | OriginKindV0_Superuser | OriginKindV0_Xcm

export interface OriginKindV0_Native {
  __kind: 'Native'
}

export interface OriginKindV0_SovereignAccount {
  __kind: 'SovereignAccount'
}

export interface OriginKindV0_Superuser {
  __kind: 'Superuser'
}

export interface OriginKindV0_Xcm {
  __kind: 'Xcm'
}

export interface MultiAssetV1 {
  id: XcmAssetIdV1
  fungibility: FungibilityV1
}

export type MultiAssetsV1 = MultiAssetV1[]

export type XcmOrderV1 = XcmOrderV1_Noop | XcmOrderV1_DepositAsset | XcmOrderV1_DepositReserveAsset | XcmOrderV1_ExchangeAsset | XcmOrderV1_InitiateReserveWithdraw | XcmOrderV1_InitiateTeleport | XcmOrderV1_QueryHolding | XcmOrderV1_BuyExecution

export interface XcmOrderV1_Noop {
  __kind: 'Noop'
  value: null
}

export interface XcmOrderV1_DepositAsset {
  __kind: 'DepositAsset'
  assets: MultiAssetFilterV1
  maxAssets: number
  beneficiary: MultiLocationV1
}

export interface XcmOrderV1_DepositReserveAsset {
  __kind: 'DepositReserveAsset'
  assets: MultiAssetFilterV1
  maxAssets: number
  dest: MultiLocationV1
  effects: XcmOrderV1[]
}

export interface XcmOrderV1_ExchangeAsset {
  __kind: 'ExchangeAsset'
  give: MultiAssetFilterV1
  receive: MultiAssetsV1
}

export interface XcmOrderV1_InitiateReserveWithdraw {
  __kind: 'InitiateReserveWithdraw'
  assets: MultiAssetFilterV1
  reserve: MultiLocationV1
  effects: XcmOrderV1[]
}

export interface XcmOrderV1_InitiateTeleport {
  __kind: 'InitiateTeleport'
  assets: MultiAssetFilterV1
  dest: MultiLocationV1
  effects: XcmOrderV1[]
}

export interface XcmOrderV1_QueryHolding {
  __kind: 'QueryHolding'
  queryId: bigint
  dest: MultiLocationV1
  assets: MultiAssetFilterV1
}

export interface XcmOrderV1_BuyExecution {
  __kind: 'BuyExecution'
  fees: MultiAssetV1
  weight: bigint
  debt: bigint
  haltOnError: boolean
  instructions: XcmV1[]
}

export type ResponseV1 = ResponseV1_Assets

export interface ResponseV1_Assets {
  __kind: 'Assets'
  value: MultiAssetsV1
}

export interface MultiLocationV1 {
  parents: number
  interior: JunctionsV1
}

export type ResponseV2 = ResponseV2_Null | ResponseV2_Assets | ResponseV2_ExecutionResult

export interface ResponseV2_Null {
  __kind: 'Null'
  value: null
}

export interface ResponseV2_Assets {
  __kind: 'Assets'
  value: MultiAssetsV1
}

export interface ResponseV2_ExecutionResult {
  __kind: 'ExecutionResult'
  value: ResponseV2Result
}

export type JunctionsV1 = JunctionsV1_Here | JunctionsV1_X1 | JunctionsV1_X2 | JunctionsV1_X3 | JunctionsV1_X4 | JunctionsV1_X5 | JunctionsV1_X6 | JunctionsV1_X7 | JunctionsV1_X8

export interface JunctionsV1_Here {
  __kind: 'Here'
  value: null
}

export interface JunctionsV1_X1 {
  __kind: 'X1'
  value: JunctionV1
}

export interface JunctionsV1_X2 {
  __kind: 'X2'
  value: [JunctionV1, JunctionV1]
}

export interface JunctionsV1_X3 {
  __kind: 'X3'
  value: [JunctionV1, JunctionV1, JunctionV1]
}

export interface JunctionsV1_X4 {
  __kind: 'X4'
  value: [JunctionV1, JunctionV1, JunctionV1, JunctionV1]
}

export interface JunctionsV1_X5 {
  __kind: 'X5'
  value: [JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1]
}

export interface JunctionsV1_X6 {
  __kind: 'X6'
  value: [JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1]
}

export interface JunctionsV1_X7 {
  __kind: 'X7'
  value: [JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1]
}

export interface JunctionsV1_X8 {
  __kind: 'X8'
  value: [JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1]
}

export type MultiAssetFilterV1 = MultiAssetFilterV1_Definite | MultiAssetFilterV1_Wild

export interface MultiAssetFilterV1_Definite {
  __kind: 'Definite'
  value: MultiAssetsV1
}

export interface MultiAssetFilterV1_Wild {
  __kind: 'Wild'
  value: WildMultiAssetV1
}

export type WeightLimitV2 = WeightLimitV2_Unlimited | WeightLimitV2_Limited

export interface WeightLimitV2_Unlimited {
  __kind: 'Unlimited'
  value: null
}

export interface WeightLimitV2_Limited {
  __kind: 'Limited'
  value: bigint
}

export type AssetInstanceV0 = AssetInstanceV0_Undefined | AssetInstanceV0_Index8 | AssetInstanceV0_Index16 | AssetInstanceV0_Index32 | AssetInstanceV0_Index64 | AssetInstanceV0_Index128 | AssetInstanceV0_Array4 | AssetInstanceV0_Array8 | AssetInstanceV0_Array16 | AssetInstanceV0_Array32 | AssetInstanceV0_Blob

export interface AssetInstanceV0_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface AssetInstanceV0_Index8 {
  __kind: 'Index8'
  value: number
}

export interface AssetInstanceV0_Index16 {
  __kind: 'Index16'
  value: number
}

export interface AssetInstanceV0_Index32 {
  __kind: 'Index32'
  value: number
}

export interface AssetInstanceV0_Index64 {
  __kind: 'Index64'
  value: bigint
}

export interface AssetInstanceV0_Index128 {
  __kind: 'Index128'
  value: bigint
}

export interface AssetInstanceV0_Array4 {
  __kind: 'Array4'
  value: Uint8Array
}

export interface AssetInstanceV0_Array8 {
  __kind: 'Array8'
  value: Uint8Array
}

export interface AssetInstanceV0_Array16 {
  __kind: 'Array16'
  value: Uint8Array
}

export interface AssetInstanceV0_Array32 {
  __kind: 'Array32'
  value: Uint8Array
}

export interface AssetInstanceV0_Blob {
  __kind: 'Blob'
  value: Uint8Array
}

export type JunctionV0 = JunctionV0_Parent | JunctionV0_Parachain | JunctionV0_AccountId32 | JunctionV0_AccountIndex64 | JunctionV0_AccountKey20 | JunctionV0_PalletInstance | JunctionV0_GeneralIndex | JunctionV0_GeneralKey | JunctionV0_OnlyChild | JunctionV0_Plurality

export interface JunctionV0_Parent {
  __kind: 'Parent'
  value: null
}

export interface JunctionV0_Parachain {
  __kind: 'Parachain'
  value: number
}

export interface JunctionV0_AccountId32 {
  __kind: 'AccountId32'
  network: NetworkIdV0
  id: Uint8Array
}

export interface JunctionV0_AccountIndex64 {
  __kind: 'AccountIndex64'
  network: NetworkIdV0
  index: bigint
}

export interface JunctionV0_AccountKey20 {
  __kind: 'AccountKey20'
  network: NetworkIdV0
  key: Uint8Array
}

export interface JunctionV0_PalletInstance {
  __kind: 'PalletInstance'
  value: number
}

export interface JunctionV0_GeneralIndex {
  __kind: 'GeneralIndex'
  value: bigint
}

export interface JunctionV0_GeneralKey {
  __kind: 'GeneralKey'
  value: Uint8Array
}

export interface JunctionV0_OnlyChild {
  __kind: 'OnlyChild'
  value: null
}

export interface JunctionV0_Plurality {
  __kind: 'Plurality'
  id: BodyIdV0
  part: BodyPartV0
}

export type XcmAssetIdV1 = XcmAssetIdV1_Concrete | XcmAssetIdV1_Abstract

export interface XcmAssetIdV1_Concrete {
  __kind: 'Concrete'
  value: MultiLocationV1
}

export interface XcmAssetIdV1_Abstract {
  __kind: 'Abstract'
  value: Uint8Array
}

export type FungibilityV1 = FungibilityV1_Fungible | FungibilityV1_NonFungible

export interface FungibilityV1_Fungible {
  __kind: 'Fungible'
  value: bigint
}

export interface FungibilityV1_NonFungible {
  __kind: 'NonFungible'
  value: AssetInstanceV1
}

export type XcmErrorV2 = XcmErrorV2_Undefined | XcmErrorV2_Overflow | XcmErrorV2_Unimplemented | XcmErrorV2_UnhandledXcmVersion | XcmErrorV2_UnhandledXcmMessage | XcmErrorV2_UnhandledEffect | XcmErrorV2_EscalationOfPrivilege | XcmErrorV2_UntrustedReserveLocation | XcmErrorV2_UntrustedTeleportLocation | XcmErrorV2_DestinationBufferOverflow | XcmErrorV2_MultiLocationFull | XcmErrorV2_MultiLocationNotInvertible | XcmErrorV2_FailedToDecode | XcmErrorV2_BadOrigin | XcmErrorV2_ExceedsMaxMessageSize | XcmErrorV2_FailedToTransactAsset | XcmErrorV2_WeightLimitReached | XcmErrorV2_Wildcard | XcmErrorV2_TooMuchWeightRequired | XcmErrorV2_NotHoldingFees | XcmErrorV2_WeightNotComputable | XcmErrorV2_Barrier | XcmErrorV2_NotWithdrawable | XcmErrorV2_LocationCannotHold | XcmErrorV2_TooExpensive | XcmErrorV2_AssetNotFound | XcmErrorV2_DestinationUnsupported | XcmErrorV2_RecursionLimitReached | XcmErrorV2_Transport | XcmErrorV2_Unroutable | XcmErrorV2_UnknownWeightRequired | XcmErrorV2_Trap | XcmErrorV2_UnknownClaim | XcmErrorV2_InvalidLocation

export interface XcmErrorV2_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface XcmErrorV2_Overflow {
  __kind: 'Overflow'
  value: null
}

export interface XcmErrorV2_Unimplemented {
  __kind: 'Unimplemented'
  value: null
}

export interface XcmErrorV2_UnhandledXcmVersion {
  __kind: 'UnhandledXcmVersion'
  value: null
}

export interface XcmErrorV2_UnhandledXcmMessage {
  __kind: 'UnhandledXcmMessage'
  value: null
}

export interface XcmErrorV2_UnhandledEffect {
  __kind: 'UnhandledEffect'
  value: null
}

export interface XcmErrorV2_EscalationOfPrivilege {
  __kind: 'EscalationOfPrivilege'
  value: null
}

export interface XcmErrorV2_UntrustedReserveLocation {
  __kind: 'UntrustedReserveLocation'
  value: null
}

export interface XcmErrorV2_UntrustedTeleportLocation {
  __kind: 'UntrustedTeleportLocation'
  value: null
}

export interface XcmErrorV2_DestinationBufferOverflow {
  __kind: 'DestinationBufferOverflow'
  value: null
}

export interface XcmErrorV2_MultiLocationFull {
  __kind: 'MultiLocationFull'
  value: null
}

export interface XcmErrorV2_MultiLocationNotInvertible {
  __kind: 'MultiLocationNotInvertible'
  value: null
}

export interface XcmErrorV2_FailedToDecode {
  __kind: 'FailedToDecode'
  value: null
}

export interface XcmErrorV2_BadOrigin {
  __kind: 'BadOrigin'
  value: null
}

export interface XcmErrorV2_ExceedsMaxMessageSize {
  __kind: 'ExceedsMaxMessageSize'
  value: null
}

export interface XcmErrorV2_FailedToTransactAsset {
  __kind: 'FailedToTransactAsset'
  value: null
}

export interface XcmErrorV2_WeightLimitReached {
  __kind: 'WeightLimitReached'
  value: bigint
}

export interface XcmErrorV2_Wildcard {
  __kind: 'Wildcard'
  value: null
}

export interface XcmErrorV2_TooMuchWeightRequired {
  __kind: 'TooMuchWeightRequired'
  value: null
}

export interface XcmErrorV2_NotHoldingFees {
  __kind: 'NotHoldingFees'
  value: null
}

export interface XcmErrorV2_WeightNotComputable {
  __kind: 'WeightNotComputable'
  value: null
}

export interface XcmErrorV2_Barrier {
  __kind: 'Barrier'
  value: null
}

export interface XcmErrorV2_NotWithdrawable {
  __kind: 'NotWithdrawable'
  value: null
}

export interface XcmErrorV2_LocationCannotHold {
  __kind: 'LocationCannotHold'
  value: null
}

export interface XcmErrorV2_TooExpensive {
  __kind: 'TooExpensive'
  value: null
}

export interface XcmErrorV2_AssetNotFound {
  __kind: 'AssetNotFound'
  value: null
}

export interface XcmErrorV2_DestinationUnsupported {
  __kind: 'DestinationUnsupported'
  value: null
}

export interface XcmErrorV2_RecursionLimitReached {
  __kind: 'RecursionLimitReached'
  value: null
}

export interface XcmErrorV2_Transport {
  __kind: 'Transport'
  value: null
}

export interface XcmErrorV2_Unroutable {
  __kind: 'Unroutable'
  value: null
}

export interface XcmErrorV2_UnknownWeightRequired {
  __kind: 'UnknownWeightRequired'
  value: null
}

export interface XcmErrorV2_Trap {
  __kind: 'Trap'
  value: bigint
}

export interface XcmErrorV2_UnknownClaim {
  __kind: 'UnknownClaim'
  value: null
}

export interface XcmErrorV2_InvalidLocation {
  __kind: 'InvalidLocation'
  value: null
}

export type ResponseV2Error = [number, XcmErrorV2]

export type ResponseV2Result = Result<null, ResponseV2Error>

export type JunctionV1 = JunctionV1_Parachain | JunctionV1_AccountId32 | JunctionV1_AccountIndex64 | JunctionV1_AccountKey20 | JunctionV1_PalletInstance | JunctionV1_GeneralIndex | JunctionV1_GeneralKey | JunctionV1_OnlyChild | JunctionV1_Plurality

export interface JunctionV1_Parachain {
  __kind: 'Parachain'
  value: number
}

export interface JunctionV1_AccountId32 {
  __kind: 'AccountId32'
  network: NetworkIdV0
  id: Uint8Array
}

export interface JunctionV1_AccountIndex64 {
  __kind: 'AccountIndex64'
  network: NetworkIdV0
  index: bigint
}

export interface JunctionV1_AccountKey20 {
  __kind: 'AccountKey20'
  network: NetworkIdV0
  key: Uint8Array
}

export interface JunctionV1_PalletInstance {
  __kind: 'PalletInstance'
  value: number
}

export interface JunctionV1_GeneralIndex {
  __kind: 'GeneralIndex'
  value: bigint
}

export interface JunctionV1_GeneralKey {
  __kind: 'GeneralKey'
  value: Uint8Array
}

export interface JunctionV1_OnlyChild {
  __kind: 'OnlyChild'
  value: null
}

export interface JunctionV1_Plurality {
  __kind: 'Plurality'
  id: BodyIdV0
  part: BodyPartV0
}

export type WildMultiAssetV1 = WildMultiAssetV1_All | WildMultiAssetV1_AllOf

export interface WildMultiAssetV1_All {
  __kind: 'All'
  value: null
}

export interface WildMultiAssetV1_AllOf {
  __kind: 'AllOf'
  id: XcmAssetIdV1
  fungibility: WildFungibilityV1
}

export type NetworkIdV0 = NetworkIdV0_Any | NetworkIdV0_Named | NetworkIdV0_Polkadot | NetworkIdV0_Kusama

export interface NetworkIdV0_Any {
  __kind: 'Any'
  value: null
}

export interface NetworkIdV0_Named {
  __kind: 'Named'
  value: Uint8Array
}

export interface NetworkIdV0_Polkadot {
  __kind: 'Polkadot'
  value: null
}

export interface NetworkIdV0_Kusama {
  __kind: 'Kusama'
  value: null
}

export type BodyIdV0 = BodyIdV0_Unit | BodyIdV0_Named | BodyIdV0_Index | BodyIdV0_Executive | BodyIdV0_Technical | BodyIdV0_Legislative | BodyIdV0_Judicial

export interface BodyIdV0_Unit {
  __kind: 'Unit'
  value: null
}

export interface BodyIdV0_Named {
  __kind: 'Named'
  value: Uint8Array
}

export interface BodyIdV0_Index {
  __kind: 'Index'
  value: number
}

export interface BodyIdV0_Executive {
  __kind: 'Executive'
  value: null
}

export interface BodyIdV0_Technical {
  __kind: 'Technical'
  value: null
}

export interface BodyIdV0_Legislative {
  __kind: 'Legislative'
  value: null
}

export interface BodyIdV0_Judicial {
  __kind: 'Judicial'
  value: null
}

export type BodyPartV0 = BodyPartV0_Voice | BodyPartV0_Members | BodyPartV0_Fraction | BodyPartV0_AtLeastProportion | BodyPartV0_MoreThanProportion

export interface BodyPartV0_Voice {
  __kind: 'Voice'
  value: null
}

export interface BodyPartV0_Members {
  __kind: 'Members'
  value: number
}

export interface BodyPartV0_Fraction {
  __kind: 'Fraction'
  nom: number
  denom: number
}

export interface BodyPartV0_AtLeastProportion {
  __kind: 'AtLeastProportion'
  nom: number
  denom: number
}

export interface BodyPartV0_MoreThanProportion {
  __kind: 'MoreThanProportion'
  nom: number
  denom: number
}

export type AssetInstanceV1 = AssetInstanceV1_Undefined | AssetInstanceV1_Index | AssetInstanceV1_Array4 | AssetInstanceV1_Array8 | AssetInstanceV1_Array16 | AssetInstanceV1_Array32 | AssetInstanceV1_Blob

export interface AssetInstanceV1_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface AssetInstanceV1_Index {
  __kind: 'Index'
  value: bigint
}

export interface AssetInstanceV1_Array4 {
  __kind: 'Array4'
  value: Uint8Array
}

export interface AssetInstanceV1_Array8 {
  __kind: 'Array8'
  value: Uint8Array
}

export interface AssetInstanceV1_Array16 {
  __kind: 'Array16'
  value: Uint8Array
}

export interface AssetInstanceV1_Array32 {
  __kind: 'Array32'
  value: Uint8Array
}

export interface AssetInstanceV1_Blob {
  __kind: 'Blob'
  value: Uint8Array
}

export type WildFungibilityV1 = WildFungibilityV1_Fungible | WildFungibilityV1_NonFungible

export interface WildFungibilityV1_Fungible {
  __kind: 'Fungible'
}

export interface WildFungibilityV1_NonFungible {
  __kind: 'NonFungible'
}
