import {BorshCoder} from '@coral-xyz/anchor'
import {array, bool, struct, u128, u64} from '@subsquid/borsh'
import {def} from '@subsquid/util-internal'
import {toJSON} from '@subsquid/util-internal-json'
import base58 from 'bs58'
import WHIRLPOOL from '../idls/whirlpool.json'
import {buildCallArray, CallData, decode, kb, measure, readCallData} from './util'


const Whirlpool_swap = struct({
    amount: u64,
    otherAmountThreshold: u64,
    sqrtPriceLimit: u128,
    amountSpecifiedIsInput: bool,
    aToB: bool
})


class Bench {
    @def
    whirlpoolData(): CallData[] {
        return readCallData('data/whirlpool_swap_call.csv')
    }

    @def
    whirlpoolInput(): Uint8Array {
        return buildCallArray(this.whirlpoolData())
    }

    whirlpoolBench() {
        let bytes = this.whirlpoolInput()

        let calls = measure(`Whirlpool swap [${kb(bytes)}]`, () => {
            return decode(array(Whirlpool_swap), bytes)
        })

        let json = JSON.stringify(toJSON(calls))

        measure('Whirlpool swap JSON', () => {
            JSON.parse(json)
        })

        {
            let anchor = new BorshCoder(WHIRLPOOL as any)
            let calls = this.whirlpoolData().map(call => Buffer.from(base58.decode(call.data)))

            measure('Whirlpool swap Anchor', () => {
                for (let call of calls) {
                    anchor.instruction.decode(call)
                }
            })
        }
    }
}


{
    let bench = new Bench()
    bench.whirlpoolBench()
}
