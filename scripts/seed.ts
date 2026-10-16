/**
 * Seed inicial: 16 membros do Anexo I, regulamento 2026 e admin inicial.
 * Corre uma vez: `npm run seed` (lê as mesmas variáveis do .env.local).
 * É idempotente: não apaga nada e não duplica membros já existentes.
 */
import { readFileSync, existsSync } from "node:fs";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { DEFAULT_RULES, SEED_MEMBERS } from "../src/lib/default-rules";
import { slugify } from "../src/lib/format";
import { parseWebConfig } from "../src/lib/firebase-config";

for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const projectId = process.env.FIREBASE_PROJECT_ID || parseWebConfig(process.env.NEXT_PUBLIC_FIREBASE_CONFIG).projectId;
process.env.FIREBASE_PROJECT_ID = projectId;
const credential = process.env.FIREBASE_SERVICE_ACCOUNT
  ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
  : b64
  ? cert(JSON.parse(Buffer.from(b64, "base64").toString("utf8")))
  : process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
    ? cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") })
    : undefined;
const app = initializeApp({ ...(credential ? { credential } : {}), projectId });
const databaseId = process.env.FIREBASE_DATABASE_ID || "santo-terco-bookclub-prod";
const db = getFirestore(app, databaseId);

async function main() {
  const now = new Date().toISOString();
  console.log(`A semear a base "${databaseId}" do projeto "${process.env.FIREBASE_PROJECT_ID}"...`);

  const existing = await db.collection("members").get();
  const names = new Set(existing.docs.map((d) => String(d.data().name)));
  const batch = db.batch();
  let added = 0;
  for (const m of SEED_MEMBERS) {
    if (names.has(m.name)) continue;
    batch.set(db.collection("members").doc(slugify(m.name)), { ...m, active: true, rodadas: [], createdAt: now });
    added++;
  }

  const rulesRef = db.collection("config").doc("regulamento");
  if (!(await rulesRef.get()).exists) batch.set(rulesRef, { ...DEFAULT_RULES, updatedAt: now });

  const admins = (process.env.ADMIN_BOOTSTRAP_EMAILS || "bruno.justa@sogrape.pt")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const adminsRef = db.collection("config").doc("admins");
  const current = ((await adminsRef.get()).data()?.emails as string[] | undefined) ?? [];
  batch.set(adminsRef, { emails: [...new Set([...current, ...admins])] });

  await batch.commit();
  console.log(`Feito: ${added} membros novos, regulamento e admins (${admins.join(", ")}).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
