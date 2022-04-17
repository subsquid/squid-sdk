test:
	npx mocha -r dotenv/config ./dist/test/*.test.js

up:
	@docker-compose up -d 2>&1

down:
	@docker-compose down 2>&1

logs:
	@docker logs "$$(basename $$(pwd))_db_1" -f

build: clean
	@npx tsc

clean:
	@rm -rf dist

.PHONY: up down logs test build clean
