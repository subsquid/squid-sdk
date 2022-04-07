import {decodeAddress} from "@polkadot/keyring"
import {toHex} from "@subsquid/util-internal"
import expect from "expect"
import {chain, gql, transfer, waitForHeight} from "./setup"


const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
const ALICE_ADDR = toHex(decodeAddress(ALICE))
const BOB_ADDR = toHex(decodeAddress(BOB))
const txAmount1 = 232323
const txAmount2 = 1000


describe('transfer tests', function () {
    const api = chain()
    let firstTransfer = -1
    let secondTransfer = -1

    before(async () => {
        firstTransfer = await transfer(api, ALICE, BOB, txAmount1)
        secondTransfer = await transfer(api, ALICE, BOB, txAmount2)
        await waitForHeight(secondTransfer)
    })

    it('transfers are properly indexed', function () {
        return gql.test(`
            query {
                first: transfers(where: { block_eq: ${firstTransfer} }) {
                    from
                    to
                    value
                    fromAccount { id }
                    toAccount { id }
                }
                second: transfers(where: { block_eq: ${secondTransfer} }) {
                    value
                }
            }
        `, {
            first: [{
                from: ALICE_ADDR,
                to: BOB_ADDR,
                value: '232323',
                fromAccount: {
                    id: ALICE_ADDR
                },
                toAccount: {
                    id: BOB_ADDR
                },
            }],
            second: [{
                value: '1000'
            }]
        })
    })

    it('extrinsic.id is exposed and mapped', function () {
        return gql.test(`
            query {
                transfers(limit: 1) {
                    extrinsicId
                }
            }
        `, {
            transfers: [
                {extrinsicId: expect.stringMatching(/\d/)}
            ]
        })
    })

    it('can find transfers by full-text search', function () {
        return gql.test(`
            query {
                comments: commentSearch(text: "transfer" limit: 1) {
                    highlight
                    item {
                        ... on Transfer {
                            fromAccount {
                                id
                            }
                        }
                    }
                }
            }
        `, {
            comments: [{
                highlight: expect.stringContaining('<b>Transfer'),
                item: {
                    fromAccount: {id: ALICE_ADDR}
                }
            }]
        })
    })

    it('json fields are properly mapped', function () {
        return gql.test(`
            query {
                alice: accountById(id: "${ALICE_ADDR}") {
                    status {
                        __typename
                        ... on Miserable {
                            hates
                            loves
                        }
                    }
                }
            }
        `, {
            alice: {
                status: {
                    __typename: 'Miserable',
                    hates: 'ALICE',
                    loves: ['money', 'crypto']
                }
            }
        })
    })
})
