export interface ChainInfo {
    genesisHash: string
    knownHeight: number
    specVersions: SpecVersionWithMetadata[]
}


export interface SpecVersionWithMetadata extends SpecVersion {
    /**
     * Chain metadata for this version of spec
     */
    metadata: string
}


export interface SpecVersion {
    specName: string
    specVersion: number
    /**
     * The height of the block where the given spec version was first introduced.
     */
    blockNumber: number
    /**
     * The hash of the block where the given spec version was first introduced.
     */
    blockHash: string
}


export interface Log {
    (msg: string): void
}
