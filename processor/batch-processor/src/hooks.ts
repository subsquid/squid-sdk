import {AsyncLocalStorage} from 'node:async_hooks'

const context = new AsyncLocalStorage<Map<symbol, unknown>>()

function getContext(): Map<symbol, unknown> {
    let ctx = context.getStore()
    if (ctx == null) {
        throw new Error(
            'Hook called outside of batch processing context. ' +
            'Hooks can only be used inside a data handler or functions called from it.'
        )
    }
    return ctx
}

export class Provided<T = unknown> {
    constructor(readonly key: symbol, readonly value: T) {}
}

/**
 * Creates a hook — a typed slot in the batch processing context.
 *
 * Returns a `[use, provide]` tuple:
 * - `use()` retrieves the value from the current context
 * - `provide(value)` creates a {@link Provided} descriptor
 *   to be passed to {@link provideContext}
 *
 * When called with an `init` function, the value is lazily
 * initialized on first `use()` if not explicitly provided.
 * Without `init`, calling `use()` before `provide()` throws.
 *
 * @example
 * ```
 * const [useStore, provideStore] = createHook<Store>()
 *
 * provideContext([provideStore(myStore)], async () => {
 *     let store = useStore()
 * })
 * ```
 */
export function createHook<T>(): [use: () => T, provide: (value: T) => Provided<T>]
export function createHook<T>(init: () => T): [use: () => T, provide: (value: T) => Provided<T>]
export function createHook<T>(init?: () => T): [use: () => T, provide: (value: T) => Provided<T>] {
    let key = Symbol()

    function use(): T {
        let ctx = getContext()
        if (ctx.has(key)) return ctx.get(key) as T
        if (init != null) {
            let value = init()
            ctx.set(key, value)
            return value
        }
        throw new Error('Hook value was not provided')
    }

    function provide(value: T): Provided<T> {
        return new Provided(key, value)
    }

    return [use, provide]
}

/**
 * Creates a new batch processing context, applies the
 * provided values, and runs `fn` within it.
 *
 * The context is discarded when `fn` completes.
 */
export function withContext<T>(providers: Provided[], fn: () => T): T {
    return context.run(new Map(), () => {
        let ctx = context.getStore()!
        for (let p of providers) {
            ctx.set(p.key, p.value)
        }
        return fn()
    })
}
