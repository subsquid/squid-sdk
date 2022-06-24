test:
	npx mocha -r dotenv/config ./lib/test/*.test.js --exit

test-cockroach:
	@DB_TYPE=cockroach make test

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
