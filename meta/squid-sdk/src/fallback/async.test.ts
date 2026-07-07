import {describe, expect, it, vi} from 'vitest'

import {safeReturn, withTimeout} from './async'

describe('withTimeout', () => {
    it('resolves with the promise value when it settles before the timeout', async () => {
        let makeError = vi.fn(() => new Error('should not build'))
        await expect(withTimeout(Promise.resolve(42), 1000, makeError)).resolves.toBe(42)
        expect(makeError).not.toHaveBeenCalled() // thunk only runs on a real timeout
    })

    it('rejects with makeError() when the promise outlasts the timeout', async () => {
        let never = new Promise<number>(() => {})
        await expect(withTimeout(never, 5, () => new Error('timed out'))).rejects.toThrow('timed out')
    })

    it('carries an arbitrary rejection value from makeError (not just Error)', async () => {
        let never = new Promise<number>(() => {})
        await expect(withTimeout(never, 5, () => ({reason: 'timeout'}))).rejects.toEqual({reason: 'timeout'})
    })

    it('returns the promise unchanged when ms is null (guard disabled)', async () => {
        let p = Promise.resolve('x')
        expect(withTimeout(p, null, () => new Error('nope'))).toBe(p)
        await expect(p).resolves.toBe('x')
    })

    it('does not surface the abandoned promise as an unhandled rejection after a timeout', async () => {
        let rejectLate!: (e: unknown) => void
        let slow = new Promise<number>((_res, rej) => {
            rejectLate = rej
        })
        await expect(withTimeout(slow, 5, () => new Error('timed out'))).rejects.toThrow('timed out')
        // The lost race's promise rejects *after* the timeout — must be silently swallowed.
        rejectLate(new Error('late'))
        await new Promise((r) => setTimeout(r, 10))
    })
})

describe('safeReturn', () => {
    it('closes an iterator by calling return()', () => {
        let ret = vi.fn(async () => ({value: undefined, done: true as const}))
        safeReturn({next: async () => ({value: undefined, done: true}), return: ret} as any)
        expect(ret).toHaveBeenCalledOnce()
    })

    it('swallows a rejecting return() without throwing', async () => {
        let it = {next: async () => ({value: undefined, done: true}), return: async () => Promise.reject(new Error('hang'))}
        expect(() => safeReturn(it as any)).not.toThrow()
        await new Promise((r) => setTimeout(r, 10)) // no unhandled rejection surfaces
    })

    it('tolerates an iterator without a return() method', () => {
        expect(() => safeReturn({next: async () => ({value: undefined, done: true})} as any)).not.toThrow()
    })
})
