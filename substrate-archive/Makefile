DB="postgres://postgres:postgres@localhost:29387/archive"


kusama:
	@node lib/main.js --out $(DB) \
		-e wss://kusama-rpc.polkadot.io \
		-e wss://kusama-rpc.dwellir.com \
		-e wss://kusama.api.onfinality.io/public-ws \
		--prom-port 0 \
		--write-batch-size 10


moonriver:
	@node lib/main.js --out $(DB) \
		-e wss://moonriver.api.onfinality.io/public-ws \
		-e wss://moonriver.api.onfinality.io/public-ws \
		-e wss://moonriver.api.onfinality.io/public-ws \
		--start-block 344698


up:
	@docker-compose up -d


down:
	@docker-compose down


.PHONY: up down kusama moonriver
