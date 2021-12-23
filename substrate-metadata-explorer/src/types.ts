export type SpecVersion = number


export interface ChainVersion {
    specVersion: SpecVersion
    /**
     * The height of the block where the given spec version was first introduced.
     */
    blockNumber: number
    /**
     * The hash of the block where the given spec version was first introduced.
     */
    blockHash: string
    /**
     * Chain metadata for this version of spec
     */
    metadata: string
}


export interface Log {
    (msg: string): void
}
