import * as http from 'http'
import {AddressInfo} from 'net'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {RpcClient} from './client'
import {RetryError} from './errors'
import {isRateLimitResult} from './client'

// Reproduces a provider (via erpc proxy) that returns HTTP 200 with `result`
// set to a plain rate-limit string instead of a 429 / JSON-RPC error object.
// Pre-fix this became a fatal, non-retryable validation error and crash-looped
// the dumper; post-fix it is a RetryError handled by the existing retry machinery.
const RATE_LIMIT_BODY = "You've been rate limited, please upgrade your plan.\n"

describe('isRateLimitResult', () => {
    it('matches a rate-limit string result', () => {
        expect(isRateLimitResult(RATE_LIMIT_BODY)).toBe(true)
    })
    it('ignores normal (hex / object) results', () => {
        expect(isRateLimitResult('0x1a2b')).toBe(false)
        expect(isRateLimitResult({status: '0x1'})).toBe(false)
        expect(isRateLimitResult(null)).toBe(false)
    })
})

describe('RpcClient rate-limit-as-200 result', () => {
    let server: http.Server
    let url: string

    beforeEach(async () => {
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', c => (body += c))
            req.on('end', () => {
                let {id} = JSON.parse(body)
                res.writeHead(200, {'content-type': 'application/json'})
                res.end(JSON.stringify({jsonrpc: '2.0', id, result: RATE_LIMIT_BODY}))
            })
        })
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
        url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    })

    afterEach(async () => {
        await new Promise<void>(resolve => server.close(() => resolve()))
    })

    it('surfaces a retryable RetryError, not a fatal validation error', async () => {
        let client = new RpcClient({url, retryAttempts: 0, log: null})
        // A receipt-style validator that fatally rejects a non-object result,
        // mirroring getResultValidator(Receipt) in @subsquid/evm-rpc.
        let validateResult = (result: unknown) => {
            if (typeof result !== 'object' || result == null) {
                throw new Error(`server returned unexpected result: ${result} is not an object`)
            }
            return result
        }
        await expect(
            client.call('eth_getTransactionReceipt', ['0x0'], {validateResult})
        ).rejects.toBeInstanceOf(RetryError)
        client.close()
    })
})
