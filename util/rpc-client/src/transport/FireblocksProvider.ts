import {
    RpcRequest,
    RpcResponse,
  } from "../interfaces";
  import {
    FireblocksWeb3Provider,
  } from "@fireblocks/fireblocks-web3-provider";
  import { ethers } from "ethers";
  import { FireblocksProviderConfig } from "../client";
  import { RpcProtocolError } from "../errors";
  import { Provider } from "./provider";
  
  export class FireblocksConnection extends Provider {
    private provider: ethers.BrowserProvider;
  
    constructor( fireblocksProviderConfig: FireblocksProviderConfig
    ) {
      super();
      const fbProvider = new FireblocksWeb3Provider({
        apiBaseUrl: fireblocksProviderConfig.apiBaseUrl,
        privateKey: fireblocksProviderConfig.privateKey,
        apiKey: fireblocksProviderConfig.apiKey,
        vaultAccountIds: fireblocksProviderConfig.vaultAccountIds,
        chainId: fireblocksProviderConfig.chainId,
        logTransactionStatusChanges: fireblocksProviderConfig.logTransactionStatusChanges,
      });
  
      const provider = new ethers.BrowserProvider(fbProvider);
      this.provider = provider;
    }
  
    close(err?: Error): void {
      if (err) {
        console.error(err);
      }
    }
  
    connect(): Promise<void> {
      return Promise.resolve();
    }
  
    async call(req: RpcRequest, timeout?: number): Promise<RpcResponse> {
  
      try {
        const result = await this.provider.send(req.method, req.params || []);
        const response: RpcResponse = {
          id: req.id,
          jsonrpc: req.jsonrpc,
          result: result,
        };
        return response;
      } catch (error: any) {
        const errorResponse: RpcResponse = {
          id: req.id,
          jsonrpc: req.jsonrpc,
          error: {
            code: error.code || -32000,
            message: error.message || "Internal error",
          },
        };
        throw errorResponse;
      }
    }
  
    async batchCall(
      batch: RpcRequest[],
      timeout?: number
    ): Promise<RpcResponse[]> {
  
      const promises = batch.map((req) => {
        return this.provider
          .send(req.method, req.params || [])
          .then((response) => ({
            id: req.id,
            jsonrpc: req.jsonrpc,
            result: response,
          }))
          .catch((error) => ({
            id: req.id,
            jsonrpc: req.jsonrpc,
            error: {
              code: error.code || -32000,
              message: error.message || "Internal error",
            },
          }));
      });
  
      const responses = await Promise.all(promises);
      if (!Array.isArray(responses)) {
        throw new RpcProtocolError(1008, `Response for a batch request should be an array`)
      }
      if (responses.length != batch.length) {
          throw new RpcProtocolError(1008, `Invalid length of a batch response`)
      }
      if (responses.length !== batch.length) {
        throw new Error(`Invalid length of a batch response`);
      }
  
      return responses;
    }
  }
  