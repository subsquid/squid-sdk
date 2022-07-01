import expect from 'expect'
import {gql, waitForHeight} from "./setup"

describe('item handlers', function () {
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

    it("wildcards", function() {
        return gql.test(`
            query {
                seenItems(orderBy: id_ASC) {
                    name
                }
            }
        `, {
            seenItems: [
                {name: 'Timestamp.set'},
                {name: 'System.ExtrinsicSuccess'}
            ]
        })
    })
})
