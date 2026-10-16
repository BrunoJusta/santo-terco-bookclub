import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

let app: FirebaseApp | null = null;
let emulatorConnected = false;

export function isClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
}

/** Firebase no browser é usado só para o login Google do backoffice. */
export function clientAuth(): Auth {
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
  }
  const auth = getAuth(app);
  // Só em CI/desenvolvimento: NEXT_PUBLIC_AUTH_EMULATOR_HOST nunca deve existir no Vercel.
  const emu = process.env.NEXT_PUBLIC_AUTH_EMULATOR_HOST;
  if (emu && !emulatorConnected) {
    connectAuthEmulator(auth, `http://${emu}`, { disableWarnings: true });
    emulatorConnected = true;
  }
  return auth;
}

export function googleProvider(): GoogleAuthProvider {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ hd: "sogrape.pt", prompt: "select_account" });
  return p;
}
