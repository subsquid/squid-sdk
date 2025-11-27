up:
	@docker compose up -d


down:
	@docker compose down -v


abi:
	@npx squid-evm-typegen src/abi abi/*.json


.PHONY: up down abi
