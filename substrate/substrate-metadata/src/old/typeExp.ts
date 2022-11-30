export type Type = NamedType | ArrayType | TupleType


type TypeParameter = Type |  number


export interface NamedType {
    kind: 'named'
    name: string
    params: TypeParameter[]
}


export interface ArrayType {
    kind: 'array'
    item: Type
    len: number
}


export interface TupleType {
    kind: 'tuple'
    params: Type[]
}


export function print(type: Type): string {
    switch(type.kind) {
        case 'array':
            return `[${print(type.item)}; ${type.len}]`
        case 'tuple':
            return `(${type.params.map(t => print(t)).join(', ')})`
        case 'named': {
            if (type.params.length == 0) {
                return type.name
            } else {
                return `${type.name}<${type.params.map(t => typeof t == 'number' ? ''+t : print(t)).join(', ')}>`
            }
        }
    }
}


export function parse(typeExp: string): Type {
    return new TypeExpParser(typeExp).parse()
}


class TypeExpParser {
    private tokens: string[]
    private idx = 0

    constructor(private typeExp: string) {
        this.tokens = tokenize(typeExp)
    }

    private eof(): boolean {
        return this.idx >= this.tokens.length
    }

    private tok(tok: string | RegExp): string | null {
        if (this.eof()) return null
        let current = this.tokens[this.idx]
        let match = tok instanceof RegExp
            ? !!current && tok.test(current)
            : current === tok
        if (match) {
            this.idx += 1
            return current
        } else {
            return null
        }
    }

    private assertTok(tok: string | RegExp): string {
        return this.assert(this.tok(tok))
    }

    private nat(): number | null {
        let tok = this.tok(/^\d+$/)
        return tok == null ? null : Number.parseInt(tok)
    }

    private assertNat(): number {
        return this.assert(this.nat())
    }

    private name(): string | null {
        return this.tok(/^[a-zA-Z]\w*$/)
    }

    private assertName(): string {
        return this.assert(this.name())
    }

    private list<T>(sep: string, p: () => T | null): T[] {
        let item = p()
        if (item == null) return []
        let result = [item]
        while (this.tok(sep)) {
            item = p()
            if (item == null) {
                break
            } else {
                result.push(item)
            }
        }
        return result
    }

    private tuple(): TupleType | null {
        if (!this.tok('(')) return null
        let params = this.list(',', () => this.anyType())
        this.assertTok(')')
        return {
            kind: 'tuple',
            params
        }
    }

    private array(): ArrayType | null {
        if (!this.tok('[')) return null
        let item = this.assert(this.anyType())
        this.assertTok(';')
        let len = this.assertNat()
        if (this.tok(';')) {
            this.assertName()
        }
        this.assertTok(']')
        return {
            kind: 'array',
            item,
            len
        }
    }

    private namedType(): NamedType | null {
        let name: string
        let trait: string | undefined
        let item: string | undefined | null
        if (this.tok('<')) {
            name = this.assertNamedType().name
            this.assertTok('as')
            trait = this.assertNamedType().name
            this.assertTok('>')
        } else {
            let nameTok = this.name()
            if (nameTok == null) return null
            name = nameTok
        }
        while (this.tok('::') && (item = this.name())) {}
        if (name == 'InherentOfflineReport' && name == trait && item == 'Inherent') {
        } else if (name == 'exec' && item == 'StorageKey') {
            name = 'ContractStorageKey'
        } else if (name == 'Lookup' && item == 'Source') {
            name = 'LookupSource'
        } else if (name == 'Lookup' && item == 'Target') {
            name = 'LookupTarget'
        } else if (item) {
            this.assert(trait != 'HasCompact')
            name = item
        } else if (trait == 'HasCompact') {
            return {
                kind: 'named',
                name: 'Compact',
                params: [{
                    kind: 'named',
                    name,
                    params: this.typeParameters()
                }]
            }
        }
        return {
            kind: 'named',
            name,
            params: this.typeParameters()
        }
    }

    private assertNamedType(): NamedType {
        return this.assert(this.namedType())
    }

    private typeParameters(): TypeParameter[] {
        let params: TypeParameter[]
        if (this.tok('<')) {
            params = this.list(',', () => this.nat() || this.anyType())
            this.assertTok('>')
        } else {
            params = []
        }
        return params
    }

    private pointerBytes(): Type | null {
        if (!this.tok('&')) return null
        this.tok("'") && this.assertTok('static')
        this.assertTok('[')
        this.assertTok('u8')
        this.assertTok(']')
        return {
            kind: 'named',
            name: 'Vec',
            params: [{
                kind: 'named',
                name: 'u8',
                params: []
            }]
        }
    }

    private anyType(): Type | null {
        return this.tuple() || this.array() || this.namedType() || this.pointerBytes()
    }

    parse(): Type {
        let type = this.assert(this.anyType())
        if (!this.eof()) {
            throw this.abort()
        }
        return type
    }

    private abort(): Error {
        return new Error(`Invalid type expression: ${this.typeExp}`)
    }

    private assert<T>(val: T | null): T {
        if (val == null || (val as any) === false) {
            throw this.abort()
        } else {
            return val
        }
    }
}


function tokenize(typeExp: string): string[] {
    let tokens: string[] = []
    let word = ''
    for (let i = 0; i < typeExp.length; i++) {
        let c = typeExp[i]
        if (/\w/.test(c)) {
            word += c
        } else {
            if (word) {
                tokens.push(word)
                word = ''
            }
            c = c.trim()
            if (c == ':' && typeExp[i+1] == ':') {
                i += 1
                tokens.push('::')
            } else if (c) {
                tokens.push(c)
            }
        }
    }
    if (word) {
        tokens.push(word)
    }
    return tokens
}
