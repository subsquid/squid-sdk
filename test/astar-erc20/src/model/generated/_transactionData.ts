import {Legacy} from "./_legacy"
import {EIP2930} from "./_eip2930"
import {EIP1559} from "./_eip1559"

export type TransactionData = Legacy | EIP2930 | EIP1559

export function fromJsonTransactionData(json: any): TransactionData {
  switch(json?.isTypeOf) {
    case 'Legacy': return new Legacy(undefined, json)
    case 'EIP2930': return new EIP2930(undefined, json)
    case 'EIP1559': return new EIP1559(undefined, json)
    default: throw new TypeError('Unknown json object passed as TransactionData')
  }
}
