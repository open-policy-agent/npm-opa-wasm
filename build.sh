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
npx esbuild $entrypoint \
  --outfile=$outdir/$package-browser.js \
  --bundle \
  --sourcemap \
  --minify \
  --format=iife \
  --platform=browser \
  --define:global=window \
  --global-name=opa \
  --external:util

echo "Generating esm browser build…"
npx esbuild $entrypoint \
  --outfile=$outdir/$package-browser.esm.js \
  --bundle \
  --sourcemap \
  --minify \
  --format=esm \
  --platform=browser \
  --define:global=window \
  --external:util

echo "Generating TypeScript declaration file…"
npx tsc ./src/index.mjs \
  --declaration \
  --allowJs \
  --emitDeclarationOnly \
  --outDir $outdir/types

mv $outdir/types/opa.d.ts $outdir/types/opa.d.mts
cp $outdir/types/opa.d.mts $outdir/types/opa.d.cts
