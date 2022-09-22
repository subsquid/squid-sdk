import {BigDecimal} from "@subsquid/big-decimal"
import {Column, Entity, PrimaryColumn} from "typeorm"
import * as marshal from "./marshal"


@Entity()
export class Scalar {
    @PrimaryColumn()
    id!: string

    @Column("bool")
    bool?: boolean

    @Column("timestamp with time zone")
    date?: Date

    @Column("numeric", {transformer: marshal.bigintTransformer})
    bigInt?: bigint

    @Column("numeric", {transformer: marshal.bigdecimalTransformer})
    bigDecimal?: BigDecimal

    @Column("bytea")
    bytes?: Buffer

    @Column("jsonb")
    attributes?: any
}
