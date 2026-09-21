# @subsquid/rpc-client

Lightweight [JSON-RPC](https://www.jsonrpc.org) client library.

## Endpoint redaction

`RpcClient.url` is safe to include in logs and metrics: user information, query
parameters, fragments, and key-like path segments are removed or masked. The
transport still uses the original URL supplied to the constructor.

`RpcClient` also overrides any `rpcUrl` context on a supplied custom logger with
this safe value. Use `redactRpcUrl(url)` for endpoint fields logged outside the
client.
