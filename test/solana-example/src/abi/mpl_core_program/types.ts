import {Codec, struct, ref, option, string, array, unit, u32, bool, u64, address, u8, u16, fixedArray, tuple, sum} from '@subsquid/borsh'

export interface PluginAuthorityPair {
    plugin: Plugin
    authority?: Authority | undefined
}

export const PluginAuthorityPair: Codec<PluginAuthorityPair> = struct({
    plugin: ref(() => Plugin),
    authority: option(ref(() => Authority)),
})

export interface Attribute {
    key: string
    value: string
}

export const Attribute: Codec<Attribute> = struct({
    key: string,
    value: string,
})

export interface Attributes {
    attributeList: Array<Attribute>
}

export const Attributes: Codec<Attributes> = struct({
    attributeList: array(ref(() => Attribute)),
})

export type BurnDelegate = undefined

export const BurnDelegate: Codec<BurnDelegate> = unit

export interface Edition {
    number: number
}

export const Edition: Codec<Edition> = struct({
    number: u32,
})

export interface FreezeDelegate {
    frozen: boolean
}

export const FreezeDelegate: Codec<FreezeDelegate> = struct({
    frozen: bool,
})

export interface MasterEdition {
    maxSupply?: number | undefined
    name?: string | undefined
    uri?: string | undefined
}

export const MasterEdition: Codec<MasterEdition> = struct({
    maxSupply: option(u32),
    name: option(string),
    uri: option(string),
})

export type PermanentBurnDelegate = undefined

export const PermanentBurnDelegate: Codec<PermanentBurnDelegate> = unit

export interface PermanentFreezeDelegate {
    frozen: boolean
}

export const PermanentFreezeDelegate: Codec<PermanentFreezeDelegate> = struct({
    frozen: bool,
})

export type PermanentTransferDelegate = undefined

export const PermanentTransferDelegate: Codec<PermanentTransferDelegate> = unit

export interface RegistryRecord {
    pluginType: PluginType
    authority: Authority
    offset: bigint
}

export const RegistryRecord: Codec<RegistryRecord> = struct({
    pluginType: ref(() => PluginType),
    authority: ref(() => Authority),
    offset: u64,
})

export interface ExternalPluginRecord {
    authority: Authority
    offset: bigint
}

export const ExternalPluginRecord: Codec<ExternalPluginRecord> = struct({
    authority: ref(() => Authority),
    offset: u64,
})

export interface Creator {
    address: string
    percentage: number
}

export const Creator: Codec<Creator> = struct({
    address: address,
    percentage: u8,
})

export interface Royalties {
    basisPoints: number
    creators: Array<Creator>
    ruleSet: RuleSet
}

export const Royalties: Codec<Royalties> = struct({
    basisPoints: u16,
    creators: array(ref(() => Creator)),
    ruleSet: ref(() => RuleSet),
})

export type TransferDelegate = undefined

export const TransferDelegate: Codec<TransferDelegate> = unit

export interface UpdateDelegate {
    additionalDelegates: Array<string>
}

export const UpdateDelegate: Codec<UpdateDelegate> = struct({
    additionalDelegates: array(address),
})

export interface AddPluginV1Args {
    plugin: Plugin
    initAuthority?: Authority | undefined
}

export const AddPluginV1Args: Codec<AddPluginV1Args> = struct({
    plugin: ref(() => Plugin),
    initAuthority: option(ref(() => Authority)),
})

export interface AddCollectionPluginV1Args {
    plugin: Plugin
    initAuthority?: Authority | undefined
}

export const AddCollectionPluginV1Args: Codec<AddCollectionPluginV1Args> = struct({
    plugin: ref(() => Plugin),
    initAuthority: option(ref(() => Authority)),
})

export interface ApprovePluginAuthorityV1Args {
    pluginType: PluginType
    newAuthority: Authority
}

export const ApprovePluginAuthorityV1Args: Codec<ApprovePluginAuthorityV1Args> = struct({
    pluginType: ref(() => PluginType),
    newAuthority: ref(() => Authority),
})

export interface ApproveCollectionPluginAuthorityV1Args {
    pluginType: PluginType
    newAuthority: Authority
}

export const ApproveCollectionPluginAuthorityV1Args: Codec<ApproveCollectionPluginAuthorityV1Args> = struct({
    pluginType: ref(() => PluginType),
    newAuthority: ref(() => Authority),
})

export interface BurnV1Args {
    compressionProof?: CompressionProof | undefined
}

export const BurnV1Args: Codec<BurnV1Args> = struct({
    compressionProof: option(ref(() => CompressionProof)),
})

export interface BurnCollectionV1Args {
    compressionProof?: CompressionProof | undefined
}

export const BurnCollectionV1Args: Codec<BurnCollectionV1Args> = struct({
    compressionProof: option(ref(() => CompressionProof)),
})

export type CompressV1Args = undefined

export const CompressV1Args: Codec<CompressV1Args> = unit

export interface CreateV1Args {
    dataState: DataState
    name: string
    uri: string
    plugins?: Array<PluginAuthorityPair> | undefined
}

export const CreateV1Args: Codec<CreateV1Args> = struct({
    dataState: ref(() => DataState),
    name: string,
    uri: string,
    plugins: option(array(ref(() => PluginAuthorityPair))),
})

export interface CreateCollectionV1Args {
    name: string
    uri: string
    plugins?: Array<PluginAuthorityPair> | undefined
}

export const CreateCollectionV1Args: Codec<CreateCollectionV1Args> = struct({
    name: string,
    uri: string,
    plugins: option(array(ref(() => PluginAuthorityPair))),
})

export interface DecompressV1Args {
    compressionProof: CompressionProof
}

export const DecompressV1Args: Codec<DecompressV1Args> = struct({
    compressionProof: ref(() => CompressionProof),
})

export interface RemovePluginV1Args {
    pluginType: PluginType
}

export const RemovePluginV1Args: Codec<RemovePluginV1Args> = struct({
    pluginType: ref(() => PluginType),
})

export interface RemoveCollectionPluginV1Args {
    pluginType: PluginType
}

export const RemoveCollectionPluginV1Args: Codec<RemoveCollectionPluginV1Args> = struct({
    pluginType: ref(() => PluginType),
})

export interface RevokePluginAuthorityV1Args {
    pluginType: PluginType
}

export const RevokePluginAuthorityV1Args: Codec<RevokePluginAuthorityV1Args> = struct({
    pluginType: ref(() => PluginType),
})

export interface RevokeCollectionPluginAuthorityV1Args {
    pluginType: PluginType
}

export const RevokeCollectionPluginAuthorityV1Args: Codec<RevokeCollectionPluginAuthorityV1Args> = struct({
    pluginType: ref(() => PluginType),
})

export interface TransferV1Args {
    compressionProof?: CompressionProof | undefined
}

export const TransferV1Args: Codec<TransferV1Args> = struct({
    compressionProof: option(ref(() => CompressionProof)),
})

export interface UpdateV1Args {
    newName?: string | undefined
    newUri?: string | undefined
    newUpdateAuthority?: UpdateAuthority | undefined
}

export const UpdateV1Args: Codec<UpdateV1Args> = struct({
    newName: option(string),
    newUri: option(string),
    newUpdateAuthority: option(ref(() => UpdateAuthority)),
})

export interface UpdateCollectionV1Args {
    newName?: string | undefined
    newUri?: string | undefined
}

export const UpdateCollectionV1Args: Codec<UpdateCollectionV1Args> = struct({
    newName: option(string),
    newUri: option(string),
})

export interface UpdatePluginV1Args {
    plugin: Plugin
}

export const UpdatePluginV1Args: Codec<UpdatePluginV1Args> = struct({
    plugin: ref(() => Plugin),
})

export interface UpdateCollectionPluginV1Args {
    plugin: Plugin
}

export const UpdateCollectionPluginV1Args: Codec<UpdateCollectionPluginV1Args> = struct({
    plugin: ref(() => Plugin),
})

export interface CompressionProof {
    owner: string
    updateAuthority: UpdateAuthority
    name: string
    uri: string
    seq: bigint
    plugins: Array<HashablePluginSchema>
}

export const CompressionProof: Codec<CompressionProof> = struct({
    owner: address,
    updateAuthority: ref(() => UpdateAuthority),
    name: string,
    uri: string,
    seq: u64,
    plugins: array(ref(() => HashablePluginSchema)),
})

export interface HashablePluginSchema {
    index: bigint
    authority: Authority
    plugin: Plugin
}

export const HashablePluginSchema: Codec<HashablePluginSchema> = struct({
    index: u64,
    authority: ref(() => Authority),
    plugin: ref(() => Plugin),
})

export interface HashedAssetSchema {
    assetHash: Array<number>
    pluginHashes: Array<Array<number>>
}

export const HashedAssetSchema: Codec<HashedAssetSchema> = struct({
    assetHash: fixedArray(u8, 32),
    pluginHashes: array(fixedArray(u8, 32)),
})

export type Plugin_Royalties = [
    Royalties,
]

export const Plugin_Royalties = tuple([
    ref(() => Royalties),
])

export type Plugin_FreezeDelegate = [
    FreezeDelegate,
]

export const Plugin_FreezeDelegate = tuple([
    ref(() => FreezeDelegate),
])

export type Plugin_BurnDelegate = [
    BurnDelegate,
]

export const Plugin_BurnDelegate = tuple([
    ref(() => BurnDelegate),
])

export type Plugin_TransferDelegate = [
    TransferDelegate,
]

export const Plugin_TransferDelegate = tuple([
    ref(() => TransferDelegate),
])

export type Plugin_UpdateDelegate = [
    UpdateDelegate,
]

export const Plugin_UpdateDelegate = tuple([
    ref(() => UpdateDelegate),
])

export type Plugin_PermanentFreezeDelegate = [
    PermanentFreezeDelegate,
]

export const Plugin_PermanentFreezeDelegate = tuple([
    ref(() => PermanentFreezeDelegate),
])

export type Plugin_Attributes = [
    Attributes,
]

export const Plugin_Attributes = tuple([
    ref(() => Attributes),
])

export type Plugin_PermanentTransferDelegate = [
    PermanentTransferDelegate,
]

export const Plugin_PermanentTransferDelegate = tuple([
    ref(() => PermanentTransferDelegate),
])

export type Plugin_PermanentBurnDelegate = [
    PermanentBurnDelegate,
]

export const Plugin_PermanentBurnDelegate = tuple([
    ref(() => PermanentBurnDelegate),
])

export type Plugin_Edition = [
    Edition,
]

export const Plugin_Edition = tuple([
    ref(() => Edition),
])

export type Plugin_MasterEdition = [
    MasterEdition,
]

export const Plugin_MasterEdition = tuple([
    ref(() => MasterEdition),
])

export type Plugin = 
    | {
        kind: 'Royalties'
        value: Plugin_Royalties
      }
    | {
        kind: 'FreezeDelegate'
        value: Plugin_FreezeDelegate
      }
    | {
        kind: 'BurnDelegate'
        value: Plugin_BurnDelegate
      }
    | {
        kind: 'TransferDelegate'
        value: Plugin_TransferDelegate
      }
    | {
        kind: 'UpdateDelegate'
        value: Plugin_UpdateDelegate
      }
    | {
        kind: 'PermanentFreezeDelegate'
        value: Plugin_PermanentFreezeDelegate
      }
    | {
        kind: 'Attributes'
        value: Plugin_Attributes
      }
    | {
        kind: 'PermanentTransferDelegate'
        value: Plugin_PermanentTransferDelegate
      }
    | {
        kind: 'PermanentBurnDelegate'
        value: Plugin_PermanentBurnDelegate
      }
    | {
        kind: 'Edition'
        value: Plugin_Edition
      }
    | {
        kind: 'MasterEdition'
        value: Plugin_MasterEdition
      }

export const Plugin: Codec<Plugin> = sum(1, {
    Royalties: {
        discriminator: 0,
        value: Plugin_Royalties,
    },
    FreezeDelegate: {
        discriminator: 1,
        value: Plugin_FreezeDelegate,
    },
    BurnDelegate: {
        discriminator: 2,
        value: Plugin_BurnDelegate,
    },
    TransferDelegate: {
        discriminator: 3,
        value: Plugin_TransferDelegate,
    },
    UpdateDelegate: {
        discriminator: 4,
        value: Plugin_UpdateDelegate,
    },
    PermanentFreezeDelegate: {
        discriminator: 5,
        value: Plugin_PermanentFreezeDelegate,
    },
    Attributes: {
        discriminator: 6,
        value: Plugin_Attributes,
    },
    PermanentTransferDelegate: {
        discriminator: 7,
        value: Plugin_PermanentTransferDelegate,
    },
    PermanentBurnDelegate: {
        discriminator: 8,
        value: Plugin_PermanentBurnDelegate,
    },
    Edition: {
        discriminator: 9,
        value: Plugin_Edition,
    },
    MasterEdition: {
        discriminator: 10,
        value: Plugin_MasterEdition,
    },
})

export type PluginType_Royalties = undefined

export const PluginType_Royalties = unit

export type PluginType_FreezeDelegate = undefined

export const PluginType_FreezeDelegate = unit

export type PluginType_BurnDelegate = undefined

export const PluginType_BurnDelegate = unit

export type PluginType_TransferDelegate = undefined

export const PluginType_TransferDelegate = unit

export type PluginType_UpdateDelegate = undefined

export const PluginType_UpdateDelegate = unit

export type PluginType_PermanentFreezeDelegate = undefined

export const PluginType_PermanentFreezeDelegate = unit

export type PluginType_Attributes = undefined

export const PluginType_Attributes = unit

export type PluginType_PermanentTransferDelegate = undefined

export const PluginType_PermanentTransferDelegate = unit

export type PluginType_PermanentBurnDelegate = undefined

export const PluginType_PermanentBurnDelegate = unit

export type PluginType_Edition = undefined

export const PluginType_Edition = unit

export type PluginType_MasterEdition = undefined

export const PluginType_MasterEdition = unit

export type PluginType = 
    | {
        kind: 'Royalties'
        value?: PluginType_Royalties
      }
    | {
        kind: 'FreezeDelegate'
        value?: PluginType_FreezeDelegate
      }
    | {
        kind: 'BurnDelegate'
        value?: PluginType_BurnDelegate
      }
    | {
        kind: 'TransferDelegate'
        value?: PluginType_TransferDelegate
      }
    | {
        kind: 'UpdateDelegate'
        value?: PluginType_UpdateDelegate
      }
    | {
        kind: 'PermanentFreezeDelegate'
        value?: PluginType_PermanentFreezeDelegate
      }
    | {
        kind: 'Attributes'
        value?: PluginType_Attributes
      }
    | {
        kind: 'PermanentTransferDelegate'
        value?: PluginType_PermanentTransferDelegate
      }
    | {
        kind: 'PermanentBurnDelegate'
        value?: PluginType_PermanentBurnDelegate
      }
    | {
        kind: 'Edition'
        value?: PluginType_Edition
      }
    | {
        kind: 'MasterEdition'
        value?: PluginType_MasterEdition
      }

export const PluginType: Codec<PluginType> = sum(1, {
    Royalties: {
        discriminator: 0,
        value: PluginType_Royalties,
    },
    FreezeDelegate: {
        discriminator: 1,
        value: PluginType_FreezeDelegate,
    },
    BurnDelegate: {
        discriminator: 2,
        value: PluginType_BurnDelegate,
    },
    TransferDelegate: {
        discriminator: 3,
        value: PluginType_TransferDelegate,
    },
    UpdateDelegate: {
        discriminator: 4,
        value: PluginType_UpdateDelegate,
    },
    PermanentFreezeDelegate: {
        discriminator: 5,
        value: PluginType_PermanentFreezeDelegate,
    },
    Attributes: {
        discriminator: 6,
        value: PluginType_Attributes,
    },
    PermanentTransferDelegate: {
        discriminator: 7,
        value: PluginType_PermanentTransferDelegate,
    },
    PermanentBurnDelegate: {
        discriminator: 8,
        value: PluginType_PermanentBurnDelegate,
    },
    Edition: {
        discriminator: 9,
        value: PluginType_Edition,
    },
    MasterEdition: {
        discriminator: 10,
        value: PluginType_MasterEdition,
    },
})

export type RuleSet_None = undefined

export const RuleSet_None = unit

export type RuleSet_ProgramAllowList = [
    Array<string>,
]

export const RuleSet_ProgramAllowList = tuple([
    array(address),
])

export type RuleSet_ProgramDenyList = [
    Array<string>,
]

export const RuleSet_ProgramDenyList = tuple([
    array(address),
])

export type RuleSet = 
    | {
        kind: 'None'
        value?: RuleSet_None
      }
    | {
        kind: 'ProgramAllowList'
        value: RuleSet_ProgramAllowList
      }
    | {
        kind: 'ProgramDenyList'
        value: RuleSet_ProgramDenyList
      }

export const RuleSet: Codec<RuleSet> = sum(1, {
    None: {
        discriminator: 0,
        value: RuleSet_None,
    },
    ProgramAllowList: {
        discriminator: 1,
        value: RuleSet_ProgramAllowList,
    },
    ProgramDenyList: {
        discriminator: 2,
        value: RuleSet_ProgramDenyList,
    },
})

export type DataState_AccountState = undefined

export const DataState_AccountState = unit

export type DataState_LedgerState = undefined

export const DataState_LedgerState = unit

export type DataState = 
    | {
        kind: 'AccountState'
        value?: DataState_AccountState
      }
    | {
        kind: 'LedgerState'
        value?: DataState_LedgerState
      }

export const DataState: Codec<DataState> = sum(1, {
    AccountState: {
        discriminator: 0,
        value: DataState_AccountState,
    },
    LedgerState: {
        discriminator: 1,
        value: DataState_LedgerState,
    },
})

export type Authority_None = undefined

export const Authority_None = unit

export type Authority_Owner = undefined

export const Authority_Owner = unit

export type Authority_UpdateAuthority = undefined

export const Authority_UpdateAuthority = unit

export type Authority_Address = {
    address: string
}

export const Authority_Address = struct({
    address: address,
})

export type Authority = 
    | {
        kind: 'None'
        value?: Authority_None
      }
    | {
        kind: 'Owner'
        value?: Authority_Owner
      }
    | {
        kind: 'UpdateAuthority'
        value?: Authority_UpdateAuthority
      }
    | {
        kind: 'Address'
        value: Authority_Address
      }

export const Authority: Codec<Authority> = sum(1, {
    None: {
        discriminator: 0,
        value: Authority_None,
    },
    Owner: {
        discriminator: 1,
        value: Authority_Owner,
    },
    UpdateAuthority: {
        discriminator: 2,
        value: Authority_UpdateAuthority,
    },
    Address: {
        discriminator: 3,
        value: Authority_Address,
    },
})

export type ExtraAccounts_None = undefined

export const ExtraAccounts_None = unit

export type ExtraAccounts_SplHook = {
    extraAccountMetas: string
}

export const ExtraAccounts_SplHook = struct({
    extraAccountMetas: address,
})

export type ExtraAccounts_MplHook = {
    mintPda?: string | undefined
    collectionPda?: string | undefined
    ownerPda?: string | undefined
}

export const ExtraAccounts_MplHook = struct({
    mintPda: option(address),
    collectionPda: option(address),
    ownerPda: option(address),
})

export type ExtraAccounts = 
    | {
        kind: 'None'
        value?: ExtraAccounts_None
      }
    | {
        kind: 'SplHook'
        value: ExtraAccounts_SplHook
      }
    | {
        kind: 'MplHook'
        value: ExtraAccounts_MplHook
      }

export const ExtraAccounts: Codec<ExtraAccounts> = sum(1, {
    None: {
        discriminator: 0,
        value: ExtraAccounts_None,
    },
    SplHook: {
        discriminator: 1,
        value: ExtraAccounts_SplHook,
    },
    MplHook: {
        discriminator: 2,
        value: ExtraAccounts_MplHook,
    },
})

export type Key_Uninitialized = undefined

export const Key_Uninitialized = unit

export type Key_AssetV1 = undefined

export const Key_AssetV1 = unit

export type Key_HashedAssetV1 = undefined

export const Key_HashedAssetV1 = unit

export type Key_PluginHeaderV1 = undefined

export const Key_PluginHeaderV1 = unit

export type Key_PluginRegistryV1 = undefined

export const Key_PluginRegistryV1 = unit

export type Key_CollectionV1 = undefined

export const Key_CollectionV1 = unit

export type Key = 
    | {
        kind: 'Uninitialized'
        value?: Key_Uninitialized
      }
    | {
        kind: 'AssetV1'
        value?: Key_AssetV1
      }
    | {
        kind: 'HashedAssetV1'
        value?: Key_HashedAssetV1
      }
    | {
        kind: 'PluginHeaderV1'
        value?: Key_PluginHeaderV1
      }
    | {
        kind: 'PluginRegistryV1'
        value?: Key_PluginRegistryV1
      }
    | {
        kind: 'CollectionV1'
        value?: Key_CollectionV1
      }

export const Key: Codec<Key> = sum(1, {
    Uninitialized: {
        discriminator: 0,
        value: Key_Uninitialized,
    },
    AssetV1: {
        discriminator: 1,
        value: Key_AssetV1,
    },
    HashedAssetV1: {
        discriminator: 2,
        value: Key_HashedAssetV1,
    },
    PluginHeaderV1: {
        discriminator: 3,
        value: Key_PluginHeaderV1,
    },
    PluginRegistryV1: {
        discriminator: 4,
        value: Key_PluginRegistryV1,
    },
    CollectionV1: {
        discriminator: 5,
        value: Key_CollectionV1,
    },
})

export type UpdateAuthority_None = undefined

export const UpdateAuthority_None = unit

export type UpdateAuthority_Address = [
    string,
]

export const UpdateAuthority_Address = tuple([
    address,
])

export type UpdateAuthority_Collection = [
    string,
]

export const UpdateAuthority_Collection = tuple([
    address,
])

export type UpdateAuthority = 
    | {
        kind: 'None'
        value?: UpdateAuthority_None
      }
    | {
        kind: 'Address'
        value: UpdateAuthority_Address
      }
    | {
        kind: 'Collection'
        value: UpdateAuthority_Collection
      }

export const UpdateAuthority: Codec<UpdateAuthority> = sum(1, {
    None: {
        discriminator: 0,
        value: UpdateAuthority_None,
    },
    Address: {
        discriminator: 1,
        value: UpdateAuthority_Address,
    },
    Collection: {
        discriminator: 2,
        value: UpdateAuthority_Collection,
    },
})

export type Uninitialized = undefined

export const Uninitialized: Codec<Uninitialized> = unit

export interface AssetV1 {
    key: Key
    owner: string
    updateAuthority: UpdateAuthority
    name: string
    uri: string
    seq?: bigint | undefined
}

export const AssetV1: Codec<AssetV1> = struct({
    key: ref(() => Key),
    owner: address,
    updateAuthority: ref(() => UpdateAuthority),
    name: string,
    uri: string,
    seq: option(u64),
})

export interface HashedAssetV1 {
    key: Key
    hash: Array<number>
}

export const HashedAssetV1: Codec<HashedAssetV1> = struct({
    key: ref(() => Key),
    hash: fixedArray(u8, 32),
})

export interface PluginHeaderV1 {
    key: Key
    pluginRegistryOffset: bigint
}

export const PluginHeaderV1: Codec<PluginHeaderV1> = struct({
    key: ref(() => Key),
    pluginRegistryOffset: u64,
})

export interface PluginRegistryV1 {
    key: Key
    registry: Array<RegistryRecord>
    externalPlugins: Array<ExternalPluginRecord>
}

export const PluginRegistryV1: Codec<PluginRegistryV1> = struct({
    key: ref(() => Key),
    registry: array(ref(() => RegistryRecord)),
    externalPlugins: array(ref(() => ExternalPluginRecord)),
})

export interface CollectionV1 {
    key: Key
    updateAuthority: string
    name: string
    uri: string
    numMinted: number
    currentSize: number
}

export const CollectionV1: Codec<CollectionV1> = struct({
    key: ref(() => Key),
    updateAuthority: address,
    name: string,
    uri: string,
    numMinted: u32,
    currentSize: u32,
})
