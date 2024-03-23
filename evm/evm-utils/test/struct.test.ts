import { describe, expect, it } from "vitest";
import {
  address,
  array,
  bytes4,
  int8,
  Sink,
  Src,
  struct,
  uint256,
} from "../src";
import { AbiParameter, encodeAbiParameters } from "viem";
import { arg } from "../src/utils";

function compareTypes(sink: Sink, types: AbiParameter[], values: any[]) {
  expect(sink.toString()).toEqual(encodeAbiParameters(types, values));
}

describe("StructCodec", () => {
  it("static tuple", () => {
    const s = struct(
      arg("a", int8),
      arg("b", uint256),
      arg("c", struct(arg("e", address)))
    );

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
    const s = struct(
      arg("a", array(uint256)),
      arg("b", uint256),
      arg("c", struct(arg("d", array(uint256)), arg("e", address)))
    );

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

  it("dynamic tuple2", () => {
    const s = struct(
      arg("foo", uint256),
      arg("bar", array(uint256)),
      arg("str", struct(arg("foo", uint256), arg("bar", bytes4)))
    );

    const sink = new Sink(1);
    s.encode(sink, {
      foo: 100n,
      bar: [1n, 2n, 3n],
      str: {
        foo: 123n,
        bar: Uint8Array.from([0x12, 0x34, 0x56, 0x78]),
      },
    });
    compareTypes(
      sink,
      [
        {
          type: "tuple",
          components: [
            { name: "foo", type: "uint256" },
            { name: "bar", type: "uint256[]" },
            {
              name: "str",
              type: "tuple",
              components: [
                { name: "foo", type: "uint256" },
                { name: "bar", type: "bytes4" },
              ],
            },
          ],
        },
      ],
      [
        {
          foo: 100n,
          bar: [1n, 2n, 3n],
          str: {
            foo: 123n,
            bar: "0x12345678",
          },
        },
      ]
    );

    expect(s.decode(new Src(sink.result()))).toStrictEqual({
      foo: 100n,
      bar: [1n, 2n, 3n],
      str: {
        foo: 123n,
        bar: Buffer.from([0x12, 0x34, 0x56, 0x78]),
      },
    });
  });
});
