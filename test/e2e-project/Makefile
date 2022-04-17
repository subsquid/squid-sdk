process: migrate
	@node -r dotenv/config lib/process.js


serve:
	@npx squid-graphql-server


start:
	@npx dotenv ./entrypoint.sh


codegen:
	@./node_modules/.bin/sqd codegen


typegen:
	@npx squid-substrate-typegen typegen.json


migration:
	@npx sqd db:create-migration Data


migrate:
	@npx sqd db:migrate

up:
	@docker-compose up -d

logs:
	@docker-compose logs --tail all -f


down:
	@docker-compose down


.PHONY: process serve start codegen typegen migration migrate up logs down
