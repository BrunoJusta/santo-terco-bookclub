#!/usr/bin/env bash
# Corre dentro de `firebase emulators:exec`: semeia o emulador, arranca a app e tira screenshots.
set -euo pipefail
npx tsx scripts/ci/demo-seed.ts
npx next start -p 3000 > next.log 2>&1 &
for i in $(seq 1 60); do curl -sf http://localhost:3000/ > /dev/null && break; sleep 1; done
node scripts/ci/screenshots.mjs http://localhost:3000 shots | tee shots/console.txt
tail -n 80 next.log > shots/next-log.txt || true
