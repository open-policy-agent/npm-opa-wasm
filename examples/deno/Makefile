all: build run

build: test.wasm

test.wasm: test.rego
	opa build -t wasm -e test/p $<
	tar zxvf bundle.tar.gz /policy.wasm
	mv policy.wasm test.wasm
	touch test.wasm
	rm bundle.tar.gz

run:
	deno run --allow-read=test.wasm main.ts