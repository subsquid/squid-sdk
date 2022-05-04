import {BigIntScalar} from "./BigInt"
import {BytesScalar} from "./Bytes"
import {DateTimeScalar} from "./DateTime"
import {JSONScalar} from "./JSON"


export const customScalars = {
    BigInt: BigIntScalar,
    Bytes: BytesScalar,
    DateTime: DateTimeScalar,
    JSON: JSONScalar,
}
