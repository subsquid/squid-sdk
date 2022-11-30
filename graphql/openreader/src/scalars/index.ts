import {BigIntScalar} from "./BigInt"
import {BigDecimalScalar} from "./BigDecimal"
import {BytesScalar} from "./Bytes"
import {DateTimeScalar} from "./DateTime"
import {JSONScalar} from "./JSON"


export const customScalars = {
    BigInt: BigIntScalar,
    BigDecimal: BigDecimalScalar,
    Bytes: BytesScalar,
    DateTime: DateTimeScalar,
    JSON: JSONScalar,
}
