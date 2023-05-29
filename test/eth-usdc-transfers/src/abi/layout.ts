import {StorageLayout, ValueStorageItem, StructStorageItem, MappingStorageItem, ArrayStorageItem, DynamicArrayStorageItem, BytesStorageItem} from '@subsquid/evm-support'
import {LAYOUT_JSON} from './layout.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

export const storage = {
    _owner: new ValueStorageItem<string>(
        layout, 't_address', 0n, 0
    ),
    pauser: new ValueStorageItem<string>(
        layout, 't_address', 1n, 0
    ),
    paused: new ValueStorageItem<boolean>(
        layout, 't_bool', 1n, 20
    ),
    blacklister: new ValueStorageItem<string>(
        layout, 't_address', 2n, 0
    ),
    blacklisted: new MappingStorageItem<string, ValueStorageItem<boolean>>(
        layout, 't_mapping(t_address,t_bool)', 3n, 0
    ),
    name: new BytesStorageItem<string>(
        layout, 't_string_storage', 4n, 0
    ),
    symbol: new BytesStorageItem<string>(
        layout, 't_string_storage', 5n, 0
    ),
    decimals: new ValueStorageItem<bigint>(
        layout, 't_uint8', 6n, 0
    ),
    currency: new BytesStorageItem<string>(
        layout, 't_string_storage', 7n, 0
    ),
    masterMinter: new ValueStorageItem<string>(
        layout, 't_address', 8n, 0
    ),
    initialized: new ValueStorageItem<boolean>(
        layout, 't_bool', 8n, 20
    ),
    balances: new MappingStorageItem<string, ValueStorageItem<bigint>>(
        layout, 't_mapping(t_address,t_uint256)', 9n, 0
    ),
    allowed: new MappingStorageItem<string, MappingStorageItem<string, ValueStorageItem<bigint>>>(
        layout, 't_mapping(t_address,t_mapping(t_address,t_uint256))', 10n, 0
    ),
    totalSupply_: new ValueStorageItem<bigint>(
        layout, 't_uint256', 11n, 0
    ),
    minters: new MappingStorageItem<string, ValueStorageItem<boolean>>(
        layout, 't_mapping(t_address,t_bool)', 12n, 0
    ),
    minterAllowed: new MappingStorageItem<string, ValueStorageItem<bigint>>(
        layout, 't_mapping(t_address,t_uint256)', 13n, 0
    ),
    _rescuer: new ValueStorageItem<string>(
        layout, 't_address', 14n, 0
    ),
    DOMAIN_SEPARATOR: new ValueStorageItem<Uint8Array>(
        layout, 't_bytes32', 15n, 0
    ),
    _authorizationStates: new MappingStorageItem<string, MappingStorageItem<Uint8Array, ValueStorageItem<boolean>>>(
        layout, 't_mapping(t_address,t_mapping(t_bytes32,t_bool))', 16n, 0
    ),
    _permitNonces: new MappingStorageItem<string, ValueStorageItem<bigint>>(
        layout, 't_mapping(t_address,t_uint256)', 17n, 0
    ),
    _initializedVersion: new ValueStorageItem<bigint>(
        layout, 't_uint8', 18n, 0
    ),
}
