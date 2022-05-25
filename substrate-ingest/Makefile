DB="postgres://postgres:postgres@localhost:29387/archive"


kusama:
	@node lib/main.js --out $(DB) \
		-e wss://kusama-rpc.polkadot.io \
		-c 10 \
		-e wss://kusama-rpc.dwellir.com \
		-c 10 \
		-e wss://kusama.api.onfinality.io/public-ws \
		-c 10 \
		--prom-port 0 \
		--write-batch-size 10 \
		--start-block 10000000


moonriver:
	@node lib/main.js --out $(DB) \
		-e wss://moonriver.api.onfinality.io/public-ws \
		-e wss://moonriver-rpc.dwellir.com \
		-e wss://wss.api.moonriver.moonbeam.network/ \
		--write-batch-size 20 \
		--start-block 0


up:
	@docker-compose up -d


down:
	@docker-compose down


.PHONY: up down kusama moonriver
