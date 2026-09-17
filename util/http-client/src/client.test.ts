import assert from 'assert'
import {describe, it} from 'vitest'
import {HttpClient} from './client'

const DEFAULT_SCHEDULE = [10, 100, 500, 2000, 10000, 20000]

describe('HttpClient retry configuration', () => {
    it('exposes the default schedule when none was given', () => {
        assert.deepStrictEqual([...new HttpClient({log: null}).retrySchedule], DEFAULT_SCHEDULE)
    })

    it('exposes a configured schedule', () => {
        let client = new HttpClient({log: null, retrySchedule: [1, 2, 3]})
        assert.deepStrictEqual([...client.retrySchedule], [1, 2, 3])
    })

    it('copies the configured schedule instead of aliasing it', () => {
        // The property is exposed readonly, so mutating the array the caller passed in
        // must not retune a live client.
        let schedule = [1, 2, 3]
        let client = new HttpClient({log: null, retrySchedule: schedule})
        schedule.push(999)
        assert.deepStrictEqual([...client.retrySchedule], [1, 2, 3])
    })

    it('keeps an empty schedule rather than falling back to the default', () => {
        assert.deepStrictEqual([...new HttpClient({log: null, retrySchedule: []}).retrySchedule], [])
    })

    it('exposes the configured retryAttempts, and 0 when unset', () => {
        assert.strictEqual(new HttpClient({log: null, retryAttempts: 4}).retryAttempts, 4)
        assert.strictEqual(new HttpClient({log: null, retryAttempts: Infinity}).retryAttempts, Infinity)
        assert.strictEqual(new HttpClient({log: null}).retryAttempts, 0)
    })
})
