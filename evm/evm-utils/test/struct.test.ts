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
  it("should work", () => {
    const s = struct({
      a: int8,
      b: uint256,
      c: struct({
        // d: array(uint256),
        e: address,
      }),
    });

    const sink = new Sink(1);
    s.encode(sink, {
      a: 1,
      b: 2n,
      c: {
        // d: [3n, 4n],
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
              components: [
                // { name: "d", type: "uint256[]" },
                { name: "e", type: "address" },
              ],
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
  });
});
