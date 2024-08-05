import { Connection, RpcRequest, RpcResponse } from "../interfaces";


export abstract class Provider implements Connection {


  constructor() {}

  abstract close(err?: Error): void;
  abstract connect(): Promise<void>;
  abstract call(req: RpcRequest, timeout?: number): Promise<RpcResponse>;
  abstract batchCall(batch: RpcRequest[], timeout?: number): Promise<RpcResponse[]>;
}