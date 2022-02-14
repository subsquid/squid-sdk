DB="postgres://postgres:postgres@localhost:29387/archive"


polkadot:
	@node lib/main.js --chain wss://rpc.polkadot.io --out $DB


up:
	@docker-compose up -d


down:
	@docker-compose down


.PHONY: up down
