test: up
	npx mocha -r dotenv/config ./lib/test/*.test.js

up:
	@docker-compose up -d

down:
	@docker-compose down

logs:
	@docker logs "$$(basename $$(pwd))_db_1" -f

build:
	@rm -rf lib
	@npx tsc
	@cp src/test/resolvers-extension/schema.graphql lib/test/resolvers-extension
	@cp src/test/check-extension/schema.graphql lib/test/check-extension

.PHONY: up down logs test build
