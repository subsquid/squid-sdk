import { describe, expect, it } from "vitest";
import { encodeAbiParameters, encodeEventTopics, parseAbiItem } from "viem";
import {
  arg,
  bool,
  bytes,
  indexed,
  string,
  struct,
  uint256,
  event as _event,
} from "../index";

describe("Event", () => {
  it("decodes simple args", () => {
    const topics = encodeEventTopics({
      abi: [parseAbiItem("event Test(uint256 indexed a, uint256 b)")],
      eventName: "Test",
      args: { a: 123n },
    });
    const event = _event(
      topics[0],
      indexed(arg("a", uint256)),
      arg("b", uint256)
    );
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
    const event = _event(
      topics[0],
      indexed(arg("a", string)),
      arg("b", string),
      arg("c", bytes),
      arg("d", struct(uint256, string)),
      indexed(arg("e", bool))
    );
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
      a: Buffer.from(topics[1].slice(2), "hex"),
      b: "hello",
      c: Buffer.from([0x12, 0x34]),
      d: { 0: 100n, 1: "world" },
      e: true,
    });
  });
});
