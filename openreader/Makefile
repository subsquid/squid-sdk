test: up
	npx mocha -r dotenv/config ./dist/test/*.test.js

up:
	@docker-compose up -d

down:
	@docker-compose down

logs:
	@docker logs "$$(basename $$(pwd))_db_1" -f

build: clean
	@npx tsc

clean:
	@rm -rf dist

.PHONY: up down logs test build clean
