import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";

let app: FirebaseApp | null = null;

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
  return getAuth(app);
}

export function googleProvider(): GoogleAuthProvider {
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ hd: "sogrape.pt", prompt: "select_account" });
  return p;
}
