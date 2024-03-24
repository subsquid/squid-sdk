import { describe, expect, it } from "vitest";
import { encodeFunctionData } from "viem";
import {
  arg,
  array,
  bool,
  bytes4,
  fixedArray,
  fun,
  int32,
  struct,
  uint256,
} from "../src";

describe("Function", () => {
  it("encodes/decodes simple args", () => {
    const simpleFunction = fun("0x12345678", [
      arg("foo", uint256),
      int32,
      bool,
    ]);
    const calldata = simpleFunction.encode(100n, -420, true);
    expect(calldata).toBe(
      "0x123456780000000000000000000000000000000000000000000000000000000000000064fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe5c0000000000000000000000000000000000000000000000000000000000000001"
    );

    const decoded = simpleFunction.decode(calldata);
    expect(decoded).toStrictEqual({
      foo: 100n,
      1: -420,
      2: true,
    });
  });

  it("encodes/decodes dynamic args", () => {
    const staticStruct = struct(arg("foo", uint256), arg("bar", bytes4));
    const dynamicFunction = fun("0x423917ce", [
      arg("arg1", array(uint256)),
      arg("arg2", fixedArray(array(uint256), 10)),
      arg(
        "arg3",
        struct(
          arg("foo", uint256),
          arg("bar", array(uint256)),
          arg("str", staticStruct)
        )
      ),
      arg("arg4", staticStruct),
    ]);
    const args = [
      [100n, 2n],
      [[], [1n], [], [], [100n, 2n, 3n], [], [], [1337n], [], []],
      {
        foo: 100n,
        bar: [1n, 2n, 3n],
        str: {
          foo: 123n,
          bar: Buffer.from([0x12, 0x34, 0x56, 0x78]),
        },
      },
      {
        foo: 100n,
        bar: Buffer.from([0x12, 0x34, 0x56, 0x78]),
      },
    ] as const;
    const viemArgs = [
      [100n, 2n],
      [[], [1n], [], [], [100n, 2n, 3n], [], [], [1337n], [], []],
      {
        foo: 100n,
        bar: [1n, 2n, 3n],
        str: {
          foo: 123n,
          bar: "0x12345678",
        },
      },
      {
        foo: 100n,
        bar: "0x12345678",
      },
    ] as const;

    const calldata = dynamicFunction.encode(...args);
    const expected = encodeFunctionData({
      abi: [
        {
          name: "foo",
          type: "function",
          inputs: [
            { name: "arg1", type: "uint256[]" },
            { name: "arg2", type: "uint256[][10]" },
            {
              name: "arg3",
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
            {
              name: "arg4",
              type: "tuple",
              components: [
                { name: "foo", type: "uint256" },
                { name: "bar", type: "bytes4" },
              ],
            },
          ],
        },
      ],
      functionName: "foo",
      args: viemArgs,
    });
    expect(calldata).toBe(expected);

    expect(dynamicFunction.decode(calldata)).toStrictEqual({
      arg1: args[0],
      arg2: args[1],
      arg3: args[2],
      arg4: args[3],
    });
  });
});
