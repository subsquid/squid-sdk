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
	@npx sqd db:create-migration Initial


migrate:
	@npx sqd db:migrate


HASURA := $(shell if [ "$$(uname -m)" == "arm64" ]; then echo "fedormelexin/graphql-engine-arm64:v2.0.10.cli-migrations-v3"; else echo "hasura/graphql-engine:v2.0.10.cli-migrations-v3"; fi)


up:
	@docker-compose build --build-arg HASURA="$(HASURA)"
	@docker-compose up -d


logs:
	@docker-compose logs --tail all -f


down:
	@docker-compose down


.PHONY: process serve start codegen typegen migration migrate up logs down
