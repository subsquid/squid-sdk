process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@npx squid-graphql-server


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


typegen:
	@npx squid-evm-typegen src/abi \
		erc721.json \
		0xBB9bc244D798123fDe783fCc1C72d3Bb8C189413#something \
		--multicall \
		--clean


codegen:
	@npx squid-typeorm-codegen


up:
	@docker-compose up -d


down:
	@docker-compose down -v


build:
	@npm run build


.PHONY: process serve migrate migration codegen typegen up down build
