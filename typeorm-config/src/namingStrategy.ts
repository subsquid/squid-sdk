import {toSnakeCase} from '@subsquid/util-naming'
import {DefaultNamingStrategy} from 'typeorm'


export class SnakeNamingStrategy extends DefaultNamingStrategy {
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
