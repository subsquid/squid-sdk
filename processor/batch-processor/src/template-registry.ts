import type {TemplateRegistry as ITemplateRegistry, TemplateValue} from '@subsquid/util-internal-data-source'
import type {FiniteRange, Range} from '@subsquid/util-internal-range'
import {TemplateMutation} from './database'

export interface TemplateManager {
    add(key: string, value: string, blockNumber: number): void
    remove(key: string, value: string, blockNumber: number): void
    has(key: string, value: string, blockNumber: number): boolean
}

class HandlerTemplates implements TemplateManager {
    readonly data: TemplateMutation[] = []

    constructor(
        private readonly range: FiniteRange,
        private readonly registry: TemplateRegistry,
    ) {}

    add(key: string, value: string, blockNumber: number): void {
        this.mutate('add', key, value, blockNumber)
    }

    remove(key: string, value: string, blockNumber: number): void {
        this.mutate('delete', key, value, blockNumber)
    }

    has(key: string, value: string, blockNumber: number): boolean {
        return this.registry.has(key, value, blockNumber)
    }

    private mutate(type: TemplateMutation['type'], key: string, value: string, blockNumber: number): void {
        if (blockNumber < this.range.from) {
            throw new RangeError(`blockNumber ${blockNumber} is before batch start ${this.range.from}`)
        }
        let mutation: TemplateMutation = {type, key, value, blockNumber}
        this.registry.apply(mutation)
        this.data.push(mutation)
    }
}

export class TemplateRegistry implements ITemplateRegistry {
    private byKey = new Map<string, Map<string, Range[]>>()
    private baseMutations: TemplateMutation[] = []
    private undoLog: Array<{blockNumber: number, templates: TemplateMutation[]}> = []
    private pendingTemplates: TemplateMutation[] = []

    /**
     * Rebuild state from finalized mutations and optionally replay hot block
     * mutations to reconstruct the undo log.
     *
     * Finalized mutations form the base state. Hot block mutations are stored
     * in the undo log so rollbackTo() works for hot block heights after restart.
     */
    init(
        mutations: TemplateMutation[],
        hotBlocks?: {blockNumber: number, templates: TemplateMutation[]}[]
    ): void {
        this.baseMutations = mutations
        this.undoLog = hotBlocks ?? []
        this.pendingTemplates = []
        this.rebuild()
    }

    get(key: string): TemplateValue[] {
        let m = this.byKey.get(key)
        if (m == null) return []
        let out: TemplateValue[] = []
        for (let [value, ranges] of m) {
            for (let range of ranges) {
                out.push({value, range})
            }
        }
        return out
    }

    has(key: string, value: string, block: number): boolean {
        let byVal = this.byKey.get(key)
        if (byVal == null) return false
        let ranges = byVal.get(value)
        if (ranges == null) return false
        for (let range of ranges) {
            if (block >= range.from && (range.to == null || block <= range.to)) {
                return true
            }
        }
        return false
    }

    apply(mutation: TemplateMutation): boolean {
        let changed = this.applyToState(mutation)
        if (changed) {
            this.pendingTemplates.push(mutation)
        }
        return changed
    }

    async transact(
        range: FiniteRange,
        fn: (templates: TemplateManager) => Promise<void>,
    ): Promise<{data: TemplateMutation[]; changed: boolean}> {
        let templates = new HandlerTemplates(range, this)
        try {
            await fn(templates)
        } catch (e) {
            this.pendingTemplates = []
            this.rebuild()
            throw e
        }
        let changed = this.pendingTemplates.length > 0
        if (changed) {
            this.undoLog.push({blockNumber: range.to, templates: this.pendingTemplates})
        }
        this.pendingTemplates = []
        return {data: templates.data, changed}
    }

    rollbackTo(blockNumber: number): void {
        let splitIdx = upperBound(this.undoLog, blockNumber)
        if (splitIdx >= this.undoLog.length) return
        this.undoLog.length = splitIdx
        this.pendingTemplates = []
        this.rebuild()
    }

    prune(blockNumber: number): void {
        let splitIdx = upperBound(this.undoLog, blockNumber)
        for (let i = 0; i < splitIdx; i++) {
            this.baseMutations.push(...this.undoLog[i].templates)
        }
        this.undoLog = this.undoLog.slice(splitIdx)
    }

    private applyToState({type, key, value, blockNumber}: TemplateMutation): boolean {
        if (type === 'add') {
            let byVal = this.byKey.get(key)
            if (byVal == null) {
                byVal = new Map()
                this.byKey.set(key, byVal)
            }

            let ranges = byVal.get(value)
            if (ranges == null) {
                byVal.set(value, [{from: blockNumber}])
                return true
            }

            let last = ranges[ranges.length - 1]
            if (last.to != null) {
                if (blockNumber < last.to) return false
                ranges.push({from: blockNumber})
                return true
            }

            if (blockNumber >= last.from) return false
            last.from = blockNumber
            return true
        } else {
            let byVal = this.byKey.get(key)
            if (!byVal) return false
            let ranges = byVal.get(value)
            if (!ranges || ranges.length === 0) return false
            let last = ranges[ranges.length - 1]
            if (last.to != null) return false
            if (blockNumber < last.from) return false
            last.to = blockNumber
            return true
        }
    }

    private rebuild(): void {
        this.byKey.clear()
        let allMutations: TemplateMutation[] = [...this.baseMutations]
        for (let entry of this.undoLog) {
            allMutations.push(...entry.templates)
        }
        allMutations.sort((a, b) => {
            if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber
            if (a.type !== b.type) return a.type === 'delete' ? -1 : 1
            return 0
        })
        for (let m of allMutations) {
            this.applyToState(m)
        }
    }
}

function upperBound(log: Array<{blockNumber: number}>, target: number): number {
    let lo = 0
    let hi = log.length
    while (lo < hi) {
        let mid = (lo + hi) >> 1
        if (log[mid].blockNumber > target) {
            hi = mid
        } else {
            lo = mid + 1
        }
    }
    return lo
}
