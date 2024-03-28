import type { Codec } from "./codec";
import assert from "node:assert";

/**
 * Combines members of an intersection into a readable type.
 *
 * @link https://twitter.com/mattpocockuk/status/1622730173446557697?s=20&t=NdpAcmEFXY01xkqU3KO0Mg
 */
export type Pretty<T> = { [K in keyof T]: T[K] } & unknown;

export type Hex = `0x${string}`;

export function slotsCount(codecs: readonly Codec<any>[]) {
  let count = 0;
  for (const codec of codecs) {
    count += codec.slotsCount ?? 1;
  }
  return count;
}

export function indexed<T extends Codec<any>>(
  codec: T
): Pretty<T & { indexed: true }> {
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

export function safeToNumber(value: bigint | number) {
  if (typeof value === "number") {
    return value;
  }
  assert(value <= Number.MAX_SAFE_INTEGER, "Value exceeds MAX_SAFE_INTEGER");
  assert(value >= Number.MIN_SAFE_INTEGER, "Value exceeds MIN_SAFE_INTEGER");
  return Number(value);
}

export function safeToBuffer(value: Uint8Array | Hex) {
  if (value instanceof Uint8Array) {
    return value;
  }
  assert(value.startsWith("0x"), "Hex values must start with 0x");
  return Buffer.from(value.slice(2), "hex");
}
