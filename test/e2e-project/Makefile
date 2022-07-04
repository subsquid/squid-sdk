SHELL := /bin/bash

process: migrate
	@node -r dotenv/config lib/process.js


serve:
	@npx squid-graphql-server


build:
	@npm run build


codegen:
	@npx squid-typeorm-codegen


typegen:
	@npx squid-substrate-typegen typegen.json


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


ingest:
	@source .env && npx squid-substrate-ingest \
		-e "$${CHAIN_ENDPOINT}" \
		--out "$${ARCHIVE_DB_URL}" \
		--types-bundle typesBundle.json


explore:
	@source .env && npx squid-substrate-metadata-explorer \
		--chain "$${CHAIN_ENDPOINT}" \
		--out chainSpecVersions.jsonl


up:
	@docker compose up -d


logs:
	@docker compose logs --tail all -f


down:
	@docker compose down


init:
	make down
	make up && sleep 1
	rm -rf db src/types src/model chainVersions.json
	make codegen
	make explore
	make typegen
	make build
	make migration


.PHONY: process serve start codegen typegen migration migrate archive explore up logs down init
