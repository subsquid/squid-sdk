import * as fs from 'fs'
import * as Path from 'path'
import {RetryError} from '@subsquid/rpc-client'
import {DataValidationError} from '@subsquid/util-internal-validation'
import {describe, it, expect} from 'vitest'
import {GetBlock} from '../src/rpc-data'
import {validateGetBlockResult} from '../src/rpc'

// Real zora-mainnet block 49513698: a single OP-stack deposit tx (type 0x7e).
const block = JSON.parse(
    fs.readFileSync(Path.resolve(__dirname, 'data/zora-mainnet-49513698.json'), 'utf8')
)

describe('getBlocks transient malformed result handling', () => {
    it('validates a well-formed OP-stack deposit-tx block', () => {
        expect(block.transactions[0].type).toEqual('0x7e')
        expect(GetBlock.validate(block)).toBeUndefined()
        expect(() => validateGetBlockResult(block)).not.toThrow()
    })

    it('turns a transient malformed block (deposit tx missing nonce) into a retryable error', () => {
        // Reproduces the production crash: an overloaded proxy transiently dropped
        // the `nonce` field of the deposit tx. Pre-fix this threw a fatal
        // DataValidationError and crash-looped the dumper.
        const malformed = JSON.parse(JSON.stringify(block))
        delete malformed.transactions[0].nonce

        expect(() => validateGetBlockResult(malformed)).toThrow(RetryError)

        let thrown: unknown
        try {
            validateGetBlockResult(malformed)
        } catch (err) {
            thrown = err
        }
        expect(thrown).toBeInstanceOf(RetryError)
        expect(thrown).not.toBeInstanceOf(DataValidationError)
    })
})
