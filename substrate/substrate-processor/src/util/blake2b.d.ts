
declare module 'blake2b' {
    export default createHash

    declare function createHash(
        outputSizeInBytes: number,
    ): Blake2b

    declare class Blake2b {
        update(data: Uint8Array): this
        digest(out?: Uint8Array): Uint8Array
    }
}
