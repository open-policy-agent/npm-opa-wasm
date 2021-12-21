#!/bin/bash
# Generates browser compatible versions of the package with dependencies
# bundled as well as the type declaration.
set -euo pipefail

entrypoint=./src/opa.js
outdir=./dist
package=$(node -pe 'require("./package.json").name.split("/").pop()')

if [[ ! -x $(npm bin)/esbuild || ! -x $(npm bin)/tsc ]]; then
  echo "Installing dependencies…"
  npm install
fi

echo "Generating default browser build…"
$(npm bin)/esbuild $entrypoint \
  --outfile=$outdir/$package-browser.js \
  --bundle \
  --sourcemap \
  --minify \
  --format=iife \
  --platform=browser \
  --define:global=window \
  --global-name=opa

echo "Generating esm browser build…"
$(npm bin)/esbuild $entrypoint \
  --outfile=$outdir/$package-browser.esm.js \
  --bundle \
  --sourcemap \
  --minify \
  --format=esm \
  --platform=browser \
  --define:global=window

echo "Generating TypeScript declaration file…"
$(npm bin)/tsc ./src/index.mjs \
  --declaration \
  --allowJs \
  --emitDeclarationOnly \
  --outDir $outdir
