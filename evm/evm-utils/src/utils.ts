import type { Codec, NamedCodec } from "./codec";

export function slotsCount(codecs: readonly Codec<any>[]) {
  let count = 0;
  for (const codec of codecs) {
    count += codec?.slotsCount ?? 1;
  }
  return count;
}

export function arg<T, S extends string>(
  name: S,
  codec: Codec<T>
): NamedCodec<T, S> {
  return Object.assign(codec, { name });
}
