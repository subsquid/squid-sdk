process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@npx squid-graphql-server


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


typegen:
	@npx squid-evm-typegen --abi erc20.json --output src/erc20.ts


codegen:
	@npx squid-typeorm-codegen


up:
	@docker-compose up -d


down:
	@docker-compose down


build:
	@npm run build


.PHONY: process serve migrate migration codegen typegen up down build
