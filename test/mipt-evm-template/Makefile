up:
	@docker compose up -d


down:
	@docker compose down -v


db:
	@cat db.sql | docker run -i \
		--network="$(notdir $(shell pwd))_default" \
		--entrypoint clickhouse-client \
		clickhouse:lts-jammy \
		--host clickhouse \
		--password 123


abi:
	@npx squid-evm-typegen src/abi abi/*.json


.PHONY: up down db abi
