export interface HashAndHeight {
    height: number
    hash: string
}


export interface DataSinkState extends HashAndHeight {
    top: HashAndHeight[]
}


export interface Transaction<S> {
    getState(): Promise<DataSinkState>

    updateState(state: HashAndHeight): Promise<void>
    performUpdates(cb: (store: S) => Promise<void>): Promise<void>

    insertHotBlock(block: HashAndHeight): Promise<void>
    rollbackHotBlock(block: HashAndHeight): Promise<void>
    finalizeHotBlocks(height: number): Promise<void>
}


/**
 * DataSink is responsible for providing a persistent storage for data handlers
 * and keeping the processor progress and status.
 */
export interface DataSink<S> {
    supportsHotBlocks?: boolean
    connect(): Promise<DataSinkState>
    transaction<R>(cb: (tx: Transaction<S>) => Promise<void>): Promise<R>
}
