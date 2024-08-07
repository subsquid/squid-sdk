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

up:
	@docker compose up -d

down:
	@docker compose down -v
