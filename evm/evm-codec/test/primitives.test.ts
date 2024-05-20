import {describe, expect, it} from "vitest";
import {bytes32, Sink, Src, string, uint256} from "../src";

describe('Strings', () => {
  it('should encode and decode strings', async () => {
    const sink = new Sink(1)
    string.encode(sink, 'hello')
    expect(sink.toString()).toEqual('0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000568656c6c6f000000000000000000000000000000000000000000000000000000')
    expect(string.decode(new Src(sink.result()))).toEqual('hello');
  });

  it('should encode and decode empty string', async () => {
    const sink = new Sink(1)
    string.encode(sink, '')
    expect(sink.toString()).toEqual('0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000')
    expect(string.decode(new Src(sink.result()))).toEqual('');
  });

  it('should fail on decoding invalid data', async () => {
    let sink = new Sink(1)
    uint256.encode(sink, 1337)
    expect(() => string.decode(new Src(sink.result()))).toThrow('Unexpected pointer location: 0x539. Attempting to read string from 0x0000000000000000000000000000000000000000000000000000000000000539')
    sink = new Sink(1)
    bytes32.encode(sink, '0x4b45590000000000000000000000000000000000000000000000000000000000')
    expect(() => string.decode(new Src(sink.result()))).toThrow('Unexpected end of input. Attempting to read string of length 3.404599034663955e+76 from 0x4b45590000000000000000000000000000000000000000000000000000000000')
  });
});
