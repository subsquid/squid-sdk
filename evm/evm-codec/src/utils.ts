import type { Codec } from "./codec";

export function slotsCount(codecs: readonly Codec<any>[]) {
  let count = 0;
  for (const codec of codecs) {
    count += codec.slotsCount ?? 1;
  }
  return count;
}

export function arg<T extends Codec<any>, S extends string>(
  name: S,
  codec: T
): T & { name: S } {
  return new Proxy(codec, {
    get(target: any, prop, receiver) {
      if (prop === "name") {
        return name;
      }
      const value = target[prop];
      if (value instanceof Function) {
        return function (...args: any[]) {
          // @ts-ignore
          return value.apply(this === receiver ? target : this, args);
        };
      }
      return value;
    },
  });
}

export function indexed<T extends Codec<any>>(codec: T): T & { indexed: true } {
  return new Proxy(codec, {
    get(target: any, prop, receiver) {
      if (prop === "indexed") {
        return true;
      }
      const value = target[prop];
      if (value instanceof Function) {
        return function (...args: any[]) {
          // @ts-ignore
          return value.apply(this === receiver ? target : this, args);
        };
      }
      return value;
    },
  });
}
