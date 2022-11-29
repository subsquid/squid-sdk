/**
 * Versioned ink! project metadata.
 *
 * # Note
 *
 * Represents the version of the serialized metadata *format*, which is distinct from the version of this crate for Rust semantic versioning compatibility.
 */
export type MetadataVersioned =
    | {
        V0: MetadataVersionDeprecated
    }
    | {
        V1: MetadataVersionDeprecated
    }
    | {
        V2: MetadataVersionDeprecated
    }
    | {
        V3: InkProject
    }
/**
* The 4 byte selector to identify constructors and messages
*/
export type Selector = string
/**
* Represents the static storage layout of an ink! smart contract.
*/
export type LayoutFor_PortableForm =
    | {
        cell: CellLayoutFor_PortableForm
    }
    | {
        hash: HashLayoutFor_PortableForm
    }
    | {
        array: ArrayLayoutFor_PortableForm
    }
    | {
        struct: StructLayoutFor_PortableForm
    }
    | {
        enum: EnumLayoutFor_PortableForm
    }
/**
* One of the supported crypto hashers.
*/
export type CryptoHasher = "Blake2x256" | "Sha2x256" | "Keccak256"
/**
* The possible types a SCALE encodable Rust value could have.
*
* # Note
*
* In order to preserve backwards compatibility, variant indices are explicitly specified instead of depending on the default implicit ordering.
*
* When adding a new variant, it must be added at the end with an incremented index.
*
* When removing an existing variant, the rest of variant indices remain the same, and the removed index should not be reused.
*/
export type TypeDefFor_PortableForm =
    | {
        composite: TypeDefCompositeFor_PortableForm
    }
    | {
        variant: TypeDefVariantFor_PortableForm
    }
    | {
        sequence: TypeDefSequenceFor_PortableForm
    }
    | {
        array: TypeDefArrayFor_PortableForm
    }
    | {
        tuple: number[]
    }
    | {
        primitive: TypeDefPrimitive
    }
    | {
        compact: TypeDefCompactFor_PortableForm
    }
    | {
        bitsequence: TypeDefBitSequenceFor_PortableForm
    }
/**
* A primitive Rust type.
*
* # Note
*
* Explicit codec indices specified to ensure backwards compatibility. See [`TypeDef`].
*/
export type TypeDefPrimitive =
    | "bool"
    | "char"
    | "str"
    | "u8"
    | "u16"
    | "u32"
    | "u64"
    | "u128"
    | "u256"
    | "i8"
    | "i16"
    | "i32"
    | "i64"
    | "i128"
    | "i256"

/**
* Enum to represent a deprecated metadata version that cannot be instantiated.
*/
export interface MetadataVersionDeprecated {
    [k: string]: unknown
}
/**
* An entire ink! project for metadata file generation purposes.
*/
export interface InkProject {
    spec: ContractSpecFor_PortableForm
    /**
     * The layout of the storage data structure
     */
    storage: LayoutFor_PortableForm
    types: PortableType[]
    [k: string]: unknown
}
/**
* Describes a contract.
*/
export interface ContractSpecFor_PortableForm {
    /**
     * The set of constructors of the contract.
     */
    constructors: ConstructorSpecFor_PortableForm[]
    /**
     * The contract documentation.
     */
    docs: string[]
    /**
     * The events of the contract.
     */
    events: EventSpecFor_PortableForm[]
    /**
     * The external messages of the contract.
     */
    messages: MessageSpecFor_PortableForm[]
    [k: string]: unknown
}
/**
* Describes a constructor of a contract.
*/
export interface ConstructorSpecFor_PortableForm {
    /**
     * The parameters of the deployment handler.
     */
    args: MessageParamSpecFor_PortableForm[]
    /**
     * The deployment handler documentation.
     */
    docs: string[]
    /**
     * The label of the constructor.
     *
     * In case of a trait provided constructor the label is prefixed with the trait label.
     */
    label: string
    /**
     * If the constructor accepts any `value` from the caller.
     */
    payable: boolean
    /**
     * The selector hash of the message.
     */
    selector: Selector
    [k: string]: unknown
}
/**
* Describes a pair of parameter label and type.
*/
export interface MessageParamSpecFor_PortableForm {
    /**
     * The label of the parameter.
     */
    label: string
    /**
     * The type of the parameter.
     */
    type: TypeSpecFor_PortableForm
    [k: string]: unknown
}
/**
* A type specification.
*
* This contains the actual type as well as an optional compile-time known displayed representation of the type. This is useful for cases where the type is used through a type alias in order to provide information about the alias name.
*
* # Examples
*
* Consider the following Rust function: ```no_compile fn is_sorted(input: &[i32], pred: Predicate) -> bool; ``` In this above example `input` would have no displayable name, `pred`s display name is `Predicate` and the display name of the return type is simply `bool`. Note that `Predicate` could simply be a type alias to `fn(i32, i32) -> Ordering`.
*/
export interface TypeSpecFor_PortableForm {
    /**
     * The compile-time known displayed representation of the type.
     */
    displayName: string[]
    /**
     * The actual type.
     */
    type: number
    [k: string]: unknown
}
/**
* Describes an event definition.
*/
export interface EventSpecFor_PortableForm {
    /**
     * The event arguments.
     */
    args: EventParamSpecFor_PortableForm[]
    /**
     * The event documentation.
     */
    docs: string[]
    /**
     * The label of the event.
     */
    label: string
    [k: string]: unknown
}
/**
* Describes a pair of parameter label and type.
*/
export interface EventParamSpecFor_PortableForm {
    /**
     * The documentation associated with the arguments.
     */
    docs: string[]
    /**
     * If the event parameter is indexed.
     */
    indexed: boolean
    /**
     * The label of the parameter.
     */
    label: string
    /**
     * The type of the parameter.
     */
    type: TypeSpecFor_PortableForm
    [k: string]: unknown
}
/**
* Describes a contract message.
*/
export interface MessageSpecFor_PortableForm {
    /**
     * The parameters of the message.
     */
    args: MessageParamSpecFor_PortableForm[]
    /**
     * The message documentation.
     */
    docs: string[]
    /**
     * The label of the message.
     *
     * In case of trait provided messages and constructors the prefix by convention in ink! is the label of the trait.
     */
    label: string
    /**
     * If the message is allowed to mutate the contract state.
     */
    mutates: boolean
    /**
     * If the message accepts any `value` from the caller.
     */
    payable: boolean
    /**
     * The return type of the message.
     */
    returnType?: TypeSpecFor_PortableForm | null
    /**
     * The selector hash of the message.
     */
    selector: Selector
    [k: string]: unknown
}
/**
* A SCALE encoded cell.
*/
export interface CellLayoutFor_PortableForm {
    /**
     * The offset key into the storage.
     */
    key: string
    /**
     * The type of the encoded entity.
     */
    ty: number
    [k: string]: unknown
}
/**
* A hashing layout potentially hitting all cells of the storage.
*
* Every hashing layout has an offset and a strategy to compute its keys.
*/
export interface HashLayoutFor_PortableForm {
    /**
     * The storage layout of the unbounded layout elements.
     */
    layout: LayoutFor_PortableForm
    /**
     * The key offset used by the strategy.
     */
    offset: LayoutKey
    /**
     * The hashing strategy to layout the underlying elements.
     */
    strategy: HashingStrategy
    [k: string]: unknown
}
/**
* A pointer into some storage region.
*/
export interface LayoutKey {
    key: [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
    ]
    [k: string]: unknown
}
/**
* The unbounded hashing strategy.
*
* The offset key is used as another postfix for the computation. So the actual formula is: `hasher(prefix + encoded(key) + offset + postfix)` Where `+` in this contexts means append of the byte slices.
*/
export interface HashingStrategy {
    /**
     * One of the supported crypto hashers.
     */
    hasher: CryptoHasher
    /**
     * An optional postfix to the computed hash.
     */
    postfix: number[]
    /**
     * An optional prefix to the computed hash.
     */
    prefix: number[]
    [k: string]: unknown
}
/**
* A layout for an array of associated cells with the same encoding.
*/
export interface ArrayLayoutFor_PortableForm {
    /**
     * The number of cells each element in the array layout consists of.
     */
    cellsPerElem: number
    /**
     * The layout of the elements stored in the array layout.
     */
    layout: LayoutFor_PortableForm
    /**
     * The number of elements in the array layout.
     */
    len: number
    /**
     * The offset key of the array layout.
     *
     * This is the same key as the element at index 0 of the array layout.
     */
    offset: LayoutKey
    [k: string]: unknown
}
/**
* A struct layout with consecutive fields of different layout.
*/
export interface StructLayoutFor_PortableForm {
    /**
     * The fields of the struct layout.
     */
    fields: FieldLayoutFor_PortableForm[]
    [k: string]: unknown
}
/**
* The layout for a particular field of a struct layout.
*/
export interface FieldLayoutFor_PortableForm {
    /**
     * The kind of the field.
     *
     * This is either a direct layout bound or another recursive layout sub-struct.
     */
    layout: LayoutFor_PortableForm
    /**
     * The name of the field.
     *
     * Can be missing, e.g. in case of an enum tuple struct variant.
     */
    name?: string | null
    [k: string]: unknown
}
/**
* An enum storage layout.
*/
export interface EnumLayoutFor_PortableForm {
    /**
     * The key where the discriminant is stored to dispatch the variants.
     */
    dispatchKey: LayoutKey
    /**
     * The variants of the enum.
     */
    variants: {
        [k: string]: StructLayoutFor_PortableForm
    }
    [k: string]: unknown
}
export interface PortableType {
    id: number
    type: TypeFor_PortableForm
    [k: string]: unknown
}
/**
* A [`Type`] definition with optional metadata.
*/
export interface TypeFor_PortableForm {
    /**
     * The actual type definition
     */
    def: TypeDefFor_PortableForm
    /**
     * Documentation
     */
    docs?: string[]
    /**
     * The generic type parameters of the type in use. Empty for non generic types
     */
    params?: TypeParameterFor_PortableForm[]
    /**
     * The unique path to the type. Can be empty for built-in types
     */
    path?: string[]
    [k: string]: unknown
}
/**
* A composite type, consisting of either named (struct) or unnamed (tuple struct) fields
*
* # Examples
*
* ## A Rust struct with named fields.
*
* ``` struct Person { name: String, age_in_years: u8, friends: Vec<Person>, } ```
*
* ## A tuple struct with unnamed fields.
*
* ``` struct Color(u8, u8, u8); ```
*
* ## A so-called unit struct
*
* ``` struct JustAMarker; ```
*/
export interface TypeDefCompositeFor_PortableForm {
    /**
     * The fields of the composite type.
     */
    fields?: FieldFor_PortableForm[]
    [k: string]: unknown
}
/**
* A field of a struct-like data type.
*
* Name is optional so it can represent both named and unnamed fields.
*
* This can be a named field of a struct type or an enum struct variant, or an unnamed field of a tuple struct.
*
* # Type name
*
* The `type_name` field contains a string which is the name of the type of the field as it appears in the source code. The exact contents and format of the type name are not specified, but in practice will be the name of any valid type for a field e.g.
*
* - Concrete types e.g `"u32"`, `"bool"`, `"Foo"` etc. - Type parameters e.g `"T"`, `"U"` - Generic types e.g `"Vec<u32>"`, `"Vec<T>"` - Associated types e.g. `"T::MyType"`, `"<T as MyTrait>::MyType"` - Type aliases e.g. `"MyTypeAlias"`, `"MyTypeAlias<T>"` - Other built in Rust types e.g. arrays, references etc.
*
* Note that the type name doesn't correspond to the underlying type of the field, unless using a concrete type directly. Any given type may be referred to by multiple field type names, when using generic type parameters and type aliases.
*
* This is intended for informational and diagnostic purposes only. Although it is possible to infer certain properties e.g. whether a type name is a type alias, there are no guarantees provided, and the type name representation may change.
*/
export interface FieldFor_PortableForm {
    /**
     * Documentation
     */
    docs?: string[]
    /**
     * The name of the field. None for unnamed fields.
     */
    name?: string | null
    /**
     * The type of the field.
     */
    type: number
    /**
     * The name of the type of the field as it appears in the source code.
     */
    typeName?: string | null
    [k: string]: unknown
}
/**
* A Enum type (consisting of variants).
*
* # Examples
*
* ## A Rust enum, aka tagged union.
*
* ``` enum MyEnum { RustAllowsForClikeVariants, AndAlsoForTupleStructs(i32, bool), OrStructs { with: i32, named: bool, fields: [u8; 32], }, ItIsntPossibleToSetADiscriminantThough, } ```
*
* ## A C-like enum type.
*
* ``` enum Days { Monday, Tuesday, Wednesday, Thursday = 42, // Allows setting the discriminant explicitly Friday, Saturday, Sunday, } ```
*
* ## An empty enum (for marker purposes)
*
* ``` enum JustAMarker {} ```
*/
export interface TypeDefVariantFor_PortableForm {
    /**
     * The variants of a variant type
     */
    variants?: VariantFor_PortableForm[]
    [k: string]: unknown
}
/**
* A struct enum variant with either named (struct) or unnamed (tuple struct) fields.
*
* # Example
*
* ``` enum Operation { Zero, //  ^^^^ this is a unit struct enum variant Add(i32, i32), //  ^^^^^^^^^^^^^ this is a tuple-struct enum variant Minus { source: i32 } //  ^^^^^^^^^^^^^^^^^^^^^ this is a struct enum variant } ```
*/
export interface VariantFor_PortableForm {
    /**
     * Documentation
     */
    docs?: string[]
    /**
     * The fields of the variant.
     */
    fields?: FieldFor_PortableForm[]
    /**
     * Index of the variant, used in `parity-scale-codec`.
     *
     * The value of this will be, in order of precedence: 1. The explicit index defined by a `#[codec(index = N)]` attribute. 2. The implicit index from the position of the variant in the `enum` definition.
     */
    index: number
    /**
     * The name of the variant.
     */
    name: string
    [k: string]: unknown
}
/**
* A type to refer to a sequence of elements of the same type.
*/
export interface TypeDefSequenceFor_PortableForm {
    /**
     * The element type of the sequence type.
     */
    type: number
    [k: string]: unknown
}
/**
* An array type.
*/
export interface TypeDefArrayFor_PortableForm {
    /**
     * The length of the array type.
     */
    len: number
    /**
     * The element type of the array type.
     */
    type: number
    [k: string]: unknown
}
/**
* A type wrapped in [`Compact`].
*/
export interface TypeDefCompactFor_PortableForm {
    /**
     * The type wrapped in [`Compact`], i.e. the `T` in `Compact<T>`.
     */
    type: number
    [k: string]: unknown
}
/**
* Type describing a [`bitvec::vec::BitVec`].
*
* # Note
*
* This can only be constructed for `TypeInfo` in the `MetaForm` with the `bit-vec` feature enabled, but can be decoded or deserialized into the `PortableForm` without this feature.
*/
export interface TypeDefBitSequenceFor_PortableForm {
    /**
     * The type implementing [`bitvec::order::BitOrder`].
     */
    bit_order_type: number
    /**
     * The type implementing [`bitvec::store::BitStore`].
     */
    bit_store_type: number
    [k: string]: unknown
}
/**
* A generic type parameter.
*/
export interface TypeParameterFor_PortableForm {
    /**
     * The name of the generic type parameter e.g. "T".
     */
    name: string
    /**
     * The concrete type for the type parameter.
     *
     * `None` if the type parameter is skipped.
     */
    type?: number | null
    [k: string]: unknown
}
