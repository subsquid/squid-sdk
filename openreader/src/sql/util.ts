import type {Dialect} from "../dialect"


export function escapeIdentifier(dialect: Dialect, name: string): string {
    return `"${name.replace(/"/g, '""')}"`
}


export class ColumnSet {
    private columns: Map<string, number> = new Map()

    add(column: string): number {
        let idx = this.columns.get(column)
        if (idx == null) {
            idx = this.columns.size
            this.columns.set(column, idx)
        }
        return idx
    }

    names(): string[] {
        return [...this.columns.keys()]
    }

    size(): number {
        return this.columns.size
    }
}


/**
 * LEFT OUTER JOIN "{table}" "{alias}" ON "{alias}"."{column}" = {rhs}
 */
export interface Join {
    table: string
    alias: string
    column: string
    rhs: string
}


export class JoinSet {
    private joins: Map<string, Join> = new Map()

    constructor(private aliases: AliasSet) {
    }

    add(table: string, column: string, rhs: string): string {
        let key = `${table} ${column} ${rhs}`
        let e = this.joins.get(key)
        if (!e) {
            e = {
                table,
                alias: this.aliases.add(table),
                column,
                rhs
            }
            this.joins.set(key, e)
        }
        return e.alias
    }

    forEach(cb: (join: Join) => void): void {
        this.joins.forEach(join => cb(join))
    }
}


export class AliasSet {
    private aliases: Record<string, number> = {}

    add(name: string): string {
        if (this.aliases[name]) {
            return name + "_" + (this.aliases[name]++)
        } else {
            this.aliases[name] = 1
            return name
        }
    }
}


export function printClause(op: string, exps: string[]): string {
    switch(exps.length) {
        case 0: return ''
        case 1: return exps[0]
        default: return exps.join(' ' + op + ' ')
    }
}
