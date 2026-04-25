/**
 * Database is responsible for providing a persistent storage for data handlers
 * and keeping the processor progress and status.
 */
export type Database<S> = FinalDatabase<S> | HotDatabase<S>

export interface FinalTxInfo {
    prevHead: HashAndHeight
    nextHead: HashAndHeight
    isOnTop: boolean
}

export interface FinalDatabase<S> {
    supportsHotBlocks?: false
    connect(): Promise<FinalDatabaseState>
    transact(info: FinalTxInfo, cb: (store: S) => Promise<DatabaseTransactResult | void>): Promise<void>
}

export interface DatabaseTransactResult {
    templates?: TemplateMutation[]
}

export interface FinalDatabaseState {
    height: number
    hash: string
    templates?: TemplateMutation[]
}

export interface HotTxInfo {
    finalizedHead: HashAndHeight
    baseHead: HashAndHeight
    newBlocks: HashAndHeight[]
}

export interface HotDatabase<S> {
    supportsHotBlocks: true
    connect(): Promise<HotDatabaseState>
    transact(info: FinalTxInfo, cb: (store: S) => Promise<DatabaseTransactResult | void>): Promise<void>

    transactHot2(
        info: HotTxInfo,
        cb: (store: S, blockSliceStart: number, blockSliceEnd: number) => Promise<DatabaseTransactResult | void>,
    ): Promise<void>
}

export interface HotBlock extends HashAndHeight {
    templates?: TemplateMutation[]
}

export interface HotDatabaseState extends HashAndHeight {
    top: HotBlock[]
    templates?: TemplateMutation[]
}

export interface FinalDatabaseState extends HashAndHeight {
    templates?: TemplateMutation[]
}

export interface TemplateMutation {
    type: 'add' | 'delete'
    key: string
    value: string
    blockNumber: number
}

export interface HashAndHeight {
    hash: string
    height: number
}
