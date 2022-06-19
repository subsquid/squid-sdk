/**
 * A max binary heap
 */
export class Heap<T> {
    constructor(compare: (a: T, b: T) => number)

    push(x: T): void

    pop(): T | undefined

    peek(): T | undefined

    resort(): void

    /**
     * Use `array` as a backing store
     */
    init(array: T[]): void
}
