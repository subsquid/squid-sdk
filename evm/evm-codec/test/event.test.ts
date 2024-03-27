import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from "viem";
import {
  bool,
  bytes,
  indexed,
  string,
  struct,
  uint256,
  event as _event,
} from "../src";

describe("Event", () => {
  it("decodes simple args", () => {
    const topics = encodeEventTopics({
      abi: [parseAbiItem("event Test(uint256 indexed a, uint256 b)")],
      eventName: "Test",
      args: { a: 123n },
    });
    const event = _event(topics[0], {
      a: indexed(uint256),
      b: uint256,
    });
    const decoded = event.decode({
      topics,
      data: encodeAbiParameters([{ type: "uint256" }], [100n]),
    });
    expect(decoded).toEqual({ a: 123n, b: 100n });
  });

  it("decodes complex args", () => {
    const topics = encodeEventTopics({
      abi: [
        parseAbiItem(
          "event Test(string indexed a, string b, bytes c, (uint256, string) d, bool indexed e)"
        ),
      ],
      eventName: "Test",
      args: { a: "xdxdxd", e: true },
    });
    const event = _event(topics[0], {
      a: indexed(string),
      b: string,
      c: bytes,
      d: struct({ _0: uint256, _1: string }),
      e: indexed(bool),
    });
    const decoded = event.decode({
      topics,
      data: encodeAbiParameters(
        [
          { type: "string" },
          { type: "bytes" },
          {
            type: "tuple",
            components: [{ type: "uint256" }, { type: "string" }],
          },
        ],
        ["hello", "0x1234", [100n, "world"]]
      ),
    });
    expect(decoded).toEqual({
      a: topics[1],
      b: "hello",
      c: "0x1234",
      d: { _0: 100n, _1: "world" },
      e: true,
    });
  });
});
