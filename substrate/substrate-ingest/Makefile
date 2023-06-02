DB="postgres://postgres:postgres@localhost:29387/archive"


kusama:
	@node lib/main.js --out $(DB) \
		-e https://kusama-rpc.polkadot.io \
		-c 20 \
		-e wss://kusama.api.onfinality.io/public-ws \
		-c 20 \
		--prom-port 0 \
		--write-batch-size 30


kintsugi:
	@node lib/main.js --out $(DB) \
		-e wss://kintsugi.api.onfinality.io/public-ws \
		-c 20 \
		-e wss://api-kusama.interlay.io/parachain \
		-c 20 \
		--start-block 1049400


moonriver:
	@node lib/main.js --out $(DB) \
		-e wss://moonriver.api.onfinality.io/public-ws \
		-e wss://moonriver-rpc.dwellir.com \
		-e wss://wss.api.moonriver.moonbeam.network/ \
		-c 20 \
		--write-batch-size 20 \
		--start-block 2000000


moonbeam:
	@node lib/main.js --out $(DB) \
		-e wss://moonbeam.api.onfinality.io/public-ws \
		--write-batch-size 20 \
		--start-block 610238


karura:
	@node lib/main.js --out $(DB) \
		-e wss://karura.api.onfinality.io/public-ws \
		-e wss://karura-rpc.dwellir.com \
		-e wss://karura.polkawallet.io \
		--write-batch-size 20


astar:
	@node lib/main.js --out $(DB) \
		-e wss://astar.api.onfinality.io/public-ws \
		-e wss://astar-rpc.dwellir.com \
		--write-batch-size 20 \
		--start-block 234198


shibuya:
	@node lib/main.js --out $(DB) \
		-e wss://rpc.shibuya.astar.network/ \
		-e wss://shibuya-rpc.dwellir.com/ \
		--write-batch-size 20 \
		--start-block 816402


crab:
	@node lib/main.js --out $(DB) \
		-e wss://crab-rpc.darwinia.network \
		-c 50 \
		--types-bundle crab.temp.json


mangata:
	@node lib/main.js --out $(DB) \
		-e wss://mangata-x.api.onfinality.io/public-ws
		-c 10


reef:
	@node lib/main.js --out $(DB) \
		-e wss://rpc.reefscan.com/ws \
		-c 20 \
		--prom-port 0 \
		--write-batch-size 30 \
		--start-block 4500000

polymesh:
	@node lib/main.js --out $(DB) \
		-e wss://mainnet-rpc.polymesh.network \
		-c 10 \
		--start-block 390000 \
		--disable-call-unwraping

up:
	@docker-compose up -d


down:
	@docker-compose down


.PHONY: up down kusama moonriver moonbeam karura astar shibuya crab mangata reef
