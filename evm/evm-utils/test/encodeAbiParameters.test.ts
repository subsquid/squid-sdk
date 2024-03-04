import {describe, expect, it} from "vitest";
import {decodeAbiParameters} from "../src/decodeAbiParameters";
import {encodeAbiParameters as check} from "viem";
import {encodeAbiParameters} from "../src/encodeAbiParameters";

describe("decodeAbiParameters", () => {
  const t = (type: string) => ({type})

  it("encodes strings", () => {
    const types = [t('string')];
    const values = ['hello'.repeat(100)];
    const data = encodeAbiParameters(types, values)
    expect(data).toBe(check(types, values))
    expect(decodeAbiParameters(types, data)).toStrictEqual(values)
  })

  it("decodes nested tuples", () => {
    const types = [{
      type: 'tuple',
      components: [
        t('uint8'),
        t('bool'),
        {
          type: 'tuple',
          components: [
            t('string'),
          ]
        },
        t('address'),
      ]
    }];
    const values = [
      [1, true, ['hello'], '0x9401e5e6564db35c0f86573a9828df69fc778af1'],
    ];
    const data = encodeAbiParameters(types, values)
    expect(data).toBe(check(types, values))
    expect(decodeAbiParameters(types, data)).toStrictEqual(values)
  })
})
