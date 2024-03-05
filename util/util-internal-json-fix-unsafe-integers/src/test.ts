import * as assert from 'assert'
import {describe, it} from 'node:test'
import {fixUnsafeIntegers} from './index'


function expect(json: string, out: string): void {
    assert.strictEqual(fixUnsafeIntegers(json), out)
}


describe('fixUnsafeIntegers()', function() {
    it('rewrites big integers to strings', function() {
        expect(
            '[1, 2, 9999999999999999999999999, 5, 1000000000000000000000000000]',
            '[1, 2, "9999999999999999999999999", 5, "1000000000000000000000000000"]',
        )
    })

    it('does not rewrite floats', function() {
        expect(
            '{distance: 0.0}',
            '{distance: 0.0}',
        )
        expect(
            '{distance: 1e99}',
            '{distance: 1e99}',
        )
        expect(
            '{distance: 123.045e-10}',
            '{distance: 123.045e-10}',
        )
    })

    it('does not rewrite strings', function() {
        expect(
            '{hello: "[1, 2, 9999999999999999999999999, \\"5, 1000000000000000000000000000]"}',
            '{hello: "[1, 2, 9999999999999999999999999, \\"5, 1000000000000000000000000000]"}',
        )
    })
})
