import { AbiFunction } from "./abi-components/function";
import { Struct, StructTypes } from "./codec";

export interface Chain {
  client: {
    call: <T = any>(method: string, params?: unknown[]) => Promise<T>;
  };
}

export interface ChainContext {
  _chain: Chain;
}

export interface BlockContext {
  _chain: Chain;
  block: Block;
}

export interface Block {
  height: number;
}

export class ContractBase {
  private readonly _chain: Chain;
  private readonly blockHeight: number;
  readonly address: string;

  constructor(ctx: BlockContext, address: string);
  constructor(ctx: ChainContext, block: Block, address: string);
  constructor(
    ctx: BlockContext,
    blockOrAddress: Block | string,
    address?: string
  ) {
    this._chain = ctx._chain;
    if (typeof blockOrAddress === "string") {
      this.blockHeight = ctx.block.height;
      this.address = blockOrAddress;
    } else {
      if (address == null) {
        throw new Error("missing contract address");
      }
      this.blockHeight = blockOrAddress.height;
      this.address = address;
    }
  }

  async eth_call<const T extends Struct, R>(
    func: AbiFunction<T, R>,
    args: StructTypes<T>
  ): Promise<R> {
    let data = func.encode(args);
    let result = await this._chain.client.call("eth_call", [
      { to: this.address, data },
      "0x" + this.blockHeight.toString(16),
    ]);
    return func.decodeResult(result);
  }
}
