export interface WebConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  appId?: string;
  messagingSenderId?: string;
}

/**
 * Lê NEXT_PUBLIC_FIREBASE_CONFIG: aceita o JSON ou o bloco copiado diretamente da consola Firebase
 * (`const firebaseConfig = { apiKey: "...", ... };`). Variáveis individuais continuam a funcionar como alternativa.
 */
export function parseWebConfig(raw: string | undefined): WebConfig {
  if (!raw) return {};
  const body = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    try {
      const json = body
        .replace(/\/\/.*$/gm, "")
        .replace(/'/g, '"')
        .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
        .replace(/,\s*}/g, "}");
      return JSON.parse(json);
    } catch {
      return {};
    }
  }
}

// A referência literal a process.env.NEXT_PUBLIC_FIREBASE_CONFIG é necessária para o Next a embutir no browser.
const fromBlock = parseWebConfig(process.env.NEXT_PUBLIC_FIREBASE_CONFIG);

export const webConfig: WebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || fromBlock.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || fromBlock.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || fromBlock.projectId,
  storageBucket: fromBlock.storageBucket,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || fromBlock.appId,
};
