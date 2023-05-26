import {StorageLayout, StorageItem} from './layout.support'
import {LAYOUT_JSON} from './test.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

export const storage = {
    x: new StorageItem<[], number>(
        layout, 'x'
    ),
    y: new StorageItem<[], number>(
        layout, 'y'
    ),
    's.a': new StorageItem<[], number>(
        layout, 's.a'
    ),
    's.b': new StorageItem<[], number>(
        layout, 's.b'
    ),
    's.staticArray.item': new StorageItem<[item_index: number], number>(
        layout, 's.staticArray.item'
    ),
    's.dynArray': new StorageItem<[item_index: number], number>(
        layout, 's.dynArray'
    ),
    's.dynArray.item': new StorageItem<[item_index: number], number>(
        layout, 's.dynArray.item'
    ),
    addr: new StorageItem<[], number>(
        layout, 'addr'
    ),
    'map.item.item': new StorageItem<[item_key: string, item_key: string], number>(
        layout, 'map.item.item'
    ),
    array: new StorageItem<[item_index: number], number>(
        layout, 'array'
    ),
    b2: new StorageItem<[], number>(
        layout, 'b2'
    ),
    b3: new StorageItem<[], number>(
        layout, 'b3'
    ),
    'ses.item.a': new StorageItem<[item_index: number], number>(
        layout, 'ses.item.a'
    ),
    'ses.item.b': new StorageItem<[item_index: number], number>(
        layout, 'ses.item.b'
    ),
    'ses.item.staticArray.item': new StorageItem<[item_index: number, item_index: number], number>(
        layout, 'ses.item.staticArray.item'
    ),
    'ses.item.dynArray': new StorageItem<[item_index: number, item_index: number], number>(
        layout, 'ses.item.dynArray'
    ),
    'ses.item.dynArray.item': new StorageItem<[item_index: number, item_index: number], number>(
        layout, 'ses.item.dynArray.item'
    ),
}
