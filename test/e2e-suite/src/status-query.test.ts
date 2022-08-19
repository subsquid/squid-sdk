import expect from "expect"
import {gql, waitForHeight} from "./setup"

describe("gql status query", function() {
    before(() => waitForHeight(1))

    it("should work", function() {
        return gql.test(`
            query {
                squidStatus {
                    height
                }
            }
        `, {
            squidStatus: {
                height: expect.any(Number)
            }
        })
    })
})
