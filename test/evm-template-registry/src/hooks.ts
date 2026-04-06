import {createHook, type TemplateManager} from '@subsquid/batch-processor'
import type {Store} from '@subsquid/typeorm-store'

export const [useStore, provideStore] = createHook<Store>()
export const [useTemplates, provideTemplates] = createHook<TemplateManager>()

export interface Template {
    add(value: string, blockNumber: number): void
    remove(value: string, blockNumber: number): void
    has(value: string, blockNumber: number): boolean
}

export function useTemplate(key: string): Template {
    const templates = useTemplates()

    return {
        add(value, blockNumber) {
            templates.add(key, value, blockNumber)
        },
        remove(value, blockNumber) {
            templates.remove(key, value, blockNumber)
        },
        has(value, blockNumber) {
            return templates.has(key, value, blockNumber)
        },
    }
}
