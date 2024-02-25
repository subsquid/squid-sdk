import {describe, expect, it} from "vitest";
import {encodeAbiParameters, encodeEventTopics, parseAbiItem, toEventSelector} from "viem";
import {LogEvent} from "../src/abi.support";

describe("LogEvent", () => {
  function createEvent<T extends [string, any][]>(event: any) {
    const topic = toEventSelector(event);
    return new LogEvent<T>(topic, event.inputs)
  }

  function expectToContain(value: any, expected: any) {
    if ('length' in expected) {
      expect(value).toHaveLength(expected.length)
    }
    for (let i in expected) {
      expect(value[i], `at index ${i}`).toStrictEqual(expected[i])
    }
  }

  it('decodes params of simple event', () => {
    const event = parseAbiItem('event Transfer(address indexed from, uint256 value, uint8 flag, bool success, address indexed to)');

    const logEvent = createEvent<
      [['from', string], ['value', bigint], ['flag', number], ['success', boolean], ['to', string]]
    >(event);
    const topics = encodeEventTopics({
      abi: [event],
      args: {
        from: '0x9401e5e6564db35c0f86573a9828df69fc778af1',
        to: '0x1001e5e6564db35c0f86573a9828df69fc778af1',
      }
    })
    const data = encodeAbiParameters(event.inputs.slice(1, -1), [100n, 15, true])
    const t = logEvent.decode({topics, data});
    expectToContain(t, [
      '0x9401e5e6564db35c0f86573a9828df69fc778af1',
      100n,
      15,
      true,
      '0x1001e5e6564db35c0f86573a9828df69fc778af1',
    ])
    expectToContain(t, {
      value: 100n,
      flag: 15,
      success: true,
      from: '0x9401e5e6564db35c0f86573a9828df69fc778af1',
      to: '0x1001e5e6564db35c0f86573a9828df69fc778af1'
    })
  });

  it('decodes dynamic length params', () => {
    const event = parseAbiItem('event SomethingBig(string a, string indexed indexedString, bytes b, bytes indexed indexedBytes, bytes4 indexed c)');

    const logEvent = createEvent<
      [['a', string], ['b', Uint8Array], ['c', string]]
    >(event);
    const topics = encodeEventTopics({
      abi: [event],
      args: {
        indexedString: 'world',
        indexedBytes: '0x9876',
        c: '0xdeadbeef'
      }
    })
    const data = encodeAbiParameters([event.inputs[0], event.inputs[2]], ['hello', '0x1234']);
    const t = logEvent.decode({topics, data});
    expectToContain(t, [
      'hello',
      '0x8452c9b9140222b08593a26daa782707297be9f7b3e8281d7b4974769f19afd0',
      '0x1234',
      '0xe2f884a85df4ad7a73f7b7e4091f440e1597c9a36083444607c9e9d9163aeed2',
      '0xdeadbeef',
    ])
    expectToContain(t, {
      a: 'hello',
      indexedString: '0x8452c9b9140222b08593a26daa782707297be9f7b3e8281d7b4974769f19afd0',
      b: '0x1234',
      indexedBytes: '0xe2f884a85df4ad7a73f7b7e4091f440e1597c9a36083444607c9e9d9163aeed2',
      c: '0xdeadbeef'
    })
  });

  it('decodes tuples', () => {
    const event = parseAbiItem([
      'event SomeEvent(Str foo)',
      'struct Str { string a; bool b; string c; Other d; }',
      'struct Other { uint256 bar; }',
    ]);

    const logEvent = createEvent<
      [['foo', {
        a: string,
        b: boolean,
        c: string,
        d: {
          bar: bigint
        }
      }]]
    >(event);
    const topics = encodeEventTopics({
      abi: [event],
    })
    const data = encodeAbiParameters(event.inputs, [{
      a: 'hello',
      b: true,
      c: 'world',
      d: {bar: 100n}
    }]);
    const t = logEvent.decode({topics, data});
    expectToContain(t, [{
      a: 'hello',
      b: true,
      c: 'world',
      d: {bar: 100n}
    }])
    expectToContain(t, {
      foo: {
        a: 'hello',
        b: true,
        c: 'world',
        d: {
          bar: 100n
        }
      }
    })
  });
})
