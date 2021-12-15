import * as path from 'path'
import { ConnectionOptions, DefaultNamingStrategy } from 'typeorm'
import { toSnakeCase } from '@subsquid/util'

class SnakeNamingStrategy extends DefaultNamingStrategy {
  tableName(className: string, customName?: string): string {
    return customName || toSnakeCase(className)
  }

  columnName(
    propertyName: string,
    customName?: string,
    embeddedPrefixes: string[] = []
  ): string {
    return (
      toSnakeCase(embeddedPrefixes.join('_')) +
      (customName || toSnakeCase(propertyName))
    )
  }

  relationName(propertyName: string): string {
    return toSnakeCase(propertyName)
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(`${relationName}_${referencedColumnName}`)
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return toSnakeCase(`${firstTableName}_${secondTableName}`)
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string
  ): string {
    return `${toSnakeCase(tableName)}_${columnName || toSnakeCase(propertyName)}`
  }
}

const migrationsDir = path.join(__dirname, '../../db/migrations')

const config: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASS || 'postgres',
  namingStrategy: new SnakeNamingStrategy(),
  entities: [require.resolve('./model')],
  migrations: [migrationsDir + '/*.js'],
  cli: {
    migrationsDir,
  },
}

module.exports = config
