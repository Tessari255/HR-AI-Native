/**
 * Stub de sessão. Integrar com o provedor de identidade real (ex.: NextAuth /
 * SSO corporativo) — o gestorId deve vir do token autenticado, nunca do client.
 */
export function useCurrentGestor(): { gestorId: string; nome: string } {
  return { gestorId: "GESTOR-0001", nome: "Gestor Logado" };
}
