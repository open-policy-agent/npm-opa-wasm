#!/bin/bash
set -e

npm run types

cd examples/nodejs-ts-app

echo "Installing dependencies..."
npm ci

echo "Building wasm bundle..."
npm run build

echo "Running tests..."
echo -n "When input.message == world, return hello == true "
if npm start --silent -- '{ "message": "world" }' | jq -e '.[0].result' >/dev/null; then
  echo "✔"
else
  echo "✖"
  fail=1
  fi

echo -n "When input.message != world, return hello == false "
if npm start --silent -- '{ "message": "not-world" }' | jq -e '.[0].result | not' >/dev/null; then
  echo "✔"
else
  echo "✖"
  fail=1
fi

exit $fail
