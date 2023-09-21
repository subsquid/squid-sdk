import {sts, Result, Option, Bytes} from '../../pallet.support'

export type MultiAsset = MultiAsset_AbstractFungible | MultiAsset_AbstractNonFungible | MultiAsset_All | MultiAsset_AllAbstractFungible | MultiAsset_AllAbstractNonFungible | MultiAsset_AllConcreteFungible | MultiAsset_AllConcreteNonFungible | MultiAsset_AllFungible | MultiAsset_AllNonFungible | MultiAsset_ConcreteFungible | MultiAsset_ConcreteNonFungible | MultiAsset_None

export interface MultiAsset_AbstractFungible {
    __kind: 'AbstractFungible'
    id: Bytes,
    instance: bigint,
}

export interface MultiAsset_AbstractNonFungible {
    __kind: 'AbstractNonFungible'
    class: Bytes,
    instance: AssetInstanceV0,
}

export interface MultiAsset_All {
    __kind: 'All'
}

export interface MultiAsset_AllAbstractFungible {
    __kind: 'AllAbstractFungible'
    value: Bytes
}

export interface MultiAsset_AllAbstractNonFungible {
    __kind: 'AllAbstractNonFungible'
    value: Bytes
}

export interface MultiAsset_AllConcreteFungible {
    __kind: 'AllConcreteFungible'
    value: MultiLocationV0
}

export interface MultiAsset_AllConcreteNonFungible {
    __kind: 'AllConcreteNonFungible'
    value: MultiLocationV0
}

export interface MultiAsset_AllFungible {
    __kind: 'AllFungible'
}

export interface MultiAsset_AllNonFungible {
    __kind: 'AllNonFungible'
}

export interface MultiAsset_ConcreteFungible {
    __kind: 'ConcreteFungible'
    id: MultiLocationV0,
    amount: bigint,
}

export interface MultiAsset_ConcreteNonFungible {
    __kind: 'ConcreteNonFungible'
    class: MultiLocationV0,
    instance: AssetInstanceV0,
}

export interface MultiAsset_None {
    __kind: 'None'
}

export const MultiAsset: sts.Type<MultiAsset> = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: sts.bytes(),
            instance: sts.bigint(),
        }),
        AbstractNonFungible: sts.enumStruct({
            class: sts.bytes(),
            instance: AssetInstanceV0,
        }),
        All: sts.unit(),
        AllAbstractFungible: sts.bytes(),
        AllAbstractNonFungible: sts.bytes(),
        AllConcreteFungible: MultiLocationV0,
        AllConcreteNonFungible: MultiLocationV0,
        AllFungible: sts.unit(),
        AllNonFungible: sts.unit(),
        ConcreteFungible: sts.enumStruct({
            id: MultiLocationV0,
            amount: sts.bigint(),
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: AssetInstanceV0,
        }),
        None: sts.unit(),
    }
})

export type MultiLocationV0 = MultiLocationV0_Here | MultiLocationV0_X1 | MultiLocationV0_X2 | MultiLocationV0_X3 | MultiLocationV0_X4 | MultiLocationV0_X5 | MultiLocationV0_X6 | MultiLocationV0_X7 | MultiLocationV0_X8

export interface MultiLocationV0_Here {
    __kind: 'Here'
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

export const MultiLocationV0: sts.Type<MultiLocationV0> = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV0,
        X2: sts.tuple(() => JunctionV0, JunctionV0),
        X3: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0),
        X4: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X5: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X6: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X7: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X8: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
    }
})

export type JunctionV0 = JunctionV0_AccountId32 | JunctionV0_AccountIndex64 | JunctionV0_AccountKey20 | JunctionV0_GeneralIndex | JunctionV0_GeneralKey | JunctionV0_OnlyChild | JunctionV0_PalletInstance | JunctionV0_Parachain | JunctionV0_Parent | JunctionV0_Plurality

export interface JunctionV0_AccountId32 {
    __kind: 'AccountId32'
    network: NetworkId,
    id: AccountId,
}

export interface JunctionV0_AccountIndex64 {
    __kind: 'AccountIndex64'
    network: NetworkId,
    index: bigint,
}

export interface JunctionV0_AccountKey20 {
    __kind: 'AccountKey20'
    network: NetworkId,
    key: Bytes,
}

export interface JunctionV0_GeneralIndex {
    __kind: 'GeneralIndex'
    value: bigint
}

export interface JunctionV0_GeneralKey {
    __kind: 'GeneralKey'
    value: Bytes
}

export interface JunctionV0_OnlyChild {
    __kind: 'OnlyChild'
}

export interface JunctionV0_PalletInstance {
    __kind: 'PalletInstance'
    value: number
}

export interface JunctionV0_Parachain {
    __kind: 'Parachain'
    value: number
}

export interface JunctionV0_Parent {
    __kind: 'Parent'
}

export interface JunctionV0_Plurality {
    __kind: 'Plurality'
    id: BodyId,
    part: BodyPart,
}

export const JunctionV0: sts.Type<JunctionV0> = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: NetworkId,
            id: AccountId,
        }),
        AccountIndex64: sts.enumStruct({
            network: NetworkId,
            index: sts.bigint(),
        }),
        AccountKey20: sts.enumStruct({
            network: NetworkId,
            key: sts.bytes(),
        }),
        GeneralIndex: sts.bigint(),
        GeneralKey: sts.bytes(),
        OnlyChild: sts.unit(),
        PalletInstance: sts.number(),
        Parachain: sts.number(),
        Parent: sts.unit(),
        Plurality: sts.enumStruct({
            id: BodyId,
            part: BodyPart,
        }),
    }
})

export type BodyPart = BodyPart_AtLeastProportion | BodyPart_Fraction | BodyPart_Members | BodyPart_MoreThanProportion | BodyPart_Voice

export interface BodyPart_AtLeastProportion {
    __kind: 'AtLeastProportion'
    nom: number,
    denom: number,
}

export interface BodyPart_Fraction {
    __kind: 'Fraction'
    nom: number,
    denom: number,
}

export interface BodyPart_Members {
    __kind: 'Members'
    value: number
}

export interface BodyPart_MoreThanProportion {
    __kind: 'MoreThanProportion'
    nom: number,
    denom: number,
}

export interface BodyPart_Voice {
    __kind: 'Voice'
}

export const BodyPart: sts.Type<BodyPart> = sts.closedEnum(() => {
    return  {
        AtLeastProportion: sts.enumStruct({
            nom: sts.number(),
            denom: sts.number(),
        }),
        Fraction: sts.enumStruct({
            nom: sts.number(),
            denom: sts.number(),
        }),
        Members: sts.number(),
        MoreThanProportion: sts.enumStruct({
            nom: sts.number(),
            denom: sts.number(),
        }),
        Voice: sts.unit(),
    }
})

export type BodyId = BodyId_Executive | BodyId_Index | BodyId_Judicial | BodyId_Legislative | BodyId_Named | BodyId_Technical | BodyId_Unit

export interface BodyId_Executive {
    __kind: 'Executive'
}

export interface BodyId_Index {
    __kind: 'Index'
    value: number
}

export interface BodyId_Judicial {
    __kind: 'Judicial'
}

export interface BodyId_Legislative {
    __kind: 'Legislative'
}

export interface BodyId_Named {
    __kind: 'Named'
    value: Bytes
}

export interface BodyId_Technical {
    __kind: 'Technical'
}

export interface BodyId_Unit {
    __kind: 'Unit'
}

export const BodyId: sts.Type<BodyId> = sts.closedEnum(() => {
    return  {
        Executive: sts.unit(),
        Index: sts.number(),
        Judicial: sts.unit(),
        Legislative: sts.unit(),
        Named: sts.bytes(),
        Technical: sts.unit(),
        Unit: sts.unit(),
    }
})

export type NetworkId = NetworkId_Any | NetworkId_Kusama | NetworkId_Named | NetworkId_Polkadot

export interface NetworkId_Any {
    __kind: 'Any'
}

export interface NetworkId_Kusama {
    __kind: 'Kusama'
}

export interface NetworkId_Named {
    __kind: 'Named'
    value: Bytes
}

export interface NetworkId_Polkadot {
    __kind: 'Polkadot'
}

export const NetworkId: sts.Type<NetworkId> = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: sts.bytes(),
        Polkadot: sts.unit(),
    }
})

export type AssetInstanceV0 = AssetInstanceV0_Array16 | AssetInstanceV0_Array32 | AssetInstanceV0_Array4 | AssetInstanceV0_Array8 | AssetInstanceV0_Blob | AssetInstanceV0_Index128 | AssetInstanceV0_Index16 | AssetInstanceV0_Index32 | AssetInstanceV0_Index64 | AssetInstanceV0_Index8 | AssetInstanceV0_Undefined

export interface AssetInstanceV0_Array16 {
    __kind: 'Array16'
    value: Bytes
}

export interface AssetInstanceV0_Array32 {
    __kind: 'Array32'
    value: Bytes
}

export interface AssetInstanceV0_Array4 {
    __kind: 'Array4'
    value: Bytes
}

export interface AssetInstanceV0_Array8 {
    __kind: 'Array8'
    value: Bytes
}

export interface AssetInstanceV0_Blob {
    __kind: 'Blob'
    value: Bytes
}

export interface AssetInstanceV0_Index128 {
    __kind: 'Index128'
    value: bigint
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

export interface AssetInstanceV0_Index8 {
    __kind: 'Index8'
    value: number
}

export interface AssetInstanceV0_Undefined {
    __kind: 'Undefined'
}

export const AssetInstanceV0: sts.Type<AssetInstanceV0> = sts.closedEnum(() => {
    return  {
        Array16: sts.bytes(),
        Array32: sts.bytes(),
        Array4: sts.bytes(),
        Array8: sts.bytes(),
        Blob: sts.bytes(),
        Index128: sts.bigint(),
        Index16: sts.number(),
        Index32: sts.number(),
        Index64: sts.bigint(),
        Index8: sts.number(),
        Undefined: sts.unit(),
    }
})

export type MultiSignature = MultiSignature_Ecdsa | MultiSignature_Ed25519 | MultiSignature_Sr25519

export interface MultiSignature_Ecdsa {
    __kind: 'Ecdsa'
    value: EcdsaSignature
}

export interface MultiSignature_Ed25519 {
    __kind: 'Ed25519'
    value: Ed25519Signature
}

export interface MultiSignature_Sr25519 {
    __kind: 'Sr25519'
    value: Sr25519Signature
}

export const MultiSignature: sts.Type<MultiSignature> = sts.closedEnum(() => {
    return  {
        Ecdsa: EcdsaSignature,
        Ed25519: Ed25519Signature,
        Sr25519: Sr25519Signature,
    }
})

export type Sr25519Signature = Bytes

export const Sr25519Signature: sts.Type<Sr25519Signature> = sts.bytes()

export type Ed25519Signature = Bytes

export const Ed25519Signature: sts.Type<Ed25519Signature> = sts.bytes()

export type EcdsaSignature = Bytes

export const EcdsaSignature: sts.Type<EcdsaSignature> = sts.bytes()

export type MultiSigner = MultiSigner_Ecdsa | MultiSigner_Ed25519 | MultiSigner_Sr25519

export interface MultiSigner_Ecdsa {
    __kind: 'Ecdsa'
    value: Bytes
}

export interface MultiSigner_Ed25519 {
    __kind: 'Ed25519'
    value: Bytes
}

export interface MultiSigner_Sr25519 {
    __kind: 'Sr25519'
    value: Bytes
}

export const MultiSigner: sts.Type<MultiSigner> = sts.closedEnum(() => {
    return  {
        Ecdsa: sts.bytes(),
        Ed25519: sts.bytes(),
        Sr25519: sts.bytes(),
    }
})

export type ParachainsInherentData = {
    bitfields: SignedAvailabilityBitfields,
    backedCandidates: BackedCandidate[],
    disputes: MultiDisputeStatementSet,
    parentHeader: Header,
}

export const ParachainsInherentData: sts.Type<ParachainsInherentData> = sts.struct(() => {
    return  {
        bitfields: SignedAvailabilityBitfields,
        backedCandidates: sts.array(() => BackedCandidate),
        disputes: MultiDisputeStatementSet,
        parentHeader: Header,
    }
})

export type Header = {
    parentHash: Hash,
    number: number,
    stateRoot: Hash,
    extrinsicsRoot: Hash,
    digest: Digest,
}

export const Header: sts.Type<Header> = sts.struct(() => {
    return  {
        parentHash: Hash,
        number: sts.number(),
        stateRoot: Hash,
        extrinsicsRoot: Hash,
        digest: Digest,
    }
})

export type Digest = {
    logs: DigestItem[],
}

export const Digest: sts.Type<Digest> = sts.struct(() => {
    return  {
        logs: sts.array(() => DigestItem),
    }
})

export type DigestItem = DigestItem_AuthoritiesChange | DigestItem_ChangesTrieRoot | DigestItem_ChangesTrieSignal | DigestItem_Consensus | DigestItem_Other | DigestItem_PreRuntime | DigestItem_RuntimeEnvironmentUpdated | DigestItem_Seal | DigestItem_SealV0

export interface DigestItem_AuthoritiesChange {
    __kind: 'AuthoritiesChange'
    value: AuthorityId[]
}

export interface DigestItem_ChangesTrieRoot {
    __kind: 'ChangesTrieRoot'
    value: Hash
}

export interface DigestItem_ChangesTrieSignal {
    __kind: 'ChangesTrieSignal'
    value: ChangesTrieSignal
}

export interface DigestItem_Consensus {
    __kind: 'Consensus'
    value: Consensus
}

export interface DigestItem_Other {
    __kind: 'Other'
    value: Bytes
}

export interface DigestItem_PreRuntime {
    __kind: 'PreRuntime'
    value: PreRuntime
}

export interface DigestItem_RuntimeEnvironmentUpdated {
    __kind: 'RuntimeEnvironmentUpdated'
}

export interface DigestItem_Seal {
    __kind: 'Seal'
    value: Seal
}

export interface DigestItem_SealV0 {
    __kind: 'SealV0'
    value: SealV0
}

export const DigestItem: sts.Type<DigestItem> = sts.closedEnum(() => {
    return  {
        AuthoritiesChange: sts.array(() => AuthorityId),
        ChangesTrieRoot: Hash,
        ChangesTrieSignal: ChangesTrieSignal,
        Consensus: Consensus,
        Other: sts.bytes(),
        PreRuntime: PreRuntime,
        RuntimeEnvironmentUpdated: sts.unit(),
        Seal: Seal,
        SealV0: SealV0,
    }
})

export type SealV0 = [bigint, Signature]

export const SealV0: sts.Type<SealV0> = sts.tuple(() => sts.bigint(), Signature)

export type Signature = Bytes

export const Signature: sts.Type<Signature> = sts.bytes()

export type Seal = [ConsensusEngineId, Bytes]

export const Seal: sts.Type<Seal> = sts.tuple(() => ConsensusEngineId, sts.bytes())

export type PreRuntime = [ConsensusEngineId, Bytes]

export const PreRuntime: sts.Type<PreRuntime> = sts.tuple(() => ConsensusEngineId, sts.bytes())

export type Consensus = [ConsensusEngineId, Bytes]

export const Consensus: sts.Type<Consensus> = sts.tuple(() => ConsensusEngineId, sts.bytes())

export type ConsensusEngineId = Bytes

export const ConsensusEngineId: sts.Type<ConsensusEngineId> = sts.bytes()

export type ChangesTrieSignal = ChangesTrieSignal_NewConfiguration

export interface ChangesTrieSignal_NewConfiguration {
    __kind: 'NewConfiguration'
    value?: (ChangesTrieConfiguration | undefined)
}

export const ChangesTrieSignal: sts.Type<ChangesTrieSignal> = sts.closedEnum(() => {
    return  {
        NewConfiguration: sts.option(() => ChangesTrieConfiguration),
    }
})

export type ChangesTrieConfiguration = {
    digestInterval: number,
    digestLevels: number,
}

export const ChangesTrieConfiguration: sts.Type<ChangesTrieConfiguration> = sts.struct(() => {
    return  {
        digestInterval: sts.number(),
        digestLevels: sts.number(),
    }
})

export type AuthorityId = Bytes

export const AuthorityId: sts.Type<AuthorityId> = sts.bytes()

export type Hash = Bytes

export const Hash: sts.Type<Hash> = sts.bytes()

export type MultiDisputeStatementSet = DisputeStatementSet[]

export const MultiDisputeStatementSet: sts.Type<MultiDisputeStatementSet> = sts.array(() => DisputeStatementSet)

export type DisputeStatementSet = {
    candidateHash: CandidateHash,
    session: SessionIndex,
    statements: [DisputeStatement, ParaValidatorIndex, ValidatorSignature][],
}

export const DisputeStatementSet: sts.Type<DisputeStatementSet> = sts.struct(() => {
    return  {
        candidateHash: CandidateHash,
        session: SessionIndex,
        statements: sts.array(() => sts.tuple(() => DisputeStatement, ParaValidatorIndex, ValidatorSignature)),
    }
})

export type ValidatorSignature = Bytes

export const ValidatorSignature: sts.Type<ValidatorSignature> = sts.bytes()

export type ParaValidatorIndex = number

export const ParaValidatorIndex: sts.Type<ParaValidatorIndex> = sts.number()

export type DisputeStatement = DisputeStatement_Invalid | DisputeStatement_Valid

export interface DisputeStatement_Invalid {
    __kind: 'Invalid'
    value: InvalidDisputeStatementKind
}

export interface DisputeStatement_Valid {
    __kind: 'Valid'
    value: ValidDisputeStatementKind
}

export const DisputeStatement: sts.Type<DisputeStatement> = sts.closedEnum(() => {
    return  {
        Invalid: InvalidDisputeStatementKind,
        Valid: ValidDisputeStatementKind,
    }
})

export type ValidDisputeStatementKind = ValidDisputeStatementKind_ApprovalChecking | ValidDisputeStatementKind_BackingSeconded | ValidDisputeStatementKind_BackingValid | ValidDisputeStatementKind_Explicit

export interface ValidDisputeStatementKind_ApprovalChecking {
    __kind: 'ApprovalChecking'
}

export interface ValidDisputeStatementKind_BackingSeconded {
    __kind: 'BackingSeconded'
    value: Hash
}

export interface ValidDisputeStatementKind_BackingValid {
    __kind: 'BackingValid'
    value: Hash
}

export interface ValidDisputeStatementKind_Explicit {
    __kind: 'Explicit'
}

export const ValidDisputeStatementKind: sts.Type<ValidDisputeStatementKind> = sts.closedEnum(() => {
    return  {
        ApprovalChecking: sts.unit(),
        BackingSeconded: Hash,
        BackingValid: Hash,
        Explicit: sts.unit(),
    }
})

export type InvalidDisputeStatementKind = InvalidDisputeStatementKind_Explicit

export interface InvalidDisputeStatementKind_Explicit {
    __kind: 'Explicit'
}

export const InvalidDisputeStatementKind: sts.Type<InvalidDisputeStatementKind> = sts.closedEnum(() => {
    return  {
        Explicit: sts.unit(),
    }
})

export type CandidateHash = Bytes

export const CandidateHash: sts.Type<CandidateHash> = sts.bytes()

export type BackedCandidate = {
    candidate: CommittedCandidateReceipt,
    validityVotes: ValidityAttestation[],
    validatorIndices: Uint8Array,
}

export const BackedCandidate: sts.Type<BackedCandidate> = sts.struct(() => {
    return  {
        candidate: CommittedCandidateReceipt,
        validityVotes: sts.array(() => ValidityAttestation),
        validatorIndices: sts.uint8array(),
    }
})

export type ValidityAttestation = ValidityAttestation_Explicit | ValidityAttestation_Implicit | ValidityAttestation_Never

export interface ValidityAttestation_Explicit {
    __kind: 'Explicit'
    value: ValidatorSignature
}

export interface ValidityAttestation_Implicit {
    __kind: 'Implicit'
    value: ValidatorSignature
}

export interface ValidityAttestation_Never {
    __kind: 'Never'
}

export const ValidityAttestation: sts.Type<ValidityAttestation> = sts.closedEnum(() => {
    return  {
        Explicit: ValidatorSignature,
        Implicit: ValidatorSignature,
        Never: sts.unit(),
    }
})

export type CommittedCandidateReceipt = {
    descriptor: CandidateDescriptor,
    commitments: CandidateCommitments,
}

export const CommittedCandidateReceipt: sts.Type<CommittedCandidateReceipt> = sts.struct(() => {
    return  {
        descriptor: CandidateDescriptor,
        commitments: CandidateCommitments,
    }
})

export type CandidateCommitments = {
    upwardMessages: UpwardMessage[],
    horizontalMessages: OutboundHrmpMessage[],
    newValidationCode?: (ValidationCode | undefined),
    headData: HeadData,
    processedDownwardMessages: number,
    hrmpWatermark: BlockNumber,
}

export const CandidateCommitments: sts.Type<CandidateCommitments> = sts.struct(() => {
    return  {
        upwardMessages: sts.array(() => UpwardMessage),
        horizontalMessages: sts.array(() => OutboundHrmpMessage),
        newValidationCode: sts.option(() => ValidationCode),
        headData: HeadData,
        processedDownwardMessages: sts.number(),
        hrmpWatermark: BlockNumber,
    }
})

export type OutboundHrmpMessage = {
    recipient: number,
    data: Bytes,
}

export const OutboundHrmpMessage: sts.Type<OutboundHrmpMessage> = sts.struct(() => {
    return  {
        recipient: sts.number(),
        data: sts.bytes(),
    }
})

export type UpwardMessage = Bytes

export const UpwardMessage: sts.Type<UpwardMessage> = sts.bytes()

export type CandidateDescriptor = {
    paraId: ParaId,
    relayParent: RelayChainHash,
    collatorId: CollatorId,
    persistedValidationDataHash: Hash,
    povHash: Hash,
    erasureRoot: Hash,
    signature: CollatorSignature,
    paraHead: Hash,
    validationCodeHash: ValidationCodeHash,
}

export const CandidateDescriptor: sts.Type<CandidateDescriptor> = sts.struct(() => {
    return  {
        paraId: ParaId,
        relayParent: RelayChainHash,
        collatorId: CollatorId,
        persistedValidationDataHash: Hash,
        povHash: Hash,
        erasureRoot: Hash,
        signature: CollatorSignature,
        paraHead: Hash,
        validationCodeHash: ValidationCodeHash,
    }
})

export type ValidationCodeHash = Bytes

export const ValidationCodeHash: sts.Type<ValidationCodeHash> = sts.bytes()

export type CollatorSignature = Bytes

export const CollatorSignature: sts.Type<CollatorSignature> = sts.bytes()

export type CollatorId = Bytes

export const CollatorId: sts.Type<CollatorId> = sts.bytes()

export type RelayChainHash = Bytes

export const RelayChainHash: sts.Type<RelayChainHash> = sts.bytes()

export type SignedAvailabilityBitfields = SignedAvailabilityBitfield[]

export const SignedAvailabilityBitfields: sts.Type<SignedAvailabilityBitfields> = sts.array(() => SignedAvailabilityBitfield)

export type SignedAvailabilityBitfield = {
    payload: Uint8Array,
    validatorIndex: ParaValidatorIndex,
    signature: ValidatorSignature,
}

export const SignedAvailabilityBitfield: sts.Type<SignedAvailabilityBitfield> = sts.struct(() => {
    return  {
        payload: sts.uint8array(),
        validatorIndex: ParaValidatorIndex,
        signature: ValidatorSignature,
    }
})

export type Weight = bigint

export const Weight: sts.Type<Weight> = sts.bigint()

export type LookupSource = LookupSource_Address20 | LookupSource_Address32 | LookupSource_Id | LookupSource_Index | LookupSource_Raw

export interface LookupSource_Address20 {
    __kind: 'Address20'
    value: H160
}

export interface LookupSource_Address32 {
    __kind: 'Address32'
    value: H256
}

export interface LookupSource_Id {
    __kind: 'Id'
    value: AccountId
}

export interface LookupSource_Index {
    __kind: 'Index'
    value: number
}

export interface LookupSource_Raw {
    __kind: 'Raw'
    value: Bytes
}

export const LookupSource: sts.Type<LookupSource> = sts.closedEnum(() => {
    return  {
        Address20: H160,
        Address32: H256,
        Id: AccountId,
        Index: sts.number(),
        Raw: sts.bytes(),
    }
})

export type H256 = Bytes

export const H256: sts.Type<H256> = sts.bytes()

export type H160 = Bytes

export const H160: sts.Type<H160> = sts.bytes()

export type Renouncing = Renouncing_Candidate | Renouncing_Member | Renouncing_RunnerUp

export interface Renouncing_Candidate {
    __kind: 'Candidate'
    value: number
}

export interface Renouncing_Member {
    __kind: 'Member'
}

export interface Renouncing_RunnerUp {
    __kind: 'RunnerUp'
}

export const Renouncing: sts.Type<Renouncing> = sts.closedEnum(() => {
    return  {
        Candidate: sts.number(),
        Member: sts.unit(),
        RunnerUp: sts.unit(),
    }
})

export type SolutionOrSnapshotSize = {
    voters: number,
    targets: number,
}

export const SolutionOrSnapshotSize: sts.Type<SolutionOrSnapshotSize> = sts.struct(() => {
    return  {
        voters: sts.number(),
        targets: sts.number(),
    }
})

export type RawSolution = {
    compact: CompactAssignmentsWith24,
    score: ElectionScore,
    round: number,
}

export const RawSolution: sts.Type<RawSolution> = sts.struct(() => {
    return  {
        compact: CompactAssignmentsWith24,
        score: ElectionScore,
        round: sts.number(),
    }
})

export type ElectionScore = bigint[]

export const ElectionScore: sts.Type<ElectionScore> = sts.array(() => sts.bigint())

export type CompactAssignmentsWith24 = {
    votes1: [NominatorIndexCompact, ValidatorIndexCompact][],
    votes2: [NominatorIndexCompact, CompactScoreCompact, ValidatorIndexCompact][],
    votes3: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes4: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes5: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes6: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes7: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes8: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes9: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes10: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes11: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes12: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes13: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes14: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes15: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes16: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes17: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes18: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes19: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes20: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes21: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes22: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes23: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
    votes24: [NominatorIndexCompact, CompactScoreCompact[], ValidatorIndexCompact][],
}

export const CompactAssignmentsWith24: sts.Type<CompactAssignmentsWith24> = sts.struct(() => {
    return  {
        votes1: sts.array(() => sts.tuple(() => NominatorIndexCompact, ValidatorIndexCompact)),
        votes2: sts.array(() => sts.tuple(() => NominatorIndexCompact, CompactScoreCompact, ValidatorIndexCompact)),
        votes3: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes4: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes5: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes6: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes7: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes8: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes9: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes10: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes11: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes12: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes13: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes14: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes15: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes16: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes17: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes18: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes19: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes20: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes21: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes22: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes23: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
        votes24: sts.array(() => sts.tuple(() => NominatorIndexCompact, sts.array(() => CompactScoreCompact), ValidatorIndexCompact)),
    }
})

export type CompactScoreCompact = [ValidatorIndexCompact, OffchainAccuracyCompact]

export const CompactScoreCompact: sts.Type<CompactScoreCompact> = sts.tuple(() => ValidatorIndexCompact, OffchainAccuracyCompact)

export type OffchainAccuracyCompact = number

export const OffchainAccuracyCompact: sts.Type<OffchainAccuracyCompact> = sts.number()

export type ValidatorIndexCompact = number

export const ValidatorIndexCompact: sts.Type<ValidatorIndexCompact> = sts.number()

export type NominatorIndexCompact = number

export const NominatorIndexCompact: sts.Type<NominatorIndexCompact> = sts.number()

export type ProxyType = ProxyType_Any | ProxyType_Auction | ProxyType_CancelProxy | ProxyType_Governance | ProxyType_IdentityJudgement | ProxyType_NonTransfer | ProxyType_Staking

export interface ProxyType_Any {
    __kind: 'Any'
}

export interface ProxyType_Auction {
    __kind: 'Auction'
}

export interface ProxyType_CancelProxy {
    __kind: 'CancelProxy'
}

export interface ProxyType_Governance {
    __kind: 'Governance'
}

export interface ProxyType_IdentityJudgement {
    __kind: 'IdentityJudgement'
}

export interface ProxyType_NonTransfer {
    __kind: 'NonTransfer'
}

export interface ProxyType_Staking {
    __kind: 'Staking'
}

export const ProxyType: sts.Type<ProxyType> = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Auction: sts.unit(),
        CancelProxy: sts.unit(),
        Governance: sts.unit(),
        IdentityJudgement: sts.unit(),
        NonTransfer: sts.unit(),
        Staking: sts.unit(),
    }
})

export type Priority = number

export const Priority: sts.Type<Priority> = sts.number()

export type Period = [BlockNumber, number]

export const Period: sts.Type<Period> = sts.tuple(() => BlockNumber, sts.number())

export type Type_138 = Type_138_Auctions | Type_138_AuthorityDiscovery | Type_138_Authorship | Type_138_Babe | Type_138_Balances | Type_138_Bounties | Type_138_Claims | Type_138_Council | Type_138_Crowdloan | Type_138_Democracy | Type_138_ElectionProviderMultiPhase | Type_138_Gilt | Type_138_Grandpa | Type_138_Identity | Type_138_ImOnline | Type_138_Indices | Type_138_Multisig | Type_138_Offences | Type_138_ParachainsConfiguration | Type_138_Paras | Type_138_ParasDmp | Type_138_ParasHrmp | Type_138_ParasInclusion | Type_138_ParasInherent | Type_138_ParasInitializer | Type_138_ParasScheduler | Type_138_ParasSessionInfo | Type_138_ParasShared | Type_138_ParasUmp | Type_138_PhragmenElection | Type_138_Proxy | Type_138_Recovery | Type_138_Registrar | Type_138_Scheduler | Type_138_Session | Type_138_Slots | Type_138_Society | Type_138_Staking | Type_138_System | Type_138_TechnicalCommittee | Type_138_TechnicalMembership | Type_138_Timestamp | Type_138_Tips | Type_138_Treasury | Type_138_Utility | Type_138_Vesting | Type_138_XcmPallet

export interface Type_138_Auctions {
    __kind: 'Auctions'
    value: AuctionsCall
}

export interface Type_138_AuthorityDiscovery {
    __kind: 'AuthorityDiscovery'
    value: AuthorityDiscoveryCall
}

export interface Type_138_Authorship {
    __kind: 'Authorship'
    value: AuthorshipCall
}

export interface Type_138_Babe {
    __kind: 'Babe'
    value: BabeCall
}

export interface Type_138_Balances {
    __kind: 'Balances'
    value: BalancesCall
}

export interface Type_138_Bounties {
    __kind: 'Bounties'
    value: BountiesCall
}

export interface Type_138_Claims {
    __kind: 'Claims'
    value: ClaimsCall
}

export interface Type_138_Council {
    __kind: 'Council'
    value: CouncilCall
}

export interface Type_138_Crowdloan {
    __kind: 'Crowdloan'
    value: CrowdloanCall
}

export interface Type_138_Democracy {
    __kind: 'Democracy'
    value: DemocracyCall
}

export interface Type_138_ElectionProviderMultiPhase {
    __kind: 'ElectionProviderMultiPhase'
    value: ElectionProviderMultiPhaseCall
}

export interface Type_138_Gilt {
    __kind: 'Gilt'
    value: GiltCall
}

export interface Type_138_Grandpa {
    __kind: 'Grandpa'
    value: GrandpaCall
}

export interface Type_138_Identity {
    __kind: 'Identity'
    value: IdentityCall
}

export interface Type_138_ImOnline {
    __kind: 'ImOnline'
    value: ImOnlineCall
}

export interface Type_138_Indices {
    __kind: 'Indices'
    value: IndicesCall
}

export interface Type_138_Multisig {
    __kind: 'Multisig'
    value: MultisigCall
}

export interface Type_138_Offences {
    __kind: 'Offences'
    value: OffencesCall
}

export interface Type_138_ParachainsConfiguration {
    __kind: 'ParachainsConfiguration'
    value: ParachainsConfigurationCall
}

export interface Type_138_Paras {
    __kind: 'Paras'
    value: ParasCall
}

export interface Type_138_ParasDmp {
    __kind: 'ParasDmp'
    value: ParasDmpCall
}

export interface Type_138_ParasHrmp {
    __kind: 'ParasHrmp'
    value: ParasHrmpCall
}

export interface Type_138_ParasInclusion {
    __kind: 'ParasInclusion'
    value: ParasInclusionCall
}

export interface Type_138_ParasInherent {
    __kind: 'ParasInherent'
    value: ParasInherentCall
}

export interface Type_138_ParasInitializer {
    __kind: 'ParasInitializer'
    value: ParasInitializerCall
}

export interface Type_138_ParasScheduler {
    __kind: 'ParasScheduler'
    value: ParasSchedulerCall
}

export interface Type_138_ParasSessionInfo {
    __kind: 'ParasSessionInfo'
    value: ParasSessionInfoCall
}

export interface Type_138_ParasShared {
    __kind: 'ParasShared'
    value: ParasSharedCall
}

export interface Type_138_ParasUmp {
    __kind: 'ParasUmp'
    value: ParasUmpCall
}

export interface Type_138_PhragmenElection {
    __kind: 'PhragmenElection'
    value: PhragmenElectionCall
}

export interface Type_138_Proxy {
    __kind: 'Proxy'
    value: ProxyCall
}

export interface Type_138_Recovery {
    __kind: 'Recovery'
    value: RecoveryCall
}

export interface Type_138_Registrar {
    __kind: 'Registrar'
    value: RegistrarCall
}

export interface Type_138_Scheduler {
    __kind: 'Scheduler'
    value: SchedulerCall
}

export interface Type_138_Session {
    __kind: 'Session'
    value: SessionCall
}

export interface Type_138_Slots {
    __kind: 'Slots'
    value: SlotsCall
}

export interface Type_138_Society {
    __kind: 'Society'
    value: SocietyCall
}

export interface Type_138_Staking {
    __kind: 'Staking'
    value: StakingCall
}

export interface Type_138_System {
    __kind: 'System'
    value: SystemCall
}

export interface Type_138_TechnicalCommittee {
    __kind: 'TechnicalCommittee'
    value: TechnicalCommitteeCall
}

export interface Type_138_TechnicalMembership {
    __kind: 'TechnicalMembership'
    value: TechnicalMembershipCall
}

export interface Type_138_Timestamp {
    __kind: 'Timestamp'
    value: TimestampCall
}

export interface Type_138_Tips {
    __kind: 'Tips'
    value: TipsCall
}

export interface Type_138_Treasury {
    __kind: 'Treasury'
    value: TreasuryCall
}

export interface Type_138_Utility {
    __kind: 'Utility'
    value: UtilityCall
}

export interface Type_138_Vesting {
    __kind: 'Vesting'
    value: VestingCall
}

export interface Type_138_XcmPallet {
    __kind: 'XcmPallet'
    value: XcmPalletCall
}

export const Type_138: sts.Type<Type_138> = sts.closedEnum(() => {
    return  {
        Auctions: AuctionsCall,
        AuthorityDiscovery: AuthorityDiscoveryCall,
        Authorship: AuthorshipCall,
        Babe: BabeCall,
        Balances: BalancesCall,
        Bounties: BountiesCall,
        Claims: ClaimsCall,
        Council: CouncilCall,
        Crowdloan: CrowdloanCall,
        Democracy: DemocracyCall,
        ElectionProviderMultiPhase: ElectionProviderMultiPhaseCall,
        Gilt: GiltCall,
        Grandpa: GrandpaCall,
        Identity: IdentityCall,
        ImOnline: ImOnlineCall,
        Indices: IndicesCall,
        Multisig: MultisigCall,
        Offences: OffencesCall,
        ParachainsConfiguration: ParachainsConfigurationCall,
        Paras: ParasCall,
        ParasDmp: ParasDmpCall,
        ParasHrmp: ParasHrmpCall,
        ParasInclusion: ParasInclusionCall,
        ParasInherent: ParasInherentCall,
        ParasInitializer: ParasInitializerCall,
        ParasScheduler: ParasSchedulerCall,
        ParasSessionInfo: ParasSessionInfoCall,
        ParasShared: ParasSharedCall,
        ParasUmp: ParasUmpCall,
        PhragmenElection: PhragmenElectionCall,
        Proxy: ProxyCall,
        Recovery: RecoveryCall,
        Registrar: RegistrarCall,
        Scheduler: SchedulerCall,
        Session: SessionCall,
        Slots: SlotsCall,
        Society: SocietyCall,
        Staking: StakingCall,
        System: SystemCall,
        TechnicalCommittee: TechnicalCommitteeCall,
        TechnicalMembership: TechnicalMembershipCall,
        Timestamp: TimestampCall,
        Tips: TipsCall,
        Treasury: TreasuryCall,
        Utility: UtilityCall,
        Vesting: VestingCall,
        XcmPallet: XcmPalletCall,
    }
})

export type XcmPalletCall = XcmPalletCall_execute | XcmPalletCall_send | XcmPalletCall_teleport_assets

/**
 *  Execute an XCM message from a local, signed, origin.
 * 
 *  An event is deposited indicating whether `msg` could be executed completely or only
 *  partially.
 * 
 *  No more than `max_weight` will be used in its attempted execution. If this is less than the
 *  maximum amount of weight that the message could take to be executed, then no execution
 *  attempt will be made.
 * 
 *  NOTE: A successful return to this does *not* imply that the `msg` was executed successfully
 *  to completion; only that *some* of it was executed.
 */
export interface XcmPalletCall_execute {
    __kind: 'execute'
    message: Xcm,
    maxWeight: Weight,
}

export interface XcmPalletCall_send {
    __kind: 'send'
    dest: MultiLocation,
    message: Xcm,
}

/**
 *  Teleport some assets from the local chain to some destination chain.
 * 
 *  - `origin`: Must be capable of withdrawing the `assets` and executing XCM.
 *  - `dest`: Destination context for the assets. Will typically be `X2(Parent, Parachain(..))` to send
 *    from parachain to parachain, or `X1(Parachain(..))` to send from relay to parachain.
 *  - `beneficiary`: A beneficiary location for the assets in the context of `dest`. Will generally be
 *    an `AccountId32` value.
 *  - `assets`: The assets to be withdrawn. This should include the assets used to pay the fee on the
 *    `dest` side.
 *  - `dest_weight`: Equal to the total weight on `dest` of the XCM message
 *    `Teleport { assets, effects: [ BuyExecution{..}, DepositAsset{..} ] }`.
 */
export interface XcmPalletCall_teleport_assets {
    __kind: 'teleport_assets'
    dest: MultiLocation,
    beneficiary: MultiLocation,
    assets: MultiAsset[],
    destWeight: Weight,
}

export const XcmPalletCall: sts.Type<XcmPalletCall> = sts.closedEnum(() => {
    return  {
        execute: sts.enumStruct({
            message: Xcm,
            maxWeight: Weight,
        }),
        send: sts.enumStruct({
            dest: MultiLocation,
            message: Xcm,
        }),
        teleport_assets: sts.enumStruct({
            dest: MultiLocation,
            beneficiary: MultiLocation,
            assets: sts.array(() => MultiAsset),
            destWeight: Weight,
        }),
    }
})

export type VestingCall = VestingCall_force_vested_transfer | VestingCall_vest | VestingCall_vest_other | VestingCall_vested_transfer

/**
 *  Force a vested transfer.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  - `source`: The account whose funds should be transferred.
 *  - `target`: The account that should be transferred the vested funds.
 *  - `amount`: The amount of funds to transfer and will be vested.
 *  - `schedule`: The vesting schedule attached to the transfer.
 * 
 *  Emits `VestingCreated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - DbWeight: 4 Reads, 4 Writes
 *      - Reads: Vesting Storage, Balances Locks, Target Account, Source Account
 *      - Writes: Vesting Storage, Balances Locks, Target Account, Source Account
 *  # </weight>
 */
export interface VestingCall_force_vested_transfer {
    __kind: 'force_vested_transfer'
    source: LookupSource,
    target: LookupSource,
    schedule: VestingInfo,
}

/**
 *  Unlock any vested funds of the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have funds still
 *  locked under this pallet.
 * 
 *  Emits either `VestingCompleted` or `VestingUpdated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - DbWeight: 2 Reads, 2 Writes
 *      - Reads: Vesting Storage, Balances Locks, [Sender Account]
 *      - Writes: Vesting Storage, Balances Locks, [Sender Account]
 *  # </weight>
 */
export interface VestingCall_vest {
    __kind: 'vest'
}

/**
 *  Unlock any vested funds of a `target` account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `target`: The account whose vested funds should be unlocked. Must have funds still
 *  locked under this pallet.
 * 
 *  Emits either `VestingCompleted` or `VestingUpdated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - DbWeight: 3 Reads, 3 Writes
 *      - Reads: Vesting Storage, Balances Locks, Target Account
 *      - Writes: Vesting Storage, Balances Locks, Target Account
 *  # </weight>
 */
export interface VestingCall_vest_other {
    __kind: 'vest_other'
    target: LookupSource,
}

/**
 *  Create a vested transfer.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `target`: The account that should be transferred the vested funds.
 *  - `amount`: The amount of funds to transfer and will be vested.
 *  - `schedule`: The vesting schedule attached to the transfer.
 * 
 *  Emits `VestingCreated`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - DbWeight: 3 Reads, 3 Writes
 *      - Reads: Vesting Storage, Balances Locks, Target Account, [Sender Account]
 *      - Writes: Vesting Storage, Balances Locks, Target Account, [Sender Account]
 *  # </weight>
 */
export interface VestingCall_vested_transfer {
    __kind: 'vested_transfer'
    target: LookupSource,
    schedule: VestingInfo,
}

export const VestingCall: sts.Type<VestingCall> = sts.closedEnum(() => {
    return  {
        force_vested_transfer: sts.enumStruct({
            source: LookupSource,
            target: LookupSource,
            schedule: VestingInfo,
        }),
        vest: sts.unit(),
        vest_other: sts.enumStruct({
            target: LookupSource,
        }),
        vested_transfer: sts.enumStruct({
            target: LookupSource,
            schedule: VestingInfo,
        }),
    }
})

export type VestingInfo = {
    locked: Balance,
    perBlock: Balance,
    startingBlock: BlockNumber,
}

export const VestingInfo: sts.Type<VestingInfo> = sts.struct(() => {
    return  {
        locked: Balance,
        perBlock: Balance,
        startingBlock: BlockNumber,
    }
})

export type UtilityCall = UtilityCall_as_derivative | UtilityCall_batch | UtilityCall_batch_all

/**
 *  Send a call through an indexed pseudonym of the sender.
 * 
 *  Filter from origin are passed along. The call will be dispatched with an origin which
 *  use the same filter as the origin of this call.
 * 
 *  NOTE: If you need to ensure that any account-based filtering is not honored (i.e.
 *  because you expect `proxy` to have been used prior in the call stack and you do not want
 *  the call restrictions to apply to any sub-accounts), then use `as_multi_threshold_1`
 *  in the Multisig pallet instead.
 * 
 *  NOTE: Prior to version *12, this was called `as_limited_sub`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 */
export interface UtilityCall_as_derivative {
    __kind: 'as_derivative'
    index: number,
    call: Type_138,
}

/**
 *  Send a batch of dispatch calls.
 * 
 *  May be called from any origin.
 * 
 *  - `calls`: The calls to be dispatched from the same origin.
 * 
 *  If origin is root then call are dispatch without checking origin filter. (This includes
 *  bypassing `frame_system::Config::BaseCallFilter`).
 * 
 *  # <weight>
 *  - Complexity: O(C) where C is the number of calls to be batched.
 *  # </weight>
 * 
 *  This will return `Ok` in all circumstances. To determine the success of the batch, an
 *  event is deposited. If a call failed and the batch was interrupted, then the
 *  `BatchInterrupted` event is deposited, along with the number of successful calls made
 *  and the error of the failed call. If all were successful, then the `BatchCompleted`
 *  event is deposited.
 */
export interface UtilityCall_batch {
    __kind: 'batch'
    calls: Type_138[],
}

/**
 *  Send a batch of dispatch calls and atomically execute them.
 *  The whole transaction will rollback and fail if any of the calls failed.
 * 
 *  May be called from any origin.
 * 
 *  - `calls`: The calls to be dispatched from the same origin.
 * 
 *  If origin is root then call are dispatch without checking origin filter. (This includes
 *  bypassing `frame_system::Config::BaseCallFilter`).
 * 
 *  # <weight>
 *  - Complexity: O(C) where C is the number of calls to be batched.
 *  # </weight>
 */
export interface UtilityCall_batch_all {
    __kind: 'batch_all'
    calls: Type_138[],
}

export const UtilityCall: sts.Type<UtilityCall> = sts.closedEnum(() => {
    return  {
        as_derivative: sts.enumStruct({
            index: sts.number(),
            call: Type_138,
        }),
        batch: sts.enumStruct({
            calls: sts.array(() => Type_138),
        }),
        batch_all: sts.enumStruct({
            calls: sts.array(() => Type_138),
        }),
    }
})

export type TreasuryCall = TreasuryCall_approve_proposal | TreasuryCall_propose_spend | TreasuryCall_reject_proposal

/**
 *  Approve a proposal. At a later time, the proposal will be allocated to the beneficiary
 *  and the original deposit will be returned.
 * 
 *  May only be called from `T::ApproveOrigin`.
 * 
 *  # <weight>
 *  - Complexity: O(1).
 *  - DbReads: `Proposals`, `Approvals`
 *  - DbWrite: `Approvals`
 *  # </weight>
 */
export interface TreasuryCall_approve_proposal {
    __kind: 'approve_proposal'
    proposalId: number,
}

/**
 *  Put forward a suggestion for spending. A deposit proportional to the value
 *  is reserved and slashed if the proposal is rejected. It is returned once the
 *  proposal is awarded.
 * 
 *  # <weight>
 *  - Complexity: O(1)
 *  - DbReads: `ProposalCount`, `origin account`
 *  - DbWrites: `ProposalCount`, `Proposals`, `origin account`
 *  # </weight>
 */
export interface TreasuryCall_propose_spend {
    __kind: 'propose_spend'
    value: bigint,
    beneficiary: LookupSource,
}

/**
 *  Reject a proposed spend. The original deposit will be slashed.
 * 
 *  May only be called from `T::RejectOrigin`.
 * 
 *  # <weight>
 *  - Complexity: O(1)
 *  - DbReads: `Proposals`, `rejected proposer account`
 *  - DbWrites: `Proposals`, `rejected proposer account`
 *  # </weight>
 */
export interface TreasuryCall_reject_proposal {
    __kind: 'reject_proposal'
    proposalId: number,
}

export const TreasuryCall: sts.Type<TreasuryCall> = sts.closedEnum(() => {
    return  {
        approve_proposal: sts.enumStruct({
            proposalId: sts.number(),
        }),
        propose_spend: sts.enumStruct({
            value: sts.bigint(),
            beneficiary: LookupSource,
        }),
        reject_proposal: sts.enumStruct({
            proposalId: sts.number(),
        }),
    }
})

export type TipsCall = TipsCall_close_tip | TipsCall_report_awesome | TipsCall_retract_tip | TipsCall_slash_tip | TipsCall_tip | TipsCall_tip_new

/**
 *  Close and payout a tip.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  The tip identified by `hash` must have finished its countdown period.
 * 
 *  - `hash`: The identity of the open tip for which a tip value is declared. This is formed
 *    as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
 * 
 *  # <weight>
 *  - Complexity: `O(T)` where `T` is the number of tippers.
 *    decoding `Tipper` vec of length `T`.
 *    `T` is charged as upper bound given by `ContainsLengthBound`.
 *    The actual cost depends on the implementation of `T::Tippers`.
 *  - DbReads: `Tips`, `Tippers`, `tip finder`
 *  - DbWrites: `Reasons`, `Tips`, `Tippers`, `tip finder`
 *  # </weight>
 */
export interface TipsCall_close_tip {
    __kind: 'close_tip'
    hash: Hash,
}

/**
 *  Report something `reason` that deserves a tip and claim any eventual the finder's fee.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
 *  `DataDepositPerByte` for each byte in `reason`.
 * 
 *  - `reason`: The reason for, or the thing that deserves, the tip; generally this will be
 *    a UTF-8-encoded URL.
 *  - `who`: The account which should be credited for the tip.
 * 
 *  Emits `NewTip` if successful.
 * 
 *  # <weight>
 *  - Complexity: `O(R)` where `R` length of `reason`.
 *    - encoding and hashing of 'reason'
 *  - DbReads: `Reasons`, `Tips`
 *  - DbWrites: `Reasons`, `Tips`
 *  # </weight>
 */
export interface TipsCall_report_awesome {
    __kind: 'report_awesome'
    reason: Bytes,
    who: AccountId,
}

/**
 *  Retract a prior tip-report from `report_awesome`, and cancel the process of tipping.
 * 
 *  If successful, the original deposit will be unreserved.
 * 
 *  The dispatch origin for this call must be _Signed_ and the tip identified by `hash`
 *  must have been reported by the signing account through `report_awesome` (and not
 *  through `tip_new`).
 * 
 *  - `hash`: The identity of the open tip for which a tip value is declared. This is formed
 *    as the hash of the tuple of the original tip `reason` and the beneficiary account ID.
 * 
 *  Emits `TipRetracted` if successful.
 * 
 *  # <weight>
 *  - Complexity: `O(1)`
 *    - Depends on the length of `T::Hash` which is fixed.
 *  - DbReads: `Tips`, `origin account`
 *  - DbWrites: `Reasons`, `Tips`, `origin account`
 *  # </weight>
 */
export interface TipsCall_retract_tip {
    __kind: 'retract_tip'
    hash: Hash,
}

/**
 *  Remove and slash an already-open tip.
 * 
 *  May only be called from `T::RejectOrigin`.
 * 
 *  As a result, the finder is slashed and the deposits are lost.
 * 
 *  Emits `TipSlashed` if successful.
 * 
 *  # <weight>
 *    `T` is charged as upper bound given by `ContainsLengthBound`.
 *    The actual cost depends on the implementation of `T::Tippers`.
 *  # </weight>
 */
export interface TipsCall_slash_tip {
    __kind: 'slash_tip'
    hash: Hash,
}

/**
 *  Declare a tip value for an already-open tip.
 * 
 *  The dispatch origin for this call must be _Signed_ and the signing account must be a
 *  member of the `Tippers` set.
 * 
 *  - `hash`: The identity of the open tip for which a tip value is declared. This is formed
 *    as the hash of the tuple of the hash of the original tip `reason` and the beneficiary
 *    account ID.
 *  - `tip_value`: The amount of tip that the sender would like to give. The median tip
 *    value of active tippers will be given to the `who`.
 * 
 *  Emits `TipClosing` if the threshold of tippers has been reached and the countdown period
 *  has started.
 * 
 *  # <weight>
 *  - Complexity: `O(T)` where `T` is the number of tippers.
 *    decoding `Tipper` vec of length `T`, insert tip and check closing,
 *    `T` is charged as upper bound given by `ContainsLengthBound`.
 *    The actual cost depends on the implementation of `T::Tippers`.
 * 
 *    Actually weight could be lower as it depends on how many tips are in `OpenTip` but it
 *    is weighted as if almost full i.e of length `T-1`.
 *  - DbReads: `Tippers`, `Tips`
 *  - DbWrites: `Tips`
 *  # </weight>
 */
export interface TipsCall_tip {
    __kind: 'tip'
    hash: Hash,
    tipValue: bigint,
}

/**
 *  Give a tip for something new; no finder's fee will be taken.
 * 
 *  The dispatch origin for this call must be _Signed_ and the signing account must be a
 *  member of the `Tippers` set.
 * 
 *  - `reason`: The reason for, or the thing that deserves, the tip; generally this will be
 *    a UTF-8-encoded URL.
 *  - `who`: The account which should be credited for the tip.
 *  - `tip_value`: The amount of tip that the sender would like to give. The median tip
 *    value of active tippers will be given to the `who`.
 * 
 *  Emits `NewTip` if successful.
 * 
 *  # <weight>
 *  - Complexity: `O(R + T)` where `R` length of `reason`, `T` is the number of tippers.
 *    - `O(T)`: decoding `Tipper` vec of length `T`
 *      `T` is charged as upper bound given by `ContainsLengthBound`.
 *      The actual cost depends on the implementation of `T::Tippers`.
 *    - `O(R)`: hashing and encoding of reason of length `R`
 *  - DbReads: `Tippers`, `Reasons`
 *  - DbWrites: `Reasons`, `Tips`
 *  # </weight>
 */
export interface TipsCall_tip_new {
    __kind: 'tip_new'
    reason: Bytes,
    who: AccountId,
    tipValue: bigint,
}

export const TipsCall: sts.Type<TipsCall> = sts.closedEnum(() => {
    return  {
        close_tip: sts.enumStruct({
            hash: Hash,
        }),
        report_awesome: sts.enumStruct({
            reason: sts.bytes(),
            who: AccountId,
        }),
        retract_tip: sts.enumStruct({
            hash: Hash,
        }),
        slash_tip: sts.enumStruct({
            hash: Hash,
        }),
        tip: sts.enumStruct({
            hash: Hash,
            tipValue: sts.bigint(),
        }),
        tip_new: sts.enumStruct({
            reason: sts.bytes(),
            who: AccountId,
            tipValue: sts.bigint(),
        }),
    }
})

export type TimestampCall = TimestampCall_set

/**
 *  Set the current time.
 * 
 *  This call should be invoked exactly once per block. It will panic at the finalization
 *  phase, if this call hasn't been invoked by that time.
 * 
 *  The timestamp should be greater than the previous one by the amount specified by
 *  `MinimumPeriod`.
 * 
 *  The dispatch origin for this call must be `Inherent`.
 * 
 *  # <weight>
 *  - `O(1)` (Note that implementations of `OnTimestampSet` must also be `O(1)`)
 *  - 1 storage read and 1 storage mutation (codec `O(1)`). (because of `DidUpdate::take` in `on_finalize`)
 *  - 1 event handler `on_timestamp_set`. Must be `O(1)`.
 *  # </weight>
 */
export interface TimestampCall_set {
    __kind: 'set'
    now: bigint,
}

export const TimestampCall: sts.Type<TimestampCall> = sts.closedEnum(() => {
    return  {
        set: sts.enumStruct({
            now: sts.bigint(),
        }),
    }
})

export type TechnicalMembershipCall = TechnicalMembershipCall_add_member | TechnicalMembershipCall_change_key | TechnicalMembershipCall_clear_prime | TechnicalMembershipCall_remove_member | TechnicalMembershipCall_reset_members | TechnicalMembershipCall_set_prime | TechnicalMembershipCall_swap_member

/**
 *  Add a member `who` to the set.
 * 
 *  May only be called from `T::AddOrigin`.
 */
export interface TechnicalMembershipCall_add_member {
    __kind: 'add_member'
    who: AccountId,
}

/**
 *  Swap out the sending member for some other key `new`.
 * 
 *  May only be called from `Signed` origin of a current member.
 * 
 *  Prime membership is passed from the origin account to `new`, if extant.
 */
export interface TechnicalMembershipCall_change_key {
    __kind: 'change_key'
    new: AccountId,
}

/**
 *  Remove the prime member if it exists.
 * 
 *  May only be called from `T::PrimeOrigin`.
 */
export interface TechnicalMembershipCall_clear_prime {
    __kind: 'clear_prime'
}

/**
 *  Remove a member `who` from the set.
 * 
 *  May only be called from `T::RemoveOrigin`.
 */
export interface TechnicalMembershipCall_remove_member {
    __kind: 'remove_member'
    who: AccountId,
}

/**
 *  Change the membership to a new set, disregarding the existing membership. Be nice and
 *  pass `members` pre-sorted.
 * 
 *  May only be called from `T::ResetOrigin`.
 */
export interface TechnicalMembershipCall_reset_members {
    __kind: 'reset_members'
    members: AccountId[],
}

/**
 *  Set the prime member. Must be a current member.
 * 
 *  May only be called from `T::PrimeOrigin`.
 */
export interface TechnicalMembershipCall_set_prime {
    __kind: 'set_prime'
    who: AccountId,
}

/**
 *  Swap out one member `remove` for another `add`.
 * 
 *  May only be called from `T::SwapOrigin`.
 * 
 *  Prime membership is *not* passed from `remove` to `add`, if extant.
 */
export interface TechnicalMembershipCall_swap_member {
    __kind: 'swap_member'
    remove: AccountId,
    add: AccountId,
}

export const TechnicalMembershipCall: sts.Type<TechnicalMembershipCall> = sts.closedEnum(() => {
    return  {
        add_member: sts.enumStruct({
            who: AccountId,
        }),
        change_key: sts.enumStruct({
            new: AccountId,
        }),
        clear_prime: sts.unit(),
        remove_member: sts.enumStruct({
            who: AccountId,
        }),
        reset_members: sts.enumStruct({
            members: sts.array(() => AccountId),
        }),
        set_prime: sts.enumStruct({
            who: AccountId,
        }),
        swap_member: sts.enumStruct({
            remove: AccountId,
            add: AccountId,
        }),
    }
})

export type TechnicalCommitteeCall = TechnicalCommitteeCall_close | TechnicalCommitteeCall_disapprove_proposal | TechnicalCommitteeCall_execute | TechnicalCommitteeCall_propose | TechnicalCommitteeCall_set_members | TechnicalCommitteeCall_vote

/**
 *  Close a vote that is either approved, disapproved or whose voting period has ended.
 * 
 *  May be called by any signed account in order to finish voting and close the proposal.
 * 
 *  If called before the end of the voting period it will only close the vote if it is
 *  has enough votes to be approved or disapproved.
 * 
 *  If called after the end of the voting period abstentions are counted as rejections
 *  unless there is a prime member set and the prime member cast an approval.
 * 
 *  If the close operation completes successfully with disapproval, the transaction fee will
 *  be waived. Otherwise execution of the approved operation will be charged to the caller.
 * 
 *  + `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed proposal.
 *  + `length_bound`: The upper bound for the length of the proposal in storage. Checked via
 *                    `storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(B + M + P1 + P2)` where:
 *    - `B` is `proposal` size in bytes (length-fee-bounded)
 *    - `M` is members-count (code- and governance-bounded)
 *    - `P1` is the complexity of `proposal` preimage.
 *    - `P2` is proposal-count (code-bounded)
 *  - DB:
 *   - 2 storage reads (`Members`: codec `O(M)`, `Prime`: codec `O(1)`)
 *   - 3 mutations (`Voting`: codec `O(M)`, `ProposalOf`: codec `O(B)`, `Proposals`: codec `O(P2)`)
 *   - any mutations done while executing `proposal` (`P1`)
 *  - up to 3 events
 *  # </weight>
 */
export interface TechnicalCommitteeCall_close {
    __kind: 'close'
    proposalHash: Hash,
    index: number,
    proposalWeightBound: bigint,
    lengthBound: number,
}

/**
 *  Disapprove a proposal, close, and remove it from the system, regardless of its current state.
 * 
 *  Must be called by the Root origin.
 * 
 *  Parameters:
 *  * `proposal_hash`: The hash of the proposal that should be disapproved.
 * 
 *  # <weight>
 *  Complexity: O(P) where P is the number of max proposals
 *  DB Weight:
 *  * Reads: Proposals
 *  * Writes: Voting, Proposals, ProposalOf
 *  # </weight>
 */
export interface TechnicalCommitteeCall_disapprove_proposal {
    __kind: 'disapprove_proposal'
    proposalHash: Hash,
}

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(M + P)` where `M` members-count (code-bounded) and `P` complexity of dispatching `proposal`
 *  - DB: 1 read (codec `O(M)`) + DB access of `proposal`
 *  - 1 event
 *  # </weight>
 */
export interface TechnicalCommitteeCall_execute {
    __kind: 'execute'
    proposal: Proposal,
    lengthBound: number,
}

/**
 *  Add a new proposal to either be voted on or executed directly.
 * 
 *  Requires the sender to be member.
 * 
 *  `threshold` determines whether `proposal` is executed directly (`threshold < 2`)
 *  or put up for voting.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(B + M + P1)` or `O(B + M + P2)` where:
 *    - `B` is `proposal` size in bytes (length-fee-bounded)
 *    - `M` is members-count (code- and governance-bounded)
 *    - branching is influenced by `threshold` where:
 *      - `P1` is proposal execution complexity (`threshold < 2`)
 *      - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
 *  - DB:
 *    - 1 storage read `is_member` (codec `O(M)`)
 *    - 1 storage read `ProposalOf::contains_key` (codec `O(1)`)
 *    - DB accesses influenced by `threshold`:
 *      - EITHER storage accesses done by `proposal` (`threshold < 2`)
 *      - OR proposal insertion (`threshold <= 2`)
 *        - 1 storage mutation `Proposals` (codec `O(P2)`)
 *        - 1 storage mutation `ProposalCount` (codec `O(1)`)
 *        - 1 storage write `ProposalOf` (codec `O(B)`)
 *        - 1 storage write `Voting` (codec `O(M)`)
 *    - 1 event
 *  # </weight>
 */
export interface TechnicalCommitteeCall_propose {
    __kind: 'propose'
    threshold: number,
    proposal: Proposal,
    lengthBound: number,
}

/**
 *  Set the collective's membership.
 * 
 *  - `new_members`: The new member list. Be nice to the chain and provide it sorted.
 *  - `prime`: The prime member whose vote sets the default.
 *  - `old_count`: The upper bound for the previous number of members in storage.
 *                 Used for weight estimation.
 * 
 *  Requires root origin.
 * 
 *  NOTE: Does not enforce the expected `MaxMembers` limit on the amount of members, but
 *        the weight estimations rely on it to estimate dispatchable weight.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(MP + N)` where:
 *    - `M` old-members-count (code- and governance-bounded)
 *    - `N` new-members-count (code- and governance-bounded)
 *    - `P` proposals-count (code-bounded)
 *  - DB:
 *    - 1 storage mutation (codec `O(M)` read, `O(N)` write) for reading and writing the members
 *    - 1 storage read (codec `O(P)`) for reading the proposals
 *    - `P` storage mutations (codec `O(M)`) for updating the votes for each proposal
 *    - 1 storage write (codec `O(1)`) for deleting the old `prime` and setting the new one
 *  # </weight>
 */
export interface TechnicalCommitteeCall_set_members {
    __kind: 'set_members'
    newMembers: AccountId[],
    prime?: (AccountId | undefined),
    oldCount: MemberCount,
}

/**
 *  Add an aye or nay vote for the sender to the given proposal.
 * 
 *  Requires the sender to be a member.
 * 
 *  Transaction fees will be waived if the member is voting on any particular proposal
 *  for the first time and the call is successful. Subsequent vote changes will charge a fee.
 *  # <weight>
 *  ## Weight
 *  - `O(M)` where `M` is members-count (code- and governance-bounded)
 *  - DB:
 *    - 1 storage read `Members` (codec `O(M)`)
 *    - 1 storage mutation `Voting` (codec `O(M)`)
 *  - 1 event
 *  # </weight>
 */
export interface TechnicalCommitteeCall_vote {
    __kind: 'vote'
    proposal: Hash,
    index: number,
    approve: boolean,
}

export const TechnicalCommitteeCall: sts.Type<TechnicalCommitteeCall> = sts.closedEnum(() => {
    return  {
        close: sts.enumStruct({
            proposalHash: Hash,
            index: sts.number(),
            proposalWeightBound: sts.bigint(),
            lengthBound: sts.number(),
        }),
        disapprove_proposal: sts.enumStruct({
            proposalHash: Hash,
        }),
        execute: sts.enumStruct({
            proposal: Proposal,
            lengthBound: sts.number(),
        }),
        propose: sts.enumStruct({
            threshold: sts.number(),
            proposal: Proposal,
            lengthBound: sts.number(),
        }),
        set_members: sts.enumStruct({
            newMembers: sts.array(() => AccountId),
            prime: sts.option(() => AccountId),
            oldCount: MemberCount,
        }),
        vote: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
            approve: sts.boolean(),
        }),
    }
})

export type MemberCount = number

export const MemberCount: sts.Type<MemberCount> = sts.number()

export type SystemCall = SystemCall_fill_block | SystemCall_kill_prefix | SystemCall_kill_storage | SystemCall_remark | SystemCall_remark_with_event | SystemCall_set_changes_trie_config | SystemCall_set_code | SystemCall_set_code_without_checks | SystemCall_set_heap_pages | SystemCall_set_storage

/**
 *  A dispatch that will fill the block weight up to the given ratio.
 */
export interface SystemCall_fill_block {
    __kind: 'fill_block'
    ratio: Perbill,
}

/**
 *  Kill all storage items with a key that starts with the given prefix.
 * 
 *  **NOTE:** We rely on the Root origin to provide us the number of subkeys under
 *  the prefix we are removing to accurately calculate the weight of this function.
 * 
 *  # <weight>
 *  - `O(P)` where `P` amount of keys with prefix `prefix`
 *  - `P` storage deletions.
 *  - Base Weight: 0.834 * P µs
 *  - Writes: Number of subkeys + 1
 *  # </weight>
 */
export interface SystemCall_kill_prefix {
    __kind: 'kill_prefix'
    prefix: Key,
    subkeys: number,
}

/**
 *  Kill some items from storage.
 * 
 *  # <weight>
 *  - `O(IK)` where `I` length of `keys` and `K` length of one key
 *  - `I` storage deletions.
 *  - Base Weight: .378 * i µs
 *  - Writes: Number of items
 *  # </weight>
 */
export interface SystemCall_kill_storage {
    __kind: 'kill_storage'
    keys: Key[],
}

/**
 *  Make some on-chain remark.
 * 
 *  # <weight>
 *  - `O(1)`
 *  # </weight>
 */
export interface SystemCall_remark {
    __kind: 'remark'
    remark: Bytes,
}

/**
 *  Make some on-chain remark and emit event.
 * 
 *  # <weight>
 *  - `O(b)` where b is the length of the remark.
 *  - 1 event.
 *  # </weight>
 */
export interface SystemCall_remark_with_event {
    __kind: 'remark_with_event'
    remark: Bytes,
}

/**
 *  Set the new changes trie configuration.
 * 
 *  # <weight>
 *  - `O(1)`
 *  - 1 storage write or delete (codec `O(1)`).
 *  - 1 call to `deposit_log`: Uses `append` API, so O(1)
 *  - Base Weight: 7.218 µs
 *  - DB Weight:
 *      - Writes: Changes Trie, System Digest
 *  # </weight>
 */
export interface SystemCall_set_changes_trie_config {
    __kind: 'set_changes_trie_config'
    changesTrieConfig?: (ChangesTrieConfiguration | undefined),
}

/**
 *  Set the new runtime code.
 * 
 *  # <weight>
 *  - `O(C + S)` where `C` length of `code` and `S` complexity of `can_set_code`
 *  - 1 storage write (codec `O(C)`).
 *  - 1 call to `can_set_code`: `O(S)` (calls `sp_io::misc::runtime_version` which is expensive).
 *  - 1 event.
 *  The weight of this function is dependent on the runtime, but generally this is very expensive.
 *  We will treat this as a full block.
 *  # </weight>
 */
export interface SystemCall_set_code {
    __kind: 'set_code'
    code: Bytes,
}

/**
 *  Set the new runtime code without doing any checks of the given `code`.
 * 
 *  # <weight>
 *  - `O(C)` where `C` length of `code`
 *  - 1 storage write (codec `O(C)`).
 *  - 1 event.
 *  The weight of this function is dependent on the runtime. We will treat this as a full block.
 *  # </weight>
 */
export interface SystemCall_set_code_without_checks {
    __kind: 'set_code_without_checks'
    code: Bytes,
}

/**
 *  Set the number of pages in the WebAssembly environment's heap.
 * 
 *  # <weight>
 *  - `O(1)`
 *  - 1 storage write.
 *  - Base Weight: 1.405 µs
 *  - 1 write to HEAP_PAGES
 *  # </weight>
 */
export interface SystemCall_set_heap_pages {
    __kind: 'set_heap_pages'
    pages: bigint,
}

/**
 *  Set some items of storage.
 * 
 *  # <weight>
 *  - `O(I)` where `I` length of `items`
 *  - `I` storage writes (`O(1)`).
 *  - Base Weight: 0.568 * i µs
 *  - Writes: Number of items
 *  # </weight>
 */
export interface SystemCall_set_storage {
    __kind: 'set_storage'
    items: KeyValue[],
}

export const SystemCall: sts.Type<SystemCall> = sts.closedEnum(() => {
    return  {
        fill_block: sts.enumStruct({
            ratio: Perbill,
        }),
        kill_prefix: sts.enumStruct({
            prefix: Key,
            subkeys: sts.number(),
        }),
        kill_storage: sts.enumStruct({
            keys: sts.array(() => Key),
        }),
        remark: sts.enumStruct({
            remark: sts.bytes(),
        }),
        remark_with_event: sts.enumStruct({
            remark: sts.bytes(),
        }),
        set_changes_trie_config: sts.enumStruct({
            changesTrieConfig: sts.option(() => ChangesTrieConfiguration),
        }),
        set_code: sts.enumStruct({
            code: sts.bytes(),
        }),
        set_code_without_checks: sts.enumStruct({
            code: sts.bytes(),
        }),
        set_heap_pages: sts.enumStruct({
            pages: sts.bigint(),
        }),
        set_storage: sts.enumStruct({
            items: sts.array(() => KeyValue),
        }),
    }
})

export type KeyValue = [StorageKey, StorageData]

export const KeyValue: sts.Type<KeyValue> = sts.tuple(() => StorageKey, StorageData)

export type StorageData = Bytes

export const StorageData: sts.Type<StorageData> = sts.bytes()

export type StorageKey = Bytes

export const StorageKey: sts.Type<StorageKey> = sts.bytes()

export type Key = Bytes

export const Key: sts.Type<Key> = sts.bytes()

export type Perbill = number

export const Perbill: sts.Type<Perbill> = sts.number()

export type StakingCall = StakingCall_bond | StakingCall_bond_extra | StakingCall_cancel_deferred_slash | StakingCall_chill | StakingCall_force_new_era | StakingCall_force_new_era_always | StakingCall_force_no_eras | StakingCall_force_unstake | StakingCall_increase_validator_count | StakingCall_kick | StakingCall_nominate | StakingCall_payout_stakers | StakingCall_reap_stash | StakingCall_rebond | StakingCall_scale_validator_count | StakingCall_set_controller | StakingCall_set_history_depth | StakingCall_set_invulnerables | StakingCall_set_payee | StakingCall_set_validator_count | StakingCall_unbond | StakingCall_validate | StakingCall_withdraw_unbonded

/**
 *  Take the origin account as a stash and lock up `value` of its balance. `controller` will
 *  be the account that controls it.
 * 
 *  `value` must be more than the `minimum_balance` specified by `T::Currency`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash account.
 * 
 *  Emits `Bonded`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Moderate complexity.
 *  - O(1).
 *  - Three extra DB entries.
 * 
 *  NOTE: Two of the storage writes (`Self::bonded`, `Self::payee`) are _never_ cleaned
 *  unless the `origin` falls below _existential deposit_ and gets removed as dust.
 *  ------------------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: Bonded, Ledger, [Origin Account], Current Era, History Depth, Locks
 *  - Write: Bonded, Payee, [Origin Account], Locks, Ledger
 *  # </weight>
 */
export interface StakingCall_bond {
    __kind: 'bond'
    controller: LookupSource,
    value: bigint,
    payee: RewardDestination,
}

/**
 *  Add some extra amount that have appeared in the stash `free_balance` into the balance up
 *  for staking.
 * 
 *  Use this if there are additional funds in your stash account that you wish to bond.
 *  Unlike [`bond`] or [`unbond`] this function does not impose any limitation on the amount
 *  that can be added.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller and
 *  it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Bonded`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - O(1).
 *  - One DB entry.
 *  ------------
 *  DB Weight:
 *  - Read: Era Election Status, Bonded, Ledger, [Origin Account], Locks
 *  - Write: [Origin Account], Locks, Ledger
 *  # </weight>
 */
export interface StakingCall_bond_extra {
    __kind: 'bond_extra'
    maxAdditional: bigint,
}

/**
 *  Cancel enactment of a deferred slash.
 * 
 *  Can be called by the `T::SlashCancelOrigin`.
 * 
 *  Parameters: era and indices of the slashes for that era to kill.
 * 
 *  # <weight>
 *  Complexity: O(U + S)
 *  with U unapplied slashes weighted with U=1000
 *  and S is the number of slash indices to be canceled.
 *  - Read: Unapplied Slashes
 *  - Write: Unapplied Slashes
 *  # </weight>
 */
export interface StakingCall_cancel_deferred_slash {
    __kind: 'cancel_deferred_slash'
    era: EraIndex,
    slashIndices: number[],
}

/**
 *  Declare no desire to either validate or nominate.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains one read.
 *  - Writes are limited to the `origin` account key.
 *  --------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: EraElectionStatus, Ledger
 *  - Write: Validators, Nominators
 *  # </weight>
 */
export interface StakingCall_chill {
    __kind: 'chill'
}

/**
 *  Force there to be a new era at the end of the next session. After this, it will be
 *  reset to normal (non-forced) behaviour.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  - No arguments.
 *  - Weight: O(1)
 *  - Write ForceEra
 *  # </weight>
 */
export interface StakingCall_force_new_era {
    __kind: 'force_new_era'
}

/**
 *  Force there to be a new era at the end of sessions indefinitely.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  - Weight: O(1)
 *  - Write: ForceEra
 *  # </weight>
 */
export interface StakingCall_force_new_era_always {
    __kind: 'force_new_era_always'
}

/**
 *  Force there to be no new eras indefinitely.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  - No arguments.
 *  - Weight: O(1)
 *  - Write: ForceEra
 *  # </weight>
 */
export interface StakingCall_force_no_eras {
    __kind: 'force_no_eras'
}

/**
 *  Force a current staker to become completely unstaked, immediately.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  O(S) where S is the number of slashing spans to be removed
 *  Reads: Bonded, Slashing Spans, Account, Locks
 *  Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Account, Locks
 *  Writes Each: SpanSlash * S
 *  # </weight>
 */
export interface StakingCall_force_unstake {
    __kind: 'force_unstake'
    stash: AccountId,
    numSlashingSpans: number,
}

/**
 *  Increments the ideal number of validators.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  Same as [`set_validator_count`].
 *  # </weight>
 */
export interface StakingCall_increase_validator_count {
    __kind: 'increase_validator_count'
    additional: number,
}

/**
 *  Remove the given nominations from the calling validator.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`. The controller
 *  account should represent a validator.
 * 
 *  - `who`: A list of nominator stash accounts who are nominating this validator which
 *    should no longer be nominating this validator.
 * 
 *  Note: Making this call only makes sense if you first set the validator preferences to
 *  block any further nominations.
 */
export interface StakingCall_kick {
    __kind: 'kick'
    who: LookupSource[],
}

/**
 *  Declare the desire to nominate `targets` for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era. This can only be called when
 *  [`EraElectionStatus`] is `Closed`.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - The transaction's complexity is proportional to the size of `targets` (N)
 *  which is capped at CompactAssignments::LIMIT (MAX_NOMINATIONS).
 *  - Both the reads and writes follow a similar pattern.
 *  ---------
 *  Weight: O(N)
 *  where N is the number of targets
 *  DB Weight:
 *  - Reads: Era Election Status, Ledger, Current Era
 *  - Writes: Validators, Nominators
 *  # </weight>
 */
export interface StakingCall_nominate {
    __kind: 'nominate'
    targets: LookupSource[],
}

/**
 *  Pay out all the stakers behind a single validator for a single era.
 * 
 *  - `validator_stash` is the stash account of the validator. Their nominators, up to
 *    `T::MaxNominatorRewardedPerValidator`, will also receive their rewards.
 *  - `era` may be any era between `[current_era - history_depth; current_era]`.
 * 
 *  The origin of this call must be _Signed_. Any account can call this function, even if
 *  it is not one of the stakers.
 * 
 *  This can only be called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Time complexity: at most O(MaxNominatorRewardedPerValidator).
 *  - Contains a limited number of reads and writes.
 *  -----------
 *  N is the Number of payouts for the validator (including the validator)
 *  Weight:
 *  - Reward Destination Staked: O(N)
 *  - Reward Destination Controller (Creating): O(N)
 *  DB Weight:
 *  - Read: EraElectionStatus, CurrentEra, HistoryDepth, ErasValidatorReward,
 *          ErasStakersClipped, ErasRewardPoints, ErasValidatorPrefs (8 items)
 *  - Read Each: Bonded, Ledger, Payee, Locks, System Account (5 items)
 *  - Write Each: System Account, Locks, Ledger (3 items)
 * 
 *    NOTE: weights are assuming that payouts are made to alive stash account (Staked).
 *    Paying even a dead controller is cheaper weight-wise. We don't do any refunds here.
 *  # </weight>
 */
export interface StakingCall_payout_stakers {
    __kind: 'payout_stakers'
    validatorStash: AccountId,
    era: EraIndex,
}

/**
 *  Remove all data structure concerning a staker/stash once its balance is at the minimum.
 *  This is essentially equivalent to `withdraw_unbonded` except it can be called by anyone
 *  and the target `stash` must have no funds left beyond the ED.
 * 
 *  This can be called from any origin.
 * 
 *  - `stash`: The stash account to reap. Its balance must be zero.
 * 
 *  # <weight>
 *  Complexity: O(S) where S is the number of slashing spans on the account.
 *  DB Weight:
 *  - Reads: Stash Account, Bonded, Slashing Spans, Locks
 *  - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators, Stash Account, Locks
 *  - Writes Each: SpanSlash * S
 *  # </weight>
 */
export interface StakingCall_reap_stash {
    __kind: 'reap_stash'
    stash: AccountId,
    numSlashingSpans: number,
}

/**
 *  Rebond a portion of the stash scheduled to be unlocked.
 * 
 *  The dispatch origin must be signed by the controller, and it can be only called when
 *  [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Time complexity: O(L), where L is unlocking chunks
 *  - Bounded by `MAX_UNLOCKING_CHUNKS`.
 *  - Storage changes: Can't increase storage, only decrease it.
 *  ---------------
 *  - DB Weight:
 *      - Reads: EraElectionStatus, Ledger, Locks, [Origin Account]
 *      - Writes: [Origin Account], Locks, Ledger
 *  # </weight>
 */
export interface StakingCall_rebond {
    __kind: 'rebond'
    value: bigint,
}

/**
 *  Scale up the ideal number of validators by a factor.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  Same as [`set_validator_count`].
 *  # </weight>
 */
export interface StakingCall_scale_validator_count {
    __kind: 'scale_validator_count'
    factor: Percent,
}

/**
 *  (Re-)set the controller of a stash.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the stash, not the controller.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  ----------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: Bonded, Ledger New Controller, Ledger Old Controller
 *  - Write: Bonded, Ledger New Controller, Ledger Old Controller
 *  # </weight>
 */
export interface StakingCall_set_controller {
    __kind: 'set_controller'
    controller: LookupSource,
}

/**
 *  Set `HistoryDepth` value. This function will delete any history information
 *  when `HistoryDepth` is reduced.
 * 
 *  Parameters:
 *  - `new_history_depth`: The new history depth you would like to set.
 *  - `era_items_deleted`: The number of items that will be deleted by this dispatch.
 *     This should report all the storage items that will be deleted by clearing old
 *     era history. Needed to report an accurate weight for the dispatch. Trusted by
 *     `Root` to report an accurate number.
 * 
 *  Origin must be root.
 * 
 *  # <weight>
 *  - E: Number of history depths removed, i.e. 10 -> 7 = 3
 *  - Weight: O(E)
 *  - DB Weight:
 *      - Reads: Current Era, History Depth
 *      - Writes: History Depth
 *      - Clear Prefix Each: Era Stakers, EraStakersClipped, ErasValidatorPrefs
 *      - Writes Each: ErasValidatorReward, ErasRewardPoints, ErasTotalStake, ErasStartSessionIndex
 *  # </weight>
 */
export interface StakingCall_set_history_depth {
    __kind: 'set_history_depth'
    newHistoryDepth: number,
    eraItemsDeleted: number,
}

/**
 *  Set the validators who cannot be slashed (if any).
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  - O(V)
 *  - Write: Invulnerables
 *  # </weight>
 */
export interface StakingCall_set_invulnerables {
    __kind: 'set_invulnerables'
    invulnerables: AccountId[],
}

/**
 *  (Re-)set the payment target for a controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  ---------
 *  - Weight: O(1)
 *  - DB Weight:
 *      - Read: Ledger
 *      - Write: Payee
 *  # </weight>
 */
export interface StakingCall_set_payee {
    __kind: 'set_payee'
    payee: RewardDestination,
}

/**
 *  Sets the ideal number of validators.
 * 
 *  The dispatch origin must be Root.
 * 
 *  # <weight>
 *  Weight: O(1)
 *  Write: Validator Count
 *  # </weight>
 */
export interface StakingCall_set_validator_count {
    __kind: 'set_validator_count'
    new: number,
}

/**
 *  Schedule a portion of the stash to be unlocked ready for transfer out after the bond
 *  period ends. If this leaves an amount actively bonded less than
 *  T::Currency::minimum_balance(), then it is increased to the full amount.
 * 
 *  Once the unlock period is done, you can call `withdraw_unbonded` to actually move
 *  the funds out of management ready for transfer.
 * 
 *  No more than a limited number of unlocking chunks (see `MAX_UNLOCKING_CHUNKS`)
 *  can co-exists at the same time. In that case, [`Call::withdraw_unbonded`] need
 *  to be called first to remove some of the chunks (if possible).
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Unbonded`.
 * 
 *  See also [`Call::withdraw_unbonded`].
 * 
 *  # <weight>
 *  - Independent of the arguments. Limited but potentially exploitable complexity.
 *  - Contains a limited number of reads.
 *  - Each call (requires the remainder of the bonded balance to be above `minimum_balance`)
 *    will cause a new entry to be inserted into a vector (`Ledger.unlocking`) kept in storage.
 *    The only way to clean the aforementioned storage item is also user-controlled via
 *    `withdraw_unbonded`.
 *  - One DB entry.
 *  ----------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: EraElectionStatus, Ledger, CurrentEra, Locks, BalanceOf Stash,
 *  - Write: Locks, Ledger, BalanceOf Stash,
 *  </weight>
 */
export interface StakingCall_unbond {
    __kind: 'unbond'
    value: bigint,
}

/**
 *  Declare the desire to validate for the origin controller.
 * 
 *  Effects will be felt at the beginning of the next era.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  # <weight>
 *  - Independent of the arguments. Insignificant complexity.
 *  - Contains a limited number of reads.
 *  - Writes are limited to the `origin` account key.
 *  -----------
 *  Weight: O(1)
 *  DB Weight:
 *  - Read: Era Election Status, Ledger
 *  - Write: Nominators, Validators
 *  # </weight>
 */
export interface StakingCall_validate {
    __kind: 'validate'
    prefs: ValidatorPrefs,
}

/**
 *  Remove any unlocked chunks from the `unlocking` queue from our management.
 * 
 *  This essentially frees up that balance to be used by the stash account to do
 *  whatever it wants.
 * 
 *  The dispatch origin for this call must be _Signed_ by the controller, not the stash.
 *  And, it can be only called when [`EraElectionStatus`] is `Closed`.
 * 
 *  Emits `Withdrawn`.
 * 
 *  See also [`Call::unbond`].
 * 
 *  # <weight>
 *  - Could be dependent on the `origin` argument and how much `unlocking` chunks exist.
 *   It implies `consolidate_unlocked` which loops over `Ledger.unlocking`, which is
 *   indirectly user-controlled. See [`unbond`] for more detail.
 *  - Contains a limited number of reads, yet the size of which could be large based on `ledger`.
 *  - Writes are limited to the `origin` account key.
 *  ---------------
 *  Complexity O(S) where S is the number of slashing spans to remove
 *  Update:
 *  - Reads: EraElectionStatus, Ledger, Current Era, Locks, [Origin Account]
 *  - Writes: [Origin Account], Locks, Ledger
 *  Kill:
 *  - Reads: EraElectionStatus, Ledger, Current Era, Bonded, Slashing Spans, [Origin
 *    Account], Locks, BalanceOf stash
 *  - Writes: Bonded, Slashing Spans (if S > 0), Ledger, Payee, Validators, Nominators,
 *    [Origin Account], Locks, BalanceOf stash.
 *  - Writes Each: SpanSlash * S
 *  NOTE: Weight annotation is the kill scenario, we refund otherwise.
 *  # </weight>
 */
export interface StakingCall_withdraw_unbonded {
    __kind: 'withdraw_unbonded'
    numSlashingSpans: number,
}

export const StakingCall: sts.Type<StakingCall> = sts.closedEnum(() => {
    return  {
        bond: sts.enumStruct({
            controller: LookupSource,
            value: sts.bigint(),
            payee: RewardDestination,
        }),
        bond_extra: sts.enumStruct({
            maxAdditional: sts.bigint(),
        }),
        cancel_deferred_slash: sts.enumStruct({
            era: EraIndex,
            slashIndices: sts.array(() => sts.number()),
        }),
        chill: sts.unit(),
        force_new_era: sts.unit(),
        force_new_era_always: sts.unit(),
        force_no_eras: sts.unit(),
        force_unstake: sts.enumStruct({
            stash: AccountId,
            numSlashingSpans: sts.number(),
        }),
        increase_validator_count: sts.enumStruct({
            additional: sts.number(),
        }),
        kick: sts.enumStruct({
            who: sts.array(() => LookupSource),
        }),
        nominate: sts.enumStruct({
            targets: sts.array(() => LookupSource),
        }),
        payout_stakers: sts.enumStruct({
            validatorStash: AccountId,
            era: EraIndex,
        }),
        reap_stash: sts.enumStruct({
            stash: AccountId,
            numSlashingSpans: sts.number(),
        }),
        rebond: sts.enumStruct({
            value: sts.bigint(),
        }),
        scale_validator_count: sts.enumStruct({
            factor: Percent,
        }),
        set_controller: sts.enumStruct({
            controller: LookupSource,
        }),
        set_history_depth: sts.enumStruct({
            newHistoryDepth: sts.number(),
            eraItemsDeleted: sts.number(),
        }),
        set_invulnerables: sts.enumStruct({
            invulnerables: sts.array(() => AccountId),
        }),
        set_payee: sts.enumStruct({
            payee: RewardDestination,
        }),
        set_validator_count: sts.enumStruct({
            new: sts.number(),
        }),
        unbond: sts.enumStruct({
            value: sts.bigint(),
        }),
        validate: sts.enumStruct({
            prefs: ValidatorPrefs,
        }),
        withdraw_unbonded: sts.enumStruct({
            numSlashingSpans: sts.number(),
        }),
    }
})

export type ValidatorPrefs = {
    commission: number,
    blocked: boolean,
}

export const ValidatorPrefs: sts.Type<ValidatorPrefs> = sts.struct(() => {
    return  {
        commission: sts.number(),
        blocked: sts.boolean(),
    }
})

export type Percent = number

export const Percent: sts.Type<Percent> = sts.number()

export type EraIndex = number

export const EraIndex: sts.Type<EraIndex> = sts.number()

export type RewardDestination = RewardDestination_Account | RewardDestination_Controller | RewardDestination_None | RewardDestination_Staked | RewardDestination_Stash

export interface RewardDestination_Account {
    __kind: 'Account'
    value: AccountId
}

export interface RewardDestination_Controller {
    __kind: 'Controller'
}

export interface RewardDestination_None {
    __kind: 'None'
}

export interface RewardDestination_Staked {
    __kind: 'Staked'
}

export interface RewardDestination_Stash {
    __kind: 'Stash'
}

export const RewardDestination: sts.Type<RewardDestination> = sts.closedEnum(() => {
    return  {
        Account: AccountId,
        Controller: sts.unit(),
        None: sts.unit(),
        Staked: sts.unit(),
        Stash: sts.unit(),
    }
})

export type SocietyCall = SocietyCall_bid | SocietyCall_defender_vote | SocietyCall_found | SocietyCall_judge_suspended_candidate | SocietyCall_judge_suspended_member | SocietyCall_payout | SocietyCall_set_max_members | SocietyCall_unbid | SocietyCall_unfound | SocietyCall_unvouch | SocietyCall_vote | SocietyCall_vouch

/**
 *  A user outside of the society can make a bid for entry.
 * 
 *  Payment: `CandidateDeposit` will be reserved for making a bid. It is returned
 *  when the bid becomes a member, or if the bid calls `unbid`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `value`: A one time payment the bid would like to receive when joining the society.
 * 
 *  # <weight>
 *  Key: B (len of bids), C (len of candidates), M (len of members), X (balance reserve)
 *  - Storage Reads:
 *  	- One storage read to check for suspended candidate. O(1)
 *  	- One storage read to check for suspended member. O(1)
 *  	- One storage read to retrieve all current bids. O(B)
 *  	- One storage read to retrieve all current candidates. O(C)
 *  	- One storage read to retrieve all members. O(M)
 *  - Storage Writes:
 *  	- One storage mutate to add a new bid to the vector O(B) (TODO: possible optimization w/ read)
 *  	- Up to one storage removal if bid.len() > MAX_BID_COUNT. O(1)
 *  - Notable Computation:
 *  	- O(B + C + log M) search to check user is not already a part of society.
 *  	- O(log B) search to insert the new bid sorted.
 *  - External Module Operations:
 *  	- One balance reserve operation. O(X)
 *  	- Up to one balance unreserve operation if bids.len() > MAX_BID_COUNT.
 *  - Events:
 *  	- One event for new bid.
 *  	- Up to one event for AutoUnbid if bid.len() > MAX_BID_COUNT.
 * 
 *  Total Complexity: O(M + B + C + logM + logB + X)
 *  # </weight>
 */
export interface SocietyCall_bid {
    __kind: 'bid'
    value: BalanceOf,
}

/**
 *  As a member, vote on the defender.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `approve`: A boolean which says if the candidate should be
 *  approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  - Key: M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM)
 *  # </weight>
 */
export interface SocietyCall_defender_vote {
    __kind: 'defender_vote'
    approve: boolean,
}

/**
 *  Found the society.
 * 
 *  This is done as a discrete action in order to allow for the
 *  module to be included into a running chain and can only be done once.
 * 
 *  The dispatch origin for this call must be from the _FounderSetOrigin_.
 * 
 *  Parameters:
 *  - `founder` - The first member and head of the newly founded society.
 *  - `max_members` - The initial max number of members for the society.
 *  - `rules` - The rules of this society concerning membership.
 * 
 *  # <weight>
 *  - Two storage mutates to set `Head` and `Founder`. O(1)
 *  - One storage write to add the first member to society. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export interface SocietyCall_found {
    __kind: 'found'
    founder: AccountId,
    maxMembers: number,
    rules: Bytes,
}

/**
 *  Allow suspended judgement origin to make judgement on a suspended candidate.
 * 
 *  If the judgement is `Approve`, we add them to society as a member with the appropriate
 *  payment for joining society.
 * 
 *  If the judgement is `Reject`, we either slash the deposit of the bid, giving it back
 *  to the society treasury, or we ban the voucher from vouching again.
 * 
 *  If the judgement is `Rebid`, we put the candidate back in the bid pool and let them go
 *  through the induction process again.
 * 
 *  The dispatch origin for this call must be from the _SuspensionJudgementOrigin_.
 * 
 *  Parameters:
 *  - `who` - The suspended candidate to be judged.
 *  - `judgement` - `Approve`, `Reject`, or `Rebid`.
 * 
 *  # <weight>
 *  Key: B (len of bids), M (len of members), X (balance action)
 *  - One storage read to check `who` is a suspended candidate.
 *  - One storage removal of the suspended candidate.
 *  - Approve Logic
 *  	- One storage read to get the available pot to pay users with. O(1)
 *  	- One storage write to update the available pot. O(1)
 *  	- One storage read to get the current block number. O(1)
 *  	- One storage read to get all members. O(M)
 *  	- Up to one unreserve currency action.
 *  	- Up to two new storage writes to payouts.
 *  	- Up to one storage write with O(log M) binary search to add a member to society.
 *  - Reject Logic
 *  	- Up to one repatriate reserved currency action. O(X)
 *  	- Up to one storage write to ban the vouching member from vouching again.
 *  - Rebid Logic
 *  	- Storage mutate with O(log B) binary search to place the user back into bids.
 *  - Up to one additional event if unvouch takes place.
 *  - One storage removal.
 *  - One event for the judgement.
 * 
 *  Total Complexity: O(M + logM + B + X)
 *  # </weight>
 */
export interface SocietyCall_judge_suspended_candidate {
    __kind: 'judge_suspended_candidate'
    who: AccountId,
    judgement: SocietyJudgement,
}

/**
 *  Allow suspension judgement origin to make judgement on a suspended member.
 * 
 *  If a suspended member is forgiven, we simply add them back as a member, not affecting
 *  any of the existing storage items for that member.
 * 
 *  If a suspended member is rejected, remove all associated storage items, including
 *  their payouts, and remove any vouched bids they currently have.
 * 
 *  The dispatch origin for this call must be from the _SuspensionJudgementOrigin_.
 * 
 *  Parameters:
 *  - `who` - The suspended member to be judged.
 *  - `forgive` - A boolean representing whether the suspension judgement origin
 *                forgives (`true`) or rejects (`false`) a suspended member.
 * 
 *  # <weight>
 *  Key: B (len of bids), M (len of members)
 *  - One storage read to check `who` is a suspended member. O(1)
 *  - Up to one storage write O(M) with O(log M) binary search to add a member back to society.
 *  - Up to 3 storage removals O(1) to clean up a removed member.
 *  - Up to one storage write O(B) with O(B) search to remove vouched bid from bids.
 *  - Up to one additional event if unvouch takes place.
 *  - One storage removal. O(1)
 *  - One event for the judgement.
 * 
 *  Total Complexity: O(M + logM + B)
 *  # </weight>
 */
export interface SocietyCall_judge_suspended_member {
    __kind: 'judge_suspended_member'
    who: AccountId,
    forgive: boolean,
}

/**
 *  Transfer the first matured payout for the sender and remove it from the records.
 * 
 *  NOTE: This extrinsic needs to be called multiple times to claim multiple matured payouts.
 * 
 *  Payment: The member will receive a payment equal to their first matured
 *  payout to their free balance.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member with
 *  payouts remaining.
 * 
 *  # <weight>
 *  Key: M (len of members), P (number of payouts for a particular member)
 *  - One storage read O(M) and O(log M) search to check signer is a member.
 *  - One storage read O(P) to get all payouts for a member.
 *  - One storage read O(1) to get the current block number.
 *  - One currency transfer call. O(X)
 *  - One storage write or removal to update the member's payouts. O(P)
 * 
 *  Total Complexity: O(M + logM + P + X)
 *  # </weight>
 */
export interface SocietyCall_payout {
    __kind: 'payout'
}

/**
 *  Allows root origin to change the maximum number of members in society.
 *  Max membership count must be greater than 1.
 * 
 *  The dispatch origin for this call must be from _ROOT_.
 * 
 *  Parameters:
 *  - `max` - The maximum number of members for the society.
 * 
 *  # <weight>
 *  - One storage write to update the max. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export interface SocietyCall_set_max_members {
    __kind: 'set_max_members'
    max: number,
}

/**
 *  A bidder can remove their bid for entry into society.
 *  By doing so, they will have their candidate deposit returned or
 *  they will unvouch their voucher.
 * 
 *  Payment: The bid deposit is unreserved if the user made a bid.
 * 
 *  The dispatch origin for this call must be _Signed_ and a bidder.
 * 
 *  Parameters:
 *  - `pos`: Position in the `Bids` vector of the bid who wants to unbid.
 * 
 *  # <weight>
 *  Key: B (len of bids), X (balance unreserve)
 *  - One storage read and write to retrieve and update the bids. O(B)
 *  - Either one unreserve balance action O(X) or one vouching storage removal. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(B + X)
 *  # </weight>
 */
export interface SocietyCall_unbid {
    __kind: 'unbid'
    pos: number,
}

/**
 *  Annul the founding of the society.
 * 
 *  The dispatch origin for this call must be Signed, and the signing account must be both
 *  the `Founder` and the `Head`. This implies that it may only be done when there is one
 *  member.
 * 
 *  # <weight>
 *  - Two storage reads O(1).
 *  - Four storage removals O(1).
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export interface SocietyCall_unfound {
    __kind: 'unfound'
}

/**
 *  As a vouching member, unvouch a bid. This only works while vouched user is
 *  only a bidder (and not a candidate).
 * 
 *  The dispatch origin for this call must be _Signed_ and a vouching member.
 * 
 *  Parameters:
 *  - `pos`: Position in the `Bids` vector of the bid who should be unvouched.
 * 
 *  # <weight>
 *  Key: B (len of bids)
 *  - One storage read O(1) to check the signer is a vouching member.
 *  - One storage mutate to retrieve and update the bids. O(B)
 *  - One vouching storage removal. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(B)
 *  # </weight>
 */
export interface SocietyCall_unvouch {
    __kind: 'unvouch'
    pos: number,
}

/**
 *  As a member, vote on a candidate.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `candidate`: The candidate that the member would like to bid on.
 *  - `approve`: A boolean which says if the candidate should be
 *               approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  Key: C (len of candidates), M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One account lookup.
 *  - One storage read O(C) and O(C) search to check that user is a candidate.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM + C)
 *  # </weight>
 */
export interface SocietyCall_vote {
    __kind: 'vote'
    candidate: LookupSource,
    approve: boolean,
}

/**
 *  As a member, vouch for someone to join society by placing a bid on their behalf.
 * 
 *  There is no deposit required to vouch for a new bid, but a member can only vouch for
 *  one bid at a time. If the bid becomes a suspended candidate and ultimately rejected by
 *  the suspension judgement origin, the member will be banned from vouching again.
 * 
 *  As a vouching member, you can claim a tip if the candidate is accepted. This tip will
 *  be paid as a portion of the reward the member will receive for joining the society.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `who`: The user who you would like to vouch for.
 *  - `value`: The total reward to be paid between you and the candidate if they become
 *  a member in the society.
 *  - `tip`: Your cut of the total `value` payout when the candidate is inducted into
 *  the society. Tips larger than `value` will be saturated upon payout.
 * 
 *  # <weight>
 *  Key: B (len of bids), C (len of candidates), M (len of members)
 *  - Storage Reads:
 *  	- One storage read to retrieve all members. O(M)
 *  	- One storage read to check member is not already vouching. O(1)
 *  	- One storage read to check for suspended candidate. O(1)
 *  	- One storage read to check for suspended member. O(1)
 *  	- One storage read to retrieve all current bids. O(B)
 *  	- One storage read to retrieve all current candidates. O(C)
 *  - Storage Writes:
 *  	- One storage write to insert vouching status to the member. O(1)
 *  	- One storage mutate to add a new bid to the vector O(B) (TODO: possible optimization w/ read)
 *  	- Up to one storage removal if bid.len() > MAX_BID_COUNT. O(1)
 *  - Notable Computation:
 *  	- O(log M) search to check sender is a member.
 *  	- O(B + C + log M) search to check user is not already a part of society.
 *  	- O(log B) search to insert the new bid sorted.
 *  - External Module Operations:
 *  	- One balance reserve operation. O(X)
 *  	- Up to one balance unreserve operation if bids.len() > MAX_BID_COUNT.
 *  - Events:
 *  	- One event for vouch.
 *  	- Up to one event for AutoUnbid if bid.len() > MAX_BID_COUNT.
 * 
 *  Total Complexity: O(M + B + C + logM + logB + X)
 *  # </weight>
 */
export interface SocietyCall_vouch {
    __kind: 'vouch'
    who: AccountId,
    value: BalanceOf,
    tip: BalanceOf,
}

export const SocietyCall: sts.Type<SocietyCall> = sts.closedEnum(() => {
    return  {
        bid: sts.enumStruct({
            value: BalanceOf,
        }),
        defender_vote: sts.enumStruct({
            approve: sts.boolean(),
        }),
        found: sts.enumStruct({
            founder: AccountId,
            maxMembers: sts.number(),
            rules: sts.bytes(),
        }),
        judge_suspended_candidate: sts.enumStruct({
            who: AccountId,
            judgement: SocietyJudgement,
        }),
        judge_suspended_member: sts.enumStruct({
            who: AccountId,
            forgive: sts.boolean(),
        }),
        payout: sts.unit(),
        set_max_members: sts.enumStruct({
            max: sts.number(),
        }),
        unbid: sts.enumStruct({
            pos: sts.number(),
        }),
        unfound: sts.unit(),
        unvouch: sts.enumStruct({
            pos: sts.number(),
        }),
        vote: sts.enumStruct({
            candidate: LookupSource,
            approve: sts.boolean(),
        }),
        vouch: sts.enumStruct({
            who: AccountId,
            value: BalanceOf,
            tip: BalanceOf,
        }),
    }
})

export type SocietyJudgement = SocietyJudgement_Approve | SocietyJudgement_Rebid | SocietyJudgement_Reject

export interface SocietyJudgement_Approve {
    __kind: 'Approve'
}

export interface SocietyJudgement_Rebid {
    __kind: 'Rebid'
}

export interface SocietyJudgement_Reject {
    __kind: 'Reject'
}

export const SocietyJudgement: sts.Type<SocietyJudgement> = sts.closedEnum(() => {
    return  {
        Approve: sts.unit(),
        Rebid: sts.unit(),
        Reject: sts.unit(),
    }
})

export type SlotsCall = SlotsCall_clear_all_leases | SlotsCall_force_lease | SlotsCall_trigger_onboard

/**
 *  Clear all leases for a Para Id, refunding any deposits back to the original owners.
 * 
 *  Can only be called by the Root origin.
 */
export interface SlotsCall_clear_all_leases {
    __kind: 'clear_all_leases'
    para: ParaId,
}

/**
 *  Just a hotwire into the `lease_out` call, in case Root wants to force some lease to happen
 *  independently of any other on-chain mechanism to use it.
 * 
 *  Can only be called by the Root origin.
 */
export interface SlotsCall_force_lease {
    __kind: 'force_lease'
    para: ParaId,
    leaser: AccountId,
    amount: BalanceOf,
    periodBegin: LeasePeriodOf,
    periodCount: LeasePeriodOf,
}

/**
 *  Try to onboard a parachain that has a lease for the current lease period.
 * 
 *  This function can be useful if there was some state issue with a para that should
 *  have onboarded, but was unable to. As long as they have a lease period, we can
 *  let them onboard from here.
 * 
 *  Origin must be signed, but can be called by anyone.
 */
export interface SlotsCall_trigger_onboard {
    __kind: 'trigger_onboard'
    para: ParaId,
}

export const SlotsCall: sts.Type<SlotsCall> = sts.closedEnum(() => {
    return  {
        clear_all_leases: sts.enumStruct({
            para: ParaId,
        }),
        force_lease: sts.enumStruct({
            para: ParaId,
            leaser: AccountId,
            amount: BalanceOf,
            periodBegin: LeasePeriodOf,
            periodCount: LeasePeriodOf,
        }),
        trigger_onboard: sts.enumStruct({
            para: ParaId,
        }),
    }
})

export type SessionCall = SessionCall_purge_keys | SessionCall_set_keys

/**
 *  Removes any session key(s) of the function caller.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - Complexity: `O(1)` in number of key types.
 *    Actual cost depends on the number of length of `T::Keys::key_ids()` which is fixed.
 *  - DbReads: `T::ValidatorIdOf`, `NextKeys`, `origin account`
 *  - DbWrites: `NextKeys`, `origin account`
 *  - DbWrites per key id: `KeyOwnder`
 *  # </weight>
 */
export interface SessionCall_purge_keys {
    __kind: 'purge_keys'
}

/**
 *  Sets the session key(s) of the function caller to `keys`.
 *  Allows an account to set its session key prior to becoming a validator.
 *  This doesn't take effect until the next session.
 * 
 *  The dispatch origin of this function must be signed.
 * 
 *  # <weight>
 *  - Complexity: `O(1)`
 *    Actual cost depends on the number of length of `T::Keys::key_ids()` which is fixed.
 *  - DbReads: `origin account`, `T::ValidatorIdOf`, `NextKeys`
 *  - DbWrites: `origin account`, `NextKeys`
 *  - DbReads per key id: `KeyOwner`
 *  - DbWrites per key id: `KeyOwner`
 *  # </weight>
 */
export interface SessionCall_set_keys {
    __kind: 'set_keys'
    keys: Keys,
    proof: Bytes,
}

export const SessionCall: sts.Type<SessionCall> = sts.closedEnum(() => {
    return  {
        purge_keys: sts.unit(),
        set_keys: sts.enumStruct({
            keys: Keys,
            proof: sts.bytes(),
        }),
    }
})

export type Keys = [AccountId, AccountId, AccountId, AccountId, AccountId, AccountId]

export const Keys: sts.Type<Keys> = sts.tuple(() => AccountId, AccountId, AccountId, AccountId, AccountId, AccountId)

export type SchedulerCall = SchedulerCall_cancel | SchedulerCall_cancel_named | SchedulerCall_schedule | SchedulerCall_schedule_after | SchedulerCall_schedule_named | SchedulerCall_schedule_named_after

/**
 *  Cancel an anonymously scheduled task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 22.15 + 2.869 * S µs
 *  - DB Weight:
 *      - Read: Agenda
 *      - Write: Agenda, Lookup
 *  - Will use base weight of 100 which should be good for up to 30 scheduled calls
 *  # </weight>
 */
export interface SchedulerCall_cancel {
    __kind: 'cancel'
    when: BlockNumber,
    index: number,
}

/**
 *  Cancel a named scheduled task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 24.91 + 2.907 * S µs
 *  - DB Weight:
 *      - Read: Agenda, Lookup
 *      - Write: Agenda, Lookup
 *  - Will use base weight of 100 which should be good for up to 30 scheduled calls
 *  # </weight>
 */
export interface SchedulerCall_cancel_named {
    __kind: 'cancel_named'
    id: Bytes,
}

/**
 *  Anonymously schedule a task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 22.29 + .126 * S µs
 *  - DB Weight:
 *      - Read: Agenda
 *      - Write: Agenda
 *  - Will use base weight of 25 which should be good for up to 30 scheduled calls
 *  # </weight>
 */
export interface SchedulerCall_schedule {
    __kind: 'schedule'
    when: BlockNumber,
    maybePeriodic?: (Period | undefined),
    priority: Priority,
    call: Type_138,
}

/**
 *  Anonymously schedule a task after a delay.
 * 
 *  # <weight>
 *  Same as [`schedule`].
 *  # </weight>
 */
export interface SchedulerCall_schedule_after {
    __kind: 'schedule_after'
    after: BlockNumber,
    maybePeriodic?: (Period | undefined),
    priority: Priority,
    call: Type_138,
}

/**
 *  Schedule a named task.
 * 
 *  # <weight>
 *  - S = Number of already scheduled calls
 *  - Base Weight: 29.6 + .159 * S µs
 *  - DB Weight:
 *      - Read: Agenda, Lookup
 *      - Write: Agenda, Lookup
 *  - Will use base weight of 35 which should be good for more than 30 scheduled calls
 *  # </weight>
 */
export interface SchedulerCall_schedule_named {
    __kind: 'schedule_named'
    id: Bytes,
    when: BlockNumber,
    maybePeriodic?: (Period | undefined),
    priority: Priority,
    call: Type_138,
}

/**
 *  Schedule a named task after a delay.
 * 
 *  # <weight>
 *  Same as [`schedule_named`].
 *  # </weight>
 */
export interface SchedulerCall_schedule_named_after {
    __kind: 'schedule_named_after'
    id: Bytes,
    after: BlockNumber,
    maybePeriodic?: (Period | undefined),
    priority: Priority,
    call: Type_138,
}

export const SchedulerCall: sts.Type<SchedulerCall> = sts.closedEnum(() => {
    return  {
        cancel: sts.enumStruct({
            when: BlockNumber,
            index: sts.number(),
        }),
        cancel_named: sts.enumStruct({
            id: sts.bytes(),
        }),
        schedule: sts.enumStruct({
            when: BlockNumber,
            maybePeriodic: sts.option(() => Period),
            priority: Priority,
            call: Type_138,
        }),
        schedule_after: sts.enumStruct({
            after: BlockNumber,
            maybePeriodic: sts.option(() => Period),
            priority: Priority,
            call: Type_138,
        }),
        schedule_named: sts.enumStruct({
            id: sts.bytes(),
            when: BlockNumber,
            maybePeriodic: sts.option(() => Period),
            priority: Priority,
            call: Type_138,
        }),
        schedule_named_after: sts.enumStruct({
            id: sts.bytes(),
            after: BlockNumber,
            maybePeriodic: sts.option(() => Period),
            priority: Priority,
            call: Type_138,
        }),
    }
})

export type RegistrarCall = RegistrarCall_deregister | RegistrarCall_force_register | RegistrarCall_force_remove_lock | RegistrarCall_register | RegistrarCall_reserve | RegistrarCall_swap

/**
 *  Deregister a Para Id, freeing all data and returning any deposit.
 * 
 *  The caller must be Root, the `para` owner, or the `para` itself. The para must be a parathread.
 */
export interface RegistrarCall_deregister {
    __kind: 'deregister'
    id: ParaId,
}

/**
 *  Force the registration of a Para Id on the relay chain.
 * 
 *  This function must be called by a Root origin.
 * 
 *  The deposit taken can be specified for this registration. Any ParaId
 *  can be registered, including sub-1000 IDs which are System Parachains.
 */
export interface RegistrarCall_force_register {
    __kind: 'force_register'
    who: AccountId,
    deposit: BalanceOf,
    id: ParaId,
    genesisHead: HeadData,
    validationCode: ValidationCode,
}

/**
 *  Remove a manager lock from a para. This will allow the manager of a
 *  previously locked para to deregister or swap a para without using governance.
 * 
 *  Can only be called by the Root origin.
 */
export interface RegistrarCall_force_remove_lock {
    __kind: 'force_remove_lock'
    para: ParaId,
}

/**
 *  Register head data and validation code for a reserved Para Id.
 * 
 *  ## Arguments
 *  - `origin`: Must be called by a `Signed` origin.
 *  - `id`: The para ID. Must be owned/managed by the `origin` signing account.
 *  - `genesis_head`: The genesis head data of the parachain/thread.
 *  - `validation_code`: The initial validation code of the parachain/thread.
 * 
 *  ## Deposits/Fees
 *  The origin signed account must reserve a corresponding deposit for the registration. Anything already
 *  reserved previously for this para ID is accounted for.
 * 
 *  ## Events
 *  The `Registered` event is emitted in case of success.
 */
export interface RegistrarCall_register {
    __kind: 'register'
    id: ParaId,
    genesisHead: HeadData,
    validationCode: ValidationCode,
}

/**
 *  Reserve a Para Id on the relay chain.
 * 
 *  This function will reserve a new Para Id to be owned/managed by the origin account.
 *  The origin account is able to register head data and validation code using `register` to create
 *  a parathread. Using the Slots pallet, a parathread can then be upgraded to get a parachain slot.
 * 
 *  ## Arguments
 *  - `origin`: Must be called by a `Signed` origin. Becomes the manager/owner of the new para ID.
 * 
 *  ## Deposits/Fees
 *  The origin must reserve a deposit of `ParaDeposit` for the registration.
 * 
 *  ## Events
 *  The `Reserved` event is emitted in case of success, which provides the ID reserved for use.
 */
export interface RegistrarCall_reserve {
    __kind: 'reserve'
}

/**
 *  Swap a parachain with another parachain or parathread.
 * 
 *  The origin must be Root, the `para` owner, or the `para` itself.
 * 
 *  The swap will happen only if there is already an opposite swap pending. If there is not,
 *  the swap will be stored in the pending swaps map, ready for a later confirmatory swap.
 * 
 *  The `ParaId`s remain mapped to the same head data and code so external code can rely on
 *  `ParaId` to be a long-term identifier of a notional "parachain". However, their
 *  scheduling info (i.e. whether they're a parathread or parachain), auction information
 *  and the auction deposit are switched.
 */
export interface RegistrarCall_swap {
    __kind: 'swap'
    id: ParaId,
    other: ParaId,
}

export const RegistrarCall: sts.Type<RegistrarCall> = sts.closedEnum(() => {
    return  {
        deregister: sts.enumStruct({
            id: ParaId,
        }),
        force_register: sts.enumStruct({
            who: AccountId,
            deposit: BalanceOf,
            id: ParaId,
            genesisHead: HeadData,
            validationCode: ValidationCode,
        }),
        force_remove_lock: sts.enumStruct({
            para: ParaId,
        }),
        register: sts.enumStruct({
            id: ParaId,
            genesisHead: HeadData,
            validationCode: ValidationCode,
        }),
        reserve: sts.unit(),
        swap: sts.enumStruct({
            id: ParaId,
            other: ParaId,
        }),
    }
})

export type RecoveryCall = RecoveryCall_as_recovered | RecoveryCall_cancel_recovered | RecoveryCall_claim_recovery | RecoveryCall_close_recovery | RecoveryCall_create_recovery | RecoveryCall_initiate_recovery | RecoveryCall_remove_recovery | RecoveryCall_set_recovered | RecoveryCall_vouch_recovery

/**
 *  Send a call through a recovered account.
 * 
 *  The dispatch origin for this call must be _Signed_ and registered to
 *  be able to make calls on behalf of the recovered account.
 * 
 *  Parameters:
 *  - `account`: The recovered account you want to make a call on-behalf-of.
 *  - `call`: The call you want to make with the recovered account.
 * 
 *  # <weight>
 *  - The weight of the `call` + 10,000.
 *  - One storage lookup to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export interface RecoveryCall_as_recovered {
    __kind: 'as_recovered'
    account: AccountId,
    call: Type_138,
}

/**
 *  Cancel the ability to use `as_recovered` for `account`.
 * 
 *  The dispatch origin for this call must be _Signed_ and registered to
 *  be able to make calls on behalf of the recovered account.
 * 
 *  Parameters:
 *  - `account`: The recovered account you are able to call on-behalf-of.
 * 
 *  # <weight>
 *  - One storage mutation to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export interface RecoveryCall_cancel_recovered {
    __kind: 'cancel_recovered'
    account: AccountId,
}

/**
 *  Allow a successful rescuer to claim their recovered account.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a "rescuer"
 *  who has successfully completed the account recovery process: collected
 *  `threshold` or more vouches, waited `delay_period` blocks since initiation.
 * 
 *  Parameters:
 *  - `account`: The lost account that you want to claim has been successfully
 *    recovered by you.
 * 
 *  # <weight>
 *  Key: F (len of friends in config), V (len of vouching friends)
 *  - One storage read to get the recovery configuration. O(1), Codec O(F)
 *  - One storage read to get the active recovery process. O(1), Codec O(V)
 *  - One storage read to get the current block number. O(1)
 *  - One storage write. O(1), Codec O(V).
 *  - One event.
 * 
 *  Total Complexity: O(F + V)
 *  # </weight>
 */
export interface RecoveryCall_claim_recovery {
    __kind: 'claim_recovery'
    account: AccountId,
}

/**
 *  As the controller of a recoverable account, close an active recovery
 *  process for your account.
 * 
 *  Payment: By calling this function, the recoverable account will receive
 *  the recovery deposit `RecoveryDeposit` placed by the rescuer.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a
 *  recoverable account with an active recovery process for it.
 * 
 *  Parameters:
 *  - `rescuer`: The account trying to rescue this recoverable account.
 * 
 *  # <weight>
 *  Key: V (len of vouching friends)
 *  - One storage read/remove to get the active recovery process. O(1), Codec O(V)
 *  - One balance call to repatriate reserved. O(X)
 *  - One event.
 * 
 *  Total Complexity: O(V + X)
 *  # </weight>
 */
export interface RecoveryCall_close_recovery {
    __kind: 'close_recovery'
    rescuer: AccountId,
}

/**
 *  Create a recovery configuration for your account. This makes your account recoverable.
 * 
 *  Payment: `ConfigDepositBase` + `FriendDepositFactor` * #_of_friends balance
 *  will be reserved for storing the recovery configuration. This deposit is returned
 *  in full when the user calls `remove_recovery`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `friends`: A list of friends you trust to vouch for recovery attempts.
 *    Should be ordered and contain no duplicate values.
 *  - `threshold`: The number of friends that must vouch for a recovery attempt
 *    before the account can be recovered. Should be less than or equal to
 *    the length of the list of friends.
 *  - `delay_period`: The number of blocks after a recovery attempt is initialized
 *    that needs to pass before the account can be recovered.
 * 
 *  # <weight>
 *  - Key: F (len of friends)
 *  - One storage read to check that account is not already recoverable. O(1).
 *  - A check that the friends list is sorted and unique. O(F)
 *  - One currency reserve operation. O(X)
 *  - One storage write. O(1). Codec O(F).
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export interface RecoveryCall_create_recovery {
    __kind: 'create_recovery'
    friends: AccountId[],
    threshold: number,
    delayPeriod: BlockNumber,
}

/**
 *  Initiate the process for recovering a recoverable account.
 * 
 *  Payment: `RecoveryDeposit` balance will be reserved for initiating the
 *  recovery process. This deposit will always be repatriated to the account
 *  trying to be recovered. See `close_recovery`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `account`: The lost account that you want to recover. This account
 *    needs to be recoverable (i.e. have a recovery configuration).
 * 
 *  # <weight>
 *  - One storage read to check that account is recoverable. O(F)
 *  - One storage read to check that this recovery process hasn't already started. O(1)
 *  - One currency reserve operation. O(X)
 *  - One storage read to get the current block number. O(1)
 *  - One storage write. O(1).
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export interface RecoveryCall_initiate_recovery {
    __kind: 'initiate_recovery'
    account: AccountId,
}

/**
 *  Remove the recovery process for your account. Recovered accounts are still accessible.
 * 
 *  NOTE: The user must make sure to call `close_recovery` on all active
 *  recovery attempts before calling this function else it will fail.
 * 
 *  Payment: By calling this function the recoverable account will unreserve
 *  their recovery configuration deposit.
 *  (`ConfigDepositBase` + `FriendDepositFactor` * #_of_friends)
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a
 *  recoverable account (i.e. has a recovery configuration).
 * 
 *  # <weight>
 *  Key: F (len of friends)
 *  - One storage read to get the prefix iterator for active recoveries. O(1)
 *  - One storage read/remove to get the recovery configuration. O(1), Codec O(F)
 *  - One balance call to unreserved. O(X)
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export interface RecoveryCall_remove_recovery {
    __kind: 'remove_recovery'
}

/**
 *  Allow ROOT to bypass the recovery process and set an a rescuer account
 *  for a lost account directly.
 * 
 *  The dispatch origin for this call must be _ROOT_.
 * 
 *  Parameters:
 *  - `lost`: The "lost account" to be recovered.
 *  - `rescuer`: The "rescuer account" which can call as the lost account.
 * 
 *  # <weight>
 *  - One storage write O(1)
 *  - One event
 *  # </weight>
 */
export interface RecoveryCall_set_recovered {
    __kind: 'set_recovered'
    lost: AccountId,
    rescuer: AccountId,
}

/**
 *  Allow a "friend" of a recoverable account to vouch for an active recovery
 *  process for that account.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a "friend"
 *  for the recoverable account.
 * 
 *  Parameters:
 *  - `lost`: The lost account that you want to recover.
 *  - `rescuer`: The account trying to rescue the lost account that you
 *    want to vouch for.
 * 
 *  The combination of these two parameters must point to an active recovery
 *  process.
 * 
 *  # <weight>
 *  Key: F (len of friends in config), V (len of vouching friends)
 *  - One storage read to get the recovery configuration. O(1), Codec O(F)
 *  - One storage read to get the active recovery process. O(1), Codec O(V)
 *  - One binary search to confirm caller is a friend. O(logF)
 *  - One binary search to confirm caller has not already vouched. O(logV)
 *  - One storage write. O(1), Codec O(V).
 *  - One event.
 * 
 *  Total Complexity: O(F + logF + V + logV)
 *  # </weight>
 */
export interface RecoveryCall_vouch_recovery {
    __kind: 'vouch_recovery'
    lost: AccountId,
    rescuer: AccountId,
}

export const RecoveryCall: sts.Type<RecoveryCall> = sts.closedEnum(() => {
    return  {
        as_recovered: sts.enumStruct({
            account: AccountId,
            call: Type_138,
        }),
        cancel_recovered: sts.enumStruct({
            account: AccountId,
        }),
        claim_recovery: sts.enumStruct({
            account: AccountId,
        }),
        close_recovery: sts.enumStruct({
            rescuer: AccountId,
        }),
        create_recovery: sts.enumStruct({
            friends: sts.array(() => AccountId),
            threshold: sts.number(),
            delayPeriod: BlockNumber,
        }),
        initiate_recovery: sts.enumStruct({
            account: AccountId,
        }),
        remove_recovery: sts.unit(),
        set_recovered: sts.enumStruct({
            lost: AccountId,
            rescuer: AccountId,
        }),
        vouch_recovery: sts.enumStruct({
            lost: AccountId,
            rescuer: AccountId,
        }),
    }
})

export type ProxyCall = ProxyCall_add_proxy | ProxyCall_announce | ProxyCall_anonymous | ProxyCall_kill_anonymous | ProxyCall_proxy | ProxyCall_proxy_announced | ProxyCall_reject_announcement | ProxyCall_remove_announcement | ProxyCall_remove_proxies | ProxyCall_remove_proxy

/**
 *  Register a proxy account for the sender that is able to make calls on its behalf.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `proxy`: The account that the `caller` would like to make a proxy.
 *  - `proxy_type`: The permissions allowed for this proxy account.
 *  - `delay`: The announcement period required of the initial proxy. Will generally be
 *  zero.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export interface ProxyCall_add_proxy {
    __kind: 'add_proxy'
    delegate: AccountId,
    proxyType: ProxyType,
    delay: BlockNumber,
}

/**
 *  Publish the hash of a proxy-call that will be made in the future.
 * 
 *  This must be called some number of blocks before the corresponding `proxy` is attempted
 *  if the delay associated with the proxy relationship is greater than zero.
 * 
 *  No more than `MaxPending` announcements may be made at any one time.
 * 
 *  This will take a deposit of `AnnouncementDepositFactor` as well as
 *  `AnnouncementDepositBase` if there are no other pending announcements.
 * 
 *  The dispatch origin for this call must be _Signed_ and a proxy of `real`.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `call_hash`: The hash of the call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export interface ProxyCall_announce {
    __kind: 'announce'
    real: AccountId,
    callHash: CallHashOf,
}

/**
 *  Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
 *  initialize it with a proxy of `proxy_type` for `origin` sender.
 * 
 *  Requires a `Signed` origin.
 * 
 *  - `proxy_type`: The type of the proxy that the sender will be registered as over the
 *  new account. This will almost always be the most permissive `ProxyType` possible to
 *  allow for maximum flexibility.
 *  - `index`: A disambiguation index, in case this is called multiple times in the same
 *  transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
 *  want to use `0`.
 *  - `delay`: The announcement period required of the initial proxy. Will generally be
 *  zero.
 * 
 *  Fails with `Duplicate` if this has already been called in this transaction, from the
 *  same sender, with the same parameters.
 * 
 *  Fails if there are insufficient funds to pay for deposit.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 *  TODO: Might be over counting 1 read
 */
export interface ProxyCall_anonymous {
    __kind: 'anonymous'
    proxyType: ProxyType,
    delay: BlockNumber,
    index: number,
}

/**
 *  Removes a previously spawned anonymous proxy.
 * 
 *  WARNING: **All access to this account will be lost.** Any funds held in it will be
 *  inaccessible.
 * 
 *  Requires a `Signed` origin, and the sender account must have been created by a call to
 *  `anonymous` with corresponding parameters.
 * 
 *  - `spawner`: The account that originally called `anonymous` to create this account.
 *  - `index`: The disambiguation index originally passed to `anonymous`. Probably `0`.
 *  - `proxy_type`: The proxy type originally passed to `anonymous`.
 *  - `height`: The height of the chain when the call to `anonymous` was processed.
 *  - `ext_index`: The extrinsic index in which the call to `anonymous` was processed.
 * 
 *  Fails with `NoPermission` in case the caller is not a previously created anonymous
 *  account whose `anonymous` call has corresponding parameters.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export interface ProxyCall_kill_anonymous {
    __kind: 'kill_anonymous'
    spawner: AccountId,
    proxyType: ProxyType,
    index: number,
    height: number,
    extIndex: number,
}

/**
 *  Dispatch the given `call` from an account that the sender is authorised for through
 *  `add_proxy`.
 * 
 *  Removes any corresponding announcement(s).
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 *  - `call`: The call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export interface ProxyCall_proxy {
    __kind: 'proxy'
    real: AccountId,
    forceProxyType?: (ProxyType | undefined),
    call: Type_138,
}

/**
 *  Dispatch the given `call` from an account that the sender is authorized for through
 *  `add_proxy`.
 * 
 *  Removes any corresponding announcement(s).
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 *  - `call`: The call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export interface ProxyCall_proxy_announced {
    __kind: 'proxy_announced'
    delegate: AccountId,
    real: AccountId,
    forceProxyType?: (ProxyType | undefined),
    call: Type_138,
}

/**
 *  Remove the given announcement of a delegate.
 * 
 *  May be called by a target (proxied) account to remove a call that one of their delegates
 *  (`delegate`) has announced they want to execute. The deposit is returned.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `delegate`: The account that previously announced the call.
 *  - `call_hash`: The hash of the call to be made.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export interface ProxyCall_reject_announcement {
    __kind: 'reject_announcement'
    delegate: AccountId,
    callHash: CallHashOf,
}

/**
 *  Remove a given announcement.
 * 
 *  May be called by a proxy account to remove a call they previously announced and return
 *  the deposit.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `call_hash`: The hash of the call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export interface ProxyCall_remove_announcement {
    __kind: 'remove_announcement'
    real: AccountId,
    callHash: CallHashOf,
}

/**
 *  Unregister all proxy accounts for the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  WARNING: This may be called on accounts created by `anonymous`, however if done, then
 *  the unreserved fees will be inaccessible. **All access to this account will be lost.**
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export interface ProxyCall_remove_proxies {
    __kind: 'remove_proxies'
}

/**
 *  Unregister a proxy account for the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `proxy`: The account that the `caller` would like to remove as a proxy.
 *  - `proxy_type`: The permissions currently enabled for the removed proxy account.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export interface ProxyCall_remove_proxy {
    __kind: 'remove_proxy'
    delegate: AccountId,
    proxyType: ProxyType,
    delay: BlockNumber,
}

export const ProxyCall: sts.Type<ProxyCall> = sts.closedEnum(() => {
    return  {
        add_proxy: sts.enumStruct({
            delegate: AccountId,
            proxyType: ProxyType,
            delay: BlockNumber,
        }),
        announce: sts.enumStruct({
            real: AccountId,
            callHash: CallHashOf,
        }),
        anonymous: sts.enumStruct({
            proxyType: ProxyType,
            delay: BlockNumber,
            index: sts.number(),
        }),
        kill_anonymous: sts.enumStruct({
            spawner: AccountId,
            proxyType: ProxyType,
            index: sts.number(),
            height: sts.number(),
            extIndex: sts.number(),
        }),
        proxy: sts.enumStruct({
            real: AccountId,
            forceProxyType: sts.option(() => ProxyType),
            call: Type_138,
        }),
        proxy_announced: sts.enumStruct({
            delegate: AccountId,
            real: AccountId,
            forceProxyType: sts.option(() => ProxyType),
            call: Type_138,
        }),
        reject_announcement: sts.enumStruct({
            delegate: AccountId,
            callHash: CallHashOf,
        }),
        remove_announcement: sts.enumStruct({
            real: AccountId,
            callHash: CallHashOf,
        }),
        remove_proxies: sts.unit(),
        remove_proxy: sts.enumStruct({
            delegate: AccountId,
            proxyType: ProxyType,
            delay: BlockNumber,
        }),
    }
})

export type CallHashOf = Bytes

export const CallHashOf: sts.Type<CallHashOf> = sts.bytes()

export type PhragmenElectionCall = PhragmenElectionCall_clean_defunct_voters | PhragmenElectionCall_remove_member | PhragmenElectionCall_remove_voter | PhragmenElectionCall_renounce_candidacy | PhragmenElectionCall_submit_candidacy | PhragmenElectionCall_vote

/**
 *  Clean all voters who are defunct (i.e. they do not serve any purpose at all). The
 *  deposit of the removed voters are returned.
 * 
 *  This is an root function to be used only for cleaning the state.
 * 
 *  The dispatch origin of this call must be root.
 * 
 *  # <weight>
 *  The total number of voters and those that are defunct must be provided as witness data.
 *  # </weight>
 */
export interface PhragmenElectionCall_clean_defunct_voters {
    __kind: 'clean_defunct_voters'
    numVoters: number,
    numDefunct: number,
}

/**
 *  Remove a particular member from the set. This is effective immediately and the bond of
 *  the outgoing member is slashed.
 * 
 *  If a runner-up is available, then the best runner-up will be removed and replaces the
 *  outgoing member. Otherwise, a new phragmen election is started.
 * 
 *  The dispatch origin of this call must be root.
 * 
 *  Note that this does not affect the designated block number of the next election.
 * 
 *  # <weight>
 *  If we have a replacement, we use a small weight. Else, since this is a root call and
 *  will go into phragmen, we assume full block for now.
 *  # </weight>
 */
export interface PhragmenElectionCall_remove_member {
    __kind: 'remove_member'
    who: LookupSource,
    hasReplacement: boolean,
}

/**
 *  Remove `origin` as a voter.
 * 
 *  This removes the lock and returns the deposit.
 * 
 *  The dispatch origin of this call must be signed and be a voter.
 */
export interface PhragmenElectionCall_remove_voter {
    __kind: 'remove_voter'
}

/**
 *  Renounce one's intention to be a candidate for the next election round. 3 potential
 *  outcomes exist:
 * 
 *  - `origin` is a candidate and not elected in any set. In this case, the deposit is
 *    unreserved, returned and origin is removed as a candidate.
 *  - `origin` is a current runner-up. In this case, the deposit is unreserved, returned and
 *    origin is removed as a runner-up.
 *  - `origin` is a current member. In this case, the deposit is unreserved and origin is
 *    removed as a member, consequently not being a candidate for the next round anymore.
 *    Similar to [`remove_members`], if replacement runners exists, they are immediately
 *    used. If the prime is renouncing, then no prime will exist until the next round.
 * 
 *  The dispatch origin of this call must be signed, and have one of the above roles.
 * 
 *  # <weight>
 *  The type of renouncing must be provided as witness data.
 *  # </weight>
 */
export interface PhragmenElectionCall_renounce_candidacy {
    __kind: 'renounce_candidacy'
    renouncing: Renouncing,
}

/**
 *  Submit oneself for candidacy. A fixed amount of deposit is recorded.
 * 
 *  All candidates are wiped at the end of the term. They either become a member/runner-up,
 *  or leave the system while their deposit is slashed.
 * 
 *  The dispatch origin of this call must be signed.
 * 
 *  ### Warning
 * 
 *  Even if a candidate ends up being a member, they must call [`Call::renounce_candidacy`]
 *  to get their deposit back. Losing the spot in an election will always lead to a slash.
 * 
 *  # <weight>
 *  The number of current candidates must be provided as witness data.
 *  # </weight>
 */
export interface PhragmenElectionCall_submit_candidacy {
    __kind: 'submit_candidacy'
    candidateCount: number,
}

/**
 *  Vote for a set of candidates for the upcoming round of election. This can be called to
 *  set the initial votes, or update already existing votes.
 * 
 *  Upon initial voting, `value` units of `who`'s balance is locked and a deposit amount is
 *  reserved. The deposit is based on the number of votes and can be updated over time.
 * 
 *  The `votes` should:
 *    - not be empty.
 *    - be less than the number of possible candidates. Note that all current members and
 *      runners-up are also automatically candidates for the next round.
 * 
 *  If `value` is more than `who`'s total balance, then the maximum of the two is used.
 * 
 *  The dispatch origin of this call must be signed.
 * 
 *  ### Warning
 * 
 *  It is the responsibility of the caller to **NOT** place all of their balance into the
 *  lock and keep some for further operations.
 * 
 *  # <weight>
 *  We assume the maximum weight among all 3 cases: vote_equal, vote_more and vote_less.
 *  # </weight>
 */
export interface PhragmenElectionCall_vote {
    __kind: 'vote'
    votes: AccountId[],
    value: bigint,
}

export const PhragmenElectionCall: sts.Type<PhragmenElectionCall> = sts.closedEnum(() => {
    return  {
        clean_defunct_voters: sts.enumStruct({
            numVoters: sts.number(),
            numDefunct: sts.number(),
        }),
        remove_member: sts.enumStruct({
            who: LookupSource,
            hasReplacement: sts.boolean(),
        }),
        remove_voter: sts.unit(),
        renounce_candidacy: sts.enumStruct({
            renouncing: Renouncing,
        }),
        submit_candidacy: sts.enumStruct({
            candidateCount: sts.number(),
        }),
        vote: sts.enumStruct({
            votes: sts.array(() => AccountId),
            value: sts.bigint(),
        }),
    }
})

export type ParasUmpCall = never

export type ParasSharedCall = never

export type ParasSessionInfoCall = never

export type ParasSchedulerCall = never

export type ParasInitializerCall = ParasInitializerCall_force_approve

/**
 *  Issue a signal to the consensus engine to forcibly act as though all parachain
 *  blocks in all relay chain blocks up to and including the given number in the current
 *  chain are valid and should be finalized.
 */
export interface ParasInitializerCall_force_approve {
    __kind: 'force_approve'
    upTo: BlockNumber,
}

export const ParasInitializerCall: sts.Type<ParasInitializerCall> = sts.closedEnum(() => {
    return  {
        force_approve: sts.enumStruct({
            upTo: BlockNumber,
        }),
    }
})

export type ParasInherentCall = ParasInherentCall_enter

/**
 *  Enter the paras inherent. This will process bitfields and backed candidates.
 */
export interface ParasInherentCall_enter {
    __kind: 'enter'
    data: ParachainsInherentData,
}

export const ParasInherentCall: sts.Type<ParasInherentCall> = sts.closedEnum(() => {
    return  {
        enter: sts.enumStruct({
            data: ParachainsInherentData,
        }),
    }
})

export type ParasInclusionCall = never

export type ParasHrmpCall = ParasHrmpCall_force_clean_hrmp | ParasHrmpCall_force_process_hrmp_close | ParasHrmpCall_force_process_hrmp_open | ParasHrmpCall_hrmp_accept_open_channel | ParasHrmpCall_hrmp_close_channel | ParasHrmpCall_hrmp_init_open_channel

/**
 *  This extrinsic triggers the cleanup of all the HRMP storage items that
 *  a para may have. Normally this happens once per session, but this allows
 *  you to trigger the cleanup immediately for a specific parachain.
 * 
 *  Origin must be Root.
 */
export interface ParasHrmpCall_force_clean_hrmp {
    __kind: 'force_clean_hrmp'
    para: ParaId,
}

/**
 *  Force process hrmp close channel requests.
 * 
 *  If there are pending HRMP close channel requests, you can use this
 *  function process all of those requests immediately.
 */
export interface ParasHrmpCall_force_process_hrmp_close {
    __kind: 'force_process_hrmp_close'
}

/**
 *  Force process hrmp open channel requests.
 * 
 *  If there are pending HRMP open channel requests, you can use this
 *  function process all of those requests immediately.
 */
export interface ParasHrmpCall_force_process_hrmp_open {
    __kind: 'force_process_hrmp_open'
}

/**
 *  Accept a pending open channel request from the given sender.
 * 
 *  The channel will be opened only on the next session boundary.
 */
export interface ParasHrmpCall_hrmp_accept_open_channel {
    __kind: 'hrmp_accept_open_channel'
    sender: ParaId,
}

/**
 *  Initiate unilateral closing of a channel. The origin must be either the sender or the
 *  recipient in the channel being closed.
 * 
 *  The closure can only happen on a session change.
 */
export interface ParasHrmpCall_hrmp_close_channel {
    __kind: 'hrmp_close_channel'
    channelId: HrmpChannelId,
}

/**
 *  Initiate opening a channel from a parachain to a given recipient with given channel
 *  parameters.
 * 
 *  - `proposed_max_capacity` - specifies how many messages can be in the channel at once.
 *  - `proposed_max_message_size` - specifies the maximum size of any of the messages.
 * 
 *  These numbers are a subject to the relay-chain configuration limits.
 * 
 *  The channel can be opened only after the recipient confirms it and only on a session
 *  change.
 */
export interface ParasHrmpCall_hrmp_init_open_channel {
    __kind: 'hrmp_init_open_channel'
    recipient: ParaId,
    proposedMaxCapacity: number,
    proposedMaxMessageSize: number,
}

export const ParasHrmpCall: sts.Type<ParasHrmpCall> = sts.closedEnum(() => {
    return  {
        force_clean_hrmp: sts.enumStruct({
            para: ParaId,
        }),
        force_process_hrmp_close: sts.unit(),
        force_process_hrmp_open: sts.unit(),
        hrmp_accept_open_channel: sts.enumStruct({
            sender: ParaId,
        }),
        hrmp_close_channel: sts.enumStruct({
            channelId: HrmpChannelId,
        }),
        hrmp_init_open_channel: sts.enumStruct({
            recipient: ParaId,
            proposedMaxCapacity: sts.number(),
            proposedMaxMessageSize: sts.number(),
        }),
    }
})

export type ParasDmpCall = never

export type ParasCall = ParasCall_force_note_new_head | ParasCall_force_queue_action | ParasCall_force_schedule_code_upgrade | ParasCall_force_set_current_code | ParasCall_force_set_current_head

/**
 *  Note a new block head for para within the context of the current block.
 */
export interface ParasCall_force_note_new_head {
    __kind: 'force_note_new_head'
    para: ParaId,
    newHead: HeadData,
}

/**
 *  Put a parachain directly into the next session's action queue.
 *  We can't queue it any sooner than this without going into the
 *  initializer...
 */
export interface ParasCall_force_queue_action {
    __kind: 'force_queue_action'
    para: ParaId,
}

/**
 *  Schedule a code upgrade for block `expected_at`.
 */
export interface ParasCall_force_schedule_code_upgrade {
    __kind: 'force_schedule_code_upgrade'
    para: ParaId,
    newCode: ValidationCode,
    expectedAt: BlockNumber,
}

/**
 *  Set the storage for the parachain validation code immediately.
 */
export interface ParasCall_force_set_current_code {
    __kind: 'force_set_current_code'
    para: ParaId,
    newCode: ValidationCode,
}

/**
 *  Set the storage for the current parachain head data immediately.
 */
export interface ParasCall_force_set_current_head {
    __kind: 'force_set_current_head'
    para: ParaId,
    newHead: HeadData,
}

export const ParasCall: sts.Type<ParasCall> = sts.closedEnum(() => {
    return  {
        force_note_new_head: sts.enumStruct({
            para: ParaId,
            newHead: HeadData,
        }),
        force_queue_action: sts.enumStruct({
            para: ParaId,
        }),
        force_schedule_code_upgrade: sts.enumStruct({
            para: ParaId,
            newCode: ValidationCode,
            expectedAt: BlockNumber,
        }),
        force_set_current_code: sts.enumStruct({
            para: ParaId,
            newCode: ValidationCode,
        }),
        force_set_current_head: sts.enumStruct({
            para: ParaId,
            newHead: HeadData,
        }),
    }
})

export type ParachainsConfigurationCall = ParachainsConfigurationCall_set_chain_availability_period | ParachainsConfigurationCall_set_code_retention_period | ParachainsConfigurationCall_set_dispute_conclusion_by_time_out_period | ParachainsConfigurationCall_set_dispute_max_spam_slots | ParachainsConfigurationCall_set_dispute_period | ParachainsConfigurationCall_set_dispute_post_conclusion_acceptance_period | ParachainsConfigurationCall_set_group_rotation_frequency | ParachainsConfigurationCall_set_hrmp_channel_max_capacity | ParachainsConfigurationCall_set_hrmp_channel_max_message_size | ParachainsConfigurationCall_set_hrmp_channel_max_total_size | ParachainsConfigurationCall_set_hrmp_max_message_num_per_candidate | ParachainsConfigurationCall_set_hrmp_max_parachain_inbound_channels | ParachainsConfigurationCall_set_hrmp_max_parachain_outbound_channels | ParachainsConfigurationCall_set_hrmp_max_parathread_inbound_channels | ParachainsConfigurationCall_set_hrmp_max_parathread_outbound_channels | ParachainsConfigurationCall_set_hrmp_open_request_ttl | ParachainsConfigurationCall_set_hrmp_recipient_deposit | ParachainsConfigurationCall_set_hrmp_sender_deposit | ParachainsConfigurationCall_set_max_code_size | ParachainsConfigurationCall_set_max_downward_message_size | ParachainsConfigurationCall_set_max_head_data_size | ParachainsConfigurationCall_set_max_pov_size | ParachainsConfigurationCall_set_max_upward_message_num_per_candidate | ParachainsConfigurationCall_set_max_upward_message_size | ParachainsConfigurationCall_set_max_upward_queue_count | ParachainsConfigurationCall_set_max_upward_queue_size | ParachainsConfigurationCall_set_max_validators | ParachainsConfigurationCall_set_max_validators_per_core | ParachainsConfigurationCall_set_n_delay_tranches | ParachainsConfigurationCall_set_needed_approvals | ParachainsConfigurationCall_set_no_show_slots | ParachainsConfigurationCall_set_parathread_cores | ParachainsConfigurationCall_set_parathread_retries | ParachainsConfigurationCall_set_preferred_dispatchable_upward_messages_step_weight | ParachainsConfigurationCall_set_relay_vrf_modulo_samples | ParachainsConfigurationCall_set_scheduling_lookahead | ParachainsConfigurationCall_set_thread_availability_period | ParachainsConfigurationCall_set_validation_upgrade_delay | ParachainsConfigurationCall_set_validation_upgrade_frequency | ParachainsConfigurationCall_set_zeroth_delay_tranche_width

/**
 *  Set the availability period for parachains.
 */
export interface ParachainsConfigurationCall_set_chain_availability_period {
    __kind: 'set_chain_availability_period'
    new: BlockNumber,
}

/**
 *  Set the acceptance period for an included candidate.
 */
export interface ParachainsConfigurationCall_set_code_retention_period {
    __kind: 'set_code_retention_period'
    new: BlockNumber,
}

/**
 *  Set the dispute conclusion by time out period.
 */
export interface ParachainsConfigurationCall_set_dispute_conclusion_by_time_out_period {
    __kind: 'set_dispute_conclusion_by_time_out_period'
    new: BlockNumber,
}

/**
 *  Set the maximum number of dispute spam slots.
 */
export interface ParachainsConfigurationCall_set_dispute_max_spam_slots {
    __kind: 'set_dispute_max_spam_slots'
    new: number,
}

/**
 *  Set the dispute period, in number of sessions to keep for disputes.
 */
export interface ParachainsConfigurationCall_set_dispute_period {
    __kind: 'set_dispute_period'
    new: SessionIndex,
}

/**
 *  Set the dispute post conclusion acceptance period.
 */
export interface ParachainsConfigurationCall_set_dispute_post_conclusion_acceptance_period {
    __kind: 'set_dispute_post_conclusion_acceptance_period'
    new: BlockNumber,
}

/**
 *  Set the parachain validator-group rotation frequency
 */
export interface ParachainsConfigurationCall_set_group_rotation_frequency {
    __kind: 'set_group_rotation_frequency'
    new: BlockNumber,
}

/**
 *  Sets the maximum number of messages allowed in an HRMP channel at once.
 */
export interface ParachainsConfigurationCall_set_hrmp_channel_max_capacity {
    __kind: 'set_hrmp_channel_max_capacity'
    new: number,
}

/**
 *  Sets the maximum size of a message that could ever be put into an HRMP channel.
 */
export interface ParachainsConfigurationCall_set_hrmp_channel_max_message_size {
    __kind: 'set_hrmp_channel_max_message_size'
    new: number,
}

/**
 *  Sets the maximum total size of messages in bytes allowed in an HRMP channel at once.
 */
export interface ParachainsConfigurationCall_set_hrmp_channel_max_total_size {
    __kind: 'set_hrmp_channel_max_total_size'
    new: number,
}

/**
 *  Sets the maximum number of outbound HRMP messages can be sent by a candidate.
 */
export interface ParachainsConfigurationCall_set_hrmp_max_message_num_per_candidate {
    __kind: 'set_hrmp_max_message_num_per_candidate'
    new: number,
}

/**
 *  Sets the maximum number of inbound HRMP channels a parachain is allowed to accept.
 */
export interface ParachainsConfigurationCall_set_hrmp_max_parachain_inbound_channels {
    __kind: 'set_hrmp_max_parachain_inbound_channels'
    new: number,
}

/**
 *  Sets the maximum number of outbound HRMP channels a parachain is allowed to open.
 */
export interface ParachainsConfigurationCall_set_hrmp_max_parachain_outbound_channels {
    __kind: 'set_hrmp_max_parachain_outbound_channels'
    new: number,
}

/**
 *  Sets the maximum number of inbound HRMP channels a parathread is allowed to accept.
 */
export interface ParachainsConfigurationCall_set_hrmp_max_parathread_inbound_channels {
    __kind: 'set_hrmp_max_parathread_inbound_channels'
    new: number,
}

/**
 *  Sets the maximum number of outbound HRMP channels a parathread is allowed to open.
 */
export interface ParachainsConfigurationCall_set_hrmp_max_parathread_outbound_channels {
    __kind: 'set_hrmp_max_parathread_outbound_channels'
    new: number,
}

/**
 *  Sets the number of sessions after which an HRMP open channel request expires.
 */
export interface ParachainsConfigurationCall_set_hrmp_open_request_ttl {
    __kind: 'set_hrmp_open_request_ttl'
    new: number,
}

/**
 *  Sets the amount of funds that the recipient should provide for accepting opening an HRMP
 *  channel.
 */
export interface ParachainsConfigurationCall_set_hrmp_recipient_deposit {
    __kind: 'set_hrmp_recipient_deposit'
    new: Balance,
}

/**
 *  Sets the amount of funds that the sender should provide for opening an HRMP channel.
 */
export interface ParachainsConfigurationCall_set_hrmp_sender_deposit {
    __kind: 'set_hrmp_sender_deposit'
    new: Balance,
}

/**
 *  Set the max validation code size for incoming upgrades.
 */
export interface ParachainsConfigurationCall_set_max_code_size {
    __kind: 'set_max_code_size'
    new: number,
}

/**
 *  Set the critical downward message size.
 */
export interface ParachainsConfigurationCall_set_max_downward_message_size {
    __kind: 'set_max_downward_message_size'
    new: number,
}

/**
 *  Set the max head data size for paras.
 */
export interface ParachainsConfigurationCall_set_max_head_data_size {
    __kind: 'set_max_head_data_size'
    new: number,
}

/**
 *  Set the max POV block size for incoming upgrades.
 */
export interface ParachainsConfigurationCall_set_max_pov_size {
    __kind: 'set_max_pov_size'
    new: number,
}

/**
 *  Sets the maximum number of messages that a candidate can contain.
 */
export interface ParachainsConfigurationCall_set_max_upward_message_num_per_candidate {
    __kind: 'set_max_upward_message_num_per_candidate'
    new: number,
}

/**
 *  Sets the maximum size of an upward message that can be sent by a candidate.
 */
export interface ParachainsConfigurationCall_set_max_upward_message_size {
    __kind: 'set_max_upward_message_size'
    new: number,
}

/**
 *  Sets the maximum items that can present in a upward dispatch queue at once.
 */
export interface ParachainsConfigurationCall_set_max_upward_queue_count {
    __kind: 'set_max_upward_queue_count'
    new: number,
}

/**
 *  Sets the maximum total size of items that can present in a upward dispatch queue at once.
 */
export interface ParachainsConfigurationCall_set_max_upward_queue_size {
    __kind: 'set_max_upward_queue_size'
    new: number,
}

/**
 *  Set the maximum number of validators to use in parachain consensus.
 */
export interface ParachainsConfigurationCall_set_max_validators {
    __kind: 'set_max_validators'
    new?: (number | undefined),
}

/**
 *  Set the maximum number of validators to assign to any core.
 */
export interface ParachainsConfigurationCall_set_max_validators_per_core {
    __kind: 'set_max_validators_per_core'
    new?: (number | undefined),
}

/**
 *  Set the total number of delay tranches.
 */
export interface ParachainsConfigurationCall_set_n_delay_tranches {
    __kind: 'set_n_delay_tranches'
    new: number,
}

/**
 *  Set the number of validators needed to approve a block.
 */
export interface ParachainsConfigurationCall_set_needed_approvals {
    __kind: 'set_needed_approvals'
    new: number,
}

/**
 *  Set the no show slots, in number of number of consensus slots.
 *  Must be at least 1.
 */
export interface ParachainsConfigurationCall_set_no_show_slots {
    __kind: 'set_no_show_slots'
    new: number,
}

/**
 *  Set the number of parathread execution cores.
 */
export interface ParachainsConfigurationCall_set_parathread_cores {
    __kind: 'set_parathread_cores'
    new: number,
}

/**
 *  Set the number of retries for a particular parathread.
 */
export interface ParachainsConfigurationCall_set_parathread_retries {
    __kind: 'set_parathread_retries'
    new: number,
}

/**
 *  Sets the soft limit for the phase of dispatching dispatchable upward messages.
 */
export interface ParachainsConfigurationCall_set_preferred_dispatchable_upward_messages_step_weight {
    __kind: 'set_preferred_dispatchable_upward_messages_step_weight'
    new: Weight,
}

/**
 *  Set the number of samples to do of the RelayVRFModulo approval assignment criterion.
 */
export interface ParachainsConfigurationCall_set_relay_vrf_modulo_samples {
    __kind: 'set_relay_vrf_modulo_samples'
    new: number,
}

/**
 *  Set the scheduling lookahead, in expected number of blocks at peak throughput.
 */
export interface ParachainsConfigurationCall_set_scheduling_lookahead {
    __kind: 'set_scheduling_lookahead'
    new: number,
}

/**
 *  Set the availability period for parathreads.
 */
export interface ParachainsConfigurationCall_set_thread_availability_period {
    __kind: 'set_thread_availability_period'
    new: BlockNumber,
}

/**
 *  Set the validation upgrade delay.
 */
export interface ParachainsConfigurationCall_set_validation_upgrade_delay {
    __kind: 'set_validation_upgrade_delay'
    new: BlockNumber,
}

/**
 *  Set the validation upgrade frequency.
 */
export interface ParachainsConfigurationCall_set_validation_upgrade_frequency {
    __kind: 'set_validation_upgrade_frequency'
    new: BlockNumber,
}

/**
 *  Set the zeroth delay tranche width.
 */
export interface ParachainsConfigurationCall_set_zeroth_delay_tranche_width {
    __kind: 'set_zeroth_delay_tranche_width'
    new: number,
}

export const ParachainsConfigurationCall: sts.Type<ParachainsConfigurationCall> = sts.closedEnum(() => {
    return  {
        set_chain_availability_period: sts.enumStruct({
            new: BlockNumber,
        }),
        set_code_retention_period: sts.enumStruct({
            new: BlockNumber,
        }),
        set_dispute_conclusion_by_time_out_period: sts.enumStruct({
            new: BlockNumber,
        }),
        set_dispute_max_spam_slots: sts.enumStruct({
            new: sts.number(),
        }),
        set_dispute_period: sts.enumStruct({
            new: SessionIndex,
        }),
        set_dispute_post_conclusion_acceptance_period: sts.enumStruct({
            new: BlockNumber,
        }),
        set_group_rotation_frequency: sts.enumStruct({
            new: BlockNumber,
        }),
        set_hrmp_channel_max_capacity: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_channel_max_message_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_channel_max_total_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_max_message_num_per_candidate: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_max_parachain_inbound_channels: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_max_parachain_outbound_channels: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_max_parathread_inbound_channels: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_max_parathread_outbound_channels: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_open_request_ttl: sts.enumStruct({
            new: sts.number(),
        }),
        set_hrmp_recipient_deposit: sts.enumStruct({
            new: Balance,
        }),
        set_hrmp_sender_deposit: sts.enumStruct({
            new: Balance,
        }),
        set_max_code_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_downward_message_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_head_data_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_pov_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_upward_message_num_per_candidate: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_upward_message_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_upward_queue_count: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_upward_queue_size: sts.enumStruct({
            new: sts.number(),
        }),
        set_max_validators: sts.enumStruct({
            new: sts.option(() => sts.number()),
        }),
        set_max_validators_per_core: sts.enumStruct({
            new: sts.option(() => sts.number()),
        }),
        set_n_delay_tranches: sts.enumStruct({
            new: sts.number(),
        }),
        set_needed_approvals: sts.enumStruct({
            new: sts.number(),
        }),
        set_no_show_slots: sts.enumStruct({
            new: sts.number(),
        }),
        set_parathread_cores: sts.enumStruct({
            new: sts.number(),
        }),
        set_parathread_retries: sts.enumStruct({
            new: sts.number(),
        }),
        set_preferred_dispatchable_upward_messages_step_weight: sts.enumStruct({
            new: Weight,
        }),
        set_relay_vrf_modulo_samples: sts.enumStruct({
            new: sts.number(),
        }),
        set_scheduling_lookahead: sts.enumStruct({
            new: sts.number(),
        }),
        set_thread_availability_period: sts.enumStruct({
            new: BlockNumber,
        }),
        set_validation_upgrade_delay: sts.enumStruct({
            new: BlockNumber,
        }),
        set_validation_upgrade_frequency: sts.enumStruct({
            new: BlockNumber,
        }),
        set_zeroth_delay_tranche_width: sts.enumStruct({
            new: sts.number(),
        }),
    }
})

export type OffencesCall = never

export type MultisigCall = MultisigCall_approve_as_multi | MultisigCall_as_multi | MultisigCall_as_multi_threshold_1 | MultisigCall_cancel_as_multi

/**
 *  Register approval for a dispatch to be made from a deterministic composite account if
 *  approved by a total of `threshold - 1` of `other_signatories`.
 * 
 *  Payment: `DepositBase` will be reserved if this is the first approval, plus
 *  `threshold` times `DepositFactor`. It is returned once this dispatch happens or
 *  is cancelled.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `threshold`: The total number of approvals for this dispatch before it is executed.
 *  - `other_signatories`: The accounts (other than the sender) who can approve this
 *  dispatch. May not be empty.
 *  - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
 *  not the first approval, then it must be `Some`, with the timepoint (block number and
 *  transaction index) of the first approval transaction.
 *  - `call_hash`: The hash of the call to be executed.
 * 
 *  NOTE: If this is the final approval, you will want to use `as_multi` instead.
 * 
 *  # <weight>
 *  - `O(S)`.
 *  - Up to one balance-reserve or unreserve operation.
 *  - One passthrough operation, one insert, both `O(S)` where `S` is the number of
 *    signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
 *  - One encode & hash, both of complexity `O(S)`.
 *  - Up to one binary search and insert (`O(logS + S)`).
 *  - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
 *  - One event.
 *  - Storage: inserts one item, value size bounded by `MaxSignatories`, with a
 *    deposit taken for its lifetime of
 *    `DepositBase + threshold * DepositFactor`.
 *  ----------------------------------
 *  - DB Weight:
 *      - Read: Multisig Storage, [Caller Account]
 *      - Write: Multisig Storage, [Caller Account]
 *  # </weight>
 */
export interface MultisigCall_approve_as_multi {
    __kind: 'approve_as_multi'
    threshold: number,
    otherSignatories: AccountId[],
    maybeTimepoint?: (Timepoint | undefined),
    callHash: Bytes,
    maxWeight: Weight,
}

/**
 *  Register approval for a dispatch to be made from a deterministic composite account if
 *  approved by a total of `threshold - 1` of `other_signatories`.
 * 
 *  If there are enough, then dispatch the call.
 * 
 *  Payment: `DepositBase` will be reserved if this is the first approval, plus
 *  `threshold` times `DepositFactor`. It is returned once this dispatch happens or
 *  is cancelled.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `threshold`: The total number of approvals for this dispatch before it is executed.
 *  - `other_signatories`: The accounts (other than the sender) who can approve this
 *  dispatch. May not be empty.
 *  - `maybe_timepoint`: If this is the first approval, then this must be `None`. If it is
 *  not the first approval, then it must be `Some`, with the timepoint (block number and
 *  transaction index) of the first approval transaction.
 *  - `call`: The call to be executed.
 * 
 *  NOTE: Unless this is the final approval, you will generally want to use
 *  `approve_as_multi` instead, since it only requires a hash of the call.
 * 
 *  Result is equivalent to the dispatched result if `threshold` is exactly `1`. Otherwise
 *  on success, result is `Ok` and the result from the interior call, if it was executed,
 *  may be found in the deposited `MultisigExecuted` event.
 * 
 *  # <weight>
 *  - `O(S + Z + Call)`.
 *  - Up to one balance-reserve or unreserve operation.
 *  - One passthrough operation, one insert, both `O(S)` where `S` is the number of
 *    signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
 *  - One call encode & hash, both of complexity `O(Z)` where `Z` is tx-len.
 *  - One encode & hash, both of complexity `O(S)`.
 *  - Up to one binary search and insert (`O(logS + S)`).
 *  - I/O: 1 read `O(S)`, up to 1 mutate `O(S)`. Up to one remove.
 *  - One event.
 *  - The weight of the `call`.
 *  - Storage: inserts one item, value size bounded by `MaxSignatories`, with a
 *    deposit taken for its lifetime of
 *    `DepositBase + threshold * DepositFactor`.
 *  -------------------------------
 *  - DB Weight:
 *      - Reads: Multisig Storage, [Caller Account], Calls (if `store_call`)
 *      - Writes: Multisig Storage, [Caller Account], Calls (if `store_call`)
 *  - Plus Call Weight
 *  # </weight>
 */
export interface MultisigCall_as_multi {
    __kind: 'as_multi'
    threshold: number,
    otherSignatories: AccountId[],
    maybeTimepoint?: (Timepoint | undefined),
    call: OpaqueCall,
    storeCall: boolean,
    maxWeight: Weight,
}

/**
 *  Immediately dispatch a multi-signature call using a single approval from the caller.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `other_signatories`: The accounts (other than the sender) who are part of the
 *  multi-signature, but do not participate in the approval process.
 *  - `call`: The call to be executed.
 * 
 *  Result is equivalent to the dispatched result.
 * 
 *  # <weight>
 *  O(Z + C) where Z is the length of the call and C its execution weight.
 *  -------------------------------
 *  - DB Weight: None
 *  - Plus Call Weight
 *  # </weight>
 */
export interface MultisigCall_as_multi_threshold_1 {
    __kind: 'as_multi_threshold_1'
    otherSignatories: AccountId[],
    call: Type_138,
}

/**
 *  Cancel a pre-existing, on-going multisig transaction. Any deposit reserved previously
 *  for this operation will be unreserved on success.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `threshold`: The total number of approvals for this dispatch before it is executed.
 *  - `other_signatories`: The accounts (other than the sender) who can approve this
 *  dispatch. May not be empty.
 *  - `timepoint`: The timepoint (block number and transaction index) of the first approval
 *  transaction for this dispatch.
 *  - `call_hash`: The hash of the call to be executed.
 * 
 *  # <weight>
 *  - `O(S)`.
 *  - Up to one balance-reserve or unreserve operation.
 *  - One passthrough operation, one insert, both `O(S)` where `S` is the number of
 *    signatories. `S` is capped by `MaxSignatories`, with weight being proportional.
 *  - One encode & hash, both of complexity `O(S)`.
 *  - One event.
 *  - I/O: 1 read `O(S)`, one remove.
 *  - Storage: removes one item.
 *  ----------------------------------
 *  - DB Weight:
 *      - Read: Multisig Storage, [Caller Account], Refund Account, Calls
 *      - Write: Multisig Storage, [Caller Account], Refund Account, Calls
 *  # </weight>
 */
export interface MultisigCall_cancel_as_multi {
    __kind: 'cancel_as_multi'
    threshold: number,
    otherSignatories: AccountId[],
    timepoint: Timepoint,
    callHash: Bytes,
}

export const MultisigCall: sts.Type<MultisigCall> = sts.closedEnum(() => {
    return  {
        approve_as_multi: sts.enumStruct({
            threshold: sts.number(),
            otherSignatories: sts.array(() => AccountId),
            maybeTimepoint: sts.option(() => Timepoint),
            callHash: sts.bytes(),
            maxWeight: Weight,
        }),
        as_multi: sts.enumStruct({
            threshold: sts.number(),
            otherSignatories: sts.array(() => AccountId),
            maybeTimepoint: sts.option(() => Timepoint),
            call: OpaqueCall,
            storeCall: sts.boolean(),
            maxWeight: Weight,
        }),
        as_multi_threshold_1: sts.enumStruct({
            otherSignatories: sts.array(() => AccountId),
            call: Type_138,
        }),
        cancel_as_multi: sts.enumStruct({
            threshold: sts.number(),
            otherSignatories: sts.array(() => AccountId),
            timepoint: Timepoint,
            callHash: sts.bytes(),
        }),
    }
})

export type OpaqueCall = Bytes

export const OpaqueCall: sts.Type<OpaqueCall> = sts.bytes()

export type Timepoint = {
    height: BlockNumber,
    index: number,
}

export const Timepoint: sts.Type<Timepoint> = sts.struct(() => {
    return  {
        height: BlockNumber,
        index: sts.number(),
    }
})

export type IndicesCall = IndicesCall_claim | IndicesCall_force_transfer | IndicesCall_free | IndicesCall_freeze | IndicesCall_transfer

/**
 *  Assign an previously unassigned index.
 * 
 *  Payment: `Deposit` is reserved from the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `index`: the index to be claimed. This must not be in use.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One reserve operation.
 *  - One event.
 *  -------------------
 *  - DB Weight: 1 Read/Write (Accounts)
 *  # </weight>
 */
export interface IndicesCall_claim {
    __kind: 'claim'
    index: AccountIndex,
}

/**
 *  Force an index to an account. This doesn't require a deposit. If the index is already
 *  held, then any deposit is reimbursed to its current owner.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  - `index`: the index to be (re-)assigned.
 *  - `new`: the new owner of the index. This function is a no-op if it is equal to sender.
 *  - `freeze`: if set to `true`, will freeze the index so it cannot be transferred.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - Up to one reserve operation.
 *  - One event.
 *  -------------------
 *  - DB Weight:
 *     - Reads: Indices Accounts, System Account (original owner)
 *     - Writes: Indices Accounts, System Account (original owner)
 *  # </weight>
 */
export interface IndicesCall_force_transfer {
    __kind: 'force_transfer'
    new: AccountId,
    index: AccountIndex,
    freeze: boolean,
}

/**
 *  Free up an index owned by the sender.
 * 
 *  Payment: Any previous deposit placed for the index is unreserved in the sender account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must own the index.
 * 
 *  - `index`: the index to be freed. This must be owned by the sender.
 * 
 *  Emits `IndexFreed` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One reserve operation.
 *  - One event.
 *  -------------------
 *  - DB Weight: 1 Read/Write (Accounts)
 *  # </weight>
 */
export interface IndicesCall_free {
    __kind: 'free'
    index: AccountIndex,
}

/**
 *  Freeze an index so it will always point to the sender account. This consumes the deposit.
 * 
 *  The dispatch origin for this call must be _Signed_ and the signing account must have a
 *  non-frozen account `index`.
 * 
 *  - `index`: the index to be frozen in place.
 * 
 *  Emits `IndexFrozen` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - Up to one slash operation.
 *  - One event.
 *  -------------------
 *  - DB Weight: 1 Read/Write (Accounts)
 *  # </weight>
 */
export interface IndicesCall_freeze {
    __kind: 'freeze'
    index: AccountIndex,
}

/**
 *  Assign an index already owned by the sender to another account. The balance reservation
 *  is effectively transferred to the new account.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `index`: the index to be re-assigned. This must be owned by the sender.
 *  - `new`: the new owner of the index. This function is a no-op if it is equal to sender.
 * 
 *  Emits `IndexAssigned` if successful.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  - One storage mutation (codec `O(1)`).
 *  - One transfer operation.
 *  - One event.
 *  -------------------
 *  - DB Weight:
 *     - Reads: Indices Accounts, System Account (recipient)
 *     - Writes: Indices Accounts, System Account (recipient)
 *  # </weight>
 */
export interface IndicesCall_transfer {
    __kind: 'transfer'
    new: AccountId,
    index: AccountIndex,
}

export const IndicesCall: sts.Type<IndicesCall> = sts.closedEnum(() => {
    return  {
        claim: sts.enumStruct({
            index: AccountIndex,
        }),
        force_transfer: sts.enumStruct({
            new: AccountId,
            index: AccountIndex,
            freeze: sts.boolean(),
        }),
        free: sts.enumStruct({
            index: AccountIndex,
        }),
        freeze: sts.enumStruct({
            index: AccountIndex,
        }),
        transfer: sts.enumStruct({
            new: AccountId,
            index: AccountIndex,
        }),
    }
})

export type AccountIndex = number

export const AccountIndex: sts.Type<AccountIndex> = sts.number()

export type ImOnlineCall = ImOnlineCall_heartbeat

/**
 *  # <weight>
 *  - Complexity: `O(K + E)` where K is length of `Keys` (heartbeat.validators_len)
 *    and E is length of `heartbeat.network_state.external_address`
 *    - `O(K)`: decoding of length `K`
 *    - `O(E)`: decoding/encoding of length `E`
 *  - DbReads: pallet_session `Validators`, pallet_session `CurrentIndex`, `Keys`,
 *    `ReceivedHeartbeats`
 *  - DbWrites: `ReceivedHeartbeats`
 *  # </weight>
 */
export interface ImOnlineCall_heartbeat {
    __kind: 'heartbeat'
    heartbeat: Heartbeat,
    signature: Signature,
}

export const ImOnlineCall: sts.Type<ImOnlineCall> = sts.closedEnum(() => {
    return  {
        heartbeat: sts.enumStruct({
            heartbeat: Heartbeat,
            signature: Signature,
        }),
    }
})

export type Heartbeat = {
    blockNumber: BlockNumber,
    networkState: OpaqueNetworkState,
    sessionIndex: SessionIndex,
    authorityIndex: AuthIndex,
    validatorsLen: number,
}

export const Heartbeat: sts.Type<Heartbeat> = sts.struct(() => {
    return  {
        blockNumber: BlockNumber,
        networkState: OpaqueNetworkState,
        sessionIndex: SessionIndex,
        authorityIndex: AuthIndex,
        validatorsLen: sts.number(),
    }
})

export type AuthIndex = number

export const AuthIndex: sts.Type<AuthIndex> = sts.number()

export type OpaqueNetworkState = {
    peerId: OpaquePeerId,
    externalAddresses: OpaqueMultiaddr[],
}

export const OpaqueNetworkState: sts.Type<OpaqueNetworkState> = sts.struct(() => {
    return  {
        peerId: OpaquePeerId,
        externalAddresses: sts.array(() => OpaqueMultiaddr),
    }
})

export type OpaqueMultiaddr = Bytes

export const OpaqueMultiaddr: sts.Type<OpaqueMultiaddr> = sts.bytes()

export type OpaquePeerId = Bytes

export const OpaquePeerId: sts.Type<OpaquePeerId> = sts.bytes()

export type IdentityCall = IdentityCall_add_registrar | IdentityCall_add_sub | IdentityCall_cancel_request | IdentityCall_clear_identity | IdentityCall_kill_identity | IdentityCall_provide_judgement | IdentityCall_quit_sub | IdentityCall_remove_sub | IdentityCall_rename_sub | IdentityCall_request_judgement | IdentityCall_set_account_id | IdentityCall_set_fee | IdentityCall_set_fields | IdentityCall_set_identity | IdentityCall_set_subs

/**
 *  Add a registrar to the system.
 * 
 *  The dispatch origin for this call must be `T::RegistrarOrigin`.
 * 
 *  - `account`: the account of the registrar.
 * 
 *  Emits `RegistrarAdded` if successful.
 * 
 *  # <weight>
 *  - `O(R)` where `R` registrar-count (governance-bounded and code-bounded).
 *  - One storage mutation (codec `O(R)`).
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_add_registrar {
    __kind: 'add_registrar'
    account: AccountId,
}

/**
 *  Add the given account to the sender's subs.
 * 
 *  Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 *  to the sender.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  sub identity of `sub`.
 */
export interface IdentityCall_add_sub {
    __kind: 'add_sub'
    sub: LookupSource,
    data: Data,
}

/**
 *  Cancel a previous request.
 * 
 *  Payment: A previously reserved deposit is returned on success.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a
 *  registered identity.
 * 
 *  - `reg_index`: The index of the registrar whose judgement is no longer requested.
 * 
 *  Emits `JudgementUnrequested` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-reserve operation.
 *  - One storage mutation `O(R + X)`.
 *  - One event
 *  # </weight>
 */
export interface IdentityCall_cancel_request {
    __kind: 'cancel_request'
    regIndex: RegistrarIndex,
}

/**
 *  Clear an account's identity info and all sub-accounts and return all deposits.
 * 
 *  Payment: All reserved balances on the account are returned.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  Emits `IdentityCleared` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`
 *    - where `R` registrar-count (governance-bounded).
 *    - where `S` subs-count (hard- and deposit-bounded).
 *    - where `X` additional-field-count (deposit-bounded and code-bounded).
 *  - One balance-unreserve operation.
 *  - `2` storage reads and `S + 2` storage deletions.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_clear_identity {
    __kind: 'clear_identity'
}

/**
 *  Remove an account's identity and sub-account information and slash the deposits.
 * 
 *  Payment: Reserved balances from `set_subs` and `set_identity` are slashed and handled by
 *  `Slash`. Verification request deposits are not returned; they should be cancelled
 *  manually using `cancel_request`.
 * 
 *  The dispatch origin for this call must match `T::ForceOrigin`.
 * 
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 * 
 *  Emits `IdentityKilled` if successful.
 * 
 *  # <weight>
 *  - `O(R + S + X)`.
 *  - One balance-reserve operation.
 *  - `S + 2` storage mutations.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_kill_identity {
    __kind: 'kill_identity'
    target: LookupSource,
}

/**
 *  Provide a judgement for an account's identity.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `reg_index`.
 * 
 *  - `reg_index`: the index of the registrar whose judgement is being made.
 *  - `target`: the account whose identity the judgement is upon. This must be an account
 *    with a registered identity.
 *  - `judgement`: the judgement of the registrar of index `reg_index` about `target`.
 * 
 *  Emits `JudgementGiven` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-transfer operation.
 *  - Up to one account-lookup operation.
 *  - Storage: 1 read `O(R)`, 1 mutate `O(R + X)`.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_provide_judgement {
    __kind: 'provide_judgement'
    regIndex: number,
    target: LookupSource,
    judgement: IdentityJudgement,
}

/**
 *  Remove the sender as a sub-account.
 * 
 *  Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 *  to the sender (*not* the original depositor).
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  super-identity.
 * 
 *  NOTE: This should not normally be used, but is provided in the case that the non-
 *  controller of an account is maliciously registered as a sub-account.
 */
export interface IdentityCall_quit_sub {
    __kind: 'quit_sub'
}

/**
 *  Remove the given account from the sender's subs.
 * 
 *  Payment: Balance reserved by a previous `set_subs` call for one sub will be repatriated
 *  to the sender.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  sub identity of `sub`.
 */
export interface IdentityCall_remove_sub {
    __kind: 'remove_sub'
    sub: LookupSource,
}

/**
 *  Alter the associated name of the given sub-account.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  sub identity of `sub`.
 */
export interface IdentityCall_rename_sub {
    __kind: 'rename_sub'
    sub: LookupSource,
    data: Data,
}

/**
 *  Request a judgement from a registrar.
 * 
 *  Payment: At most `max_fee` will be reserved for payment to the registrar if judgement
 *  given.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a
 *  registered identity.
 * 
 *  - `reg_index`: The index of the registrar whose judgement is requested.
 *  - `max_fee`: The maximum fee that may be paid. This should just be auto-populated as:
 * 
 *  ```nocompile
 *  Self::registrars().get(reg_index).unwrap().fee
 *  ```
 * 
 *  Emits `JudgementRequested` if successful.
 * 
 *  # <weight>
 *  - `O(R + X)`.
 *  - One balance-reserve operation.
 *  - Storage: 1 read `O(R)`, 1 mutate `O(X + R)`.
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_request_judgement {
    __kind: 'request_judgement'
    regIndex: number,
    maxFee: bigint,
}

/**
 *  Change the account associated with a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `new`: the new account ID.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  - Benchmark: 8.823 + R * 0.32 µs (min squares analysis)
 *  # </weight>
 */
export interface IdentityCall_set_account_id {
    __kind: 'set_account_id'
    index: number,
    new: AccountId,
}

/**
 *  Set the fee required for a judgement to be requested from a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `fee`: the new fee.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  - Benchmark: 7.315 + R * 0.329 µs (min squares analysis)
 *  # </weight>
 */
export interface IdentityCall_set_fee {
    __kind: 'set_fee'
    index: number,
    fee: bigint,
}

/**
 *  Set the field information for a registrar.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must be the account
 *  of the registrar whose index is `index`.
 * 
 *  - `index`: the index of the registrar whose fee is to be set.
 *  - `fields`: the fields that the registrar concerns themselves with.
 * 
 *  # <weight>
 *  - `O(R)`.
 *  - One storage mutation `O(R)`.
 *  - Benchmark: 7.464 + R * 0.325 µs (min squares analysis)
 *  # </weight>
 */
export interface IdentityCall_set_fields {
    __kind: 'set_fields'
    index: number,
    fields: bigint,
}

/**
 *  Set an account's identity information and reserve the appropriate deposit.
 * 
 *  If the account already has identity information, the deposit is taken as part payment
 *  for the new deposit.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  - `info`: The identity information.
 * 
 *  Emits `IdentitySet` if successful.
 * 
 *  # <weight>
 *  - `O(X + X' + R)`
 *    - where `X` additional-field-count (deposit-bounded and code-bounded)
 *    - where `R` judgements-count (registrar-count-bounded)
 *  - One balance reserve operation.
 *  - One storage mutation (codec-read `O(X' + R)`, codec-write `O(X + R)`).
 *  - One event.
 *  # </weight>
 */
export interface IdentityCall_set_identity {
    __kind: 'set_identity'
    info: IdentityInfo,
}

/**
 *  Set the sub-accounts of the sender.
 * 
 *  Payment: Any aggregate balance reserved by previous `set_subs` calls will be returned
 *  and an amount `SubAccountDeposit` will be reserved for each item in `subs`.
 * 
 *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
 *  identity.
 * 
 *  - `subs`: The identity's (new) sub-accounts.
 * 
 *  # <weight>
 *  - `O(P + S)`
 *    - where `P` old-subs-count (hard- and deposit-bounded).
 *    - where `S` subs-count (hard- and deposit-bounded).
 *  - At most one balance operations.
 *  - DB:
 *    - `P + S` storage mutations (codec complexity `O(1)`)
 *    - One storage read (codec complexity `O(P)`).
 *    - One storage write (codec complexity `O(S)`).
 *    - One storage-exists (`IdentityOf::contains_key`).
 *  # </weight>
 */
export interface IdentityCall_set_subs {
    __kind: 'set_subs'
    subs: [AccountId, Data][],
}

export const IdentityCall: sts.Type<IdentityCall> = sts.closedEnum(() => {
    return  {
        add_registrar: sts.enumStruct({
            account: AccountId,
        }),
        add_sub: sts.enumStruct({
            sub: LookupSource,
            data: Data,
        }),
        cancel_request: sts.enumStruct({
            regIndex: RegistrarIndex,
        }),
        clear_identity: sts.unit(),
        kill_identity: sts.enumStruct({
            target: LookupSource,
        }),
        provide_judgement: sts.enumStruct({
            regIndex: sts.number(),
            target: LookupSource,
            judgement: IdentityJudgement,
        }),
        quit_sub: sts.unit(),
        remove_sub: sts.enumStruct({
            sub: LookupSource,
        }),
        rename_sub: sts.enumStruct({
            sub: LookupSource,
            data: Data,
        }),
        request_judgement: sts.enumStruct({
            regIndex: sts.number(),
            maxFee: sts.bigint(),
        }),
        set_account_id: sts.enumStruct({
            index: sts.number(),
            new: AccountId,
        }),
        set_fee: sts.enumStruct({
            index: sts.number(),
            fee: sts.bigint(),
        }),
        set_fields: sts.enumStruct({
            index: sts.number(),
            fields: sts.bigint(),
        }),
        set_identity: sts.enumStruct({
            info: IdentityInfo,
        }),
        set_subs: sts.enumStruct({
            subs: sts.array(() => sts.tuple(() => AccountId, Data)),
        }),
    }
})

export type IdentityInfo = {
    additional: IdentityInfoAdditional[],
    display: Data,
    legal: Data,
    web: Data,
    riot: Data,
    email: Data,
    pgpFingerprint?: (H160 | undefined),
    image: Data,
    twitter: Data,
}

export const IdentityInfo: sts.Type<IdentityInfo> = sts.struct(() => {
    return  {
        additional: sts.array(() => IdentityInfoAdditional),
        display: Data,
        legal: Data,
        web: Data,
        riot: Data,
        email: Data,
        pgpFingerprint: sts.option(() => H160),
        image: Data,
        twitter: Data,
    }
})

export type IdentityInfoAdditional = [Data, Data]

export const IdentityInfoAdditional: sts.Type<IdentityInfoAdditional> = sts.tuple(() => Data, Data)

export type IdentityJudgement = IdentityJudgement_Erroneous | IdentityJudgement_FeePaid | IdentityJudgement_KnownGood | IdentityJudgement_LowQuality | IdentityJudgement_OutOfDate | IdentityJudgement_Reasonable | IdentityJudgement_Unknown

export interface IdentityJudgement_Erroneous {
    __kind: 'Erroneous'
}

export interface IdentityJudgement_FeePaid {
    __kind: 'FeePaid'
    value: Balance
}

export interface IdentityJudgement_KnownGood {
    __kind: 'KnownGood'
}

export interface IdentityJudgement_LowQuality {
    __kind: 'LowQuality'
}

export interface IdentityJudgement_OutOfDate {
    __kind: 'OutOfDate'
}

export interface IdentityJudgement_Reasonable {
    __kind: 'Reasonable'
}

export interface IdentityJudgement_Unknown {
    __kind: 'Unknown'
}

export const IdentityJudgement: sts.Type<IdentityJudgement> = sts.closedEnum(() => {
    return  {
        Erroneous: sts.unit(),
        FeePaid: Balance,
        KnownGood: sts.unit(),
        LowQuality: sts.unit(),
        OutOfDate: sts.unit(),
        Reasonable: sts.unit(),
        Unknown: sts.unit(),
    }
})

export type RegistrarIndex = number

export const RegistrarIndex: sts.Type<RegistrarIndex> = sts.number()

export type Data = Data_BlakeTwo256 | Data_Keccak256 | Data_None | Data_Raw0 | Data_Raw1 | Data_Raw10 | Data_Raw11 | Data_Raw12 | Data_Raw13 | Data_Raw14 | Data_Raw15 | Data_Raw16 | Data_Raw17 | Data_Raw18 | Data_Raw19 | Data_Raw2 | Data_Raw20 | Data_Raw21 | Data_Raw22 | Data_Raw23 | Data_Raw24 | Data_Raw25 | Data_Raw26 | Data_Raw27 | Data_Raw28 | Data_Raw29 | Data_Raw3 | Data_Raw30 | Data_Raw31 | Data_Raw32 | Data_Raw4 | Data_Raw5 | Data_Raw6 | Data_Raw7 | Data_Raw8 | Data_Raw9 | Data_Sha256 | Data_ShaThree256

export interface Data_BlakeTwo256 {
    __kind: 'BlakeTwo256'
    value: H256
}

export interface Data_Keccak256 {
    __kind: 'Keccak256'
    value: H256
}

export interface Data_None {
    __kind: 'None'
}

export interface Data_Raw0 {
    __kind: 'Raw0'
    value: Bytes
}

export interface Data_Raw1 {
    __kind: 'Raw1'
    value: Bytes
}

export interface Data_Raw10 {
    __kind: 'Raw10'
    value: Bytes
}

export interface Data_Raw11 {
    __kind: 'Raw11'
    value: Bytes
}

export interface Data_Raw12 {
    __kind: 'Raw12'
    value: Bytes
}

export interface Data_Raw13 {
    __kind: 'Raw13'
    value: Bytes
}

export interface Data_Raw14 {
    __kind: 'Raw14'
    value: Bytes
}

export interface Data_Raw15 {
    __kind: 'Raw15'
    value: Bytes
}

export interface Data_Raw16 {
    __kind: 'Raw16'
    value: Bytes
}

export interface Data_Raw17 {
    __kind: 'Raw17'
    value: Bytes
}

export interface Data_Raw18 {
    __kind: 'Raw18'
    value: Bytes
}

export interface Data_Raw19 {
    __kind: 'Raw19'
    value: Bytes
}

export interface Data_Raw2 {
    __kind: 'Raw2'
    value: Bytes
}

export interface Data_Raw20 {
    __kind: 'Raw20'
    value: Bytes
}

export interface Data_Raw21 {
    __kind: 'Raw21'
    value: Bytes
}

export interface Data_Raw22 {
    __kind: 'Raw22'
    value: Bytes
}

export interface Data_Raw23 {
    __kind: 'Raw23'
    value: Bytes
}

export interface Data_Raw24 {
    __kind: 'Raw24'
    value: Bytes
}

export interface Data_Raw25 {
    __kind: 'Raw25'
    value: Bytes
}

export interface Data_Raw26 {
    __kind: 'Raw26'
    value: Bytes
}

export interface Data_Raw27 {
    __kind: 'Raw27'
    value: Bytes
}

export interface Data_Raw28 {
    __kind: 'Raw28'
    value: Bytes
}

export interface Data_Raw29 {
    __kind: 'Raw29'
    value: Bytes
}

export interface Data_Raw3 {
    __kind: 'Raw3'
    value: Bytes
}

export interface Data_Raw30 {
    __kind: 'Raw30'
    value: Bytes
}

export interface Data_Raw31 {
    __kind: 'Raw31'
    value: Bytes
}

export interface Data_Raw32 {
    __kind: 'Raw32'
    value: Bytes
}

export interface Data_Raw4 {
    __kind: 'Raw4'
    value: Bytes
}

export interface Data_Raw5 {
    __kind: 'Raw5'
    value: Bytes
}

export interface Data_Raw6 {
    __kind: 'Raw6'
    value: Bytes
}

export interface Data_Raw7 {
    __kind: 'Raw7'
    value: Bytes
}

export interface Data_Raw8 {
    __kind: 'Raw8'
    value: Bytes
}

export interface Data_Raw9 {
    __kind: 'Raw9'
    value: Bytes
}

export interface Data_Sha256 {
    __kind: 'Sha256'
    value: H256
}

export interface Data_ShaThree256 {
    __kind: 'ShaThree256'
    value: H256
}

export const Data: sts.Type<Data> = sts.closedEnum(() => {
    return  {
        BlakeTwo256: H256,
        Keccak256: H256,
        None: sts.unit(),
        Raw0: sts.bytes(),
        Raw1: sts.bytes(),
        Raw10: sts.bytes(),
        Raw11: sts.bytes(),
        Raw12: sts.bytes(),
        Raw13: sts.bytes(),
        Raw14: sts.bytes(),
        Raw15: sts.bytes(),
        Raw16: sts.bytes(),
        Raw17: sts.bytes(),
        Raw18: sts.bytes(),
        Raw19: sts.bytes(),
        Raw2: sts.bytes(),
        Raw20: sts.bytes(),
        Raw21: sts.bytes(),
        Raw22: sts.bytes(),
        Raw23: sts.bytes(),
        Raw24: sts.bytes(),
        Raw25: sts.bytes(),
        Raw26: sts.bytes(),
        Raw27: sts.bytes(),
        Raw28: sts.bytes(),
        Raw29: sts.bytes(),
        Raw3: sts.bytes(),
        Raw30: sts.bytes(),
        Raw31: sts.bytes(),
        Raw32: sts.bytes(),
        Raw4: sts.bytes(),
        Raw5: sts.bytes(),
        Raw6: sts.bytes(),
        Raw7: sts.bytes(),
        Raw8: sts.bytes(),
        Raw9: sts.bytes(),
        Sha256: H256,
        ShaThree256: H256,
    }
})

export type GrandpaCall = GrandpaCall_note_stalled | GrandpaCall_report_equivocation | GrandpaCall_report_equivocation_unsigned

/**
 *  Note that the current authority set of the GRANDPA finality gadget has
 *  stalled. This will trigger a forced authority set change at the beginning
 *  of the next session, to be enacted `delay` blocks after that. The delay
 *  should be high enough to safely assume that the block signalling the
 *  forced change will not be re-orged (e.g. 1000 blocks). The GRANDPA voters
 *  will start the new authority set using the given finalized block as base.
 *  Only callable by root.
 */
export interface GrandpaCall_note_stalled {
    __kind: 'note_stalled'
    delay: BlockNumber,
    bestFinalizedBlockNumber: BlockNumber,
}

/**
 *  Report voter equivocation/misbehavior. This method will verify the
 *  equivocation proof and validate the given key ownership proof
 *  against the extracted offender. If both are valid, the offence
 *  will be reported.
 */
export interface GrandpaCall_report_equivocation {
    __kind: 'report_equivocation'
    equivocationProof: GrandpaEquivocationProof,
    keyOwnerProof: KeyOwnerProof,
}

/**
 *  Report voter equivocation/misbehavior. This method will verify the
 *  equivocation proof and validate the given key ownership proof
 *  against the extracted offender. If both are valid, the offence
 *  will be reported.
 * 
 *  This extrinsic must be called unsigned and it is expected that only
 *  block authors will call it (validated in `ValidateUnsigned`), as such
 *  if the block author is defined it will be defined as the equivocation
 *  reporter.
 */
export interface GrandpaCall_report_equivocation_unsigned {
    __kind: 'report_equivocation_unsigned'
    equivocationProof: GrandpaEquivocationProof,
    keyOwnerProof: KeyOwnerProof,
}

export const GrandpaCall: sts.Type<GrandpaCall> = sts.closedEnum(() => {
    return  {
        note_stalled: sts.enumStruct({
            delay: BlockNumber,
            bestFinalizedBlockNumber: BlockNumber,
        }),
        report_equivocation: sts.enumStruct({
            equivocationProof: GrandpaEquivocationProof,
            keyOwnerProof: KeyOwnerProof,
        }),
        report_equivocation_unsigned: sts.enumStruct({
            equivocationProof: GrandpaEquivocationProof,
            keyOwnerProof: KeyOwnerProof,
        }),
    }
})

export type KeyOwnerProof = {
    session: SessionIndex,
    trieNodes: Bytes[],
    validatorCount: ValidatorCount,
}

export const KeyOwnerProof: sts.Type<KeyOwnerProof> = sts.struct(() => {
    return  {
        session: SessionIndex,
        trieNodes: sts.array(() => sts.bytes()),
        validatorCount: ValidatorCount,
    }
})

export type ValidatorCount = number

export const ValidatorCount: sts.Type<ValidatorCount> = sts.number()

export type GrandpaEquivocationProof = {
    setId: SetId,
    equivocation: GrandpaEquivocation,
}

export const GrandpaEquivocationProof: sts.Type<GrandpaEquivocationProof> = sts.struct(() => {
    return  {
        setId: SetId,
        equivocation: GrandpaEquivocation,
    }
})

export type GrandpaEquivocation = GrandpaEquivocation_Precommit | GrandpaEquivocation_Prevote

export interface GrandpaEquivocation_Precommit {
    __kind: 'Precommit'
    value: GrandpaEquivocationValue
}

export interface GrandpaEquivocation_Prevote {
    __kind: 'Prevote'
    value: GrandpaEquivocationValue
}

export const GrandpaEquivocation: sts.Type<GrandpaEquivocation> = sts.closedEnum(() => {
    return  {
        Precommit: GrandpaEquivocationValue,
        Prevote: GrandpaEquivocationValue,
    }
})

export type GrandpaEquivocationValue = {
    roundNumber: bigint,
    identity: AuthorityId,
    first: [GrandpaPrevote, AuthoritySignature],
    second: [GrandpaPrevote, AuthoritySignature],
}

export const GrandpaEquivocationValue: sts.Type<GrandpaEquivocationValue> = sts.struct(() => {
    return  {
        roundNumber: sts.bigint(),
        identity: AuthorityId,
        first: sts.tuple(() => GrandpaPrevote, AuthoritySignature),
        second: sts.tuple(() => GrandpaPrevote, AuthoritySignature),
    }
})

export type AuthoritySignature = Bytes

export const AuthoritySignature: sts.Type<AuthoritySignature> = sts.bytes()

export type GrandpaPrevote = {
    targetHash: Hash,
    targetNumber: BlockNumber,
}

export const GrandpaPrevote: sts.Type<GrandpaPrevote> = sts.struct(() => {
    return  {
        targetHash: Hash,
        targetNumber: BlockNumber,
    }
})

export type SetId = bigint

export const SetId: sts.Type<SetId> = sts.bigint()

export type GiltCall = GiltCall_place_bid | GiltCall_retract_bid | GiltCall_set_target | GiltCall_thaw

/**
 *  Place a bid for a gilt to be issued.
 * 
 *  Origin must be Signed, and account must have at least `amount` in free balance.
 * 
 *  - `amount`: The amount of the bid; these funds will be reserved. If the bid is
 *  successfully elevated into an issued gilt, then these funds will continue to be
 *  reserved until the gilt expires. Must be at least `MinFreeze`.
 *  - `duration`: The number of periods for which the funds will be locked if the gilt is
 *  issued. It will expire only after this period has elapsed after the point of issuance.
 *  Must be greater than 1 and no more than `QueueCount`.
 * 
 *  Complexities:
 *  - `Queues[duration].len()` (just take max).
 */
export interface GiltCall_place_bid {
    __kind: 'place_bid'
    amount: bigint,
    duration: number,
}

/**
 *  Retract a previously placed bid.
 * 
 *  Origin must be Signed, and the account should have previously issued a still-active bid
 *  of `amount` for `duration`.
 * 
 *  - `amount`: The amount of the previous bid.
 *  - `duration`: The duration of the previous bid.
 */
export interface GiltCall_retract_bid {
    __kind: 'retract_bid'
    amount: bigint,
    duration: number,
}

/**
 *  Set target proportion of gilt-funds.
 * 
 *  Origin must be `AdminOrigin`.
 * 
 *  - `target`: The target proportion of effective issued funds that should be under gilts
 *  at any one time.
 */
export interface GiltCall_set_target {
    __kind: 'set_target'
    target: bigint,
}

/**
 *  Remove an active but expired gilt. Reserved funds under gilt are freed and balance is
 *  adjusted to ensure that the funds grow or shrink to maintain the equivalent proportion
 *  of effective total issued funds.
 * 
 *  Origin must be Signed and the account must be the owner of the gilt of the given index.
 * 
 *  - `index`: The index of the gilt to be thawed.
 */
export interface GiltCall_thaw {
    __kind: 'thaw'
    index: number,
}

export const GiltCall: sts.Type<GiltCall> = sts.closedEnum(() => {
    return  {
        place_bid: sts.enumStruct({
            amount: sts.bigint(),
            duration: sts.number(),
        }),
        retract_bid: sts.enumStruct({
            amount: sts.bigint(),
            duration: sts.number(),
        }),
        set_target: sts.enumStruct({
            target: sts.bigint(),
        }),
        thaw: sts.enumStruct({
            index: sts.number(),
        }),
    }
})

export type ElectionProviderMultiPhaseCall = ElectionProviderMultiPhaseCall_submit_unsigned

/**
 *  Submit a solution for the unsigned phase.
 * 
 *  The dispatch origin fo this call must be __none__.
 * 
 *  This submission is checked on the fly. Moreover, this unsigned solution is only
 *  validated when submitted to the pool from the **local** node. Effectively, this means
 *  that only active validators can submit this transaction when authoring a block (similar
 *  to an inherent).
 * 
 *  To prevent any incorrect solution (and thus wasted time/weight), this transaction will
 *  panic if the solution submitted by the validator is invalid in any way, effectively
 *  putting their authoring reward at risk.
 * 
 *  No deposit or reward is associated with this submission.
 */
export interface ElectionProviderMultiPhaseCall_submit_unsigned {
    __kind: 'submit_unsigned'
    solution: RawSolution,
    witness: SolutionOrSnapshotSize,
}

export const ElectionProviderMultiPhaseCall: sts.Type<ElectionProviderMultiPhaseCall> = sts.closedEnum(() => {
    return  {
        submit_unsigned: sts.enumStruct({
            solution: RawSolution,
            witness: SolutionOrSnapshotSize,
        }),
    }
})

export type DemocracyCall = DemocracyCall_blacklist | DemocracyCall_cancel_proposal | DemocracyCall_cancel_queued | DemocracyCall_cancel_referendum | DemocracyCall_clear_public_proposals | DemocracyCall_delegate | DemocracyCall_emergency_cancel | DemocracyCall_enact_proposal | DemocracyCall_external_propose | DemocracyCall_external_propose_default | DemocracyCall_external_propose_majority | DemocracyCall_fast_track | DemocracyCall_note_imminent_preimage | DemocracyCall_note_imminent_preimage_operational | DemocracyCall_note_preimage | DemocracyCall_note_preimage_operational | DemocracyCall_propose | DemocracyCall_reap_preimage | DemocracyCall_remove_other_vote | DemocracyCall_remove_vote | DemocracyCall_second | DemocracyCall_undelegate | DemocracyCall_unlock | DemocracyCall_veto_external | DemocracyCall_vote

/**
 *  Permanently place a proposal into the blacklist. This prevents it from ever being
 *  proposed again.
 * 
 *  If called on a queued public or external proposal, then this will result in it being
 *  removed. If the `ref_index` supplied is an active referendum with the proposal hash,
 *  then it will be cancelled.
 * 
 *  The dispatch origin of this call must be `BlacklistOrigin`.
 * 
 *  - `proposal_hash`: The proposal hash to blacklist permanently.
 *  - `ref_index`: An ongoing referendum whose hash is `proposal_hash`, which will be
 *  cancelled.
 * 
 *  Weight: `O(p)` (though as this is an high-privilege dispatch, we assume it has a
 *    reasonable value).
 */
export interface DemocracyCall_blacklist {
    __kind: 'blacklist'
    proposalHash: Hash,
    maybeRefIndex?: (ReferendumIndex | undefined),
}

/**
 *  Remove a proposal.
 * 
 *  The dispatch origin of this call must be `CancelProposalOrigin`.
 * 
 *  - `prop_index`: The index of the proposal to cancel.
 * 
 *  Weight: `O(p)` where `p = PublicProps::<T>::decode_len()`
 */
export interface DemocracyCall_cancel_proposal {
    __kind: 'cancel_proposal'
    propIndex: number,
}

/**
 *  Cancel a proposal queued for enactment.
 * 
 *  The dispatch origin of this call must be _Root_.
 * 
 *  - `which`: The index of the referendum to cancel.
 * 
 *  Weight: `O(D)` where `D` is the items in the dispatch queue. Weighted as `D = 10`.
 */
export interface DemocracyCall_cancel_queued {
    __kind: 'cancel_queued'
    which: ReferendumIndex,
}

/**
 *  Remove a referendum.
 * 
 *  The dispatch origin of this call must be _Root_.
 * 
 *  - `ref_index`: The index of the referendum to cancel.
 * 
 *  # Weight: `O(1)`.
 */
export interface DemocracyCall_cancel_referendum {
    __kind: 'cancel_referendum'
    refIndex: number,
}

/**
 *  Clears all public proposals.
 * 
 *  The dispatch origin of this call must be _Root_.
 * 
 *  Weight: `O(1)`.
 */
export interface DemocracyCall_clear_public_proposals {
    __kind: 'clear_public_proposals'
}

/**
 *  Delegate the voting power (with some given conviction) of the sending account.
 * 
 *  The balance delegated is locked for as long as it's delegated, and thereafter for the
 *  time appropriate for the conviction's lock period.
 * 
 *  The dispatch origin of this call must be _Signed_, and the signing account must either:
 *    - be delegating already; or
 *    - have no voting activity (if there is, then it will need to be removed/consolidated
 *      through `reap_vote` or `unvote`).
 * 
 *  - `to`: The account whose voting the `target` account's voting power will follow.
 *  - `conviction`: The conviction that will be attached to the delegated votes. When the
 *    account is undelegated, the funds will be locked for the corresponding period.
 *  - `balance`: The amount of the account's balance to be used in delegating. This must
 *    not be more than the account's current balance.
 * 
 *  Emits `Delegated`.
 * 
 *  Weight: `O(R)` where R is the number of referendums the voter delegating to has
 *    voted on. Weight is charged as if maximum votes.
 */
export interface DemocracyCall_delegate {
    __kind: 'delegate'
    to: AccountId,
    conviction: Conviction,
    balance: BalanceOf,
}

/**
 *  Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
 *  referendum.
 * 
 *  The dispatch origin of this call must be `CancellationOrigin`.
 * 
 *  -`ref_index`: The index of the referendum to cancel.
 * 
 *  Weight: `O(1)`.
 */
export interface DemocracyCall_emergency_cancel {
    __kind: 'emergency_cancel'
    refIndex: ReferendumIndex,
}

/**
 *  Enact a proposal from a referendum. For now we just make the weight be the maximum.
 */
export interface DemocracyCall_enact_proposal {
    __kind: 'enact_proposal'
    proposalHash: Hash,
    index: ReferendumIndex,
}

/**
 *  Schedule a referendum to be tabled once it is legal to schedule an external
 *  referendum.
 * 
 *  The dispatch origin of this call must be `ExternalOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal.
 * 
 *  Weight: `O(V)` with V number of vetoers in the blacklist of proposal.
 *    Decoding vec of length V. Charged as maximum
 */
export interface DemocracyCall_external_propose {
    __kind: 'external_propose'
    proposalHash: Hash,
}

/**
 *  Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
 *  schedule an external referendum.
 * 
 *  The dispatch of this call must be `ExternalDefaultOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 * 
 *  Weight: `O(1)`
 */
export interface DemocracyCall_external_propose_default {
    __kind: 'external_propose_default'
    proposalHash: Hash,
}

/**
 *  Schedule a majority-carries referendum to be tabled next once it is legal to schedule
 *  an external referendum.
 * 
 *  The dispatch of this call must be `ExternalMajorityOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 * 
 *  Weight: `O(1)`
 */
export interface DemocracyCall_external_propose_majority {
    __kind: 'external_propose_majority'
    proposalHash: Hash,
}

/**
 *  Schedule the currently externally-proposed majority-carries referendum to be tabled
 *  immediately. If there is no externally-proposed referendum currently, or if there is one
 *  but it is not a majority-carries referendum then it fails.
 * 
 *  The dispatch of this call must be `FastTrackOrigin`.
 * 
 *  - `proposal_hash`: The hash of the current external proposal.
 *  - `voting_period`: The period that is allowed for voting on this proposal. Increased to
 *    `FastTrackVotingPeriod` if too low.
 *  - `delay`: The number of block after voting has ended in approval and this should be
 *    enacted. This doesn't have a minimum amount.
 * 
 *  Emits `Started`.
 * 
 *  Weight: `O(1)`
 */
export interface DemocracyCall_fast_track {
    __kind: 'fast_track'
    proposalHash: Hash,
    votingPeriod: BlockNumber,
    delay: BlockNumber,
}

/**
 *  Register the preimage for an upcoming proposal. This requires the proposal to be
 *  in the dispatch queue. No deposit is needed. When this call is successful, i.e.
 *  the preimage has not been uploaded before and matches some imminent proposal,
 *  no fee is paid.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `encoded_proposal`: The preimage of a proposal.
 * 
 *  Emits `PreimageNoted`.
 * 
 *  Weight: `O(E)` with E size of `encoded_proposal` (protected by a required deposit).
 */
export interface DemocracyCall_note_imminent_preimage {
    __kind: 'note_imminent_preimage'
    encodedProposal: Bytes,
}

/**
 *  Same as `note_imminent_preimage` but origin is `OperationalPreimageOrigin`.
 */
export interface DemocracyCall_note_imminent_preimage_operational {
    __kind: 'note_imminent_preimage_operational'
    encodedProposal: Bytes,
}

/**
 *  Register the preimage for an upcoming proposal. This doesn't require the proposal to be
 *  in the dispatch queue but does require a deposit, returned once enacted.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `encoded_proposal`: The preimage of a proposal.
 * 
 *  Emits `PreimageNoted`.
 * 
 *  Weight: `O(E)` with E size of `encoded_proposal` (protected by a required deposit).
 */
export interface DemocracyCall_note_preimage {
    __kind: 'note_preimage'
    encodedProposal: Bytes,
}

/**
 *  Same as `note_preimage` but origin is `OperationalPreimageOrigin`.
 */
export interface DemocracyCall_note_preimage_operational {
    __kind: 'note_preimage_operational'
    encodedProposal: Bytes,
}

/**
 *  Propose a sensitive action to be taken.
 * 
 *  The dispatch origin of this call must be _Signed_ and the sender must
 *  have funds to cover the deposit.
 * 
 *  - `proposal_hash`: The hash of the proposal preimage.
 *  - `value`: The amount of deposit (must be at least `MinimumDeposit`).
 * 
 *  Emits `Proposed`.
 * 
 *  Weight: `O(p)`
 */
export interface DemocracyCall_propose {
    __kind: 'propose'
    proposalHash: Hash,
    value: bigint,
}

/**
 *  Remove an expired proposal preimage and collect the deposit.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proposal_hash`: The preimage hash of a proposal.
 *  - `proposal_length_upper_bound`: an upper bound on length of the proposal.
 *    Extrinsic is weighted according to this value with no refund.
 * 
 *  This will only work after `VotingPeriod` blocks from the time that the preimage was
 *  noted, if it's the same account doing it. If it's a different account, then it'll only
 *  work an additional `EnactmentPeriod` later.
 * 
 *  Emits `PreimageReaped`.
 * 
 *  Weight: `O(D)` where D is length of proposal.
 */
export interface DemocracyCall_reap_preimage {
    __kind: 'reap_preimage'
    proposalHash: Hash,
    proposalLenUpperBound: number,
}

/**
 *  Remove a vote for a referendum.
 * 
 *  If the `target` is equal to the signer, then this function is exactly equivalent to
 *  `remove_vote`. If not equal to the signer, then the vote must have expired,
 *  either because the referendum was cancelled, because the voter lost the referendum or
 *  because the conviction period is over.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `target`: The account of the vote to be removed; this account must have voted for
 *    referendum `index`.
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *    Weight is calculated for the maximum number of vote.
 */
export interface DemocracyCall_remove_other_vote {
    __kind: 'remove_other_vote'
    target: AccountId,
    index: ReferendumIndex,
}

/**
 *  Remove a vote for a referendum.
 * 
 *  If:
 *  - the referendum was cancelled, or
 *  - the referendum is ongoing, or
 *  - the referendum has ended such that
 *    - the vote of the account was in opposition to the result; or
 *    - there was no conviction to the account's vote; or
 *    - the account made a split vote
 *  ...then the vote is removed cleanly and a following call to `unlock` may result in more
 *  funds being available.
 * 
 *  If, however, the referendum has ended and:
 *  - it finished corresponding to the vote of the account, and
 *  - the account made a standard vote with conviction, and
 *  - the lock period of the conviction is not over
 *  ...then the lock will be aggregated into the overall account's lock, which may involve
 *  *overlocking* (where the two locks are combined into a single lock that is the maximum
 *  of both the amount locked and the time is it locked for).
 * 
 *  The dispatch origin of this call must be _Signed_, and the signer must have a vote
 *  registered for referendum `index`.
 * 
 *  - `index`: The index of referendum of the vote to be removed.
 * 
 *  Weight: `O(R + log R)` where R is the number of referenda that `target` has voted on.
 *    Weight is calculated for the maximum number of vote.
 */
export interface DemocracyCall_remove_vote {
    __kind: 'remove_vote'
    index: ReferendumIndex,
}

/**
 *  Signals agreement with a particular proposal.
 * 
 *  The dispatch origin of this call must be _Signed_ and the sender
 *  must have funds to cover the deposit, equal to the original deposit.
 * 
 *  - `proposal`: The index of the proposal to second.
 *  - `seconds_upper_bound`: an upper bound on the current number of seconds on this
 *    proposal. Extrinsic is weighted according to this value with no refund.
 * 
 *  Weight: `O(S)` where S is the number of seconds a proposal already has.
 */
export interface DemocracyCall_second {
    __kind: 'second'
    proposal: number,
    secondsUpperBound: number,
}

/**
 *  Undelegate the voting power of the sending account.
 * 
 *  Tokens may be unlocked following once an amount of time consistent with the lock period
 *  of the conviction with which the delegation was issued.
 * 
 *  The dispatch origin of this call must be _Signed_ and the signing account must be
 *  currently delegating.
 * 
 *  Emits `Undelegated`.
 * 
 *  Weight: `O(R)` where R is the number of referendums the voter delegating to has
 *    voted on. Weight is charged as if maximum votes.
 */
export interface DemocracyCall_undelegate {
    __kind: 'undelegate'
}

/**
 *  Unlock tokens that have an expired lock.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `target`: The account to remove the lock on.
 * 
 *  Weight: `O(R)` with R number of vote of target.
 */
export interface DemocracyCall_unlock {
    __kind: 'unlock'
    target: AccountId,
}

/**
 *  Veto and blacklist the external proposal hash.
 * 
 *  The dispatch origin of this call must be `VetoOrigin`.
 * 
 *  - `proposal_hash`: The preimage hash of the proposal to veto and blacklist.
 * 
 *  Emits `Vetoed`.
 * 
 *  Weight: `O(V + log(V))` where V is number of `existing vetoers`
 */
export interface DemocracyCall_veto_external {
    __kind: 'veto_external'
    proposalHash: Hash,
}

/**
 *  Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
 *  otherwise it is a vote to keep the status quo.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `ref_index`: The index of the referendum to vote for.
 *  - `vote`: The vote configuration.
 * 
 *  Weight: `O(R)` where R is the number of referendums the voter has voted on.
 */
export interface DemocracyCall_vote {
    __kind: 'vote'
    refIndex: number,
    vote: AccountVote,
}

export const DemocracyCall: sts.Type<DemocracyCall> = sts.closedEnum(() => {
    return  {
        blacklist: sts.enumStruct({
            proposalHash: Hash,
            maybeRefIndex: sts.option(() => ReferendumIndex),
        }),
        cancel_proposal: sts.enumStruct({
            propIndex: sts.number(),
        }),
        cancel_queued: sts.enumStruct({
            which: ReferendumIndex,
        }),
        cancel_referendum: sts.enumStruct({
            refIndex: sts.number(),
        }),
        clear_public_proposals: sts.unit(),
        delegate: sts.enumStruct({
            to: AccountId,
            conviction: Conviction,
            balance: BalanceOf,
        }),
        emergency_cancel: sts.enumStruct({
            refIndex: ReferendumIndex,
        }),
        enact_proposal: sts.enumStruct({
            proposalHash: Hash,
            index: ReferendumIndex,
        }),
        external_propose: sts.enumStruct({
            proposalHash: Hash,
        }),
        external_propose_default: sts.enumStruct({
            proposalHash: Hash,
        }),
        external_propose_majority: sts.enumStruct({
            proposalHash: Hash,
        }),
        fast_track: sts.enumStruct({
            proposalHash: Hash,
            votingPeriod: BlockNumber,
            delay: BlockNumber,
        }),
        note_imminent_preimage: sts.enumStruct({
            encodedProposal: sts.bytes(),
        }),
        note_imminent_preimage_operational: sts.enumStruct({
            encodedProposal: sts.bytes(),
        }),
        note_preimage: sts.enumStruct({
            encodedProposal: sts.bytes(),
        }),
        note_preimage_operational: sts.enumStruct({
            encodedProposal: sts.bytes(),
        }),
        propose: sts.enumStruct({
            proposalHash: Hash,
            value: sts.bigint(),
        }),
        reap_preimage: sts.enumStruct({
            proposalHash: Hash,
            proposalLenUpperBound: sts.number(),
        }),
        remove_other_vote: sts.enumStruct({
            target: AccountId,
            index: ReferendumIndex,
        }),
        remove_vote: sts.enumStruct({
            index: ReferendumIndex,
        }),
        second: sts.enumStruct({
            proposal: sts.number(),
            secondsUpperBound: sts.number(),
        }),
        undelegate: sts.unit(),
        unlock: sts.enumStruct({
            target: AccountId,
        }),
        veto_external: sts.enumStruct({
            proposalHash: Hash,
        }),
        vote: sts.enumStruct({
            refIndex: sts.number(),
            vote: AccountVote,
        }),
    }
})

export type AccountVote = AccountVote_Split | AccountVote_Standard

export interface AccountVote_Split {
    __kind: 'Split'
    value: AccountVoteSplit
}

export interface AccountVote_Standard {
    __kind: 'Standard'
    value: AccountVoteStandard
}

export const AccountVote: sts.Type<AccountVote> = sts.closedEnum(() => {
    return  {
        Split: AccountVoteSplit,
        Standard: AccountVoteStandard,
    }
})

export type AccountVoteStandard = {
    vote: Vote,
    balance: Balance,
}

export const AccountVoteStandard: sts.Type<AccountVoteStandard> = sts.struct(() => {
    return  {
        vote: Vote,
        balance: Balance,
    }
})

export type Vote = number

export const Vote: sts.Type<Vote> = sts.number()

export type AccountVoteSplit = {
    aye: Balance,
    nay: Balance,
}

export const AccountVoteSplit: sts.Type<AccountVoteSplit> = sts.struct(() => {
    return  {
        aye: Balance,
        nay: Balance,
    }
})

export type Conviction = Conviction_Locked1x | Conviction_Locked2x | Conviction_Locked3x | Conviction_Locked4x | Conviction_Locked5x | Conviction_Locked6x | Conviction_None

export interface Conviction_Locked1x {
    __kind: 'Locked1x'
}

export interface Conviction_Locked2x {
    __kind: 'Locked2x'
}

export interface Conviction_Locked3x {
    __kind: 'Locked3x'
}

export interface Conviction_Locked4x {
    __kind: 'Locked4x'
}

export interface Conviction_Locked5x {
    __kind: 'Locked5x'
}

export interface Conviction_Locked6x {
    __kind: 'Locked6x'
}

export interface Conviction_None {
    __kind: 'None'
}

export const Conviction: sts.Type<Conviction> = sts.closedEnum(() => {
    return  {
        Locked1x: sts.unit(),
        Locked2x: sts.unit(),
        Locked3x: sts.unit(),
        Locked4x: sts.unit(),
        Locked5x: sts.unit(),
        Locked6x: sts.unit(),
        None: sts.unit(),
    }
})

export type ReferendumIndex = number

export const ReferendumIndex: sts.Type<ReferendumIndex> = sts.number()

export type CrowdloanCall = CrowdloanCall_add_memo | CrowdloanCall_contribute | CrowdloanCall_create | CrowdloanCall_dissolve | CrowdloanCall_edit | CrowdloanCall_poke | CrowdloanCall_refund | CrowdloanCall_withdraw

/**
 *  Add an optional memo to an existing crowdloan contribution.
 * 
 *  Origin must be Signed, and the user must have contributed to the crowdloan.
 */
export interface CrowdloanCall_add_memo {
    __kind: 'add_memo'
    index: ParaId,
    memo: Bytes,
}

/**
 *  Contribute to a crowd sale. This will transfer some balance over to fund a parachain
 *  slot. It will be withdrawable when the crowdloan has ended and the funds are unused.
 */
export interface CrowdloanCall_contribute {
    __kind: 'contribute'
    index: number,
    value: bigint,
    signature?: (MultiSignature | undefined),
}

/**
 *  Create a new crowdloaning campaign for a parachain slot with the given lease period range.
 * 
 *  This applies a lock to your parachain configuration, ensuring that it cannot be changed
 *  by the parachain manager.
 */
export interface CrowdloanCall_create {
    __kind: 'create'
    index: number,
    cap: bigint,
    firstPeriod: number,
    lastPeriod: number,
    end: number,
    verifier?: (MultiSigner | undefined),
}

/**
 *  Remove a fund after the retirement period has ended and all funds have been returned.
 */
export interface CrowdloanCall_dissolve {
    __kind: 'dissolve'
    index: number,
}

/**
 *  Edit the configuration for an in-progress crowdloan.
 * 
 *  Can only be called by Root origin.
 */
export interface CrowdloanCall_edit {
    __kind: 'edit'
    index: number,
    cap: bigint,
    firstPeriod: number,
    lastPeriod: number,
    end: number,
    verifier?: (MultiSigner | undefined),
}

/**
 *  Poke the fund into NewRaise
 * 
 *  Origin must be Signed, and the fund has non-zero raise.
 */
export interface CrowdloanCall_poke {
    __kind: 'poke'
    index: ParaId,
}

/**
 *  Automatically refund contributors of an ended crowdloan.
 *  Due to weight restrictions, this function may need to be called multiple
 *  times to fully refund all users. We will refund `RemoveKeysLimit` users at a time.
 * 
 *  Origin must be signed, but can come from anyone.
 */
export interface CrowdloanCall_refund {
    __kind: 'refund'
    index: number,
}

/**
 *  Withdraw full balance of a specific contributor.
 * 
 *  Origin must be signed, but can come from anyone.
 * 
 *  The fund must be either in, or ready for, retirement. For a fund to be *in* retirement, then the retirement
 *  flag must be set. For a fund to be ready for retirement, then:
 *  - it must not already be in retirement;
 *  - the amount of raised funds must be bigger than the _free_ balance of the account;
 *  - and either:
 *    - the block number must be at least `end`; or
 *    - the current lease period must be greater than the fund's `last_period`.
 * 
 *  In this case, the fund's retirement flag is set and its `end` is reset to the current block
 *  number.
 * 
 *  - `who`: The account whose contribution should be withdrawn.
 *  - `index`: The parachain to whose crowdloan the contribution was made.
 */
export interface CrowdloanCall_withdraw {
    __kind: 'withdraw'
    who: AccountId,
    index: number,
}

export const CrowdloanCall: sts.Type<CrowdloanCall> = sts.closedEnum(() => {
    return  {
        add_memo: sts.enumStruct({
            index: ParaId,
            memo: sts.bytes(),
        }),
        contribute: sts.enumStruct({
            index: sts.number(),
            value: sts.bigint(),
            signature: sts.option(() => MultiSignature),
        }),
        create: sts.enumStruct({
            index: sts.number(),
            cap: sts.bigint(),
            firstPeriod: sts.number(),
            lastPeriod: sts.number(),
            end: sts.number(),
            verifier: sts.option(() => MultiSigner),
        }),
        dissolve: sts.enumStruct({
            index: sts.number(),
        }),
        edit: sts.enumStruct({
            index: sts.number(),
            cap: sts.bigint(),
            firstPeriod: sts.number(),
            lastPeriod: sts.number(),
            end: sts.number(),
            verifier: sts.option(() => MultiSigner),
        }),
        poke: sts.enumStruct({
            index: ParaId,
        }),
        refund: sts.enumStruct({
            index: sts.number(),
        }),
        withdraw: sts.enumStruct({
            who: AccountId,
            index: sts.number(),
        }),
    }
})

export type CouncilCall = CouncilCall_close | CouncilCall_disapprove_proposal | CouncilCall_execute | CouncilCall_propose | CouncilCall_set_members | CouncilCall_vote

/**
 *  Close a vote that is either approved, disapproved or whose voting period has ended.
 * 
 *  May be called by any signed account in order to finish voting and close the proposal.
 * 
 *  If called before the end of the voting period it will only close the vote if it is
 *  has enough votes to be approved or disapproved.
 * 
 *  If called after the end of the voting period abstentions are counted as rejections
 *  unless there is a prime member set and the prime member cast an approval.
 * 
 *  If the close operation completes successfully with disapproval, the transaction fee will
 *  be waived. Otherwise execution of the approved operation will be charged to the caller.
 * 
 *  + `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed proposal.
 *  + `length_bound`: The upper bound for the length of the proposal in storage. Checked via
 *                    `storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(B + M + P1 + P2)` where:
 *    - `B` is `proposal` size in bytes (length-fee-bounded)
 *    - `M` is members-count (code- and governance-bounded)
 *    - `P1` is the complexity of `proposal` preimage.
 *    - `P2` is proposal-count (code-bounded)
 *  - DB:
 *   - 2 storage reads (`Members`: codec `O(M)`, `Prime`: codec `O(1)`)
 *   - 3 mutations (`Voting`: codec `O(M)`, `ProposalOf`: codec `O(B)`, `Proposals`: codec `O(P2)`)
 *   - any mutations done while executing `proposal` (`P1`)
 *  - up to 3 events
 *  # </weight>
 */
export interface CouncilCall_close {
    __kind: 'close'
    proposalHash: Hash,
    index: number,
    proposalWeightBound: bigint,
    lengthBound: number,
}

/**
 *  Disapprove a proposal, close, and remove it from the system, regardless of its current state.
 * 
 *  Must be called by the Root origin.
 * 
 *  Parameters:
 *  * `proposal_hash`: The hash of the proposal that should be disapproved.
 * 
 *  # <weight>
 *  Complexity: O(P) where P is the number of max proposals
 *  DB Weight:
 *  * Reads: Proposals
 *  * Writes: Voting, Proposals, ProposalOf
 *  # </weight>
 */
export interface CouncilCall_disapprove_proposal {
    __kind: 'disapprove_proposal'
    proposalHash: Hash,
}

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(M + P)` where `M` members-count (code-bounded) and `P` complexity of dispatching `proposal`
 *  - DB: 1 read (codec `O(M)`) + DB access of `proposal`
 *  - 1 event
 *  # </weight>
 */
export interface CouncilCall_execute {
    __kind: 'execute'
    proposal: Proposal,
    lengthBound: number,
}

/**
 *  Add a new proposal to either be voted on or executed directly.
 * 
 *  Requires the sender to be member.
 * 
 *  `threshold` determines whether `proposal` is executed directly (`threshold < 2`)
 *  or put up for voting.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(B + M + P1)` or `O(B + M + P2)` where:
 *    - `B` is `proposal` size in bytes (length-fee-bounded)
 *    - `M` is members-count (code- and governance-bounded)
 *    - branching is influenced by `threshold` where:
 *      - `P1` is proposal execution complexity (`threshold < 2`)
 *      - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
 *  - DB:
 *    - 1 storage read `is_member` (codec `O(M)`)
 *    - 1 storage read `ProposalOf::contains_key` (codec `O(1)`)
 *    - DB accesses influenced by `threshold`:
 *      - EITHER storage accesses done by `proposal` (`threshold < 2`)
 *      - OR proposal insertion (`threshold <= 2`)
 *        - 1 storage mutation `Proposals` (codec `O(P2)`)
 *        - 1 storage mutation `ProposalCount` (codec `O(1)`)
 *        - 1 storage write `ProposalOf` (codec `O(B)`)
 *        - 1 storage write `Voting` (codec `O(M)`)
 *    - 1 event
 *  # </weight>
 */
export interface CouncilCall_propose {
    __kind: 'propose'
    threshold: number,
    proposal: Proposal,
    lengthBound: number,
}

/**
 *  Set the collective's membership.
 * 
 *  - `new_members`: The new member list. Be nice to the chain and provide it sorted.
 *  - `prime`: The prime member whose vote sets the default.
 *  - `old_count`: The upper bound for the previous number of members in storage.
 *                 Used for weight estimation.
 * 
 *  Requires root origin.
 * 
 *  NOTE: Does not enforce the expected `MaxMembers` limit on the amount of members, but
 *        the weight estimations rely on it to estimate dispatchable weight.
 * 
 *  # <weight>
 *  ## Weight
 *  - `O(MP + N)` where:
 *    - `M` old-members-count (code- and governance-bounded)
 *    - `N` new-members-count (code- and governance-bounded)
 *    - `P` proposals-count (code-bounded)
 *  - DB:
 *    - 1 storage mutation (codec `O(M)` read, `O(N)` write) for reading and writing the members
 *    - 1 storage read (codec `O(P)`) for reading the proposals
 *    - `P` storage mutations (codec `O(M)`) for updating the votes for each proposal
 *    - 1 storage write (codec `O(1)`) for deleting the old `prime` and setting the new one
 *  # </weight>
 */
export interface CouncilCall_set_members {
    __kind: 'set_members'
    newMembers: AccountId[],
    prime?: (AccountId | undefined),
    oldCount: MemberCount,
}

/**
 *  Add an aye or nay vote for the sender to the given proposal.
 * 
 *  Requires the sender to be a member.
 * 
 *  Transaction fees will be waived if the member is voting on any particular proposal
 *  for the first time and the call is successful. Subsequent vote changes will charge a fee.
 *  # <weight>
 *  ## Weight
 *  - `O(M)` where `M` is members-count (code- and governance-bounded)
 *  - DB:
 *    - 1 storage read `Members` (codec `O(M)`)
 *    - 1 storage mutation `Voting` (codec `O(M)`)
 *  - 1 event
 *  # </weight>
 */
export interface CouncilCall_vote {
    __kind: 'vote'
    proposal: Hash,
    index: number,
    approve: boolean,
}

export const CouncilCall: sts.Type<CouncilCall> = sts.closedEnum(() => {
    return  {
        close: sts.enumStruct({
            proposalHash: Hash,
            index: sts.number(),
            proposalWeightBound: sts.bigint(),
            lengthBound: sts.number(),
        }),
        disapprove_proposal: sts.enumStruct({
            proposalHash: Hash,
        }),
        execute: sts.enumStruct({
            proposal: Proposal,
            lengthBound: sts.number(),
        }),
        propose: sts.enumStruct({
            threshold: sts.number(),
            proposal: Proposal,
            lengthBound: sts.number(),
        }),
        set_members: sts.enumStruct({
            newMembers: sts.array(() => AccountId),
            prime: sts.option(() => AccountId),
            oldCount: MemberCount,
        }),
        vote: sts.enumStruct({
            proposal: Hash,
            index: sts.number(),
            approve: sts.boolean(),
        }),
    }
})

export type ClaimsCall = ClaimsCall_attest | ClaimsCall_claim | ClaimsCall_claim_attest | ClaimsCall_mint_claim | ClaimsCall_move_claim

/**
 *  Attest to a statement, needed to finalize the claims process.
 * 
 *  WARNING: Insecure unless your chain includes `PrevalidateAttests` as a `SignedExtension`.
 * 
 *  Unsigned Validation:
 *  A call to attest is deemed valid if the sender has a `Preclaim` registered
 *  and provides a `statement` which is expected for the account.
 * 
 *  Parameters:
 *  - `statement`: The identity of the statement which is being attested to in the signature.
 * 
 *  <weight>
 *  The weight of this call is invariant over the input parameters.
 *  Weight includes logic to do pre-validation on `attest` call.
 * 
 *  Total Complexity: O(1)
 *  </weight>
 */
export interface ClaimsCall_attest {
    __kind: 'attest'
    statement: Bytes,
}

/**
 *  Make a claim to collect your DOTs.
 * 
 *  The dispatch origin for this call must be _None_.
 * 
 *  Unsigned Validation:
 *  A call to claim is deemed valid if the signature provided matches
 *  the expected signed message of:
 * 
 *  > Ethereum Signed Message:
 *  > (configured prefix string)(address)
 * 
 *  and `address` matches the `dest` account.
 * 
 *  Parameters:
 *  - `dest`: The destination account to payout the claim.
 *  - `ethereum_signature`: The signature of an ethereum signed message
 *     matching the format described above.
 * 
 *  <weight>
 *  The weight of this call is invariant over the input parameters.
 *  Weight includes logic to validate unsigned `claim` call.
 * 
 *  Total Complexity: O(1)
 *  </weight>
 */
export interface ClaimsCall_claim {
    __kind: 'claim'
    dest: AccountId,
    ethereumSignature: EcdsaSignature,
}

/**
 *  Make a claim to collect your DOTs by signing a statement.
 * 
 *  The dispatch origin for this call must be _None_.
 * 
 *  Unsigned Validation:
 *  A call to `claim_attest` is deemed valid if the signature provided matches
 *  the expected signed message of:
 * 
 *  > Ethereum Signed Message:
 *  > (configured prefix string)(address)(statement)
 * 
 *  and `address` matches the `dest` account; the `statement` must match that which is
 *  expected according to your purchase arrangement.
 * 
 *  Parameters:
 *  - `dest`: The destination account to payout the claim.
 *  - `ethereum_signature`: The signature of an ethereum signed message
 *     matching the format described above.
 *  - `statement`: The identity of the statement which is being attested to in the signature.
 * 
 *  <weight>
 *  The weight of this call is invariant over the input parameters.
 *  Weight includes logic to validate unsigned `claim_attest` call.
 * 
 *  Total Complexity: O(1)
 *  </weight>
 */
export interface ClaimsCall_claim_attest {
    __kind: 'claim_attest'
    dest: AccountId,
    ethereumSignature: EcdsaSignature,
    statement: Bytes,
}

/**
 *  Mint a new claim to collect DOTs.
 * 
 *  The dispatch origin for this call must be _Root_.
 * 
 *  Parameters:
 *  - `who`: The Ethereum address allowed to collect this claim.
 *  - `value`: The number of DOTs that will be claimed.
 *  - `vesting_schedule`: An optional vesting schedule for these DOTs.
 * 
 *  <weight>
 *  The weight of this call is invariant over the input parameters.
 *  We assume worst case that both vesting and statement is being inserted.
 * 
 *  Total Complexity: O(1)
 *  </weight>
 */
export interface ClaimsCall_mint_claim {
    __kind: 'mint_claim'
    who: EthereumAddress,
    value: BalanceOf,
    vestingSchedule?: ([BalanceOf, BalanceOf, BlockNumber] | undefined),
    statement?: (StatementKind | undefined),
}

export interface ClaimsCall_move_claim {
    __kind: 'move_claim'
    old: EthereumAddress,
    new: EthereumAddress,
    maybePreclaim?: (AccountId | undefined),
}

export const ClaimsCall: sts.Type<ClaimsCall> = sts.closedEnum(() => {
    return  {
        attest: sts.enumStruct({
            statement: sts.bytes(),
        }),
        claim: sts.enumStruct({
            dest: AccountId,
            ethereumSignature: EcdsaSignature,
        }),
        claim_attest: sts.enumStruct({
            dest: AccountId,
            ethereumSignature: EcdsaSignature,
            statement: sts.bytes(),
        }),
        mint_claim: sts.enumStruct({
            who: EthereumAddress,
            value: BalanceOf,
            vestingSchedule: sts.option(() => sts.tuple(() => BalanceOf, BalanceOf, BlockNumber)),
            statement: sts.option(() => StatementKind),
        }),
        move_claim: sts.enumStruct({
            old: EthereumAddress,
            new: EthereumAddress,
            maybePreclaim: sts.option(() => AccountId),
        }),
    }
})

export type StatementKind = StatementKind_Regular | StatementKind_Saft

export interface StatementKind_Regular {
    __kind: 'Regular'
}

export interface StatementKind_Saft {
    __kind: 'Saft'
}

export const StatementKind: sts.Type<StatementKind> = sts.closedEnum(() => {
    return  {
        Regular: sts.unit(),
        Saft: sts.unit(),
    }
})

export type EthereumAddress = Bytes

export const EthereumAddress: sts.Type<EthereumAddress> = sts.bytes()

export type BountiesCall = BountiesCall_accept_curator | BountiesCall_approve_bounty | BountiesCall_award_bounty | BountiesCall_claim_bounty | BountiesCall_close_bounty | BountiesCall_extend_bounty_expiry | BountiesCall_propose_bounty | BountiesCall_propose_curator | BountiesCall_unassign_curator

/**
 *  Accept the curator role for a bounty.
 *  A deposit will be reserved from curator and refund upon successful payout.
 * 
 *  May only be called from the curator.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_accept_curator {
    __kind: 'accept_curator'
    bountyId: number,
}

/**
 *  Approve a bounty proposal. At a later time, the bounty will be funded and become active
 *  and the original deposit will be returned.
 * 
 *  May only be called from `T::ApproveOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_approve_bounty {
    __kind: 'approve_bounty'
    bountyId: number,
}

/**
 *  Award bounty to a beneficiary account. The beneficiary will be able to claim the funds after a delay.
 * 
 *  The dispatch origin for this call must be the curator of this bounty.
 * 
 *  - `bounty_id`: Bounty ID to award.
 *  - `beneficiary`: The beneficiary account whom will receive the payout.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_award_bounty {
    __kind: 'award_bounty'
    bountyId: number,
    beneficiary: LookupSource,
}

/**
 *  Claim the payout from an awarded bounty after payout delay.
 * 
 *  The dispatch origin for this call must be the beneficiary of this bounty.
 * 
 *  - `bounty_id`: Bounty ID to claim.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_claim_bounty {
    __kind: 'claim_bounty'
    bountyId: number,
}

/**
 *  Cancel a proposed or active bounty. All the funds will be sent to treasury and
 *  the curator deposit will be unreserved if possible.
 * 
 *  Only `T::RejectOrigin` is able to cancel a bounty.
 * 
 *  - `bounty_id`: Bounty ID to cancel.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_close_bounty {
    __kind: 'close_bounty'
    bountyId: number,
}

/**
 *  Extend the expiry time of an active bounty.
 * 
 *  The dispatch origin for this call must be the curator of this bounty.
 * 
 *  - `bounty_id`: Bounty ID to extend.
 *  - `remark`: additional information.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_extend_bounty_expiry {
    __kind: 'extend_bounty_expiry'
    bountyId: number,
    remark: Bytes,
}

/**
 *  Propose a new bounty.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
 *  `DataDepositPerByte` for each byte in `reason`. It will be unreserved upon approval,
 *  or slashed when rejected.
 * 
 *  - `curator`: The curator account whom will manage this bounty.
 *  - `fee`: The curator fee.
 *  - `value`: The total payment amount of this bounty, curator fee included.
 *  - `description`: The description of this bounty.
 */
export interface BountiesCall_propose_bounty {
    __kind: 'propose_bounty'
    value: bigint,
    description: Bytes,
}

/**
 *  Assign a curator to a funded bounty.
 * 
 *  May only be called from `T::ApproveOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_propose_curator {
    __kind: 'propose_curator'
    bountyId: number,
    curator: LookupSource,
    fee: bigint,
}

/**
 *  Unassign curator from a bounty.
 * 
 *  This function can only be called by the `RejectOrigin` a signed origin.
 * 
 *  If this function is called by the `RejectOrigin`, we assume that the curator is malicious
 *  or inactive. As a result, we will slash the curator when possible.
 * 
 *  If the origin is the curator, we take this as a sign they are unable to do their job and
 *  they willingly give up. We could slash them, but for now we allow them to recover their
 *  deposit and exit without issue. (We may want to change this if it is abused.)
 * 
 *  Finally, the origin can be anyone if and only if the curator is "inactive". This allows
 *  anyone in the community to call out that a curator is not doing their due diligence, and
 *  we should pick a new curator. In this case the curator should also be slashed.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export interface BountiesCall_unassign_curator {
    __kind: 'unassign_curator'
    bountyId: number,
}

export const BountiesCall: sts.Type<BountiesCall> = sts.closedEnum(() => {
    return  {
        accept_curator: sts.enumStruct({
            bountyId: sts.number(),
        }),
        approve_bounty: sts.enumStruct({
            bountyId: sts.number(),
        }),
        award_bounty: sts.enumStruct({
            bountyId: sts.number(),
            beneficiary: LookupSource,
        }),
        claim_bounty: sts.enumStruct({
            bountyId: sts.number(),
        }),
        close_bounty: sts.enumStruct({
            bountyId: sts.number(),
        }),
        extend_bounty_expiry: sts.enumStruct({
            bountyId: sts.number(),
            remark: sts.bytes(),
        }),
        propose_bounty: sts.enumStruct({
            value: sts.bigint(),
            description: sts.bytes(),
        }),
        propose_curator: sts.enumStruct({
            bountyId: sts.number(),
            curator: LookupSource,
            fee: sts.bigint(),
        }),
        unassign_curator: sts.enumStruct({
            bountyId: sts.number(),
        }),
    }
})

export type BalancesCall = BalancesCall_force_transfer | BalancesCall_set_balance | BalancesCall_transfer | BalancesCall_transfer_keep_alive

/**
 *  Exactly as `transfer`, except the origin must be root and the source account may be
 *  specified.
 *  # <weight>
 *  - Same as transfer, but additional read and write because the source account is
 *    not assumed to be in the overlay.
 *  # </weight>
 */
export interface BalancesCall_force_transfer {
    __kind: 'force_transfer'
    source: LookupSource,
    dest: LookupSource,
    value: bigint,
}

/**
 *  Set the balances of a given account.
 * 
 *  This will alter `FreeBalance` and `ReservedBalance` in storage. it will
 *  also decrease the total issuance of the system (`TotalIssuance`).
 *  If the new free or reserved balance is below the existential deposit,
 *  it will reset the account nonce (`frame_system::AccountNonce`).
 * 
 *  The dispatch origin for this call is `root`.
 * 
 *  # <weight>
 *  - Independent of the arguments.
 *  - Contains a limited number of reads and writes.
 *  ---------------------
 *  - Base Weight:
 *      - Creating: 27.56 µs
 *      - Killing: 35.11 µs
 *  - DB Weight: 1 Read, 1 Write to `who`
 *  # </weight>
 */
export interface BalancesCall_set_balance {
    __kind: 'set_balance'
    who: LookupSource,
    newFree: bigint,
    newReserved: bigint,
}

/**
 *  Transfer some liquid free balance to another account.
 * 
 *  `transfer` will set the `FreeBalance` of the sender and receiver.
 *  It will decrease the total issuance of the system by the `TransferFee`.
 *  If the sender's account is below the existential deposit as a result
 *  of the transfer, the account will be reaped.
 * 
 *  The dispatch origin for this call must be `Signed` by the transactor.
 * 
 *  # <weight>
 *  - Dependent on arguments but not critical, given proper implementations for
 *    input config types. See related functions below.
 *  - It contains a limited number of reads and writes internally and no complex computation.
 * 
 *  Related functions:
 * 
 *    - `ensure_can_withdraw` is always called internally but has a bounded complexity.
 *    - Transferring balances to accounts that did not exist before will cause
 *       `T::OnNewAccount::on_new_account` to be called.
 *    - Removing enough funds from an account will trigger `T::DustRemoval::on_unbalanced`.
 *    - `transfer_keep_alive` works the same way as `transfer`, but has an additional
 *      check that the transfer will not kill the origin account.
 *  ---------------------------------
 *  - Base Weight: 73.64 µs, worst case scenario (account created, account removed)
 *  - DB Weight: 1 Read and 1 Write to destination account
 *  - Origin account is already in memory, so no DB operations for them.
 *  # </weight>
 */
export interface BalancesCall_transfer {
    __kind: 'transfer'
    dest: LookupSource,
    value: bigint,
}

/**
 *  Same as the [`transfer`] call, but with a check that the transfer will not kill the
 *  origin account.
 * 
 *  99% of the time you want [`transfer`] instead.
 * 
 *  [`transfer`]: struct.Pallet.html#method.transfer
 *  # <weight>
 *  - Cheaper than transfer because account cannot be killed.
 *  - Base Weight: 51.4 µs
 *  - DB Weight: 1 Read and 1 Write to dest (sender is in overlay already)
 *  #</weight>
 */
export interface BalancesCall_transfer_keep_alive {
    __kind: 'transfer_keep_alive'
    dest: LookupSource,
    value: bigint,
}

export const BalancesCall: sts.Type<BalancesCall> = sts.closedEnum(() => {
    return  {
        force_transfer: sts.enumStruct({
            source: LookupSource,
            dest: LookupSource,
            value: sts.bigint(),
        }),
        set_balance: sts.enumStruct({
            who: LookupSource,
            newFree: sts.bigint(),
            newReserved: sts.bigint(),
        }),
        transfer: sts.enumStruct({
            dest: LookupSource,
            value: sts.bigint(),
        }),
        transfer_keep_alive: sts.enumStruct({
            dest: LookupSource,
            value: sts.bigint(),
        }),
    }
})

export type BabeCall = BabeCall_plan_config_change | BabeCall_report_equivocation | BabeCall_report_equivocation_unsigned

/**
 *  Plan an epoch config change. The epoch config change is recorded and will be enacted on
 *  the next call to `enact_epoch_change`. The config will be activated one epoch after.
 *  Multiple calls to this method will replace any existing planned config change that had
 *  not been enacted yet.
 */
export interface BabeCall_plan_config_change {
    __kind: 'plan_config_change'
    config: NextConfigDescriptor,
}

/**
 *  Report authority equivocation/misbehavior. This method will verify
 *  the equivocation proof and validate the given key ownership proof
 *  against the extracted offender. If both are valid, the offence will
 *  be reported.
 */
export interface BabeCall_report_equivocation {
    __kind: 'report_equivocation'
    equivocationProof: BabeEquivocationProof,
    keyOwnerProof: KeyOwnerProof,
}

/**
 *  Report authority equivocation/misbehavior. This method will verify
 *  the equivocation proof and validate the given key ownership proof
 *  against the extracted offender. If both are valid, the offence will
 *  be reported.
 *  This extrinsic must be called unsigned and it is expected that only
 *  block authors will call it (validated in `ValidateUnsigned`), as such
 *  if the block author is defined it will be defined as the equivocation
 *  reporter.
 */
export interface BabeCall_report_equivocation_unsigned {
    __kind: 'report_equivocation_unsigned'
    equivocationProof: BabeEquivocationProof,
    keyOwnerProof: KeyOwnerProof,
}

export const BabeCall: sts.Type<BabeCall> = sts.closedEnum(() => {
    return  {
        plan_config_change: sts.enumStruct({
            config: NextConfigDescriptor,
        }),
        report_equivocation: sts.enumStruct({
            equivocationProof: BabeEquivocationProof,
            keyOwnerProof: KeyOwnerProof,
        }),
        report_equivocation_unsigned: sts.enumStruct({
            equivocationProof: BabeEquivocationProof,
            keyOwnerProof: KeyOwnerProof,
        }),
    }
})

export type BabeEquivocationProof = {
    offender: AuthorityId,
    slotNumber: SlotNumber,
    firstHeader: Header,
    secondHeader: Header,
}

export const BabeEquivocationProof: sts.Type<BabeEquivocationProof> = sts.struct(() => {
    return  {
        offender: AuthorityId,
        slotNumber: SlotNumber,
        firstHeader: Header,
        secondHeader: Header,
    }
})

export type SlotNumber = bigint

export const SlotNumber: sts.Type<SlotNumber> = sts.bigint()

export type NextConfigDescriptor = NextConfigDescriptor_V0 | NextConfigDescriptor_V1

export interface NextConfigDescriptor_V0 {
    __kind: 'V0'
}

export interface NextConfigDescriptor_V1 {
    __kind: 'V1'
    value: NextConfigDescriptorV1
}

export const NextConfigDescriptor: sts.Type<NextConfigDescriptor> = sts.closedEnum(() => {
    return  {
        V0: sts.unit(),
        V1: NextConfigDescriptorV1,
    }
})

export type NextConfigDescriptorV1 = {
    c: [bigint, bigint],
    allowedSlots: AllowedSlots,
}

export const NextConfigDescriptorV1: sts.Type<NextConfigDescriptorV1> = sts.struct(() => {
    return  {
        c: sts.tuple(() => sts.bigint(), sts.bigint()),
        allowedSlots: AllowedSlots,
    }
})

export type AllowedSlots = AllowedSlots_PrimaryAndSecondaryPlainSlots | AllowedSlots_PrimaryAndSecondaryVRFSlots | AllowedSlots_PrimarySlots

export interface AllowedSlots_PrimaryAndSecondaryPlainSlots {
    __kind: 'PrimaryAndSecondaryPlainSlots'
}

export interface AllowedSlots_PrimaryAndSecondaryVRFSlots {
    __kind: 'PrimaryAndSecondaryVRFSlots'
}

export interface AllowedSlots_PrimarySlots {
    __kind: 'PrimarySlots'
}

export const AllowedSlots: sts.Type<AllowedSlots> = sts.closedEnum(() => {
    return  {
        PrimaryAndSecondaryPlainSlots: sts.unit(),
        PrimaryAndSecondaryVRFSlots: sts.unit(),
        PrimarySlots: sts.unit(),
    }
})

export type AuthorshipCall = AuthorshipCall_set_uncles

/**
 *  Provide a set of uncles.
 */
export interface AuthorshipCall_set_uncles {
    __kind: 'set_uncles'
    newUncles: Header[],
}

export const AuthorshipCall: sts.Type<AuthorshipCall> = sts.closedEnum(() => {
    return  {
        set_uncles: sts.enumStruct({
            newUncles: sts.array(() => Header),
        }),
    }
})

export type AuthorityDiscoveryCall = never

export type AuctionsCall = AuctionsCall_bid | AuctionsCall_cancel_auction | AuctionsCall_new_auction

/**
 *  Make a new bid from an account (including a parachain account) for deploying a new
 *  parachain.
 * 
 *  Multiple simultaneous bids from the same bidder are allowed only as long as all active
 *  bids overlap each other (i.e. are mutually exclusive). Bids cannot be redacted.
 * 
 *  - `sub` is the sub-bidder ID, allowing for multiple competing bids to be made by (and
 *  funded by) the same account.
 *  - `auction_index` is the index of the auction to bid on. Should just be the present
 *  value of `AuctionCounter`.
 *  - `first_slot` is the first lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `last_slot` is the last lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `amount` is the amount to bid to be held as deposit for the parachain should the
 *  bid win. This amount is held throughout the range.
 */
export interface AuctionsCall_bid {
    __kind: 'bid'
    para: number,
    auctionIndex: number,
    firstSlot: number,
    lastSlot: number,
    amount: bigint,
}

/**
 *  Cancel an in-progress auction.
 * 
 *  Can only be called by Root origin.
 */
export interface AuctionsCall_cancel_auction {
    __kind: 'cancel_auction'
}

/**
 *  Create a new auction.
 * 
 *  This can only happen when there isn't already an auction in progress and may only be
 *  called by the root origin. Accepts the `duration` of this auction and the
 *  `lease_period_index` of the initial lease period of the four that are to be auctioned.
 */
export interface AuctionsCall_new_auction {
    __kind: 'new_auction'
    duration: number,
    leasePeriodIndex: number,
}

export const AuctionsCall: sts.Type<AuctionsCall> = sts.closedEnum(() => {
    return  {
        bid: sts.enumStruct({
            para: sts.number(),
            auctionIndex: sts.number(),
            firstSlot: sts.number(),
            lastSlot: sts.number(),
            amount: sts.bigint(),
        }),
        cancel_auction: sts.unit(),
        new_auction: sts.enumStruct({
            duration: sts.number(),
            leasePeriodIndex: sts.number(),
        }),
    }
})

export type ValidationCode = Bytes

export const ValidationCode: sts.Type<ValidationCode> = sts.bytes()

export type LeasePeriodOf = number

export const LeasePeriodOf: sts.Type<LeasePeriodOf> = sts.number()

export type Proposal = Proposal_Auctions | Proposal_AuthorityDiscovery | Proposal_Authorship | Proposal_Babe | Proposal_Balances | Proposal_Bounties | Proposal_Claims | Proposal_Council | Proposal_Crowdloan | Proposal_Democracy | Proposal_ElectionProviderMultiPhase | Proposal_Gilt | Proposal_Grandpa | Proposal_Identity | Proposal_ImOnline | Proposal_Indices | Proposal_Multisig | Proposal_Offences | Proposal_ParachainsConfiguration | Proposal_Paras | Proposal_ParasDmp | Proposal_ParasHrmp | Proposal_ParasInclusion | Proposal_ParasInherent | Proposal_ParasInitializer | Proposal_ParasScheduler | Proposal_ParasSessionInfo | Proposal_ParasShared | Proposal_ParasUmp | Proposal_PhragmenElection | Proposal_Proxy | Proposal_Recovery | Proposal_Registrar | Proposal_Scheduler | Proposal_Session | Proposal_Slots | Proposal_Society | Proposal_Staking | Proposal_System | Proposal_TechnicalCommittee | Proposal_TechnicalMembership | Proposal_Timestamp | Proposal_Tips | Proposal_Treasury | Proposal_Utility | Proposal_Vesting | Proposal_XcmPallet

export interface Proposal_Auctions {
    __kind: 'Auctions'
    value: AuctionsCall
}

export interface Proposal_AuthorityDiscovery {
    __kind: 'AuthorityDiscovery'
    value: AuthorityDiscoveryCall
}

export interface Proposal_Authorship {
    __kind: 'Authorship'
    value: AuthorshipCall
}

export interface Proposal_Babe {
    __kind: 'Babe'
    value: BabeCall
}

export interface Proposal_Balances {
    __kind: 'Balances'
    value: BalancesCall
}

export interface Proposal_Bounties {
    __kind: 'Bounties'
    value: BountiesCall
}

export interface Proposal_Claims {
    __kind: 'Claims'
    value: ClaimsCall
}

export interface Proposal_Council {
    __kind: 'Council'
    value: CouncilCall
}

export interface Proposal_Crowdloan {
    __kind: 'Crowdloan'
    value: CrowdloanCall
}

export interface Proposal_Democracy {
    __kind: 'Democracy'
    value: DemocracyCall
}

export interface Proposal_ElectionProviderMultiPhase {
    __kind: 'ElectionProviderMultiPhase'
    value: ElectionProviderMultiPhaseCall
}

export interface Proposal_Gilt {
    __kind: 'Gilt'
    value: GiltCall
}

export interface Proposal_Grandpa {
    __kind: 'Grandpa'
    value: GrandpaCall
}

export interface Proposal_Identity {
    __kind: 'Identity'
    value: IdentityCall
}

export interface Proposal_ImOnline {
    __kind: 'ImOnline'
    value: ImOnlineCall
}

export interface Proposal_Indices {
    __kind: 'Indices'
    value: IndicesCall
}

export interface Proposal_Multisig {
    __kind: 'Multisig'
    value: MultisigCall
}

export interface Proposal_Offences {
    __kind: 'Offences'
    value: OffencesCall
}

export interface Proposal_ParachainsConfiguration {
    __kind: 'ParachainsConfiguration'
    value: ParachainsConfigurationCall
}

export interface Proposal_Paras {
    __kind: 'Paras'
    value: ParasCall
}

export interface Proposal_ParasDmp {
    __kind: 'ParasDmp'
    value: ParasDmpCall
}

export interface Proposal_ParasHrmp {
    __kind: 'ParasHrmp'
    value: ParasHrmpCall
}

export interface Proposal_ParasInclusion {
    __kind: 'ParasInclusion'
    value: ParasInclusionCall
}

export interface Proposal_ParasInherent {
    __kind: 'ParasInherent'
    value: ParasInherentCall
}

export interface Proposal_ParasInitializer {
    __kind: 'ParasInitializer'
    value: ParasInitializerCall
}

export interface Proposal_ParasScheduler {
    __kind: 'ParasScheduler'
    value: ParasSchedulerCall
}

export interface Proposal_ParasSessionInfo {
    __kind: 'ParasSessionInfo'
    value: ParasSessionInfoCall
}

export interface Proposal_ParasShared {
    __kind: 'ParasShared'
    value: ParasSharedCall
}

export interface Proposal_ParasUmp {
    __kind: 'ParasUmp'
    value: ParasUmpCall
}

export interface Proposal_PhragmenElection {
    __kind: 'PhragmenElection'
    value: PhragmenElectionCall
}

export interface Proposal_Proxy {
    __kind: 'Proxy'
    value: ProxyCall
}

export interface Proposal_Recovery {
    __kind: 'Recovery'
    value: RecoveryCall
}

export interface Proposal_Registrar {
    __kind: 'Registrar'
    value: RegistrarCall
}

export interface Proposal_Scheduler {
    __kind: 'Scheduler'
    value: SchedulerCall
}

export interface Proposal_Session {
    __kind: 'Session'
    value: SessionCall
}

export interface Proposal_Slots {
    __kind: 'Slots'
    value: SlotsCall
}

export interface Proposal_Society {
    __kind: 'Society'
    value: SocietyCall
}

export interface Proposal_Staking {
    __kind: 'Staking'
    value: StakingCall
}

export interface Proposal_System {
    __kind: 'System'
    value: SystemCall
}

export interface Proposal_TechnicalCommittee {
    __kind: 'TechnicalCommittee'
    value: TechnicalCommitteeCall
}

export interface Proposal_TechnicalMembership {
    __kind: 'TechnicalMembership'
    value: TechnicalMembershipCall
}

export interface Proposal_Timestamp {
    __kind: 'Timestamp'
    value: TimestampCall
}

export interface Proposal_Tips {
    __kind: 'Tips'
    value: TipsCall
}

export interface Proposal_Treasury {
    __kind: 'Treasury'
    value: TreasuryCall
}

export interface Proposal_Utility {
    __kind: 'Utility'
    value: UtilityCall
}

export interface Proposal_Vesting {
    __kind: 'Vesting'
    value: VestingCall
}

export interface Proposal_XcmPallet {
    __kind: 'XcmPallet'
    value: XcmPalletCall
}

export const Proposal: sts.Type<Proposal> = sts.closedEnum(() => {
    return  {
        Auctions: AuctionsCall,
        AuthorityDiscovery: AuthorityDiscoveryCall,
        Authorship: AuthorshipCall,
        Babe: BabeCall,
        Balances: BalancesCall,
        Bounties: BountiesCall,
        Claims: ClaimsCall,
        Council: CouncilCall,
        Crowdloan: CrowdloanCall,
        Democracy: DemocracyCall,
        ElectionProviderMultiPhase: ElectionProviderMultiPhaseCall,
        Gilt: GiltCall,
        Grandpa: GrandpaCall,
        Identity: IdentityCall,
        ImOnline: ImOnlineCall,
        Indices: IndicesCall,
        Multisig: MultisigCall,
        Offences: OffencesCall,
        ParachainsConfiguration: ParachainsConfigurationCall,
        Paras: ParasCall,
        ParasDmp: ParasDmpCall,
        ParasHrmp: ParasHrmpCall,
        ParasInclusion: ParasInclusionCall,
        ParasInherent: ParasInherentCall,
        ParasInitializer: ParasInitializerCall,
        ParasScheduler: ParasSchedulerCall,
        ParasSessionInfo: ParasSessionInfoCall,
        ParasShared: ParasSharedCall,
        ParasUmp: ParasUmpCall,
        PhragmenElection: PhragmenElectionCall,
        Proxy: ProxyCall,
        Recovery: RecoveryCall,
        Registrar: RegistrarCall,
        Scheduler: SchedulerCall,
        Session: SessionCall,
        Slots: SlotsCall,
        Society: SocietyCall,
        Staking: StakingCall,
        System: SystemCall,
        TechnicalCommittee: TechnicalCommitteeCall,
        TechnicalMembership: TechnicalMembershipCall,
        Timestamp: TimestampCall,
        Tips: TipsCall,
        Treasury: TreasuryCall,
        Utility: UtilityCall,
        Vesting: VestingCall,
        XcmPallet: XcmPalletCall,
    }
})

export type Xcm = Xcm_HrmpChannelAccepted | Xcm_HrmpChannelClosing | Xcm_HrmpNewChannelOpenRequest | Xcm_QueryResponse | Xcm_ReceiveTeleportedAsset | Xcm_RelayedFrom | Xcm_ReserveAssetDeposit | Xcm_Transact | Xcm_TransferAsset | Xcm_TransferReserveAsset | Xcm_WithdrawAsset

export interface Xcm_HrmpChannelAccepted {
    __kind: 'HrmpChannelAccepted'
    recipient: number,
}

export interface Xcm_HrmpChannelClosing {
    __kind: 'HrmpChannelClosing'
    initiator: number,
    sender: number,
    recipient: number,
}

export interface Xcm_HrmpNewChannelOpenRequest {
    __kind: 'HrmpNewChannelOpenRequest'
    sender: number,
    maxMessageSize: number,
    maxCapacity: number,
}

export interface Xcm_QueryResponse {
    __kind: 'QueryResponse'
    queryId: bigint,
    response: ResponseV0,
}

export interface Xcm_ReceiveTeleportedAsset {
    __kind: 'ReceiveTeleportedAsset'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export interface Xcm_RelayedFrom {
    __kind: 'RelayedFrom'
    who: MultiLocationV0,
    message: XcmV0,
}

export interface Xcm_ReserveAssetDeposit {
    __kind: 'ReserveAssetDeposit'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export interface Xcm_Transact {
    __kind: 'Transact'
    originType: XcmOriginKind,
    requireWeightAtMost: bigint,
    call: DoubleEncodedCall,
}

export interface Xcm_TransferAsset {
    __kind: 'TransferAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
}

export interface Xcm_TransferReserveAsset {
    __kind: 'TransferReserveAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export interface Xcm_WithdrawAsset {
    __kind: 'WithdrawAsset'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export const Xcm: sts.Type<Xcm> = sts.closedEnum(() => {
    return  {
        HrmpChannelAccepted: sts.enumStruct({
            recipient: sts.number(),
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: sts.number(),
            sender: sts.number(),
            recipient: sts.number(),
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: sts.number(),
            maxMessageSize: sts.number(),
            maxCapacity: sts.number(),
        }),
        QueryResponse: sts.enumStruct({
            queryId: sts.bigint(),
            response: ResponseV0,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: sts.bigint(),
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        WithdrawAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
    }
})

export type DoubleEncodedCall = {
    encoded: Bytes,
}

export const DoubleEncodedCall: sts.Type<DoubleEncodedCall> = sts.struct(() => {
    return  {
        encoded: sts.bytes(),
    }
})

export type XcmOriginKind = XcmOriginKind_Native | XcmOriginKind_SovereignAccount | XcmOriginKind_Superuser | XcmOriginKind_Xcm

export interface XcmOriginKind_Native {
    __kind: 'Native'
}

export interface XcmOriginKind_SovereignAccount {
    __kind: 'SovereignAccount'
}

export interface XcmOriginKind_Superuser {
    __kind: 'Superuser'
}

export interface XcmOriginKind_Xcm {
    __kind: 'Xcm'
}

export const XcmOriginKind: sts.Type<XcmOriginKind> = sts.closedEnum(() => {
    return  {
        Native: sts.unit(),
        SovereignAccount: sts.unit(),
        Superuser: sts.unit(),
        Xcm: sts.unit(),
    }
})

export type XcmV0 = XcmV0_HrmpChannelAccepted | XcmV0_HrmpChannelClosing | XcmV0_HrmpNewChannelOpenRequest | XcmV0_QueryResponse | XcmV0_ReceiveTeleportedAsset | XcmV0_RelayedFrom | XcmV0_ReserveAssetDeposit | XcmV0_Transact | XcmV0_TransferAsset | XcmV0_TransferReserveAsset | XcmV0_WithdrawAsset

export interface XcmV0_HrmpChannelAccepted {
    __kind: 'HrmpChannelAccepted'
    recipient: number,
}

export interface XcmV0_HrmpChannelClosing {
    __kind: 'HrmpChannelClosing'
    initiator: number,
    sender: number,
    recipient: number,
}

export interface XcmV0_HrmpNewChannelOpenRequest {
    __kind: 'HrmpNewChannelOpenRequest'
    sender: number,
    maxMessageSize: number,
    maxCapacity: number,
}

export interface XcmV0_QueryResponse {
    __kind: 'QueryResponse'
    queryId: bigint,
    response: ResponseV0,
}

export interface XcmV0_ReceiveTeleportedAsset {
    __kind: 'ReceiveTeleportedAsset'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export interface XcmV0_RelayedFrom {
    __kind: 'RelayedFrom'
    who: MultiLocationV0,
    message: XcmV0,
}

export interface XcmV0_ReserveAssetDeposit {
    __kind: 'ReserveAssetDeposit'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export interface XcmV0_Transact {
    __kind: 'Transact'
    originType: XcmOriginKind,
    requireWeightAtMost: bigint,
    call: DoubleEncodedCall,
}

export interface XcmV0_TransferAsset {
    __kind: 'TransferAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
}

export interface XcmV0_TransferReserveAsset {
    __kind: 'TransferReserveAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export interface XcmV0_WithdrawAsset {
    __kind: 'WithdrawAsset'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export const XcmV0: sts.Type<XcmV0> = sts.closedEnum(() => {
    return  {
        HrmpChannelAccepted: sts.enumStruct({
            recipient: sts.number(),
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: sts.number(),
            sender: sts.number(),
            recipient: sts.number(),
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: sts.number(),
            maxMessageSize: sts.number(),
            maxCapacity: sts.number(),
        }),
        QueryResponse: sts.enumStruct({
            queryId: sts.bigint(),
            response: ResponseV0,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: sts.bigint(),
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        WithdrawAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
    }
})

export type XcmOrderV0 = XcmOrderV0_BuyExecution | XcmOrderV0_DepositAsset | XcmOrderV0_DepositReserveAsset | XcmOrderV0_ExchangeAsset | XcmOrderV0_InitiateReserveWithdraw | XcmOrderV0_InitiateTeleport | XcmOrderV0_Null | XcmOrderV0_QueryHolding

export interface XcmOrderV0_BuyExecution {
    __kind: 'BuyExecution'
    fees: MultiAsset,
    weight: bigint,
    debt: bigint,
    haltOnError: boolean,
    xcm: XcmV0[],
}

export interface XcmOrderV0_DepositAsset {
    __kind: 'DepositAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
}

export interface XcmOrderV0_DepositReserveAsset {
    __kind: 'DepositReserveAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export interface XcmOrderV0_ExchangeAsset {
    __kind: 'ExchangeAsset'
    give: MultiAssetV0[],
    receive: MultiAssetV0[],
}

export interface XcmOrderV0_InitiateReserveWithdraw {
    __kind: 'InitiateReserveWithdraw'
    assets: MultiAssetV0[],
    reserve: MultiLocationV0,
    effects: XcmOrderV0[],
}

export interface XcmOrderV0_InitiateTeleport {
    __kind: 'InitiateTeleport'
    assets: MultiAsset[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export interface XcmOrderV0_Null {
    __kind: 'Null'
}

export interface XcmOrderV0_QueryHolding {
    __kind: 'QueryHolding'
    queryId: bigint,
    dest: MultiLocationV0,
    assets: MultiAssetV0[],
}

export const XcmOrderV0: sts.Type<XcmOrderV0> = sts.closedEnum(() => {
    return  {
        BuyExecution: sts.enumStruct({
            fees: MultiAsset,
            weight: sts.bigint(),
            debt: sts.bigint(),
            haltOnError: sts.boolean(),
            xcm: sts.array(() => XcmV0),
        }),
        DepositAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        ExchangeAsset: sts.enumStruct({
            give: sts.array(() => MultiAssetV0),
            receive: sts.array(() => MultiAssetV0),
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            reserve: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        InitiateTeleport: sts.enumStruct({
            assets: sts.array(() => MultiAsset),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        Null: sts.unit(),
        QueryHolding: sts.enumStruct({
            queryId: sts.bigint(),
            dest: MultiLocationV0,
            assets: sts.array(() => MultiAssetV0),
        }),
    }
})

export type MultiAssetV0 = MultiAssetV0_AbstractFungible | MultiAssetV0_AbstractNonFungible | MultiAssetV0_All | MultiAssetV0_AllAbstractFungible | MultiAssetV0_AllAbstractNonFungible | MultiAssetV0_AllConcreteFungible | MultiAssetV0_AllConcreteNonFungible | MultiAssetV0_AllFungible | MultiAssetV0_AllNonFungible | MultiAssetV0_ConcreteFungible | MultiAssetV0_ConcreteNonFungible | MultiAssetV0_None

export interface MultiAssetV0_AbstractFungible {
    __kind: 'AbstractFungible'
    id: Bytes,
    instance: bigint,
}

export interface MultiAssetV0_AbstractNonFungible {
    __kind: 'AbstractNonFungible'
    class: Bytes,
    instance: AssetInstanceV0,
}

export interface MultiAssetV0_All {
    __kind: 'All'
}

export interface MultiAssetV0_AllAbstractFungible {
    __kind: 'AllAbstractFungible'
    value: Bytes
}

export interface MultiAssetV0_AllAbstractNonFungible {
    __kind: 'AllAbstractNonFungible'
    value: Bytes
}

export interface MultiAssetV0_AllConcreteFungible {
    __kind: 'AllConcreteFungible'
    value: MultiLocationV0
}

export interface MultiAssetV0_AllConcreteNonFungible {
    __kind: 'AllConcreteNonFungible'
    value: MultiLocationV0
}

export interface MultiAssetV0_AllFungible {
    __kind: 'AllFungible'
}

export interface MultiAssetV0_AllNonFungible {
    __kind: 'AllNonFungible'
}

export interface MultiAssetV0_ConcreteFungible {
    __kind: 'ConcreteFungible'
    id: MultiLocationV0,
    amount: bigint,
}

export interface MultiAssetV0_ConcreteNonFungible {
    __kind: 'ConcreteNonFungible'
    class: MultiLocationV0,
    instance: AssetInstanceV0,
}

export interface MultiAssetV0_None {
    __kind: 'None'
}

export const MultiAssetV0: sts.Type<MultiAssetV0> = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: sts.bytes(),
            instance: sts.bigint(),
        }),
        AbstractNonFungible: sts.enumStruct({
            class: sts.bytes(),
            instance: AssetInstanceV0,
        }),
        All: sts.unit(),
        AllAbstractFungible: sts.bytes(),
        AllAbstractNonFungible: sts.bytes(),
        AllConcreteFungible: MultiLocationV0,
        AllConcreteNonFungible: MultiLocationV0,
        AllFungible: sts.unit(),
        AllNonFungible: sts.unit(),
        ConcreteFungible: sts.enumStruct({
            id: MultiLocationV0,
            amount: sts.bigint(),
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: AssetInstanceV0,
        }),
        None: sts.unit(),
    }
})

export type ResponseV0 = ResponseV0_Assets

export interface ResponseV0_Assets {
    __kind: 'Assets'
    value: MultiAssetV0[]
}

export const ResponseV0: sts.Type<ResponseV0> = sts.closedEnum(() => {
    return  {
        Assets: sts.array(() => MultiAssetV0),
    }
})

export type MultiLocation = MultiLocation_Here | MultiLocation_X1 | MultiLocation_X2 | MultiLocation_X3 | MultiLocation_X4 | MultiLocation_X5 | MultiLocation_X6 | MultiLocation_X7 | MultiLocation_X8

export interface MultiLocation_Here {
    __kind: 'Here'
}

export interface MultiLocation_X1 {
    __kind: 'X1'
    value: JunctionV0
}

export interface MultiLocation_X2 {
    __kind: 'X2'
    value: [JunctionV0, JunctionV0]
}

export interface MultiLocation_X3 {
    __kind: 'X3'
    value: [JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocation_X4 {
    __kind: 'X4'
    value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocation_X5 {
    __kind: 'X5'
    value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocation_X6 {
    __kind: 'X6'
    value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocation_X7 {
    __kind: 'X7'
    value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export interface MultiLocation_X8 {
    __kind: 'X8'
    value: [JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0]
}

export const MultiLocation: sts.Type<MultiLocation> = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV0,
        X2: sts.tuple(() => JunctionV0, JunctionV0),
        X3: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0),
        X4: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X5: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X6: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X7: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
        X8: sts.tuple(() => JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0),
    }
})

export type Outcome = Outcome_Complete | Outcome_Error | Outcome_Incomplete

export interface Outcome_Complete {
    __kind: 'Complete'
    value: Weight
}

export interface Outcome_Error {
    __kind: 'Error'
    value: XcmErrorV0
}

export interface Outcome_Incomplete {
    __kind: 'Incomplete'
    value: [Weight, XcmErrorV0]
}

export const Outcome: sts.Type<Outcome> = sts.closedEnum(() => {
    return  {
        Complete: Weight,
        Error: XcmErrorV0,
        Incomplete: sts.tuple(() => Weight, XcmErrorV0),
    }
})

export type XcmErrorV0 = XcmErrorV0_AssetNotFound | XcmErrorV0_BadOrigin | XcmErrorV0_Barrier | XcmErrorV0_CannotReachDestination | XcmErrorV0_DestinationBufferOverflow | XcmErrorV0_EscalationOfPrivilege | XcmErrorV0_ExceedsMaxMessageSize | XcmErrorV0_FailedToDecode | XcmErrorV0_FailedToTransactAsset | XcmErrorV0_LocationCannotHold | XcmErrorV0_MultiLocationFull | XcmErrorV0_NotHoldingFees | XcmErrorV0_NotWithdrawable | XcmErrorV0_Overflow | XcmErrorV0_RecursionLimitReached | XcmErrorV0_SendFailed | XcmErrorV0_TooExpensive | XcmErrorV0_TooMuchWeightRequired | XcmErrorV0_Undefined | XcmErrorV0_UnhandledEffect | XcmErrorV0_UnhandledXcmMessage | XcmErrorV0_UnhandledXcmVersion | XcmErrorV0_Unimplemented | XcmErrorV0_UntrustedReserveLocation | XcmErrorV0_UntrustedTeleportLocation | XcmErrorV0_WeightLimitReached | XcmErrorV0_WeightNotComputable | XcmErrorV0_Wildcard

export interface XcmErrorV0_AssetNotFound {
    __kind: 'AssetNotFound'
}

export interface XcmErrorV0_BadOrigin {
    __kind: 'BadOrigin'
}

export interface XcmErrorV0_Barrier {
    __kind: 'Barrier'
}

export interface XcmErrorV0_CannotReachDestination {
    __kind: 'CannotReachDestination'
    value: [MultiLocation, Xcm]
}

export interface XcmErrorV0_DestinationBufferOverflow {
    __kind: 'DestinationBufferOverflow'
}

export interface XcmErrorV0_EscalationOfPrivilege {
    __kind: 'EscalationOfPrivilege'
}

export interface XcmErrorV0_ExceedsMaxMessageSize {
    __kind: 'ExceedsMaxMessageSize'
}

export interface XcmErrorV0_FailedToDecode {
    __kind: 'FailedToDecode'
}

export interface XcmErrorV0_FailedToTransactAsset {
    __kind: 'FailedToTransactAsset'
}

export interface XcmErrorV0_LocationCannotHold {
    __kind: 'LocationCannotHold'
}

export interface XcmErrorV0_MultiLocationFull {
    __kind: 'MultiLocationFull'
}

export interface XcmErrorV0_NotHoldingFees {
    __kind: 'NotHoldingFees'
}

export interface XcmErrorV0_NotWithdrawable {
    __kind: 'NotWithdrawable'
}

export interface XcmErrorV0_Overflow {
    __kind: 'Overflow'
}

export interface XcmErrorV0_RecursionLimitReached {
    __kind: 'RecursionLimitReached'
}

export interface XcmErrorV0_SendFailed {
    __kind: 'SendFailed'
}

export interface XcmErrorV0_TooExpensive {
    __kind: 'TooExpensive'
}

export interface XcmErrorV0_TooMuchWeightRequired {
    __kind: 'TooMuchWeightRequired'
}

export interface XcmErrorV0_Undefined {
    __kind: 'Undefined'
}

export interface XcmErrorV0_UnhandledEffect {
    __kind: 'UnhandledEffect'
}

export interface XcmErrorV0_UnhandledXcmMessage {
    __kind: 'UnhandledXcmMessage'
}

export interface XcmErrorV0_UnhandledXcmVersion {
    __kind: 'UnhandledXcmVersion'
}

export interface XcmErrorV0_Unimplemented {
    __kind: 'Unimplemented'
}

export interface XcmErrorV0_UntrustedReserveLocation {
    __kind: 'UntrustedReserveLocation'
}

export interface XcmErrorV0_UntrustedTeleportLocation {
    __kind: 'UntrustedTeleportLocation'
}

export interface XcmErrorV0_WeightLimitReached {
    __kind: 'WeightLimitReached'
    value: Weight
}

export interface XcmErrorV0_WeightNotComputable {
    __kind: 'WeightNotComputable'
}

export interface XcmErrorV0_Wildcard {
    __kind: 'Wildcard'
}

export const XcmErrorV0: sts.Type<XcmErrorV0> = sts.closedEnum(() => {
    return  {
        AssetNotFound: sts.unit(),
        BadOrigin: sts.unit(),
        Barrier: sts.unit(),
        CannotReachDestination: sts.tuple(() => MultiLocation, Xcm),
        DestinationBufferOverflow: sts.unit(),
        EscalationOfPrivilege: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        FailedToDecode: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        LocationCannotHold: sts.unit(),
        MultiLocationFull: sts.unit(),
        NotHoldingFees: sts.unit(),
        NotWithdrawable: sts.unit(),
        Overflow: sts.unit(),
        RecursionLimitReached: sts.unit(),
        SendFailed: sts.unit(),
        TooExpensive: sts.unit(),
        TooMuchWeightRequired: sts.unit(),
        Undefined: sts.unit(),
        UnhandledEffect: sts.unit(),
        UnhandledXcmMessage: sts.unit(),
        UnhandledXcmVersion: sts.unit(),
        Unimplemented: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        WeightLimitReached: Weight,
        WeightNotComputable: sts.unit(),
        Wildcard: sts.unit(),
    }
})

export type DispatchResult = DispatchResult_Err | DispatchResult_Ok

export interface DispatchResult_Err {
    __kind: 'Err'
    value: DispatchError
}

export interface DispatchResult_Ok {
    __kind: 'Ok'
}

export const DispatchResult: sts.Type<DispatchResult> = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export type DispatchError = DispatchError_Arithmetic | DispatchError_BadOrigin | DispatchError_CannotLookup | DispatchError_ConsumerRemaining | DispatchError_Module | DispatchError_NoProviders | DispatchError_Other | DispatchError_Token

export interface DispatchError_Arithmetic {
    __kind: 'Arithmetic'
    value: ArithmeticError
}

export interface DispatchError_BadOrigin {
    __kind: 'BadOrigin'
}

export interface DispatchError_CannotLookup {
    __kind: 'CannotLookup'
}

export interface DispatchError_ConsumerRemaining {
    __kind: 'ConsumerRemaining'
}

export interface DispatchError_Module {
    __kind: 'Module'
    value: DispatchErrorModule
}

export interface DispatchError_NoProviders {
    __kind: 'NoProviders'
}

export interface DispatchError_Other {
    __kind: 'Other'
}

export interface DispatchError_Token {
    __kind: 'Token'
    value: TokenError
}

export const DispatchError: sts.Type<DispatchError> = sts.closedEnum(() => {
    return  {
        Arithmetic: ArithmeticError,
        BadOrigin: sts.unit(),
        CannotLookup: sts.unit(),
        ConsumerRemaining: sts.unit(),
        Module: DispatchErrorModule,
        NoProviders: sts.unit(),
        Other: sts.unit(),
        Token: TokenError,
    }
})

export type TokenError = TokenError_BelowMinimum | TokenError_CannotCreate | TokenError_Frozen | TokenError_NoFunds | TokenError_Overflow | TokenError_Underflow | TokenError_UnknownAsset | TokenError_WouldDie

export interface TokenError_BelowMinimum {
    __kind: 'BelowMinimum'
}

export interface TokenError_CannotCreate {
    __kind: 'CannotCreate'
}

export interface TokenError_Frozen {
    __kind: 'Frozen'
}

export interface TokenError_NoFunds {
    __kind: 'NoFunds'
}

export interface TokenError_Overflow {
    __kind: 'Overflow'
}

export interface TokenError_Underflow {
    __kind: 'Underflow'
}

export interface TokenError_UnknownAsset {
    __kind: 'UnknownAsset'
}

export interface TokenError_WouldDie {
    __kind: 'WouldDie'
}

export const TokenError: sts.Type<TokenError> = sts.closedEnum(() => {
    return  {
        BelowMinimum: sts.unit(),
        CannotCreate: sts.unit(),
        Frozen: sts.unit(),
        NoFunds: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
        UnknownAsset: sts.unit(),
        WouldDie: sts.unit(),
    }
})

export type DispatchErrorModule = {
    index: number,
    error: number,
}

export const DispatchErrorModule: sts.Type<DispatchErrorModule> = sts.struct(() => {
    return  {
        index: sts.number(),
        error: sts.number(),
    }
})

export type ArithmeticError = ArithmeticError_DivisionByZero | ArithmeticError_Overflow | ArithmeticError_Underflow

export interface ArithmeticError_DivisionByZero {
    __kind: 'DivisionByZero'
}

export interface ArithmeticError_Overflow {
    __kind: 'Overflow'
}

export interface ArithmeticError_Underflow {
    __kind: 'Underflow'
}

export const ArithmeticError: sts.Type<ArithmeticError> = sts.closedEnum(() => {
    return  {
        DivisionByZero: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
    }
})

export type SlotRange = SlotRange_OneOne | SlotRange_OneThree | SlotRange_OneTwo | SlotRange_ThreeThree | SlotRange_TwoThree | SlotRange_TwoTwo | SlotRange_ZeroOne | SlotRange_ZeroThree | SlotRange_ZeroTwo | SlotRange_ZeroZero

export interface SlotRange_OneOne {
    __kind: 'OneOne'
}

export interface SlotRange_OneThree {
    __kind: 'OneThree'
}

export interface SlotRange_OneTwo {
    __kind: 'OneTwo'
}

export interface SlotRange_ThreeThree {
    __kind: 'ThreeThree'
}

export interface SlotRange_TwoThree {
    __kind: 'TwoThree'
}

export interface SlotRange_TwoTwo {
    __kind: 'TwoTwo'
}

export interface SlotRange_ZeroOne {
    __kind: 'ZeroOne'
}

export interface SlotRange_ZeroThree {
    __kind: 'ZeroThree'
}

export interface SlotRange_ZeroTwo {
    __kind: 'ZeroTwo'
}

export interface SlotRange_ZeroZero {
    __kind: 'ZeroZero'
}

export const SlotRange: sts.Type<SlotRange> = sts.closedEnum(() => {
    return  {
        OneOne: sts.unit(),
        OneThree: sts.unit(),
        OneTwo: sts.unit(),
        ThreeThree: sts.unit(),
        TwoThree: sts.unit(),
        TwoTwo: sts.unit(),
        ZeroOne: sts.unit(),
        ZeroThree: sts.unit(),
        ZeroTwo: sts.unit(),
        ZeroZero: sts.unit(),
    }
})

export type AuctionIndex = number

export const AuctionIndex: sts.Type<AuctionIndex> = sts.number()

export type HrmpChannelId = {
    sender: number,
    receiver: number,
}

export const HrmpChannelId: sts.Type<HrmpChannelId> = sts.struct(() => {
    return  {
        sender: sts.number(),
        receiver: sts.number(),
    }
})

export type SessionIndex = number

export const SessionIndex: sts.Type<SessionIndex> = sts.number()

export type GroupIndex = number

export const GroupIndex: sts.Type<GroupIndex> = sts.number()

export type CoreIndex = number

export const CoreIndex: sts.Type<CoreIndex> = sts.number()

export type HeadData = Bytes

export const HeadData: sts.Type<HeadData> = sts.bytes()

export type CandidateReceipt = {
    descriptor: CandidateDescriptor,
    commitmentsHash: Hash,
}

export const CandidateReceipt: sts.Type<CandidateReceipt> = sts.struct(() => {
    return  {
        descriptor: CandidateDescriptor,
        commitmentsHash: Hash,
    }
})

export type BlockNumber = number

export const BlockNumber: sts.Type<BlockNumber> = sts.number()

export type ActiveIndex = number

export const ActiveIndex: sts.Type<ActiveIndex> = sts.number()

export type BalanceOf = bigint

export const BalanceOf: sts.Type<BalanceOf> = sts.bigint()

export type Balance = bigint

export const Balance: sts.Type<Balance> = sts.bigint()

export type LeasePeriod = number

export const LeasePeriod: sts.Type<LeasePeriod> = sts.number()

export type AccountId = Bytes

export const AccountId: sts.Type<AccountId> = sts.bytes()

export type ParaId = number

export const ParaId: sts.Type<ParaId> = sts.number()

export type OpaqueTimeSlot = Bytes

export const OpaqueTimeSlot: sts.Type<OpaqueTimeSlot> = sts.bytes()

export type Kind = Bytes

export const Kind: sts.Type<Kind> = sts.bytes()
