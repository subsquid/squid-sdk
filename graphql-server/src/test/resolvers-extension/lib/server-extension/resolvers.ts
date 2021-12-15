import {Field, ObjectType, Query, Resolver} from "type-graphql"
import {EntityManager} from "typeorm"
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
    bigNumber?: bigint

    @Field()
    bytes?: Buffer
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
