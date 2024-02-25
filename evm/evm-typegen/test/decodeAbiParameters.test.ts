import {describe, expect, it} from "vitest";
import {encodeAbiParameters} from "viem";
import {decodeAbiParameters} from "../src/decodeAbiParameters";

describe("decodeAbiParameters", () => {
  const t = (type: string) => ({type})

  it("decodes static types", () => {
    const types = [t('uint8'), t('bool'), t('bool'), t('uint256'), t('address'), t('int128')];
    const values = [2137, true, false, 10n ** 20n, '0x9401e5e6564db35c0f86573a9828df69fc778af1', -(10n ** 20n)];
    const data = encodeAbiParameters(types, values)
    expect(decodeAbiParameters(types, data)).toStrictEqual(values)
  })

  it("decodes dynamic types", () => {
    const types = [t('bytes'), t('string'), t('bytes4')];
    const values = ['0x1234', 'hello', '0xdeadbeef'];
    const data = encodeAbiParameters(types, values)
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
    expect(decodeAbiParameters(types, data)).toStrictEqual(values)
  })
})
