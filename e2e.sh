#!/bin/bash
set -ueE
trap 'EXIT_CODE=$?; echo "ERR at line ${LINENO} (exit code: $EXIT_CODE)"; exit $EXIT_CODE' ERR

npm run types

cd examples/nodejs-ts-app

echo "Installing dependencies..."
npm ci

echo "Building wasm bundle..."
npm run build

echo "Running tests..."
RESULT="$(npm start --silent -- '{ "message": "world" }' | jq '.[0].result')"
echo "When input.message == world, return hello == true $(if [ $RESULT = "true" ]; then echo "✔" ; else echo "✖"; fi)"

RESULT="$(npm start --silent -- '{ "message": "not-world" }' | jq '.[0].result')"
echo "When input.message != world, return hello == false $(if [ $RESULT = "false" ]; then echo "✔" ; else echo "✖"; fi)"
