
export type Metadata = Metadata_V0 | Metadata_V1 | Metadata_V2 | Metadata_V3 | Metadata_V4 | Metadata_V5 | Metadata_V6 | Metadata_V7 | Metadata_V8 | Metadata_V9 | Metadata_V10 | Metadata_V11 | Metadata_V12 | Metadata_V13 | Metadata_V14

export interface Metadata_V0 {
  __kind: 'V0'
  value: never
}

export interface Metadata_V1 {
  __kind: 'V1'
  value: never
}

export interface Metadata_V2 {
  __kind: 'V2'
  value: never
}

export interface Metadata_V3 {
  __kind: 'V3'
  value: never
}

export interface Metadata_V4 {
  __kind: 'V4'
  value: never
}

export interface Metadata_V5 {
  __kind: 'V5'
  value: never
}

export interface Metadata_V6 {
  __kind: 'V6'
  value: never
}

export interface Metadata_V7 {
  __kind: 'V7'
  value: never
}

export interface Metadata_V8 {
  __kind: 'V8'
  value: never
}

export interface Metadata_V9 {
  __kind: 'V9'
  value: MetadataV9
}

export interface Metadata_V10 {
  __kind: 'V10'
  value: MetadataV10
}

export interface Metadata_V11 {
  __kind: 'V11'
  value: MetadataV11
}

export interface Metadata_V12 {
  __kind: 'V12'
  value: MetadataV12
}

export interface Metadata_V13 {
  __kind: 'V13'
  value: MetadataV13
}

export interface Metadata_V14 {
  __kind: 'V14'
  value: MetadataV14
}

export interface MetadataV9 {
  modules: ModuleMetadataV9[]
}

export interface MetadataV10 {
  modules: ModuleMetadataV10[]
}

export interface MetadataV11 {
  modules: ModuleMetadataV11[]
  extrinsic: ExtrinsicMetadataV11
}

export interface MetadataV12 {
  modules: ModuleMetadataV12[]
  extrinsic: ExtrinsicMetadataV11
}

export interface MetadataV13 {
  modules: ModuleMetadataV13[]
  extrinsic: ExtrinsicMetadataV11
}

export interface MetadataV14 {
  lookup: PortableRegistryV14
  pallets: PalletMetadataV14[]
  extrinsic: ExtrinsicMetadataV14
  type: number
}

export interface ModuleMetadataV9 {
  name: string
  storage: (StorageMetadataV9 | undefined)
  calls: (FunctionMetadataV9[] | undefined)
  events: (EventMetadataV9[] | undefined)
  constants: ModuleConstantMetadataV9[]
  errors: ErrorMetadataV9[]
}

export interface ModuleMetadataV10 {
  name: string
  storage: (StorageMetadataV10 | undefined)
  calls: (FunctionMetadataV9[] | undefined)
  events: (EventMetadataV9[] | undefined)
  constants: ModuleConstantMetadataV9[]
  errors: ErrorMetadataV9[]
}

export interface ModuleMetadataV11 {
  name: string
  storage: (StorageMetadataV11 | undefined)
  calls: (FunctionMetadataV9[] | undefined)
  events: (EventMetadataV9[] | undefined)
  constants: ModuleConstantMetadataV9[]
  errors: ErrorMetadataV9[]
}

export interface ExtrinsicMetadataV11 {
  version: number
  signedExtensions: string[]
}

export interface ModuleMetadataV12 {
  name: string
  storage: (StorageMetadataV11 | undefined)
  calls: (FunctionMetadataV9[] | undefined)
  events: (EventMetadataV9[] | undefined)
  constants: ModuleConstantMetadataV9[]
  errors: ErrorMetadataV9[]
  index: number
}

export interface ModuleMetadataV13 {
  name: string
  storage: (StorageMetadataV13 | undefined)
  calls: (FunctionMetadataV9[] | undefined)
  events: (EventMetadataV9[] | undefined)
  constants: ModuleConstantMetadataV9[]
  errors: ErrorMetadataV9[]
  index: number
}

export interface PortableRegistryV14 {
  types: PortableTypeV14[]
}

export interface PalletMetadataV14 {
  name: string
  storage: (PalletStorageMetadataV14 | undefined)
  calls: (PalletCallMetadataV14 | undefined)
  events: (PalletEventMetadataV14 | undefined)
  constants: PalletConstantMetadataV14[]
  errors: (PalletErrorMetadataV14 | undefined)
  index: number
}

export interface ExtrinsicMetadataV14 {
  type: number
  version: number
  signedExtensions: SignedExtensionMetadataV14[]
}

export interface StorageMetadataV9 {
  prefix: string
  items: StorageEntryMetadataV9[]
}

export interface FunctionMetadataV9 {
  name: string
  args: FunctionArgumentMetadataV9[]
  docs: string[]
}

export interface EventMetadataV9 {
  name: string
  args: string[]
  docs: string[]
}

export interface ModuleConstantMetadataV9 {
  name: string
  type: string
  value: Uint8Array
  docs: string[]
}

export interface ErrorMetadataV9 {
  name: string
  docs: string[]
}

export interface StorageMetadataV10 {
  prefix: string
  items: StorageEntryMetadataV10[]
}

export interface StorageMetadataV11 {
  prefix: string
  items: StorageEntryMetadataV11[]
}

export interface StorageMetadataV13 {
  prefix: string
  items: StorageEntryMetadataV13[]
}

export interface PortableTypeV14 {
  id: number
  type: Si1Type
}

export interface PalletStorageMetadataV14 {
  prefix: string
  items: StorageEntryMetadataV14[]
}

export interface PalletCallMetadataV14 {
  type: number
}

export interface PalletEventMetadataV14 {
  type: number
}

export interface PalletConstantMetadataV14 {
  name: string
  type: number
  value: Uint8Array
  docs: string[]
}

export interface PalletErrorMetadataV14 {
  type: number
}

export interface SignedExtensionMetadataV14 {
  identifier: string
  type: number
  additionalSigned: number
}

export interface StorageEntryMetadataV9 {
  name: string
  modifier: StorageEntryModifierV9
  type: StorageEntryTypeV9
  fallback: Uint8Array
  docs: string[]
}

export interface FunctionArgumentMetadataV9 {
  name: string
  type: string
}

export interface StorageEntryMetadataV10 {
  name: string
  modifier: StorageEntryModifierV9
  type: StorageEntryTypeV10
  fallback: Uint8Array
  docs: string[]
}

export interface StorageEntryMetadataV11 {
  name: string
  modifier: StorageEntryModifierV9
  type: StorageEntryTypeV11
  fallback: Uint8Array
  docs: string[]
}

export interface StorageEntryMetadataV13 {
  name: string
  modifier: StorageEntryModifierV9
  type: StorageEntryTypeV13
  fallback: Uint8Array
  docs: string[]
}

export interface Si1Type {
  path: string[]
  params: Si1TypeParameter[]
  def: Si1TypeDef
  docs: string[]
}

export interface StorageEntryMetadataV14 {
  name: string
  modifier: StorageEntryModifierV9
  type: StorageEntryTypeV14
  fallback: Uint8Array
  docs: string[]
}

export type StorageEntryModifierV9 = StorageEntryModifierV9_Optional | StorageEntryModifierV9_Default | StorageEntryModifierV9_Required

export interface StorageEntryModifierV9_Optional {
  __kind: 'Optional'
}

export interface StorageEntryModifierV9_Default {
  __kind: 'Default'
}

export interface StorageEntryModifierV9_Required {
  __kind: 'Required'
}

export type StorageEntryTypeV9 = StorageEntryTypeV9_Plain | StorageEntryTypeV9_Map | StorageEntryTypeV9_DoubleMap

export interface StorageEntryTypeV9_Plain {
  __kind: 'Plain'
  value: string
}

export interface StorageEntryTypeV9_Map {
  __kind: 'Map'
  hasher: StorageHasherV9
  key: string
  value: string
  linked: boolean
}

export interface StorageEntryTypeV9_DoubleMap {
  __kind: 'DoubleMap'
  hasher: StorageHasherV9
  key1: string
  key2: string
  value: string
  key2Hasher: StorageHasherV9
}

export type StorageEntryTypeV10 = StorageEntryTypeV10_Plain | StorageEntryTypeV10_Map | StorageEntryTypeV10_DoubleMap

export interface StorageEntryTypeV10_Plain {
  __kind: 'Plain'
  value: string
}

export interface StorageEntryTypeV10_Map {
  __kind: 'Map'
  hasher: StorageHasherV10
  key: string
  value: string
  linked: boolean
}

export interface StorageEntryTypeV10_DoubleMap {
  __kind: 'DoubleMap'
  hasher: StorageHasherV10
  key1: string
  key2: string
  value: string
  key2Hasher: StorageHasherV10
}

export type StorageEntryTypeV11 = StorageEntryTypeV11_Plain | StorageEntryTypeV11_Map | StorageEntryTypeV11_DoubleMap

export interface StorageEntryTypeV11_Plain {
  __kind: 'Plain'
  value: string
}

export interface StorageEntryTypeV11_Map {
  __kind: 'Map'
  hasher: StorageHasherV11
  key: string
  value: string
  linked: boolean
}

export interface StorageEntryTypeV11_DoubleMap {
  __kind: 'DoubleMap'
  hasher: StorageHasherV11
  key1: string
  key2: string
  value: string
  key2Hasher: StorageHasherV11
}

export type StorageEntryTypeV13 = StorageEntryTypeV13_Plain | StorageEntryTypeV13_Map | StorageEntryTypeV13_DoubleMap | StorageEntryTypeV13_NMap

export interface StorageEntryTypeV13_Plain {
  __kind: 'Plain'
  value: string
}

export interface StorageEntryTypeV13_Map {
  __kind: 'Map'
  hasher: StorageHasherV11
  key: string
  value: string
  linked: boolean
}

export interface StorageEntryTypeV13_DoubleMap {
  __kind: 'DoubleMap'
  hasher: StorageHasherV11
  key1: string
  key2: string
  value: string
  key2Hasher: StorageHasherV11
}

export interface StorageEntryTypeV13_NMap {
  __kind: 'NMap'
  keyVec: string[]
  hashers: StorageHasherV11[]
  value: string
}

export interface Si1TypeParameter {
  name: string
  type: (number | undefined)
}

export type Si1TypeDef = Si1TypeDef_Composite | Si1TypeDef_Variant | Si1TypeDef_Sequence | Si1TypeDef_Array | Si1TypeDef_Tuple | Si1TypeDef_Primitive | Si1TypeDef_Compact | Si1TypeDef_BitSequence

export interface Si1TypeDef_Composite {
  __kind: 'Composite'
  value: Si1TypeDefComposite
}

export interface Si1TypeDef_Variant {
  __kind: 'Variant'
  value: Si1TypeDefVariant
}

export interface Si1TypeDef_Sequence {
  __kind: 'Sequence'
  value: Si1TypeDefSequence
}

export interface Si1TypeDef_Array {
  __kind: 'Array'
  value: Si1TypeDefArray
}

export interface Si1TypeDef_Tuple {
  __kind: 'Tuple'
  value: number[]
}

export interface Si1TypeDef_Primitive {
  __kind: 'Primitive'
  value: Si0TypeDefPrimitive
}

export interface Si1TypeDef_Compact {
  __kind: 'Compact'
  value: Si1TypeDefCompact
}

export interface Si1TypeDef_BitSequence {
  __kind: 'BitSequence'
  value: Si1TypeDefBitSequence
}

export type StorageEntryTypeV14 = StorageEntryTypeV14_Plain | StorageEntryTypeV14_Map

export interface StorageEntryTypeV14_Plain {
  __kind: 'Plain'
  value: number
}

export interface StorageEntryTypeV14_Map {
  __kind: 'Map'
  hashers: StorageHasherV11[]
  key: number
  value: number
}

export type StorageHasherV9 = StorageHasherV9_Blake2_128 | StorageHasherV9_Blake2_256 | StorageHasherV9_Twox128 | StorageHasherV9_Twox256 | StorageHasherV9_Twox64Concat

export interface StorageHasherV9_Blake2_128 {
  __kind: 'Blake2_128'
}

export interface StorageHasherV9_Blake2_256 {
  __kind: 'Blake2_256'
}

export interface StorageHasherV9_Twox128 {
  __kind: 'Twox128'
}

export interface StorageHasherV9_Twox256 {
  __kind: 'Twox256'
}

export interface StorageHasherV9_Twox64Concat {
  __kind: 'Twox64Concat'
}

export type StorageHasherV10 = StorageHasherV10_Blake2_128 | StorageHasherV10_Blake2_256 | StorageHasherV10_Blake2_128Concat | StorageHasherV10_Twox128 | StorageHasherV10_Twox256 | StorageHasherV10_Twox64Concat

export interface StorageHasherV10_Blake2_128 {
  __kind: 'Blake2_128'
}

export interface StorageHasherV10_Blake2_256 {
  __kind: 'Blake2_256'
}

export interface StorageHasherV10_Blake2_128Concat {
  __kind: 'Blake2_128Concat'
}

export interface StorageHasherV10_Twox128 {
  __kind: 'Twox128'
}

export interface StorageHasherV10_Twox256 {
  __kind: 'Twox256'
}

export interface StorageHasherV10_Twox64Concat {
  __kind: 'Twox64Concat'
}

export type StorageHasherV11 = StorageHasherV11_Blake2_128 | StorageHasherV11_Blake2_256 | StorageHasherV11_Blake2_128Concat | StorageHasherV11_Twox128 | StorageHasherV11_Twox256 | StorageHasherV11_Twox64Concat | StorageHasherV11_Identity

export interface StorageHasherV11_Blake2_128 {
  __kind: 'Blake2_128'
}

export interface StorageHasherV11_Blake2_256 {
  __kind: 'Blake2_256'
}

export interface StorageHasherV11_Blake2_128Concat {
  __kind: 'Blake2_128Concat'
}

export interface StorageHasherV11_Twox128 {
  __kind: 'Twox128'
}

export interface StorageHasherV11_Twox256 {
  __kind: 'Twox256'
}

export interface StorageHasherV11_Twox64Concat {
  __kind: 'Twox64Concat'
}

export interface StorageHasherV11_Identity {
  __kind: 'Identity'
}

export interface Si1TypeDefComposite {
  fields: Si1Field[]
}

export interface Si1TypeDefVariant {
  variants: Si1Variant[]
}

export interface Si1TypeDefSequence {
  type: number
}

export interface Si1TypeDefArray {
  len: number
  type: number
}

export type Si0TypeDefPrimitive = Si0TypeDefPrimitive_Bool | Si0TypeDefPrimitive_Char | Si0TypeDefPrimitive_Str | Si0TypeDefPrimitive_U8 | Si0TypeDefPrimitive_U16 | Si0TypeDefPrimitive_U32 | Si0TypeDefPrimitive_U64 | Si0TypeDefPrimitive_U128 | Si0TypeDefPrimitive_U256 | Si0TypeDefPrimitive_I8 | Si0TypeDefPrimitive_I16 | Si0TypeDefPrimitive_I32 | Si0TypeDefPrimitive_I64 | Si0TypeDefPrimitive_I128 | Si0TypeDefPrimitive_I256

export interface Si0TypeDefPrimitive_Bool {
  __kind: 'Bool'
}

export interface Si0TypeDefPrimitive_Char {
  __kind: 'Char'
}

export interface Si0TypeDefPrimitive_Str {
  __kind: 'Str'
}

export interface Si0TypeDefPrimitive_U8 {
  __kind: 'U8'
}

export interface Si0TypeDefPrimitive_U16 {
  __kind: 'U16'
}

export interface Si0TypeDefPrimitive_U32 {
  __kind: 'U32'
}

export interface Si0TypeDefPrimitive_U64 {
  __kind: 'U64'
}

export interface Si0TypeDefPrimitive_U128 {
  __kind: 'U128'
}

export interface Si0TypeDefPrimitive_U256 {
  __kind: 'U256'
}

export interface Si0TypeDefPrimitive_I8 {
  __kind: 'I8'
}

export interface Si0TypeDefPrimitive_I16 {
  __kind: 'I16'
}

export interface Si0TypeDefPrimitive_I32 {
  __kind: 'I32'
}

export interface Si0TypeDefPrimitive_I64 {
  __kind: 'I64'
}

export interface Si0TypeDefPrimitive_I128 {
  __kind: 'I128'
}

export interface Si0TypeDefPrimitive_I256 {
  __kind: 'I256'
}

export interface Si1TypeDefCompact {
  type: number
}

export interface Si1TypeDefBitSequence {
  bitStoreType: number
  bitOrderType: number
}

export interface Si1Field {
  name: (string | undefined)
  type: number
  typeName: (string | undefined)
  docs: string[]
}

export interface Si1Variant {
  name: string
  fields: Si1Field[]
  index: number
  docs: string[]
}
