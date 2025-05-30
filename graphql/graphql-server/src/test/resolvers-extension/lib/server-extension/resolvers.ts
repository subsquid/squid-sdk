import {BigDecimal} from "@subsquid/big-decimal"
import {Arg, Field, InputType, ObjectType, Query, Resolver} from 'type-graphql'
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


@InputType()
export class PingInput {
    @Field(() => String, {nullable: false})
    message!: string
}


@ObjectType({simpleResolvers: true})
export class PongOutput {
    @Field(() => String, {nullable: false})
    message!: string
}


@Resolver()
export class PingPong {
    @Query(() => PongOutput)
    ping(@Arg('msg', () => PingInput) msg: PingInput): PongOutput {
        return msg
    }
}

@Resolver()
export class ArgResolver {
    @Query(() => Boolean, { nullable: false })
    stringArray(@Arg('ids', () => [String]) ids: string[]): boolean {
        return true
    }
}
