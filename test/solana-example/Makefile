process: migrate
	@npx node -r dotenv/config lib/main.js


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


.PHONY: process start codegen migration migrate up down
