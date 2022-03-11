process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@npx squid-graphql-server


migrate:
	@npx sqd db:migrate


migration:
	@npx sqd db:create-migration Data


codegen:
	@npx sqd codegen


up:
	@docker-compose up -d


down:
	@docker-compose down


.PHONY: process serve migrate migration codegen up down
