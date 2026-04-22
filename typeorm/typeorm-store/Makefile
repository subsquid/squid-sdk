test:
	@echo POSTGRES
	@npx vitest --run
	@echo COCKROACH
	@DB_PORT=27437 npx vitest --run


up:
	@docker compose up -d 2>&1


down:
	@docker compose down -v 2>&1


.PHONY: test up down
