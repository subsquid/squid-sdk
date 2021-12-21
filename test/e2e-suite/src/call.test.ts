import expect from 'expect'
import {gql, waitForHeight} from "./setup"

describe('extrinsic handlers', function () {
    before(() => waitForHeight(1))

    it('timestamp updates', function () {
        return gql.test(`
            query {
                blockTimestamps(limit: 1) {
                  timestamp
                }
            }
        `, {
            blockTimestamps: [
                {timestamp: expect.stringMatching(/^\d+$/)}
            ]
        })
    })
})
