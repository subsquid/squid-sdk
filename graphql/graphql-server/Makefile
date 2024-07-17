test:
	npx mocha -r dotenv/config ./lib/test/*.test.js --exit --timeout 20000

codegen:
	@#cd src/test/check-extension && npx squid-typeorm-codegen
	@#cd src/test/resolvers-extension && npx squid-typeorm-codegen
	@node ../../typeorm/typeorm-codegen/bin/run.js --out ./src/test/check-extension/lib/model --project-dir src/test/check-extension
	@node ../../typeorm/typeorm-codegen/bin/run.js --out ./src/test/resolvers-extension/lib/model --project-dir src/test/resolvers-extension

test-cockroach:
	@DB_TYPE=cockroach DB_PORT=$(DB_PORT_COCKROACH) make test

up:
	@docker-compose up -d 2>&1

down:
	@docker-compose down 2>&1

logs:
	@docker logs "$$(basename $$(pwd))_db_1" -f

build:
	@rm -rf lib
	@npx tsc
	@cp src/test/resolvers-extension/schema.graphql lib/test/resolvers-extension
	@cp src/test/check-extension/schema.graphql lib/test/check-extension

.PHONY: up down logs test test-cockroach build
