
export interface Filter<T> {
    match(obj: T): boolean
}


export class EntityFilter<T, R extends object> {
    private requests: {
        filter: Filter<T>
        relations: R
    }[] = []

    present(): boolean {
        return this.requests.length > 0
    }

    match(obj: T): R | undefined {
        let relations: R | undefined
        for (let req of this.requests) {
            if (req.filter.match(obj)) {
                relations = this.mergeRelations(relations, req.relations)
            }
        }
        return relations
    }

    mergeRelations(a: R | undefined, b: R): R {
        if (a == null) return b
        let result = {...a}
        let key: keyof R
        for (key in b) {
            if (b[key]) {
                result[key] = b[key]
            }
        }
        return result
    }

    add(filter: Filter<T> | FilterBuilder<T>, relations: R): void {
        if (filter instanceof FilterBuilder) {
            if (filter.isNever()) return
            filter = filter.build()
        }
        this.requests.push({
            filter,
            relations
        })
    }
}


export class FilterBuilder<T> {
    private filters: Filter<T>[] = []
    private never = false

    propIn<P extends keyof T>(prop: P, values?: T[P][]): this {
        if (values == null) return this
        if (values.length == 0) {
            this.never = true
        }
        let filter = values.length == 1
            ? new PropEqFilter(prop, values[0])
            : new PropInFilter(prop, values)
        this.filters.push(filter)
        return this
    }

    getIn<P>(get: (obj: T) => P, values?: P[]): this {
        if (values == null) return this
        if (values.length == 0) {
            this.never = true
        }
        let filter = values.length == 1
            ? new GetEqFilter(get, values[0])
            : new GetInFilter(get, values)
        this.filters.push(filter)
        return this
    }

    matchAny<P>(test: (obj: T, value: P) => boolean, values?: P[]): this {
        if (values == null) return this
        if (values.length == 0) {
            this.never = true
        }
        this.filters.push(new MatchAnyFilter(test, values))
        return this
    }

    isNever(): boolean {
        return this.never
    }

    build(): Filter<T> {
        switch(this.filters.length) {
            case 0: return OK
            case 1: return this.filters[0]
            default: return new AndFilter(this.filters)
        }
    }
}


const OK: Filter<unknown> = {
    match(obj: unknown): boolean {
        return true
    }
}


class PropInFilter<T, P extends keyof T> implements Filter<T> {
    public readonly values: Set<T[P]>

    constructor(public readonly prop: P, values: T[P][]) {
        this.values = new Set(values)
    }

    match(obj: T): boolean {
        return this.values.has(obj[this.prop])
    }
}


class PropEqFilter<T, P extends keyof T> implements Filter<T> {
    constructor(public readonly prop: P, public readonly value: T[P]) {}

    match(obj: T): boolean {
        return obj[this.prop] === this.value
    }
}


class GetInFilter<T, P> implements Filter<T> {
    public readonly values: Set<P>

    constructor(public readonly get: (obj: T) => P, values: P[]) {
        this.values = new Set(values)
    }

    match(obj: T): boolean {
        return this.values.has(this.get(obj))
    }
}


class GetEqFilter<T, P> implements Filter<T> {
    constructor(public readonly get: (obj: T) => P, public readonly value: P) {}

    match(obj: T): boolean {
        return this.get(obj) === this.value
    }
}


class MatchAnyFilter<T, P> implements Filter<T> {
    constructor(
        public readonly test: (obj: T, value: P) => boolean,
        public readonly values: P[]
    ) {}

    match(obj: T): boolean {
        for (let i = 0; i < this.values.length; i++) {
            if (this.test(obj, this.values[i])) return true
        }
        return false
    }
}


class AndFilter<T> implements Filter<T> {
    constructor(public readonly filters: Filter<T>[]) {}

    match(obj: T): boolean {
        for (let f of this.filters) {
            if (!f.match(obj)) return false
        }
        return true
    }
}
