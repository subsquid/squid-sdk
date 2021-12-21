import {chain, gql, transfer, waitForHeight} from "./setup"


const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
const txAmount1 = 232323
const txAmount2 = 1000


describe('transfer tests', function () {
    const api = chain()
    let blockHeight = -1

    before(async () => {
        blockHeight = await transfer(api, ALICE, BOB, txAmount1)
        blockHeight = await transfer(api, ALICE, BOB, txAmount2)
        await waitForHeight(blockHeight)
    })

    it('transfers are indexed', function () {
        return gql.test(`
            query {
                transfers(where: { value_eq: ${txAmount2}, block_eq: ${blockHeight} }) {
                    value
                    fromAccount { id }
                    toAccount { id }
                }
            }
        `, {
            transfers: [{
                value: '1000',
                fromAccount: {
                    id: ALICE
                },
                toAccount: {
                    id: BOB
                },
            }]
        })
    })

    it('extrinsic.id is exposed and mapped', function () {

    })
})
