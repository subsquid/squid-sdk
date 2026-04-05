process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@npx squid-graphql-server


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


codegen:
	@npx squid-typeorm-codegen


typegen:
	@npx squid-evm-typegen src/abi erc20.json uniswap-v2-factory.json uniswap-v2-pair.json


up:
	@docker compose up -d


down:
	@docker compose down -v


test: build


.PHONY: process serve migrate migration codegen typegen up down test
