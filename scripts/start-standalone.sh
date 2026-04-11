#!/bin/sh
# Wrapper for Next.js standalone output. `next build` does not copy
# .next/static or public/ into .next/standalone/, so we sync them here
# before starting the precompiled server. Mirrors what the Dockerfile
# does at image build time.
set -e
cd "$(dirname "$0")/.."

if [ ! -f .next/standalone/server.js ]; then
  echo "start-standalone.sh: .next/standalone/server.js missing — run 'npm run build' first" >&2
  exit 1
fi

rm -rf .next/standalone/.next/static .next/standalone/public
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public

exec node .next/standalone/server.js
