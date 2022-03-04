import * as ss58 from "@subsquid/ss58"
import {toHex} from "@subsquid/util"

console.log(toHex(ss58.decode('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY').bytes))
console.log(Buffer.from('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY').toString('hex'))
