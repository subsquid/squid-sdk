export type Result<T, E> = {
    __kind: 'Ok'
    value: T
} | {
    __kind: 'Err'
    value: E
}
