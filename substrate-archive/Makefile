run: migrate
	@node lib/run.js index

migrate:
	@node lib/run.js migrate

up:
	@docker-compose up -d

down:
	@docker-compose down

.PHONY: run migrate up down reset
