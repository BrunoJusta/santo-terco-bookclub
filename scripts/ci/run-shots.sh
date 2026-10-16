#!/usr/bin/env bash
# Corre dentro de `firebase emulators:exec`: semeia o emulador, arranca a app e tira screenshots.
set -uo pipefail
mkdir -p shots
npx tsx scripts/ci/demo-seed.ts > shots/seed.txt 2>&1 || { cat shots/seed.txt; }
npx next start -p 3000 > shots/next-log.txt 2>&1 &
for i in $(seq 1 60); do curl -sf http://localhost:3000/robots.txt > /dev/null && break; sleep 1; done
curl -s http://localhost:3000/ -o shots/home.html -w "%{http_code}\n" > shots/home-status.txt || true
node scripts/ci/screenshots.mjs http://localhost:3000 shots > shots/console.txt 2>&1
code=$?
sleep 1
exit $code
