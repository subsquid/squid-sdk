import {StorageLayout, StorageItem, MappingStorageItem, DynamicArrayStorageItem, BytesStorageItem, BytesPartStorageItem} from '@subsquid/evm-support'
import {LAYOUT_JSON} from './usdc.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

class StringItem extends BytesStorageItem<string> {}

class AddressItem extends StorageItem<string> {}

class BoolItem extends StorageItem<boolean> {}

class Bytes32Item extends StorageItem<Uint8Array> {}

class Uint256Item extends StorageItem<bigint> {}

class Uint8Item extends StorageItem<bigint> {}

class AddressBoolMappingItem extends MappingStorageItem {
    get(key: string): BoolItem {
        return this.item(BoolItem, key)
    }
}

class AddressAddressUint256MappingMappingItem extends MappingStorageItem {
    get(key: string): AddressUint256MappingItem {
        return this.item(AddressUint256MappingItem, key)
    }
}

class AddressBytes32BoolMappingMappingItem extends MappingStorageItem {
    get(key: string): Bytes32BoolMappingItem {
        return this.item(Bytes32BoolMappingItem, key)
    }
}

class AddressUint256MappingItem extends MappingStorageItem {
    get(key: string): Uint256Item {
        return this.item(Uint256Item, key)
    }
}

class Bytes32BoolMappingItem extends MappingStorageItem {
    get(key: Uint8Array): BoolItem {
        return this.item(BoolItem, key)
    }
}

export const storage = {
    _owner: new AddressItem(
        layout, 't_address', 0n, 0
    ),
    pauser: new AddressItem(
        layout, 't_address', 1n, 0
    ),
    paused: new BoolItem(
        layout, 't_bool', 1n, 20
    ),
    blacklister: new AddressItem(
        layout, 't_address', 2n, 0
    ),
    blacklisted: new AddressBoolMappingItem(
        layout, 't_mapping(t_address,t_bool)', 3n, 0
    ),
    name: new StringItem(
        layout, 't_string_storage', 4n, 0
    ),
    symbol: new StringItem(
        layout, 't_string_storage', 5n, 0
    ),
    decimals: new Uint8Item(
        layout, 't_uint8', 6n, 0
    ),
    currency: new StringItem(
        layout, 't_string_storage', 7n, 0
    ),
    masterMinter: new AddressItem(
        layout, 't_address', 8n, 0
    ),
    initialized: new BoolItem(
        layout, 't_bool', 8n, 20
    ),
    balances: new AddressUint256MappingItem(
        layout, 't_mapping(t_address,t_uint256)', 9n, 0
    ),
    allowed: new AddressAddressUint256MappingMappingItem(
        layout, 't_mapping(t_address,t_mapping(t_address,t_uint256))', 10n, 0
    ),
    totalSupply_: new Uint256Item(
        layout, 't_uint256', 11n, 0
    ),
    minters: new AddressBoolMappingItem(
        layout, 't_mapping(t_address,t_bool)', 12n, 0
    ),
    minterAllowed: new AddressUint256MappingItem(
        layout, 't_mapping(t_address,t_uint256)', 13n, 0
    ),
    _rescuer: new AddressItem(
        layout, 't_address', 14n, 0
    ),
    DOMAIN_SEPARATOR: new Bytes32Item(
        layout, 't_bytes32', 15n, 0
    ),
    _authorizationStates: new AddressBytes32BoolMappingMappingItem(
        layout, 't_mapping(t_address,t_mapping(t_bytes32,t_bool))', 16n, 0
    ),
    _permitNonces: new AddressUint256MappingItem(
        layout, 't_mapping(t_address,t_uint256)', 17n, 0
    ),
    _initializedVersion: new Uint8Item(
        layout, 't_uint8', 18n, 0
    ),
}
