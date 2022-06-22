/**
 * Database is responsible for providing storage to data handlers
 * and persisting mapping progress and status.
 *
 * This interface should be considered by framework users to be completely opaque,
 * as its details were not yet stabilized and are expected to change.
 */
export interface Database<S> {
    connect(): Promise<number>
    transact(from: number, to: number, cb: (store: S) => Promise<void>): Promise<void>
    advance(height: number): Promise<void>
}
