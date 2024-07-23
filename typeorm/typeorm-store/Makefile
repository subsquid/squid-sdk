test:
	@echo POSTGRES
	@npx jest --runInBand --runTestsByPath lib/test/*.test.js --forceExit --bail
	@echo COCKROACH
	@DB_TYPE=cockroach DB_PORT=27437 npx jest --runInBand --runTestsByPath lib/test/*.test.js --forceExit --bail
	@echo SQLITE
	@DB_TYPE=sqlite DB_URL=./squid.db npx jest --runInBand --runTestsByPath lib/test/*.test.js --forceExit --bail

up:
	@docker-compose up -d 2>&1


down:
	@docker-compose down -v 2>&1


.PHONY: test up down
