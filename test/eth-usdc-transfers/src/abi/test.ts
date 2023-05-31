import {StorageLayout, StorageItem, MappingStorageItem, DynamicArrayStorageItem, BytesStorageItem, BytesPartStorageItem} from '@subsquid/evm-support'
import {LAYOUT_JSON} from './test.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

class BytesItem extends BytesStorageItem<Uint8Array> {}

class StringItem extends BytesStorageItem<string> {}

class StringArrayItem extends DynamicArrayStorageItem {
    at(index: number): StringItem {
        return this.item(StringItem, index)
    }
}

class Uint256ArrayItem extends DynamicArrayStorageItem {
    at(index: number): Uint256Item {
        return this.item(Uint256Item, index)
    }
}

class AddressItem extends StorageItem<string> {}

class Uint256Array2Item extends StorageItem<unknown> {
    readonly length = 2

    ;[0] = new Uint256Item(this.layout, 't_uint256', this.slot + 0n, NaN)

    ;[1] = new Uint256Item(this.layout, 't_uint256', this.slot + 2n, NaN)
}

class BoolItem extends StorageItem<boolean> {}

class Bytes30Item extends StorageItem<Uint8Array> {}

class TestContractItem extends StorageItem<string> {}

class LettersEnumItem extends StorageItem<number> {}

class DataStructItem extends StorageItem<unknown> {
    readonly a = new Uint64Item(this.layout, 'undefined', this.slot + 0n, 0)

    readonly b = new Uint128Item(this.layout, 'undefined', this.slot + 0n, 8)

    readonly staticArray = new Uint256Array2Item(this.layout, 'undefined', this.slot + 1n, 0)

    readonly dynArray = new Uint256ArrayItem(this.layout, 'undefined', this.slot + 3n, 0)
}

class Uint128Item extends StorageItem<bigint> {}

class Uint256Item extends StorageItem<bigint> {}

class Uint64Item extends StorageItem<bigint> {}

class AddressBoolMappingItem extends MappingStorageItem {
    get(key: string): BoolItem {
        return this.item(BoolItem, key)
    }
}

class LettersEnumAddressBoolMappingMappingItem extends MappingStorageItem {
    get(key: number): AddressBoolMappingItem {
        return this.item(AddressBoolMappingItem, key)
    }
}

export const storage = {
    x: new Uint256Item(
        layout, 't_uint256', 0n, 0
    ),
    y: new Uint256Item(
        layout, 't_uint256', 1n, 0
    ),
    x64: new Uint64Item(
        layout, 't_uint64', 2n, 0
    ),
    y128: new Uint128Item(
        layout, 't_uint128', 2n, 8
    ),
    struct_: new DataStructItem(
        layout, 't_struct(Data)13_storage', 3n, 0
    ),
    address_: new AddressItem(
        layout, 't_address', 7n, 0
    ),
    mapping_: new LettersEnumAddressBoolMappingMappingItem(
        layout, 't_mapping(t_enum(Letters)21,t_mapping(t_address,t_bool))', 8n, 0
    ),
    array: new StringArrayItem(
        layout, 't_array(t_string_storage)dyn_storage', 9n, 0
    ),
    s1: new StringItem(
        layout, 't_string_storage', 10n, 0
    ),
    bytes_: new BytesItem(
        layout, 't_bytes_storage', 11n, 0
    ),
    bytes32_: new Bytes30Item(
        layout, 't_bytes30', 12n, 0
    ),
    enum_: new LettersEnumItem(
        layout, 't_enum(Letters)21', 12n, 30
    ),
    contract_: new TestContractItem(
        layout, 't_contract(Test)57', 13n, 0
    ),
}
