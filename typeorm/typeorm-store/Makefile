test:
	@echo POSTGRES
	@npx mocha -r dotenv/config lib/test/*.test.js --exit --timeout 5000
	@echo COCKROACH
	@DB_PORT=27437 npx mocha -r dotenv/config lib/test/*.test.js --exit --timeout 5000


up:
	@docker-compose up -d 2>&1


down:
	@docker-compose down -v 2>&1


.PHONY: test up down
