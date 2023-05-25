import {StorageLayout, StorageItem} from './layout.support'
import {LAYOUT_JSON} from './test.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

export const storage = {
    values: new StorageItem<[item_index: number], number>(
        layout, 'values'
    ),
    'values.item': new StorageItem<[item_index: number], number>(
        layout, 'values.item'
    ),
}

let key = storage['values.item'].encodeKey(0)
console.log(key)