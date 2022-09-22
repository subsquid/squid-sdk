process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@npx squid-graphql-server \
		--subscriptions --subscription-poll-interval 1000 \
		--dumb-cache redis


migrate:
	@npx squid-typeorm-migration apply


migration:
	@npx squid-typeorm-migration generate


codegen:
	@npx squid-typeorm-codegen


typegen:
	@npx squid-substrate-typegen typegen.json


up:
	@docker-compose up -d


down:
	@docker-compose down -v


.PHONY: process serve start codegen migration migrate up down
