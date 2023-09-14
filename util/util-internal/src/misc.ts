import assert from 'assert'
import * as process from 'process'


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


export function unexpectedCase(val?: unknown): Error {
    return new Error(val ? `Unexpected case: ${val}` : `Unexpected case`)
}


export function last<T>(array: T[]): T {
    assert(array.length > 0)
    return array[array.length - 1]
}


export function maybeLast<T>(array: T[]): T | undefined {
    return array.length > 0 ? array[array.length - 1] : undefined
}


export function runProgram(main: () => Promise<void>, log?: (err: Error) => void): void {

    function onerror(err: unknown) {
        if (log) {
            log(ensureError(err))
        } else {
            console.error(err)
        }
        process.exit(1)
    }

    try {
        main().then(() => process.exit(0), onerror)
    } catch(e: unknown) {
        onerror(e)
    }
}


export class NonErrorThrow extends Error {
    constructor(public readonly value: unknown) {
        super('Non-error object was thrown')
    }
}


export function ensureError(val: unknown): Error {
    if (val instanceof Error) {
        return val
    } else {
        return new NonErrorThrow(val)
    }
}


export function addErrorContext<T extends Error>(err: T, ctx: any): T {
    let e = err as any
    for (let key in ctx) {
        if (e[key] == null) {
            e[key] = ctx[key]
        }
    }
    return err
}


export function withErrorContext(ctx: any): (err: Error) => never {
    return function(err: Error): never {
        throw addErrorContext(err, ctx)
    }
}


export function annotateSyncError(getCtx: (...args: any[]) => any): (proto: any, prop: string, d: PropertyDescriptor) => PropertyDescriptor {
    return function decorate(proto: any, prop: string, d: PropertyDescriptor): PropertyDescriptor {
        let {value: fn, ...options} = d

        function annotate(err: any, args: any[]) {
            return addErrorContext(
                ensureError(err),
                getCtx(...args)
            )
        }

        let value = function(this: any, ...args: any[]) {
            try {
                return fn.apply(this, args)
            } catch(err: any) {
                throw annotate(err, args)
            }
        } as any

        return {value, ...options}
    }
}


export function annotateAsyncError(getCtx: (...args: any[]) => any): (proto: any, prop: string, d: PropertyDescriptor) => PropertyDescriptor {
    return function decorate(proto: any, prop: string, d: PropertyDescriptor): PropertyDescriptor {
        let {value: fn, ...options} = d

        function annotate(err: any, args: any[]) {
            return addErrorContext(
                ensureError(err),
                getCtx(...args)
            )
        }

        let value = function(this: any, ...args: any[]) {
            try {
                return fn.apply(this, args).catch((err: any) => {
                    throw annotate(err, args)
                })
            } catch(err: any) {
                throw annotate(err, args)
            }
        } as any

        return {value, ...options}
    }
}


export function wait(ms: number, abortSignal?: AbortSignal): Promise<void> {
    if (abortSignal) {
        return new Promise((resolve, reject) => {
            if (abortSignal.aborted) return reject(new Error('aborted'))

            abortSignal.addEventListener('abort', abort, {once: true})

            let timer = setTimeout(() => {
                abortSignal.removeEventListener('abort', abort)
                resolve()
            }, ms)

            function abort() {
                clearTimeout(timer)
                reject(new Error('aborted'))
            }
        })
    } else {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        })
    }
}


export function groupBy<T, G>(elements: Iterable<T>, group: (e: T) => G): Map<G, T[]> {
    let grouping = new Map<G, T[]>()
    for (let element of elements) {
        let key = group(element)
        let g = grouping.get(key)
        if (g == null) {
            grouping.set(key, [element])
        } else {
            g.push(element)
        }
    }
    return grouping
}


export function* splitSlice(maxSize: number, beg: number, end?: number): Iterable<[beg: number, end: number]> {
    assert(maxSize >= 1)
    end = end ?? Number.MAX_SAFE_INTEGER
    while (beg < end) {
        let left = end - beg
        let splits = Math.ceil(left / maxSize)
        let step = Math.round(left / splits)
        yield [beg, beg + step]
        beg += step
    }
}


export function* splitArray<T>(maxSize: number, arr: T[]): Iterable<T[]> {
    if (arr.length <= maxSize) {
        yield arr
    } else {
        for (let [beg, end] of splitSlice(maxSize, 0, arr.length)) {
            yield arr.slice(beg, end)
        }
    }
}


export async function splitParallelWork<T, R>(maxSize: number, tasks: T[], run: (tasks: T[]) => Promise<R[]>): Promise<R[]> {
    if (tasks.length <= maxSize) return run(tasks)

    let promises: Promise<R[]>[] = []
    for (let group of splitArray(maxSize, tasks)) {
        promises.push(run(group))
    }

    let result: R[] = []
    for (let group of await Promise.all(promises)) {
        result.push(...group)
    }
    return result
}
