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
	@npx squid-ink-typegen --abi erc20.json --output src/erc20.ts

up:
	@docker compose up -d

down:
	@docker compose down -v
