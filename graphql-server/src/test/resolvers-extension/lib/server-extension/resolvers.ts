import {BigDecimal} from "@subsquid/big-decimal"
import {Field, ObjectType, Query, Resolver} from "type-graphql"
import {EntityManager} from "typeorm"
import {Json} from "../../../../index"
import {Scalar} from "../model"


@ObjectType({simpleResolvers: true})
export class ScalarRow {
    @Field({nullable: false})
    id!: string

    @Field()
    bool?: boolean

    @Field()
    date?: Date

    @Field()
    bigInt?: bigint

    @Field(() => BigDecimal)
    bigDecimal?: BigDecimal

    @Field()
    bytes?: Buffer

    @Field(() => Json)
    attributes?: any
}


@Resolver()
export class ScalarResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(() => [ScalarRow])
    async scalarsExtension(): Promise<ScalarRow[]>  {
        let em = await this.tx()
        return em.find(Scalar, {
            order: {
                id: 'ASC'
            }
        })
    }
}
