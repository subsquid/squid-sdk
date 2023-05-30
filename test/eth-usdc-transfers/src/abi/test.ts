import {StorageLayout, StorageItem, MappingStorageItem, DynamicArrayStorageItem, BytesStorageItem, BytesPartStorageItem} from '@subsquid/evm-support'
import {LAYOUT_JSON} from './test.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

class AddressItem extends StorageItem<string> {}

class BoolItem extends StorageItem<boolean> {}

class BytesItem extends BytesStorageItem<Uint8Array> {
    at(index: number): BytesPartStorageItem<Uint8Array> {
        return this.part(BytesPartStorageItem, index)
    }
}

class Bytes2Item extends StorageItem<Uint8Array> {}

class Bytes30Item extends StorageItem<Uint8Array> {}

class AContractItem extends StorageItem<string> {}

class EnumEnumItem extends StorageItem<number> {}

class AddressBoolMappingItem extends MappingStorageItem {
    get(key: string): BoolItem {
        return this.item(BoolItem, key)
    }
}

class AContractBoolMappingItem extends MappingStorageItem {
    get(key: string): BoolItem {
        return this.item(BoolItem, key)
    }
}

class EnumEnumAddressBoolMappingMappingItem extends MappingStorageItem {
    get(key: number): AddressBoolMappingItem {
        return this.item(AddressBoolMappingItem, key)
    }
}

class StringItem extends BytesStorageItem<string> {
    at(index: number): BytesPartStorageItem<string> {
        return this.part(BytesPartStorageItem, index)
    }
}

class StringArrayItem extends DynamicArrayStorageItem {
    at(index: number): StringItem {
        return this.item(StringItem, index)
    }
}

class SStructItem extends StorageItem<unknown> {
    readonly a = new Uint64Item(this.layout, 'undefined', this.slot + 0n, 0)

    readonly b = new Uint128Item(this.layout, 'undefined', this.slot + 0n, 8)

    readonly staticArray = new Uint256Array2Item(this.layout, 'undefined', this.slot + 1n, 0)

    readonly dynArray = new Uint256ArrayItem(this.layout, 'undefined', this.slot + 3n, 0)
}

class SStructArray2Item extends StorageItem<unknown> {
    readonly length = 2

    ;[0] = new SStructItem(this.layout, 't_struct(S)13_storage', this.slot + 0n, NaN)

    ;[1] = new SStructItem(this.layout, 't_struct(S)13_storage', this.slot + 8n, NaN)
}

class Uint128Item extends StorageItem<bigint> {}

class Uint256Item extends StorageItem<bigint> {}

class Uint256ArrayItem extends DynamicArrayStorageItem {
    at(index: number): Uint256Item {
        return this.item(Uint256Item, index)
    }
}

class Uint256Array2Item extends StorageItem<unknown> {
    readonly length = 2

    ;[0] = new Uint256Item(this.layout, 't_uint256', this.slot + 0n, NaN)

    ;[1] = new Uint256Item(this.layout, 't_uint256', this.slot + 2n, NaN)
}

class Uint64Item extends StorageItem<bigint> {}

export const storage = {
    x: new Uint256Item(
        layout, 't_uint256', 0n, 0
    ),
    y: new Uint256Item(
        layout, 't_uint256', 1n, 0
    ),
    s: new SStructItem(
        layout, 't_struct(S)13_storage', 2n, 0
    ),
    addr: new AddressItem(
        layout, 't_address', 6n, 0
    ),
    map: new EnumEnumAddressBoolMappingMappingItem(
        layout, 't_mapping(t_enum(Enum)21,t_mapping(t_address,t_bool))', 7n, 0
    ),
    array: new StringArrayItem(
        layout, 't_array(t_string_storage)dyn_storage', 8n, 0
    ),
    s1: new StringItem(
        layout, 't_string_storage', 9n, 0
    ),
    b1: new BytesItem(
        layout, 't_bytes_storage', 10n, 0
    ),
    b2: new Bytes30Item(
        layout, 't_bytes30', 11n, 0
    ),
    b3: new Bytes2Item(
        layout, 't_bytes2', 11n, 30
    ),
    ses: new SStructArray2Item(
        layout, 't_array(t_struct(S)13_storage)2_storage', 12n, 0
    ),
    mapa: new AContractBoolMappingItem(
        layout, 't_mapping(t_contract(A)59,t_bool)', 20n, 0
    ),
}
