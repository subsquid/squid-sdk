import type { Sink } from './sink'
import type { Src } from './src'

export const WORD_SIZE = 32

export type BaseType = 'int' | 'address' | 'bool' | 'bytes' | 'string' | 'array' | 'struct'

export interface Codec<TIn, TOut = TIn> {
  encode(sink: Sink, val: TIn): void
  decode(src: Src): TOut
  isDynamic: boolean
  slotsCount?: number
  baseType: BaseType
}

export type Struct = {
  [key: string]: Codec<any>
}

type Pretty<T> = { [K in keyof T]: T[K] } & unknown

export type DecodedStruct<T extends Struct> = Pretty<{
  [K in keyof T]: T[K] extends Codec<any, infer U> ? U : never
}>

export type EncodedStruct<T extends Struct> = Pretty<{
  [K in keyof T]: T[K] extends Codec<infer U, any> ? U : never
}>
