kusama-test:
	@node lib/main.js \
		-e https://kusama-rpc.polkadot.io \
		--dest s3://kusama-test \
		--first-block 18000000

westend-local:
	@node lib/main.js \
		-e https://westend-rpc.dwellir.com \
		--dest data.temp \
		--first-block 16000000 \
		--with-trace state \
		--chunk-size 32


.PHONY: kusama-test westend-local
