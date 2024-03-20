import { describe, expect, it } from "vitest";
import {
  address,
  array,
  int8,
  struct,
  uint256,
} from "../src/codecs/primitives";
import { Sink } from "../src/sink";
import { Src } from "../src/src";
import { AbiParameter, encodeAbiParameters } from "viem";

function compareTypes(sink: Sink, types: AbiParameter[], values: any[]) {
  expect(sink.toString()).toEqual(encodeAbiParameters(types, values));
}

describe("StructCodec", () => {
  it("static tuple", () => {
    const s = struct({
      a: { codec: int8, index: 0 },
      b: { codec: uint256, index: 1 },
      c: {
        codec: struct({
          e: { codec: address, index: 0 },
        }),
        index: 2,
      },
    });

    const sink = new Sink(3);
    s.encode(sink, {
      a: 1,
      b: 2n,
      c: {
        e: "0x1234567890123456789012345678901234567890",
      },
    });

    compareTypes(
      sink,
      [
        {
          type: "tuple",
          components: [
            { name: "a", type: "int8" },
            { name: "b", type: "uint256" },
            {
              name: "c",
              type: "tuple",
              components: [{ name: "e", type: "address" }],
            },
          ],
        },
      ],
      [
        {
          a: 1,
          b: 2n,
          c: {
            d: [3n, 4n],
            e: "0x1234567890123456789012345678901234567890",
          },
        },
      ]
    );

    expect(s.decode(new Src(sink.result()))).toStrictEqual({
      a: 1,
      b: 2n,
      c: {
        e: "0x1234567890123456789012345678901234567890",
      },
    });
  });

  it("dynamic tuple", () => {
    const s = struct({
      a: { codec: array(uint256), index: 0 },
      b: { codec: uint256, index: 1 },
      c: {
        codec: struct({
          d: { codec: array(uint256), index: 0 },
          e: { codec: address, index: 1 },
        }),
        index: 2,
      },
    });

    const sink = new Sink(1);
    s.encode(sink, {
      a: [100n, 1n, 123n],
      b: 2n,
      c: {
        d: [3n, 4n],
        e: "0x1234567890123456789012345678901234567890",
      },
    });
    compareTypes(
      sink,
      [
        {
          type: "tuple",
          components: [
            { name: "a", type: "uint256[]" },
            { name: "b", type: "uint256" },
            {
              name: "c",
              type: "tuple",
              components: [
                { name: "d", type: "uint256[]" },
                { name: "e", type: "address" },
              ],
            },
          ],
        },
      ],
      [
        {
          a: [100n, 1n, 123n],
          b: 2n,
          c: {
            d: [3n, 4n],
            e: "0x1234567890123456789012345678901234567890",
          },
        },
      ]
    );

    expect(s.decode(new Src(sink.result()))).toStrictEqual({
      a: [100n, 1n, 123n],
      b: 2n,
      c: {
        d: [3n, 4n],
        e: "0x1234567890123456789012345678901234567890",
      },
    });
  });
});
