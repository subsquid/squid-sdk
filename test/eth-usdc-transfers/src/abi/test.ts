import {StorageLayout, StorageItem, StructStorageItem, MappingStorageItem, ArrayStorageItem, DynamicArrayStorageItem, BytesStorageItem} from '@subsquid/evm-support'
import {LAYOUT_JSON} from './test.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

export const storage = {
    values: new DynamicArrayStorageItem<StorageItem<number>>(
        layout, 't_array(t_uint8)dyn_storage', 0n, 0
    ),
}
