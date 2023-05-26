import {
    StorageLayout,
    StorageItem,
    StructStorageItem,
    MappingStorageItem,
    ArrayStorageItem,
    DynamicArrayStorageItem,
} from './layout.support'
import {LAYOUT_JSON} from './layout.layout'

export const layout = LAYOUT_JSON

export const storage = {
    _owner: new StorageItem<string>(
        layout,
        layout.types['t_address'],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        0
    ),
    pauser: new StorageItem<string>(
        layout,
        layout.types['t_address'],
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        0
    ),
    paused: new StorageItem<boolean>(
        layout,
        layout.types['t_bool'],
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        20
    ),
    blacklister: new StorageItem<string>(
        layout,
        layout.types['t_address'],
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        0
    ),
    blacklisted: new MappingStorageItem<string, StorageItem<boolean>>(
        layout,
        layout.types['t_mapping(t_address,t_bool)'],
        '0x0000000000000000000000000000000000000000000000000000000000000003',
        0
    ),
    name: new StorageItem<string>(
        layout,
        layout.types['t_string_storage'],
        '0x0000000000000000000000000000000000000000000000000000000000000004',
        0
    ),
    symbol: new StorageItem<string>(
        layout,
        layout.types['t_string_storage'],
        '0x0000000000000000000000000000000000000000000000000000000000000005',
        0
    ),
    decimals: new StorageItem<number>(
        layout,
        layout.types['t_uint8'],
        '0x0000000000000000000000000000000000000000000000000000000000000006',
        0
    ),
    currency: new StorageItem<string>(
        layout,
        layout.types['t_string_storage'],
        '0x0000000000000000000000000000000000000000000000000000000000000007',
        0
    ),
    masterMinter: new StorageItem<string>(
        layout,
        layout.types['t_address'],
        '0x0000000000000000000000000000000000000000000000000000000000000008',
        0
    ),
    initialized: new StorageItem<boolean>(
        layout,
        layout.types['t_bool'],
        '0x0000000000000000000000000000000000000000000000000000000000000008',
        20
    ),
    balances: new MappingStorageItem<string, StorageItem<bigint>>(
        layout,
        layout.types['t_mapping(t_address,t_uint256)'],
        '0x0000000000000000000000000000000000000000000000000000000000000009',
        0
    ),
    allowed: new MappingStorageItem<string, MappingStorageItem<string, StorageItem<bigint>>>(
        layout,
        layout.types['t_mapping(t_address,t_mapping(t_address,t_uint256))'],
        '0x000000000000000000000000000000000000000000000000000000000000000a',
        0
    ),
    totalSupply_: new StorageItem<bigint>(
        layout,
        layout.types['t_uint256'],
        '0x000000000000000000000000000000000000000000000000000000000000000b',
        0
    ),
    minters: new MappingStorageItem<string, StorageItem<boolean>>(
        layout,
        layout.types['t_mapping(t_address,t_bool)'],
        '0x000000000000000000000000000000000000000000000000000000000000000c',
        0
    ),
    minterAllowed: new MappingStorageItem<string, StorageItem<bigint>>(
        layout,
        layout.types['t_mapping(t_address,t_uint256)'],
        '0x000000000000000000000000000000000000000000000000000000000000000d',
        0
    ),
    _rescuer: new StorageItem<string>(
        layout,
        layout.types['t_address'],
        '0x000000000000000000000000000000000000000000000000000000000000000e',
        0
    ),
    DOMAIN_SEPARATOR: new StorageItem<string>(
        layout,
        layout.types['t_bytes32'],
        '0x000000000000000000000000000000000000000000000000000000000000000f',
        0
    ),
    _authorizationStates: new MappingStorageItem<string, MappingStorageItem<string, StorageItem<boolean>>>(
        layout,
        layout.types['t_mapping(t_address,t_mapping(t_bytes32,t_bool))'],
        '0x0000000000000000000000000000000000000000000000000000000000000010',
        0
    ),
    _permitNonces: new MappingStorageItem<string, StorageItem<bigint>>(
        layout,
        layout.types['t_mapping(t_address,t_uint256)'],
        '0x0000000000000000000000000000000000000000000000000000000000000011',
        0
    ),
    _initializedVersion: new StorageItem<number>(
        layout,
        layout.types['t_uint8'],
        '0x0000000000000000000000000000000000000000000000000000000000000012',
        0
    ),
}
