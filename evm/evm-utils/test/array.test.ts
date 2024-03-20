import { describe, expect, it } from "vitest";
import {
  address,
  array,
  bytes,
  fixedArray,
  int8,
  string,
  uint256,
} from "../src/codecs/primitives";
import { Sink } from "../src/sink";
import { AbiParameter, encodeAbiParameters } from "viem";
import { Src } from "../src/src";

function compareTypes(sink: Sink, types: AbiParameter[], values: any[]) {
  expect(sink.toString()).toEqual(encodeAbiParameters(types, values));
}

describe("fixed size array", () => {
  it("static types encoding", () => {
    const arr = fixedArray(int8, 5);
    const sink = new Sink(5);
    arr.encode(sink, [1, 2, -3, 4, 5]);
    compareTypes(sink, [{ type: "int8[5]" }], [[1, 2, -3, 4, 5]]);
  });

  it("static types decoding", () => {
    const arr = fixedArray(int8, 5);
    const sink = new Sink(5);
    arr.encode(sink, [1, 2, -3, -4, 5]);
    expect(arr.decode(new Src(sink.result()))).toStrictEqual([1, 2, -3, -4, 5]);
  });

  it("dynamic types encoding", () => {
    const arr = fixedArray(string, 3);
    const sink = new Sink(1);
    const data = [
      "aaa",
      "a relatively long string to test what happens when the string is long, longer than 32 bytes or even better, longer than 64 bytes!!!",
      "dasdas",
    ];
    arr.encode(sink, data);
    compareTypes(sink, [{ type: "string[3]" }], [data]);
    expect(arr.decode(new Src(sink.result()))).toStrictEqual(data);
  });

  it("deep nested arrays", () => {
    const arr = fixedArray(fixedArray(string, 3), 2);
    const sink = new Sink(1);
    const data = [
      "aaa",
      "a relatively long string to test what happens when the string is long, longer than 32 bytes or even better, longer than 64 bytes!!!",
      "dasdas",
    ];
    arr.encode(sink, [data, data.reverse()]);
    compareTypes(
      sink,
      [{ type: "string[3][2]" }],
      [[data.reverse(), data.reverse()]]
    );
  });
});

describe("dynamic size array", () => {
  it("static types encoding", () => {
    const arr = array(int8);
    const sink = new Sink(1);
    arr.encode(sink, [1, 2, -3, 4, 5]);
    compareTypes(sink, [{ type: "int8[]" }], [[1, 2, -3, 4, 5]]);
  });

  it("static types decoding", () => {
    const arr = array(int8);
    const sink = new Sink(1);
    arr.encode(sink, [1, 2, -3, -4, 5]);
    expect(arr.decode(new Src(sink.result()))).toStrictEqual([1, 2, -3, -4, 5]);
  });

  it("dynamic types encoding", () => {
    const arr = array(string);
    const sink = new Sink(1);
    const data = [
      "aaa",
      "a relatively long string to test what happens when the string is long, longer than 32 bytes or even better, longer than 64 bytes!!!",
      "dasdas",
    ];
    arr.encode(sink, data);
    compareTypes(sink, [{ type: "string[]" }], [data]);
    expect(arr.decode(new Src(sink.result()))).toStrictEqual(data);
  });

  it("hardcore dynamic types", () => {
    const sink = new Sink(5);
    const arr1 = array(array(fixedArray(string, 3)));
    const arr2 = array(array(uint256));
    const arr3 = array(fixedArray(bytes, 2));
    const data1 = [
      [
        ["aaa", "bbb", "ccc"],
        ["ddd", "eee", "fff"],
      ],
      [["ggg", "hhh", "iii"]],
    ];
    const data2 = [[1n, 2n, 3n], [], [4n]];
    const data3 = [
      [Buffer.from("1234", "hex"), Buffer.from("5678", "hex")],
      [Buffer.from("dead", "hex"), Buffer.from("beef", "hex")],
    ];
    arr1.encode(sink, data1);
    address.encode(sink, "0x1234567890123456789012345678901234567890");
    arr3.encode(sink, data3);
    arr2.encode(sink, data2);
    uint256.encode(sink, 123n);
    compareTypes(
      sink,
      [
        { type: "string[3][][]" },
        { type: "address" },
        { type: "bytes[2][]" },
        { type: "uint256[][]" },
        { type: "uint256" },
      ],
      [
        data1,
        "0x1234567890123456789012345678901234567890",
        [
          ["0x1234", "0x5678"],
          ["0xdead", "0xbeef"],
        ],
        data2,
        123n,
      ]
    );

    const src = new Src(sink.result());

    expect(arr1.decode(src)).toStrictEqual(data1);
    expect(address.decode(src)).toBe(
      "0x1234567890123456789012345678901234567890"
    );
    expect(arr3.decode(src)).toStrictEqual(data3);
    expect(arr2.decode(src)).toStrictEqual(data2);
    expect(uint256.decode(src)).toBe(123n);
  });
});
