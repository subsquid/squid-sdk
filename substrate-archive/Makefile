DB="postgres://postgres:postgres@localhost:29387/archive"
COCKROACH="postgres://root@localhost:26257/kusama_archive"


kusama:
	@node lib/main.js --out $(COCKROACH) \
		-e wss://kusama-rpc.polkadot.io \
		-e wss://kusama-rpc.polkadot.io \
		-e wss://kusama-rpc.polkadot.io \
		-e wss://kusama-rpc.dwellir.com \
		-e wss://kusama-rpc.dwellir.com \
		-e wss://kusama-rpc.dwellir.com \
		-e wss://kusama-rpc.dwellir.com \
		-e wss://kusama.api.onfinality.io/public-ws \
		-e wss://kusama.api.onfinality.io/public-ws \
		-e wss://kusama.api.onfinality.io/public-ws


up:
	@docker-compose up -d


down:
	@docker-compose down


.PHONY: up down
