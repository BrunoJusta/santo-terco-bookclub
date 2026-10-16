import "server-only";
import { cert, getApps, initializeApp, type App, type Credential } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

export const DATABASE_ID = process.env.FIREBASE_DATABASE_ID || "santo-terco-bookclub-prod";
export const STORAGE_PREFIX = (process.env.FIREBASE_STORAGE_PREFIX || "santo-terco-bookclub-prod").replace(/\/+$/, "");

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
        (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.FIRESTORE_EMULATOR_HOST),
  );
}

function credential(): Credential | undefined {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return cert(json);
  }
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }
  return undefined; // Application Default Credentials ou emulador
}

function app(): App {
  const existing = getApps().find((a) => a.name === "santo-terco");
  if (existing) return existing;
  const cred = credential();
  return initializeApp(
    {
      // Sem chave explícita (emulador ou ADC) a propriedade não pode existir, nem como undefined.
      ...(cred ? { credential: cred } : {}),
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    },
    "santo-terco",
  );
}

const g = globalThis as unknown as { __stDb?: Firestore };

export function db(): Firestore {
  if (!g.__stDb) {
    const firestore = getFirestore(app(), DATABASE_ID);
    firestore.settings({ ignoreUndefinedProperties: true });
    g.__stDb = firestore;
  }
  return g.__stDb;
}

export function adminAuth() {
  return getAuth(app());
}

export function bucket() {
  return getStorage(app()).bucket(process.env.FIREBASE_STORAGE_BUCKET);
}

export const col = {
  members: () => db().collection("members"),
  books: () => db().collection("books"),
  reviews: () => db().collection("reviews"),
  wines: () => db().collection("wines"),
  polls: () => db().collection("polls"),
  ballots: () => db().collection("ballots"),
  config: () => db().collection("config"),
};
