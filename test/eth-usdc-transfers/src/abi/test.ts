import {
    StorageLayout,
    StorageItem,
    StructStorageItem,
    MappingStorageItem,
    ArrayStorageItem,
    DynamicArrayStorageItem,
} from './layout.support'
import {LAYOUT_JSON} from './test.layout'

export const layout = LAYOUT_JSON

export const storage = {
    x: new StorageItem<bigint>(
        layout,
        layout.types['t_uint256'],
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        0
    ),
    y: new StorageItem<bigint>(
        layout,
        layout.types['t_uint256'],
        '0x0000000000000000000000000000000000000000000000000000000000000001',
        0
    ),
    s: new StructStorageItem<{
        a: StorageItem<bigint>
        b: StorageItem<bigint>
        staticArray: ArrayStorageItem<StorageItem<bigint>>
        dynArray: DynamicArrayStorageItem<StorageItem<bigint>>
    }>(
        layout,
        layout.types['t_struct(S)13_storage'],
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        0
    ),
    addr: new StorageItem<string>(
        layout,
        layout.types['t_address'],
        '0x0000000000000000000000000000000000000000000000000000000000000006',
        0
    ),
    map: new MappingStorageItem<number, MappingStorageItem<string, StorageItem<boolean>>>(
        layout,
        layout.types['t_mapping(t_enum(Enum)21,t_mapping(t_address,t_bool))'],
        '0x0000000000000000000000000000000000000000000000000000000000000007',
        0
    ),
    array: new DynamicArrayStorageItem<StorageItem<string>>(
        layout,
        layout.types['t_array(t_string_storage)dyn_storage'],
        '0x0000000000000000000000000000000000000000000000000000000000000008',
        0
    ),
    s1: new StorageItem<string>(
        layout,
        layout.types['t_string_storage'],
        '0x0000000000000000000000000000000000000000000000000000000000000009',
        0
    ),
    b1: new StorageItem<string>(
        layout,
        layout.types['t_bytes_storage'],
        '0x000000000000000000000000000000000000000000000000000000000000000a',
        0
    ),
    b2: new StorageItem<string>(
        layout,
        layout.types['t_bytes30'],
        '0x000000000000000000000000000000000000000000000000000000000000000b',
        0
    ),
    b3: new StorageItem<string>(
        layout,
        layout.types['t_bytes2'],
        '0x000000000000000000000000000000000000000000000000000000000000000b',
        30
    ),
    ses: new ArrayStorageItem<
        StructStorageItem<{
            a: StorageItem<bigint>
            b: StorageItem<bigint>
            staticArray: ArrayStorageItem<StorageItem<bigint>>
            dynArray: DynamicArrayStorageItem<StorageItem<bigint>>
        }>
    >(
        layout,
        layout.types['t_array(t_struct(S)13_storage)2_storage'],
        '0x000000000000000000000000000000000000000000000000000000000000000c',
        0
    ),
}

