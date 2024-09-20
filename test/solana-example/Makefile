process: migrate
	@npx node -r dotenv/config lib/main.js


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


codegen:
	@npx squid-typeorm-codegen


typegen:
	@npx squid-solana-typegen ./src/abi whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc#whirlpool ./idl/*.json

up:
	@docker compose up -d


down:
	@docker compose down -v


.PHONY: process start codegen migration migrate up down
