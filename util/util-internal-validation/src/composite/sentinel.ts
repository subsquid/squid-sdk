import type {Logger} from '@subsquid/logger'
import {ValidationFailure} from '../error'
import {Validator} from '../interface'


const SUPPRESSED_LABELS: {
    [label: string]: boolean
} = initSuppressedLabels()


let LOG: Logger | undefined
try {
    LOG = require('@subsquid/logger').createLogger('sqd:validation')
} catch(err: any) {}


function warn(label: string): void {
    if (LOG == null || SUPPRESSED_LABELS[label]) return
    SUPPRESSED_LABELS[label] = true
    LOG.warn(
        `Sentinel value was used in place of ${label}. ` +
        `This message will be printed only once. ` +
        `To suppress it entirely set SQD_ALLOW_SENTINEL=${label} env variable. ` +
        `Use commas (,) to separate multiple labels.`
    )
}


export class Sentinel<T, S> implements Validator<T, S | null | undefined>{
    constructor(
        public readonly label: string,
        public readonly value: T,
        public readonly item: Validator<T, S>
    ) {}

    cast(value: unknown): ValidationFailure | T {
        if (value == null) {
            warn(this.label)
            return this.value
        } else {
            return this.item.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value == null) return
        return this.item.validate(value)
    }

    phantom(): S | null | undefined {
        return undefined
    }
}


function initSuppressedLabels(): Record<string, boolean> {
    let rec: Record<string, boolean> = {}
    if (typeof process.env.SQD_ALLOW_SENTINEL == 'string') {
        let labels = process.env.SQD_ALLOW_SENTINEL.split(',').map(l => l.trim())
        for (let l of labels) {
            rec[l] = true
        }
    }
    return rec
}
