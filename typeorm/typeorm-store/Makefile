test:
	@echo POSTGRES
	@npx jest --runInBand --runTestsByPath lib/test/*.test.js --forceExit
	@echo COCKROACH
	@DB_PORT=27437 npx jest --runInBand TestsByPath lib/test/*.test.js --forceExit


up:
	@docker-compose up -d 2>&1


down:
	@docker-compose down -v 2>&1


.PHONY: test up down
