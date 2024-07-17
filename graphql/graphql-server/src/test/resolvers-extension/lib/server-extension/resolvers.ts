import {BigDecimal} from '@subsquid/big-decimal';
import {Arg, Field, InputType, ObjectType, Query, Resolver} from 'type-graphql';
import {EntityManager} from 'typeorm';
import {Bool, DateTime, Json, BigInteger, Bytes} from '../../../../index';
import {Scalar} from '../model';


@ObjectType({simpleResolvers: true})
export class ScalarRow {
    @Field({nullable: false})
    id!: string

    @Field(() => Bool)
    bool?: boolean | null

    @Field(() => DateTime)
    date?: Date | null

    @Field(() => BigInteger)
    bigInt?: bigint | null

    @Field(() => BigDecimal)
    bigDecimal?: BigDecimal | null

    @Field(() => Bytes)
    bytes?: Uint8Array | null

    @Field(() => Json, { nullable: true })
    attributes?: number[] | null
}


@Resolver()
export class ScalarResolver {
    constructor(private tx: () => Promise<EntityManager>) {}

    @Query(() => [ScalarRow])
    async scalarsExtension(): Promise<ScalarRow[]>  {
        let em = await this.tx()

        const data = await em.find(Scalar, {
            order: {
                id: 'ASC'
            }
        })

        return data.map(d => {
            return {
                ...d,
                attributes: [
                    Number(d.id)
                ]
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
