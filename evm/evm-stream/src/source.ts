import {DataSource} from '@subsquid/util-internal-data-source'
import {Block, FieldSelection} from './data/model'

export type GetDataSourceBlock<T> = T extends DataSource<infer B> ? B : never

export interface EVMDataSource<F extends FieldSelection> extends DataSource<Block<F>> {}
