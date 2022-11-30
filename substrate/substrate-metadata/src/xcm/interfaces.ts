
export type XcmAssetInstanceV0 = XcmAssetInstanceV0_Undefined | XcmAssetInstanceV0_Index8 | XcmAssetInstanceV0_Index16 | XcmAssetInstanceV0_Index32 | XcmAssetInstanceV0_Index64 | XcmAssetInstanceV0_Index128 | XcmAssetInstanceV0_Array4 | XcmAssetInstanceV0_Array8 | XcmAssetInstanceV0_Array16 | XcmAssetInstanceV0_Array32 | XcmAssetInstanceV0_Blob

export interface XcmAssetInstanceV0_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface XcmAssetInstanceV0_Index8 {
  __kind: 'Index8'
  value: number
}

export interface XcmAssetInstanceV0_Index16 {
  __kind: 'Index16'
  value: number
}

export interface XcmAssetInstanceV0_Index32 {
  __kind: 'Index32'
  value: number
}

export interface XcmAssetInstanceV0_Index64 {
  __kind: 'Index64'
  value: bigint
}

export interface XcmAssetInstanceV0_Index128 {
  __kind: 'Index128'
  value: bigint
}

export interface XcmAssetInstanceV0_Array4 {
  __kind: 'Array4'
  value: Uint8Array
}

export interface XcmAssetInstanceV0_Array8 {
  __kind: 'Array8'
  value: Uint8Array
}

export interface XcmAssetInstanceV0_Array16 {
  __kind: 'Array16'
  value: Uint8Array
}

export interface XcmAssetInstanceV0_Array32 {
  __kind: 'Array32'
  value: Uint8Array
}

export interface XcmAssetInstanceV0_Blob {
  __kind: 'Blob'
  value: Uint8Array
}

export type XcmNetworkIdV0 = XcmNetworkIdV0_Any | XcmNetworkIdV0_Named | XcmNetworkIdV0_Polkadot | XcmNetworkIdV0_Kusama

export interface XcmNetworkIdV0_Any {
  __kind: 'Any'
  value: null
}

export interface XcmNetworkIdV0_Named {
  __kind: 'Named'
  value: Uint8Array
}

export interface XcmNetworkIdV0_Polkadot {
  __kind: 'Polkadot'
  value: null
}

export interface XcmNetworkIdV0_Kusama {
  __kind: 'Kusama'
  value: null
}

export type XcmBodyIdV0 = XcmBodyIdV0_Unit | XcmBodyIdV0_Named | XcmBodyIdV0_Index | XcmBodyIdV0_Executive | XcmBodyIdV0_Technical | XcmBodyIdV0_Legislative | XcmBodyIdV0_Judicial

export interface XcmBodyIdV0_Unit {
  __kind: 'Unit'
  value: null
}

export interface XcmBodyIdV0_Named {
  __kind: 'Named'
  value: Uint8Array
}

export interface XcmBodyIdV0_Index {
  __kind: 'Index'
  value: number
}

export interface XcmBodyIdV0_Executive {
  __kind: 'Executive'
  value: null
}

export interface XcmBodyIdV0_Technical {
  __kind: 'Technical'
  value: null
}

export interface XcmBodyIdV0_Legislative {
  __kind: 'Legislative'
  value: null
}

export interface XcmBodyIdV0_Judicial {
  __kind: 'Judicial'
  value: null
}

export type XcmBodyPartV0 = XcmBodyPartV0_Voice | XcmBodyPartV0_Members | XcmBodyPartV0_Fraction | XcmBodyPartV0_AtLeastProportion | XcmBodyPartV0_MoreThanProportion

export interface XcmBodyPartV0_Voice {
  __kind: 'Voice'
  value: null
}

export interface XcmBodyPartV0_Members {
  __kind: 'Members'
  value: number
}

export interface XcmBodyPartV0_Fraction {
  __kind: 'Fraction'
  nom: number
  denom: number
}

export interface XcmBodyPartV0_AtLeastProportion {
  __kind: 'AtLeastProportion'
  nom: number
  denom: number
}

export interface XcmBodyPartV0_MoreThanProportion {
  __kind: 'MoreThanProportion'
  nom: number
  denom: number
}

export type XcmJunctionV0 = XcmJunctionV0_Parent | XcmJunctionV0_Parachain | XcmJunctionV0_AccountId32 | XcmJunctionV0_AccountIndex64 | XcmJunctionV0_AccountKey20 | XcmJunctionV0_PalletInstance | XcmJunctionV0_GeneralIndex | XcmJunctionV0_GeneralKey | XcmJunctionV0_OnlyChild | XcmJunctionV0_Plurality

export interface XcmJunctionV0_Parent {
  __kind: 'Parent'
  value: null
}

export interface XcmJunctionV0_Parachain {
  __kind: 'Parachain'
  value: number
}

export interface XcmJunctionV0_AccountId32 {
  __kind: 'AccountId32'
  network: XcmNetworkIdV0
  id: Uint8Array
}

export interface XcmJunctionV0_AccountIndex64 {
  __kind: 'AccountIndex64'
  network: XcmNetworkIdV0
  index: bigint
}

export interface XcmJunctionV0_AccountKey20 {
  __kind: 'AccountKey20'
  network: XcmNetworkIdV0
  key: Uint8Array
}

export interface XcmJunctionV0_PalletInstance {
  __kind: 'PalletInstance'
  value: number
}

export interface XcmJunctionV0_GeneralIndex {
  __kind: 'GeneralIndex'
  value: bigint
}

export interface XcmJunctionV0_GeneralKey {
  __kind: 'GeneralKey'
  value: Uint8Array
}

export interface XcmJunctionV0_OnlyChild {
  __kind: 'OnlyChild'
  value: null
}

export interface XcmJunctionV0_Plurality {
  __kind: 'Plurality'
  id: XcmBodyIdV0
  part: XcmBodyPartV0
}

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
  instance: XcmAssetInstanceV0
}

export interface MultiAssetV0_ConcreteFungible {
  __kind: 'ConcreteFungible'
  id: MultiLocationV0
  amount: bigint
}

export interface MultiAssetV0_ConcreteNonFungible {
  __kind: 'ConcreteNonFungible'
  class: MultiLocationV0
  instance: XcmAssetInstanceV0
}

export type MultiLocationV0 = MultiLocationV0_Here | MultiLocationV0_X1 | MultiLocationV0_X2 | MultiLocationV0_X3 | MultiLocationV0_X4 | MultiLocationV0_X5 | MultiLocationV0_X6 | MultiLocationV0_X7 | MultiLocationV0_X8

export interface MultiLocationV0_Here {
  __kind: 'Here'
  value: null
}

export interface MultiLocationV0_X1 {
  __kind: 'X1'
  value: XcmJunctionV0
}

export interface MultiLocationV0_X2 {
  __kind: 'X2'
  value: [XcmJunctionV0, XcmJunctionV0]
}

export interface MultiLocationV0_X3 {
  __kind: 'X3'
  value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export interface MultiLocationV0_X4 {
  __kind: 'X4'
  value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export interface MultiLocationV0_X5 {
  __kind: 'X5'
  value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export interface MultiLocationV0_X6 {
  __kind: 'X6'
  value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export interface MultiLocationV0_X7 {
  __kind: 'X7'
  value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export interface MultiLocationV0_X8 {
  __kind: 'X8'
  value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export type XcmOriginKindV0 = XcmOriginKindV0_Native | XcmOriginKindV0_SovereignAccount | XcmOriginKindV0_Superuser | XcmOriginKindV0_Xcm

export interface XcmOriginKindV0_Native {
  __kind: 'Native'
}

export interface XcmOriginKindV0_SovereignAccount {
  __kind: 'SovereignAccount'
}

export interface XcmOriginKindV0_Superuser {
  __kind: 'Superuser'
}

export interface XcmOriginKindV0_Xcm {
  __kind: 'Xcm'
}

export type XcmResponseV0 = XcmResponseV0_Assets

export interface XcmResponseV0_Assets {
  __kind: 'Assets'
  value: MultiAssetV0[]
}

export type XcmV0 = XcmV0_WithdrawAsset | XcmV0_ReserveAssetDeposit | XcmV0_TeleportAsset | XcmV0_QueryResponse | XcmV0_TransferAsset | XcmV0_TransferReserveAsset | XcmV0_Transact | XcmV0_HrmpNewChannelOpenRequest | XcmV0_HrmpChannelAccepted | XcmV0_HrmpChannelClosing | XcmV0_RelayedFrom

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

export interface XcmV0_TeleportAsset {
  __kind: 'TeleportAsset'
  assets: MultiAssetV0[]
  effects: XcmOrderV0[]
}

export interface XcmV0_QueryResponse {
  __kind: 'QueryResponse'
  queryId: bigint
  response: XcmResponseV0
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
  originType: XcmOriginKindV0
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

export type XcmErrorV0 = XcmErrorV0_Undefined | XcmErrorV0_Overflow | XcmErrorV0_Unimplemented | XcmErrorV0_UnhandledXcmVersion | XcmErrorV0_UnhandledXcmMessage | XcmErrorV0_UnhandledEffect | XcmErrorV0_EscalationOfPrivilege | XcmErrorV0_UntrustedReserveLocation | XcmErrorV0_UntrustedTeleportLocation | XcmErrorV0_DestinationBufferOverflow | XcmErrorV0_SendFailed | XcmErrorV0_CannotReachDestination | XcmErrorV0_MultiLocationFull | XcmErrorV0_FailedToDecode | XcmErrorV0_BadOrigin | XcmErrorV0_ExceedsMaxMessageSize | XcmErrorV0_FailedToTransactAsset | XcmErrorV0_WeightLimitReached | XcmErrorV0_Wildcard | XcmErrorV0_TooMuchWeightRequired | XcmErrorV0_NotHoldingFees | XcmErrorV0_WeightNotComputable | XcmErrorV0_Barrier | XcmErrorV0_NotWithdrawable | XcmErrorV0_LocationCannotHold | XcmErrorV0_TooExpensive | XcmErrorV0_AssetNotFound | XcmErrorV0_RecursionLimitReached

export interface XcmErrorV0_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface XcmErrorV0_Overflow {
  __kind: 'Overflow'
  value: null
}

export interface XcmErrorV0_Unimplemented {
  __kind: 'Unimplemented'
  value: null
}

export interface XcmErrorV0_UnhandledXcmVersion {
  __kind: 'UnhandledXcmVersion'
  value: null
}

export interface XcmErrorV0_UnhandledXcmMessage {
  __kind: 'UnhandledXcmMessage'
  value: null
}

export interface XcmErrorV0_UnhandledEffect {
  __kind: 'UnhandledEffect'
  value: null
}

export interface XcmErrorV0_EscalationOfPrivilege {
  __kind: 'EscalationOfPrivilege'
  value: null
}

export interface XcmErrorV0_UntrustedReserveLocation {
  __kind: 'UntrustedReserveLocation'
  value: null
}

export interface XcmErrorV0_UntrustedTeleportLocation {
  __kind: 'UntrustedTeleportLocation'
  value: null
}

export interface XcmErrorV0_DestinationBufferOverflow {
  __kind: 'DestinationBufferOverflow'
  value: null
}

export interface XcmErrorV0_SendFailed {
  __kind: 'SendFailed'
  value: null
}

export interface XcmErrorV0_CannotReachDestination {
  __kind: 'CannotReachDestination'
  value: [MultiLocationV0, XcmV0]
}

export interface XcmErrorV0_MultiLocationFull {
  __kind: 'MultiLocationFull'
  value: null
}

export interface XcmErrorV0_FailedToDecode {
  __kind: 'FailedToDecode'
  value: null
}

export interface XcmErrorV0_BadOrigin {
  __kind: 'BadOrigin'
  value: null
}

export interface XcmErrorV0_ExceedsMaxMessageSize {
  __kind: 'ExceedsMaxMessageSize'
  value: null
}

export interface XcmErrorV0_FailedToTransactAsset {
  __kind: 'FailedToTransactAsset'
  value: null
}

export interface XcmErrorV0_WeightLimitReached {
  __kind: 'WeightLimitReached'
  value: bigint
}

export interface XcmErrorV0_Wildcard {
  __kind: 'Wildcard'
  value: null
}

export interface XcmErrorV0_TooMuchWeightRequired {
  __kind: 'TooMuchWeightRequired'
  value: null
}

export interface XcmErrorV0_NotHoldingFees {
  __kind: 'NotHoldingFees'
  value: null
}

export interface XcmErrorV0_WeightNotComputable {
  __kind: 'WeightNotComputable'
  value: null
}

export interface XcmErrorV0_Barrier {
  __kind: 'Barrier'
  value: null
}

export interface XcmErrorV0_NotWithdrawable {
  __kind: 'NotWithdrawable'
  value: null
}

export interface XcmErrorV0_LocationCannotHold {
  __kind: 'LocationCannotHold'
  value: null
}

export interface XcmErrorV0_TooExpensive {
  __kind: 'TooExpensive'
  value: null
}

export interface XcmErrorV0_AssetNotFound {
  __kind: 'AssetNotFound'
  value: null
}

export interface XcmErrorV0_RecursionLimitReached {
  __kind: 'RecursionLimitReached'
  value: null
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

export type XcmOutcomeV0 = XcmOutcomeV0_Complete | XcmOutcomeV0_Incomplete | XcmOutcomeV0_Error

export interface XcmOutcomeV0_Complete {
  __kind: 'Complete'
  value: bigint
}

export interface XcmOutcomeV0_Incomplete {
  __kind: 'Incomplete'
  value: [bigint, XcmErrorV0]
}

export interface XcmOutcomeV0_Error {
  __kind: 'Error'
  value: XcmErrorV0
}

export type XcmAssetInstanceV1 = XcmAssetInstanceV1_Undefined | XcmAssetInstanceV1_Index | XcmAssetInstanceV1_Array4 | XcmAssetInstanceV1_Array8 | XcmAssetInstanceV1_Array16 | XcmAssetInstanceV1_Array32 | XcmAssetInstanceV1_Blob

export interface XcmAssetInstanceV1_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface XcmAssetInstanceV1_Index {
  __kind: 'Index'
  value: bigint
}

export interface XcmAssetInstanceV1_Array4 {
  __kind: 'Array4'
  value: Uint8Array
}

export interface XcmAssetInstanceV1_Array8 {
  __kind: 'Array8'
  value: Uint8Array
}

export interface XcmAssetInstanceV1_Array16 {
  __kind: 'Array16'
  value: Uint8Array
}

export interface XcmAssetInstanceV1_Array32 {
  __kind: 'Array32'
  value: Uint8Array
}

export interface XcmAssetInstanceV1_Blob {
  __kind: 'Blob'
  value: Uint8Array
}

export type XcmFungibilityV1 = XcmFungibilityV1_Fungible | XcmFungibilityV1_NonFungible

export interface XcmFungibilityV1_Fungible {
  __kind: 'Fungible'
  value: bigint
}

export interface XcmFungibilityV1_NonFungible {
  __kind: 'NonFungible'
  value: XcmAssetInstanceV1
}

export type XcmJunctionV1 = XcmJunctionV1_Parachain | XcmJunctionV1_AccountId32 | XcmJunctionV1_AccountIndex64 | XcmJunctionV1_AccountKey20 | XcmJunctionV1_PalletInstance | XcmJunctionV1_GeneralIndex | XcmJunctionV1_GeneralKey | XcmJunctionV1_OnlyChild | XcmJunctionV1_Plurality

export interface XcmJunctionV1_Parachain {
  __kind: 'Parachain'
  value: number
}

export interface XcmJunctionV1_AccountId32 {
  __kind: 'AccountId32'
  network: XcmNetworkIdV0
  id: Uint8Array
}

export interface XcmJunctionV1_AccountIndex64 {
  __kind: 'AccountIndex64'
  network: XcmNetworkIdV0
  index: bigint
}

export interface XcmJunctionV1_AccountKey20 {
  __kind: 'AccountKey20'
  network: XcmNetworkIdV0
  key: Uint8Array
}

export interface XcmJunctionV1_PalletInstance {
  __kind: 'PalletInstance'
  value: number
}

export interface XcmJunctionV1_GeneralIndex {
  __kind: 'GeneralIndex'
  value: bigint
}

export interface XcmJunctionV1_GeneralKey {
  __kind: 'GeneralKey'
  value: Uint8Array
}

export interface XcmJunctionV1_OnlyChild {
  __kind: 'OnlyChild'
  value: null
}

export interface XcmJunctionV1_Plurality {
  __kind: 'Plurality'
  id: XcmBodyIdV0
  part: XcmBodyPartV0
}

export type XcmJunctionsV1 = XcmJunctionsV1_Here | XcmJunctionsV1_X1 | XcmJunctionsV1_X2 | XcmJunctionsV1_X3 | XcmJunctionsV1_X4 | XcmJunctionsV1_X5 | XcmJunctionsV1_X6 | XcmJunctionsV1_X7 | XcmJunctionsV1_X8

export interface XcmJunctionsV1_Here {
  __kind: 'Here'
  value: null
}

export interface XcmJunctionsV1_X1 {
  __kind: 'X1'
  value: XcmJunctionV1
}

export interface XcmJunctionsV1_X2 {
  __kind: 'X2'
  value: [XcmJunctionV1, XcmJunctionV1]
}

export interface XcmJunctionsV1_X3 {
  __kind: 'X3'
  value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export interface XcmJunctionsV1_X4 {
  __kind: 'X4'
  value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export interface XcmJunctionsV1_X5 {
  __kind: 'X5'
  value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export interface XcmJunctionsV1_X6 {
  __kind: 'X6'
  value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export interface XcmJunctionsV1_X7 {
  __kind: 'X7'
  value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export interface XcmJunctionsV1_X8 {
  __kind: 'X8'
  value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export interface MultiAssetV1 {
  id: XcmAssetIdV1
  fungibility: XcmFungibilityV1
}

export type MultiAssetsV1 = MultiAssetV1[]

export type XcmAssetIdV1 = XcmAssetIdV1_Concrete | XcmAssetIdV1_Abstract

export interface XcmAssetIdV1_Concrete {
  __kind: 'Concrete'
  value: MultiLocationV1
}

export interface XcmAssetIdV1_Abstract {
  __kind: 'Abstract'
  value: Uint8Array
}

export type MultiAssetFilterV1 = MultiAssetFilterV1_Definite | MultiAssetFilterV1_Wild

export interface MultiAssetFilterV1_Definite {
  __kind: 'Definite'
  value: MultiAssetsV1
}

export interface MultiAssetFilterV1_Wild {
  __kind: 'Wild'
  value: XcmWildMultiAssetV1
}

export interface MultiLocationV1 {
  parents: number
  interior: XcmJunctionsV1
}

export type XcmResponseV1 = XcmResponseV1_Assets | XcmResponseV1_Version

export interface XcmResponseV1_Assets {
  __kind: 'Assets'
  value: MultiAssetsV1
}

export interface XcmResponseV1_Version {
  __kind: 'Version'
  value: XcmVersion
}

export type XcmWildFungibilityV1 = XcmWildFungibilityV1_Fungible | XcmWildFungibilityV1_NonFungible

export interface XcmWildFungibilityV1_Fungible {
  __kind: 'Fungible'
}

export interface XcmWildFungibilityV1_NonFungible {
  __kind: 'NonFungible'
}

export type XcmWildMultiAssetV1 = XcmWildMultiAssetV1_All | XcmWildMultiAssetV1_AllOf

export interface XcmWildMultiAssetV1_All {
  __kind: 'All'
  value: null
}

export interface XcmWildMultiAssetV1_AllOf {
  __kind: 'AllOf'
  id: XcmAssetIdV1
  fungibility: XcmWildFungibilityV1
}

export type XcmV1 = XcmV1_WithdrawAsset | XcmV1_ReserveAssetDeposited | XcmV1_ReceiveTeleportedAsset | XcmV1_QueryResponse | XcmV1_TransferAsset | XcmV1_TransferReserveAsset | XcmV1_Transact | XcmV1_HrmpNewChannelOpenRequest | XcmV1_HrmpChannelAccepted | XcmV1_HrmpChannelClosing | XcmV1_RelayedFrom | XcmV1_SubscribeVersion | XcmV1_UnsubscribeVersion

export interface XcmV1_WithdrawAsset {
  __kind: 'WithdrawAsset'
  assets: MultiAssetsV1
  effects: XcmOrderV1[]
}

export interface XcmV1_ReserveAssetDeposited {
  __kind: 'ReserveAssetDeposited'
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
  response: XcmResponseV1
}

export interface XcmV1_TransferAsset {
  __kind: 'TransferAsset'
  assets: MultiAssetsV1
  beneficiary: MultiLocationV1
}

export interface XcmV1_TransferReserveAsset {
  __kind: 'TransferReserveAsset'
  assets: MultiAssetsV1
  dest: MultiLocationV1
  effects: XcmOrderV1[]
}

export interface XcmV1_Transact {
  __kind: 'Transact'
  originType: XcmOriginKindV0
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

export interface XcmV1_SubscribeVersion {
  __kind: 'SubscribeVersion'
  queryId: bigint
  maxResponseWeight: bigint
}

export interface XcmV1_UnsubscribeVersion {
  __kind: 'UnsubscribeVersion'
  value: null
}

export type XcmErrorV1 = XcmErrorV1_Undefined | XcmErrorV1_Overflow | XcmErrorV1_Unimplemented | XcmErrorV1_UnhandledXcmVersion | XcmErrorV1_UnhandledXcmMessage | XcmErrorV1_UnhandledEffect | XcmErrorV1_EscalationOfPrivilege | XcmErrorV1_UntrustedReserveLocation | XcmErrorV1_UntrustedTeleportLocation | XcmErrorV1_DestinationBufferOverflow | XcmErrorV1_SendFailed | XcmErrorV1_CannotReachDestination | XcmErrorV1_MultiLocationFull | XcmErrorV1_FailedToDecode | XcmErrorV1_BadOrigin | XcmErrorV1_ExceedsMaxMessageSize | XcmErrorV1_FailedToTransactAsset | XcmErrorV1_WeightLimitReached | XcmErrorV1_Wildcard | XcmErrorV1_TooMuchWeightRequired | XcmErrorV1_NotHoldingFees | XcmErrorV1_WeightNotComputable | XcmErrorV1_Barrier | XcmErrorV1_NotWithdrawable | XcmErrorV1_LocationCannotHold | XcmErrorV1_TooExpensive | XcmErrorV1_AssetNotFound | XcmErrorV1_DestinationUnsupported | XcmErrorV1_RecursionLimitReached

export interface XcmErrorV1_Undefined {
  __kind: 'Undefined'
  value: null
}

export interface XcmErrorV1_Overflow {
  __kind: 'Overflow'
  value: null
}

export interface XcmErrorV1_Unimplemented {
  __kind: 'Unimplemented'
  value: null
}

export interface XcmErrorV1_UnhandledXcmVersion {
  __kind: 'UnhandledXcmVersion'
  value: null
}

export interface XcmErrorV1_UnhandledXcmMessage {
  __kind: 'UnhandledXcmMessage'
  value: null
}

export interface XcmErrorV1_UnhandledEffect {
  __kind: 'UnhandledEffect'
  value: null
}

export interface XcmErrorV1_EscalationOfPrivilege {
  __kind: 'EscalationOfPrivilege'
  value: null
}

export interface XcmErrorV1_UntrustedReserveLocation {
  __kind: 'UntrustedReserveLocation'
  value: null
}

export interface XcmErrorV1_UntrustedTeleportLocation {
  __kind: 'UntrustedTeleportLocation'
  value: null
}

export interface XcmErrorV1_DestinationBufferOverflow {
  __kind: 'DestinationBufferOverflow'
  value: null
}

export interface XcmErrorV1_SendFailed {
  __kind: 'SendFailed'
  value: null
}

export interface XcmErrorV1_CannotReachDestination {
  __kind: 'CannotReachDestination'
  value: [MultiLocationV1, XcmV1]
}

export interface XcmErrorV1_MultiLocationFull {
  __kind: 'MultiLocationFull'
  value: null
}

export interface XcmErrorV1_FailedToDecode {
  __kind: 'FailedToDecode'
  value: null
}

export interface XcmErrorV1_BadOrigin {
  __kind: 'BadOrigin'
  value: null
}

export interface XcmErrorV1_ExceedsMaxMessageSize {
  __kind: 'ExceedsMaxMessageSize'
  value: null
}

export interface XcmErrorV1_FailedToTransactAsset {
  __kind: 'FailedToTransactAsset'
  value: null
}

export interface XcmErrorV1_WeightLimitReached {
  __kind: 'WeightLimitReached'
  value: bigint
}

export interface XcmErrorV1_Wildcard {
  __kind: 'Wildcard'
  value: null
}

export interface XcmErrorV1_TooMuchWeightRequired {
  __kind: 'TooMuchWeightRequired'
  value: null
}

export interface XcmErrorV1_NotHoldingFees {
  __kind: 'NotHoldingFees'
  value: null
}

export interface XcmErrorV1_WeightNotComputable {
  __kind: 'WeightNotComputable'
  value: null
}

export interface XcmErrorV1_Barrier {
  __kind: 'Barrier'
  value: null
}

export interface XcmErrorV1_NotWithdrawable {
  __kind: 'NotWithdrawable'
  value: null
}

export interface XcmErrorV1_LocationCannotHold {
  __kind: 'LocationCannotHold'
  value: null
}

export interface XcmErrorV1_TooExpensive {
  __kind: 'TooExpensive'
  value: null
}

export interface XcmErrorV1_AssetNotFound {
  __kind: 'AssetNotFound'
  value: null
}

export interface XcmErrorV1_DestinationUnsupported {
  __kind: 'DestinationUnsupported'
  value: null
}

export interface XcmErrorV1_RecursionLimitReached {
  __kind: 'RecursionLimitReached'
  value: null
}

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

export type XcmOutcomeV1 = XcmOutcomeV1_Complete | XcmOutcomeV1_Incomplete | XcmOutcomeV1_Error

export interface XcmOutcomeV1_Complete {
  __kind: 'Complete'
  value: bigint
}

export interface XcmOutcomeV1_Incomplete {
  __kind: 'Incomplete'
  value: [bigint, XcmErrorV2]
}

export interface XcmOutcomeV1_Error {
  __kind: 'Error'
  value: XcmErrorV2
}

export type XcmResponseV2 = XcmResponseV2_Null | XcmResponseV2_Assets | XcmResponseV2_ExecutionResult | XcmResponseV2_Version

export interface XcmResponseV2_Null {
  __kind: 'Null'
  value: null
}

export interface XcmResponseV2_Assets {
  __kind: 'Assets'
  value: MultiAssetsV1
}

export interface XcmResponseV2_ExecutionResult {
  __kind: 'ExecutionResult'
  value: ([number, XcmErrorV2] | undefined)
}

export interface XcmResponseV2_Version {
  __kind: 'Version'
  value: XcmVersion
}

export type XcmWeightLimitV2 = XcmWeightLimitV2_Unlimited | XcmWeightLimitV2_Limited

export interface XcmWeightLimitV2_Unlimited {
  __kind: 'Unlimited'
  value: null
}

export interface XcmWeightLimitV2_Limited {
  __kind: 'Limited'
  value: bigint
}

export type XcmInstructionV2 = XcmInstructionV2_WithdrawAsset | XcmInstructionV2_ReserveAssetDeposited | XcmInstructionV2_ReceiveTeleportedAsset | XcmInstructionV2_QueryResponse | XcmInstructionV2_TransferAsset | XcmInstructionV2_TransferReserveAsset | XcmInstructionV2_Transact | XcmInstructionV2_HrmpNewChannelOpenRequest | XcmInstructionV2_HrmpChannelAccepted | XcmInstructionV2_HrmpChannelClosing | XcmInstructionV2_ClearOrigin | XcmInstructionV2_DescendOrigin | XcmInstructionV2_ReportError | XcmInstructionV2_DepositAsset | XcmInstructionV2_DepositReserveAsset | XcmInstructionV2_ExchangeAsset | XcmInstructionV2_InitiateReserveWithdraw | XcmInstructionV2_InitiateTeleport | XcmInstructionV2_QueryHolding | XcmInstructionV2_BuyExecution | XcmInstructionV2_RefundSurplus | XcmInstructionV2_SetErrorHandler | XcmInstructionV2_SetAppendix | XcmInstructionV2_ClearError | XcmInstructionV2_ClaimAsset | XcmInstructionV2_Trap | XcmInstructionV2_SubscribeVersion | XcmInstructionV2_UnsubscribeVersion

export interface XcmInstructionV2_WithdrawAsset {
  __kind: 'WithdrawAsset'
  value: MultiAssetsV1
}

export interface XcmInstructionV2_ReserveAssetDeposited {
  __kind: 'ReserveAssetDeposited'
  value: MultiAssetsV1
}

export interface XcmInstructionV2_ReceiveTeleportedAsset {
  __kind: 'ReceiveTeleportedAsset'
  value: MultiAssetsV1
}

export interface XcmInstructionV2_QueryResponse {
  __kind: 'QueryResponse'
  queryId: bigint
  response: XcmResponseV2
  maxWeight: bigint
}

export interface XcmInstructionV2_TransferAsset {
  __kind: 'TransferAsset'
  assets: MultiAssetsV1
  beneficiary: MultiLocationV1
}

export interface XcmInstructionV2_TransferReserveAsset {
  __kind: 'TransferReserveAsset'
  assets: MultiAssetsV1
  dest: MultiLocationV1
  xcm: XcmV2
}

export interface XcmInstructionV2_Transact {
  __kind: 'Transact'
  originType: XcmOriginKindV0
  requireWeightAtMost: bigint
  call: Uint8Array
}

export interface XcmInstructionV2_HrmpNewChannelOpenRequest {
  __kind: 'HrmpNewChannelOpenRequest'
  sender: number
  maxMessageSize: number
  maxCapacity: number
}

export interface XcmInstructionV2_HrmpChannelAccepted {
  __kind: 'HrmpChannelAccepted'
  recipient: number
}

export interface XcmInstructionV2_HrmpChannelClosing {
  __kind: 'HrmpChannelClosing'
  initiator: number
  sender: number
  recipient: number
}

export interface XcmInstructionV2_ClearOrigin {
  __kind: 'ClearOrigin'
  value: null
}

export interface XcmInstructionV2_DescendOrigin {
  __kind: 'DescendOrigin'
  value: XcmJunctionsV1
}

export interface XcmInstructionV2_ReportError {
  __kind: 'ReportError'
  queryId: bigint
  dest: MultiLocationV1
  maxResponseWeight: bigint
}

export interface XcmInstructionV2_DepositAsset {
  __kind: 'DepositAsset'
  assets: MultiAssetFilterV1
  maxAssets: number
  beneficiary: MultiLocationV1
}

export interface XcmInstructionV2_DepositReserveAsset {
  __kind: 'DepositReserveAsset'
  assets: MultiAssetFilterV1
  maxAssets: number
  dest: MultiLocationV1
  xcm: XcmV2
}

export interface XcmInstructionV2_ExchangeAsset {
  __kind: 'ExchangeAsset'
  give: MultiAssetFilterV1
  receive: MultiAssetsV1
}

export interface XcmInstructionV2_InitiateReserveWithdraw {
  __kind: 'InitiateReserveWithdraw'
  assets: MultiAssetFilterV1
  reserve: MultiLocationV1
  xcm: XcmV2
}

export interface XcmInstructionV2_InitiateTeleport {
  __kind: 'InitiateTeleport'
  assets: MultiAssetFilterV1
  dest: MultiLocationV1
  xcm: XcmV2
}

export interface XcmInstructionV2_QueryHolding {
  __kind: 'QueryHolding'
  queryId: bigint
  dest: MultiLocationV1
  assets: MultiAssetFilterV1
  maxResponseWeight: bigint
}

export interface XcmInstructionV2_BuyExecution {
  __kind: 'BuyExecution'
  fees: MultiAssetV1
  weightLimit: XcmWeightLimitV2
}

export interface XcmInstructionV2_RefundSurplus {
  __kind: 'RefundSurplus'
  value: null
}

export interface XcmInstructionV2_SetErrorHandler {
  __kind: 'SetErrorHandler'
  value: XcmV2
}

export interface XcmInstructionV2_SetAppendix {
  __kind: 'SetAppendix'
  value: XcmV2
}

export interface XcmInstructionV2_ClearError {
  __kind: 'ClearError'
  value: null
}

export interface XcmInstructionV2_ClaimAsset {
  __kind: 'ClaimAsset'
  assets: MultiAssetsV1
  ticket: MultiLocationV1
}

export interface XcmInstructionV2_Trap {
  __kind: 'Trap'
  value: bigint
}

export interface XcmInstructionV2_SubscribeVersion {
  __kind: 'SubscribeVersion'
  queryId: bigint
  maxResponseWeight: bigint
}

export interface XcmInstructionV2_UnsubscribeVersion {
  __kind: 'UnsubscribeVersion'
  value: null
}

export type XcmV2 = XcmInstructionV2[]

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

export type XcmVersion = number

export type VersionedMultiLocation = VersionedMultiLocation_V0 | VersionedMultiLocation_V1

export interface VersionedMultiLocation_V0 {
  __kind: 'V0'
  value: MultiLocationV0
}

export interface VersionedMultiLocation_V1 {
  __kind: 'V1'
  value: MultiLocationV1
}

export type VersionedResponse = VersionedResponse_V0 | VersionedResponse_V1 | VersionedResponse_V2

export interface VersionedResponse_V0 {
  __kind: 'V0'
  value: XcmResponseV0
}

export interface VersionedResponse_V1 {
  __kind: 'V1'
  value: XcmResponseV1
}

export interface VersionedResponse_V2 {
  __kind: 'V2'
  value: XcmResponseV2
}

export type VersionedMultiAsset = VersionedMultiAsset_V0 | VersionedMultiAsset_V1

export interface VersionedMultiAsset_V0 {
  __kind: 'V0'
  value: MultiAssetV0
}

export interface VersionedMultiAsset_V1 {
  __kind: 'V1'
  value: MultiAssetV1
}

export type VersionedMultiAssets = VersionedMultiAssets_V0 | VersionedMultiAssets_V1

export interface VersionedMultiAssets_V0 {
  __kind: 'V0'
  value: MultiAssetV0[]
}

export interface VersionedMultiAssets_V1 {
  __kind: 'V1'
  value: MultiAssetsV1
}
