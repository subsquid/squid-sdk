import {unexpectedCase} from '@subsquid/util-internal'
import {Dialect, SchemaBuilder, SchemaOptions} from './common'

export * from './common'

export function getSchemaBuilder(options: SchemaOptions & {dialect?: Dialect}): SchemaBuilder {
    switch (options.dialect) {
        case undefined:
        case Dialect.OpenCrud:
            return new (require('./opencrud/schema').SchemaBuilder)(options)
        case Dialect.TheGraph:
            return new (require('./thegraph/schema').SchemaBuilder)(options)
        default:
            throw unexpectedCase(options.dialect)
    }
}

