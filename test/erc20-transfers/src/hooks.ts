import {createHook} from '@subsquid/batch-processor'
import type {Store} from '@subsquid/typeorm-store'

export const [useStore, provideStore] = createHook<Store>()
