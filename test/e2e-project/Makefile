process:
	@npx sqd db:migrate
	@node -r dotenv/config lib/process.js

serve:
	@npx squid-graphql-server

codegen:
	@npx sqd codegen

migration:
	@npx sqd db:create-migration Initial

HASURA := $(shell if [ "$$(uname -m)" == "arm64" ]; then echo "fedormelexin/graphql-engine-arm64:v2.0.10.cli-migrations-v3"; else echo "hasura/graphql-engine:v2.0.10.cli-migrations-v3"; fi)

up:
	@docker-compose build --build-arg HASURA="$(HASURA)"
	@docker-compose up

down:
	@docker-compose down

.PHONY: process serve codegen migration up down
