import "server-only";
import { adminAuth } from "./firebase";
import { getAdminEmails } from "./data";

export const ALLOWED_DOMAIN = "sogrape.pt";

export function bootstrapAdmins(): string[] {
  return (process.env.ADMIN_BOOTSTRAP_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export class AuthError extends Error {}

/** Valida o ID token do Firebase Auth e confirma que o email é admin do clube. */
export async function requireAdmin(idToken: string): Promise<string> {
  if (!idToken) throw new AuthError("Sessão em falta. Entra outra vez.");
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(idToken);
  } catch {
    throw new AuthError("Sessão expirada. Entra outra vez.");
  }
  const email = (decoded.email || "").toLowerCase();
  // O Firebase marca as contas Microsoft (Entra ID) com email_verified = false; para esse fornecedor
  // a garantia vem do tenant Sogrape no login e da lista de admins abaixo.
  const provider = decoded.firebase?.sign_in_provider;
  const trusted = decoded.email_verified === true || provider === "microsoft.com";
  if (!email || !trusted || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    throw new AuthError(`Só contas @${ALLOWED_DOMAIN} podem gerir o clube.`);
  }
  const admins = new Set([...bootstrapAdmins(), ...(await getAdminEmails())]);
  if (!admins.has(email)) throw new AuthError("Esta conta não tem acesso à Gestão. Pede a um admin para te adicionar.");
  return email;
}
