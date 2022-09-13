process: migrate
	@node -r dotenv/config lib/processor.js


serve:
	@SQD_DEBUG=graphl-server:server npx squid-graphql-server --subscriptions --cache redis --cache-ttl 5000 --subscription-poll-interval 1000


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
