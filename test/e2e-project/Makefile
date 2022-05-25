SHELL := /bin/bash

process: migrate
	@node -r dotenv/config lib/process.js


serve:
	@npx squid-graphql-server


build:
	@npm run build


codegen:
	@npx sqd codegen


typegen:
	@npx squid-substrate-typegen typegen.json


migration:
	@npx sqd db:create-migration Data


migrate:
	@npx sqd db:migrate


ingest:
	@source .env && npx squid-substrate-ingest \
		-e "$${CHAIN_ENDPOINT}" \
		--out "$${ARCHIVE_DB_URL}" \
		--types-bundle typesBundle.json


explore:
	@source .env && npx squid-substrate-metadata-explorer \
		--chain "$${CHAIN_ENDPOINT}" \
		--out chainVersions.json


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


re-process:
	npx sqd db:drop
	npx sqd db:create
	make process


.PHONY: process serve start codegen typegen migration migrate archive explore up logs down init re-process
