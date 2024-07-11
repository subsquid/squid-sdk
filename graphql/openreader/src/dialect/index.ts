import {unexpectedCase} from '@subsquid/util-internal'
import {Dialect, SchemaBuilder, SchemaOptions} from './common'

export * from './common'

export async function getSchemaBuilder(options: SchemaOptions & {dialect?: Dialect}): Promise<SchemaBuilder> {
    switch (options.dialect) {
        case undefined:
        case Dialect.OpenCrud: {
            const {SchemaBuilder} = await import('./opencrud/schema')
            return new SchemaBuilder(options)
        }
        case Dialect.TheGraph: {
            const {SchemaBuilder} = await import('./thegraph/schema')
            return new SchemaBuilder(options)
        }
        default:
            throw unexpectedCase(options.dialect)
    }
}
