import {describe, expect, it} from 'vitest'
import {redactRpcUrl, redactRpcUrlsInError, redactRpcUrlsInText} from './redact'

describe('redactRpcUrl', () => {
    it('drops query string, fragment and userinfo', () => {
        expect(redactRpcUrl('https://user:pass@rpc.example.com/v1?api-key=SECRET#token')).toBe(
            'https://rpc.example.com/v1'
        )
    })

    it('masks key-like path segments', () => {
        expect(redactRpcUrl('https://rpc.example.com/abcdefghijklmnopqrstuvwxyz123456/mainnet')).toBe(
            'https://rpc.example.com/***/mainnet'
        )
        expect(redactRpcUrl('https://rpc.example.com/sqd_abc123')).toBe('https://rpc.example.com/sqd_***')
    })
})

describe('redactRpcUrlsInText', () => {
    it('redacts a fetch-style error message quoting the request URL', () => {
        expect(
            redactRpcUrlsInText(
                'FetchError: request to https://mainnet.example.com/?api-key=SECRET failed, reason: socket hang up'
            )
        ).toBe('FetchError: request to https://mainnet.example.com/ failed, reason: socket hang up')
    })

    it('redacts every URL occurrence, http and ws alike', () => {
        expect(redactRpcUrlsInText('a https://x.io/?k=S b wss://y.io/sqd_KEY c')).toBe(
            'a https://x.io/ b wss://y.io/sqd_*** c'
        )
    })

    it('leaves text without URLs untouched', () => {
        expect(redactRpcUrlsInText('connection refused')).toBe('connection refused')
    })
})

describe('redactRpcUrlsInError', () => {
    it('scrubs message and stack in place', () => {
        let err = new Error('request to https://rpc.example.com/?api-key=SECRET failed')
        let out = redactRpcUrlsInError(err)
        expect(out).toBe(err)
        expect(err.message).toBe('request to https://rpc.example.com/ failed')
        expect(err.stack).not.toContain('SECRET')
        expect(err.stack).toContain('https://rpc.example.com/')
    })

    it('passes non-error values through', () => {
        expect(redactRpcUrlsInError('plain')).toBe('plain')
        expect(redactRpcUrlsInError(undefined)).toBe(undefined)
    })
})
