export enum ItemKind {
    Event = 'events',
    Call = 'calls',
    Constant = 'constants',
    Storage = 'storage',
}

const ItemFixes: Record<ItemKind, string> = {
    [ItemKind.Event]: 'Event',
    [ItemKind.Call]: 'Call',
    [ItemKind.Constant]: 'Constant',
    [ItemKind.Storage]: 'Storage',
}

export function getItemName(kind: ItemKind) {
    return ItemFixes[kind]
}
