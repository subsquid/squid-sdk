import {describe, expect, it} from 'vitest'

import {translateMissingRpcPeer} from './load-rpc-stream'

function moduleNotFound(message: string): NodeJS.ErrnoException {
    let e = new Error(message) as NodeJS.ErrnoException
    e.code = 'MODULE_NOT_FOUND'
    return e
}

describe('translateMissingRpcPeer', () => {
    it('translates a missing @subsquid/evm-rpc peer into an actionable error', () => {
        let out = translateMissingRpcPeer(moduleNotFound("Cannot find module '@subsquid/evm-rpc'")) as Error
        expect(out).toBeInstanceOf(Error)
        expect(out.message).toContain('optional peer dependencies')
        expect(out.message).toContain('@subsquid/evm-rpc')
        expect(out.message).toContain('@subsquid/evm-normalization')
    })

    it('translates a missing @subsquid/evm-normalization peer too', () => {
        let out = translateMissingRpcPeer(moduleNotFound("Cannot find module '@subsquid/evm-normalization'")) as Error
        expect(out.message).toContain('optional peer dependencies')
    })

    it('passes a MODULE_NOT_FOUND for an unrelated module through unchanged', () => {
        let orig = moduleNotFound("Cannot find module 'some-transitive-dep'")
        expect(translateMissingRpcPeer(orig)).toBe(orig)
    })

    it('passes a non-MODULE_NOT_FOUND fault through unchanged', () => {
        let orig = new Error('boom')
        expect(translateMissingRpcPeer(orig)).toBe(orig)
    })
})
