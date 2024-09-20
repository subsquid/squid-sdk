test:
	npx mocha -r dotenv/config ./lib/test/*.test.js --exit --timeout 10000


test-cockroach:
	@DB_TYPE=cockroach make test


up:
	@docker compose up -d 2>&1


down:
	@docker compose down -v 2>&1


logs:
	@docker logs "$$(basename $$(pwd))_db_1" -f


build: clean
	@npx tsc


clean:
	@rm -rf dist


.PHONY: up down logs test test-cockroach build clean
