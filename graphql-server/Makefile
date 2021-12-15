test: up
	npx mocha -r dotenv/config ./lib/test/*.test.js

up:
	@docker-compose up -d

down:
	@docker-compose down

logs:
	@docker logs "$$(basename $$(pwd))_db_1" -f

.PHONY: up down logs test
