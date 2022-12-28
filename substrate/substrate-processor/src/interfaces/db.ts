/**
 * Database is responsible for providing a persistent storage for data handlers
 * and keeping the processor progress and status.
 *
 * This interface should be considered by framework users to be completely opaque,
 * as its details were not yet stabilized and are expected to change.
 */
export interface Database<S> {
    connect(): Promise<number>
    transact(from: number, to: number, cb: (store: S) => Promise<void>): Promise<void>
    advance(height: number, isHead: boolean): Promise<void>
}
