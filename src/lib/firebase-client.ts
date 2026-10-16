import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, OAuthProvider, type Auth } from "firebase/auth";
import { webConfig } from "./firebase-config";

let app: FirebaseApp | null = null;
let emulatorConnected = false;

export function isClientConfigured(): boolean {
  return Boolean(webConfig.apiKey && webConfig.projectId);
}

/** Firebase no browser é usado só para o login Microsoft do backoffice. */
export function clientAuth(): Auth {
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        apiKey: webConfig.apiKey,
        authDomain: webConfig.authDomain,
        projectId: webConfig.projectId,
        appId: webConfig.appId,
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

/**
 * Login Microsoft (Entra ID) já configurado no Firebase.
 * O tenant limita a página de login às contas da Sogrape; aceita o domínio ou o ID do tenant.
 */
export function microsoftProvider(): OAuthProvider {
  const p = new OAuthProvider("microsoft.com");
  p.setCustomParameters({
    tenant: process.env.NEXT_PUBLIC_MICROSOFT_TENANT || "sogrape.pt",
    prompt: "select_account",
  });
  p.addScope("email");
  return p;
}
