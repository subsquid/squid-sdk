
export interface Database<S> {
    connect(): Promise<number>
    transact(height: number, cb: (store: S) => Promise<void>): Promise<void>
    advance(height: number): Promise<void>
}
