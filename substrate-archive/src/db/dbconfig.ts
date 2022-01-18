import path from 'path'
import { ConnectionOptions, DefaultNamingStrategy } from 'typeorm'
import { snakeCase } from 'typeorm/util/StringUtils'
import { SubstrateEventEntity, SubstrateExtrinsicEntity } from '../entities'
import { getDBConfig } from '../node'
import { SubstrateBlockEntity } from '../entities/SubstrateBlockEntity'

const migrationsDir = path.resolve(__dirname, '../migrations')

export default function config(name?: string): ConnectionOptions {
  const conf = getDBConfig()
  return {
    name,
    type: 'postgres',
    host: conf.DB_HOST,
    port: conf.DB_PORT,
    username: conf.DB_USER,
    password: conf.DB_PASS,
    database: conf.DB_NAME,
    entities: [
      SubstrateEventEntity,
      SubstrateExtrinsicEntity,
      SubstrateBlockEntity,
    ],
    migrations: [`${migrationsDir}/v3/*.js`, `${migrationsDir}/v4/*.js`, `${migrationsDir}/v5/*.js`],
    cli: {
      migrationsDir: 'src/migrations/v3',
    },
    namingStrategy: new SnakeNamingStrategy(),
  }
}

class SnakeNamingStrategy extends DefaultNamingStrategy {
  tableName(className: string, customName?: string): string {
    return customName || `${snakeCase(className)}` // `${snakeCase(className)}s`;
  }

  columnName(
    propertyName: string,
    customName?: string,
    embeddedPrefixes: string[] = []
  ): string {
    return (
      snakeCase(embeddedPrefixes.join('_')) +
      (customName || snakeCase(propertyName))
    )
  }

  relationName(propertyName: string): string {
    return snakeCase(propertyName)
  }

  joinColumnName(relationName: string, referencedColumnName: string): string {
    return snakeCase(`${relationName}_${referencedColumnName}`)
  }

  joinTableName(firstTableName: string, secondTableName: string): string {
    return snakeCase(`${firstTableName}_${secondTableName}`)
  }

  joinTableColumnName(
    tableName: string,
    propertyName: string,
    columnName?: string
  ): string {
    return snakeCase(`${tableName}_${columnName || propertyName}`)
  }

  classTableInheritanceParentColumnName(
    parentTableName: string,
    parentTableIdPropertyName: string
  ): string {
    return snakeCase(`${parentTableName}_${parentTableIdPropertyName}`)
  }
}
