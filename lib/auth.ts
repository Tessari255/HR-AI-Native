/**
 * Stub de sessão. Integrar com o provedor de identidade real (ex.: NextAuth /
 * SSO corporativo) — gestorId/email devem vir do token autenticado, nunca do client.
 */
export function useCurrentGestor(): { gestorId: string; nome: string; email: string } {
  return { gestorId: "GESTOR-0001", nome: "Gestor Logado", email: "gestor.logado@suaempresa.com" };
}
