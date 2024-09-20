import type { Codec } from '@subsquid/evm-codec'

export type Simplify<T> = { [K in keyof T]: T[K] } & {}

export function indexed<T extends Codec<any>>(codec: T): Simplify<T & { indexed: true }> {
  return new Proxy(codec, {
    get(target: any, prop, receiver) {
      if (prop === 'indexed') {
        return true
      }
      const value = target[prop]
      if (value instanceof Function) {
        return function (...args: any[]) {
          // @ts-ignore
          return value.apply(this === receiver ? target : this, args)
        }
      }
      return value
    },
  })
}
