

polkadot-versions:
	npx squid-substrate-metadata-explorer \
		--chain wss://rpc.polkadot.io \
		--archive https://polkadot.indexer.gc.subsquid.io/v4/graphql \
		--out polkadot/versions.json


kusama-versions:
	npx squid-substrate-metadata-explorer \
		--chain wss://kusama-rpc.polkadot.io \
		--archive https://kusama.indexer.gc.subsquid.io/v4/graphql \
		--out kusama/versions.json


.PHONY: polkadot-versions kusama-versions
