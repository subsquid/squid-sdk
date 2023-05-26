import {StorageLayout, StorageItem} from './layout.support'
import {LAYOUT_JSON} from './layout.layout'

export const layout = new StorageLayout(LAYOUT_JSON);

export const storage = {
    _owner: new StorageItem<[], number>(
        layout, '_owner'
    ),
    pauser: new StorageItem<[], number>(
        layout, 'pauser'
    ),
    paused: new StorageItem<[], number>(
        layout, 'paused'
    ),
    blacklister: new StorageItem<[], number>(
        layout, 'blacklister'
    ),
    'blacklisted.item': new StorageItem<[item_key: string], number>(
        layout, 'blacklisted.item'
    ),
    decimals: new StorageItem<[], number>(
        layout, 'decimals'
    ),
    masterMinter: new StorageItem<[], number>(
        layout, 'masterMinter'
    ),
    initialized: new StorageItem<[], number>(
        layout, 'initialized'
    ),
    'balances.item': new StorageItem<[item_key: string], number>(
        layout, 'balances.item'
    ),
    'allowed.item.item': new StorageItem<[item_key: string, item_key: string], number>(
        layout, 'allowed.item.item'
    ),
    totalSupply_: new StorageItem<[], number>(
        layout, 'totalSupply_'
    ),
    'minters.item': new StorageItem<[item_key: string], number>(
        layout, 'minters.item'
    ),
    'minterAllowed.item': new StorageItem<[item_key: string], number>(
        layout, 'minterAllowed.item'
    ),
    _rescuer: new StorageItem<[], number>(
        layout, '_rescuer'
    ),
    DOMAIN_SEPARATOR: new StorageItem<[], number>(
        layout, 'DOMAIN_SEPARATOR'
    ),
    '_authorizationStates.item.item': new StorageItem<[item_key: string, item_key: string], number>(
        layout, '_authorizationStates.item.item'
    ),
    '_permitNonces.item': new StorageItem<[item_key: string], number>(
        layout, '_permitNonces.item'
    ),
    _initializedVersion: new StorageItem<[], number>(
        layout, '_initializedVersion'
    ),
}
