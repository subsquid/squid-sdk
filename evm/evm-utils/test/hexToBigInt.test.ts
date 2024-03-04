import { expect, describe, it } from "vitest";
import { hexToBigInt } from "../src/decodeAbiParameters";
import { encodeAbiParameters } from "viem";
import { numberToHex } from "../src/encodeAbiParameters";

describe("hexToBigint", () => {
  it("decodes positive numbers", () => {
    expect(
      hexToBigInt(
        "0x0000000000000000000000000000000000000000000000000000000000001234",
        { signed: true }
      )
    ).toBe(0x1234n);
    expect(hexToBigInt("0x00", { signed: true })).toBe(0n);
  });

  it("decodes negative numbers", () => {
    const check = (neg: bigint) =>
      expect(
        hexToBigInt(encodeAbiParameters([{ type: "int256" }], [neg]), {
          signed: true,
        })
      ).toBe(neg);
    check(-1n);
    check(-63n);
    check(-64n);
    check((-1n << 64n) - 1n);
    check(-1n << 64n);
    check(-1n << 255n);
  });
});

describe("bigIntToHex", () => {
  it("encodes positive numbers", () => {
    expect(numberToHex(0x1234n, true)).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000001234"
    );
    expect(numberToHex(0n, true)).toBe(
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    );
  });

  it("encodes negative numbers", () => {
    expect(numberToHex(-1n, true)).toBe(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
    expect(numberToHex(-1, true)).toBe(
      "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
    );
    expect(numberToHex(-1n << 255n, true)).toBe(
      "0x8000000000000000000000000000000000000000000000000000000000000000"
    );
  });
});
