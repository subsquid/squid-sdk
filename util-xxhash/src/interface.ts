
export interface XXHash {
    update(data: string | Uint8Array): this
    digest(): bigint
}
