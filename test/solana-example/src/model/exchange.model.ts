import {BigIntColumn, DateTimeColumn, Entity, IntColumn, PrimaryColumn, StringColumn} from '@subsquid/typeorm-store'

// Here we define `exchange` database table as TypeORM entity class.
//
// We do that with the help of decorators from `@subsquid/typeorm-store` package.
//
// Those decorators are convenience and restrictive wrappers around decorators from `typeorm`.
//
// All restrictions are related to the fact, that `@subsquid/typeorm-store`
// supports only primitive DML operations (insert, upsert, update and delete)
// without cascading.
@Entity()
export class Exchange {
    constructor(props?: Partial<Exchange>) {
        Object.assign(this, props)
    }

    // All entities must have single column primary key named `id`.
    @PrimaryColumn()
    id!: string

    @IntColumn({nullable: false})
    slot!: number

    @StringColumn({nullable: false})
    tx!: string

    @DateTimeColumn({nullable: false})
    timestamp!: Date

    @StringColumn()
    fromOwner!: string | undefined | null

    @StringColumn({nullable: false})
    fromToken!: string

    @BigIntColumn({nullable: false})
    fromAmount!: bigint

    @StringColumn()
    toOwner!: string | undefined | null

    @StringColumn({nullable: false})
    toToken!: string

    @BigIntColumn({nullable: false})
    toAmount!: bigint
}
