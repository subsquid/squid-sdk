process: migrate
	@npx node -r dotenv/config lib/main.js


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


codegen:
	@npx squid-typeorm-codegen


typegen:
	@npx squid-evm-typegen src/abi erc20.json


serve:
	@npx squid-graphql-server


up:
	@docker compose up -d


down:
	@docker compose down -v


.PHONY: process migrate migration codegen typegen serve up down
