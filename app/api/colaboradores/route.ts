import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
const UPSTREAM_TIMEOUT_MS = 8_000;

/**
 * DTO exposto pela rota — precisa casar com `colaboradorSchema`
 * (features/movimentacoes/schemas.ts) consumido pelo combobox do wizard.
 */
interface ColaboradorDTO {
  id: string;
  nome: string;
  matricula: string;
  cargoAtual: string;
  centroCustoAtual: string;
  planta: string;
  gestorId: string;
  salarioAtual: number;
}

const SN_INSTANCE_URL = process.env.SN_INSTANCE_URL;
const SN_USER = process.env.SN_USER;
const SN_PASSWORD = process.env.SN_PASSWORD;
const MOCK_HR_API_URL = process.env.MOCK_HR_API_URL;
const USE_MOCK_HR = process.env.USE_MOCK_HR === "true" || Boolean(MOCK_HR_API_URL);

/**
 * Proxy server-side para a busca de colaboradores (Nova Movimentação > Passo 2).
 * Nunca expõe credenciais do ServiceNow ao client — fica estritamente aqui.
 */
export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? request.nextUrl.searchParams.get("search") ?? "";
  const query = rawQuery.trim().slice(0, MAX_QUERY_LENGTH);

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json([]);
  }

  try {
    const colaboradores = USE_MOCK_HR ? await fetchFromMock(query) : await fetchFromServiceNow(query);
    return NextResponse.json(colaboradores);
  } catch (error) {
    console.error("[api/colaboradores] Falha ao buscar colaboradores:", error);
    const message = error instanceof Error ? error.message : "Falha ao buscar colaboradores.";
    return NextResponse.json({ message }, { status: 502 });
  }
}

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// ---------------------------------------------------------------------------
// Fonte: WireMock local ("tabela de colaboradores do sistema")
// ---------------------------------------------------------------------------

interface MockColaboradorRecord {
  matricula: string;
  empresa: string;
  cargo?: string;
  centroCusto?: string;
  matriculaGestor?: string;
  area?: string;
}

async function fetchFromMock(query: string): Promise<ColaboradorDTO[]> {
  const baseUrl = MOCK_HR_API_URL ?? "http://100.101.45.13:8089";
  const url = new URL("/api/v1/colaboradores", baseUrl);
  url.searchParams.set("page", "1");

  const { signal, clear } = withTimeout(UPSTREAM_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" }, signal, cache: "no-store" });
  } finally {
    clear();
  }

  if (!response.ok) {
    throw new Error(`Mock HR API retornou HTTP ${response.status}`);
  }

  const body = (await response.json()) as { items?: MockColaboradorRecord[] };
  const normalizedQuery = query.toLowerCase();

  // O stub do WireMock não filtra por termo de busca — filtramos aqui.
  return (body.items ?? [])
    .filter((item) => item.matricula.toLowerCase().includes(normalizedQuery))
    .map((item) => ({
      id: `${item.empresa}:${item.matricula}`,
      nome: `Colaborador ${item.matricula}`,
      matricula: item.matricula,
      cargoAtual: item.cargo ?? "—",
      centroCustoAtual: item.centroCusto ?? "—",
      planta: item.area ?? "—",
      gestorId: item.matriculaGestor ?? "—",
      salarioAtual: 0,
    }));
}

// ---------------------------------------------------------------------------
// Fonte: ServiceNow — tabela u_divergencias_reconciliacao
//
// Esta tabela guarda uma linha por par (matrícula, atributo) — não é uma
// tabela mestre de colaboradores (não há nome/planta/gestor/salário). Os
// registros do mesmo matrícula são agregados aqui em um único Colaborador,
// usando u_valor_ec (valor "oficial"/EC) para os atributos reconhecidos.
// ---------------------------------------------------------------------------

interface ServiceNowDivergenciaRecord {
  sys_id: string;
  u_matricula: string;
  u_chave_unica?: string;
  u_empresa?: string;
  u_atributo?: string;
  u_valor_ec?: string;
}

function sanitizeServiceNowQueryValue(value: string): string {
  // Remove caracteres com significado especial na encoded query do ServiceNow
  // (^ separa cláusulas, = e ! alteram operadores) para evitar injeção.
  return value.replace(/[\^=!]/g, "");
}

async function fetchFromServiceNow(query: string): Promise<ColaboradorDTO[]> {
  if (!SN_INSTANCE_URL || !SN_USER || !SN_PASSWORD) {
    throw new Error(
      "SN_INSTANCE_URL, SN_USER e SN_PASSWORD precisam estar configuradas no ambiente do servidor."
    );
  }

  const safeQuery = sanitizeServiceNowQueryValue(query);
  const url = new URL("/api/now/table/u_divergencias_reconciliacao", SN_INSTANCE_URL);
  url.searchParams.set("sysparm_query", `u_matriculaLIKE${safeQuery}^ORu_chave_unicaLIKE${safeQuery}`);
  url.searchParams.set("sysparm_limit", "50");

  const authorization = `Basic ${Buffer.from(`${SN_USER}:${SN_PASSWORD}`).toString("base64")}`;

  const { signal, clear } = withTimeout(UPSTREAM_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: "application/json", Authorization: authorization },
      signal,
      cache: "no-store",
    });
  } finally {
    clear();
  }

  if (!response.ok) {
    throw new Error(`ServiceNow retornou HTTP ${response.status}`);
  }

  const body = (await response.json()) as { result?: ServiceNowDivergenciaRecord[] };
  return aggregateServiceNowRecords(body.result ?? []);
}

function aggregateServiceNowRecords(records: ServiceNowDivergenciaRecord[]): ColaboradorDTO[] {
  const byMatricula = new Map<string, ColaboradorDTO>();

  for (const record of records) {
    const matricula = record.u_matricula;
    if (!matricula) continue;

    const empresa = record.u_empresa ?? "";
    const key = `${empresa}:${matricula}`;

    const colaborador = byMatricula.get(key) ?? {
      id: key,
      nome: `Colaborador ${matricula}`,
      matricula,
      cargoAtual: "—",
      centroCustoAtual: "—",
      planta: "—",
      gestorId: "—",
      salarioAtual: 0,
    };

    switch (record.u_atributo) {
      case "cargo":
        colaborador.cargoAtual = record.u_valor_ec ?? colaborador.cargoAtual;
        break;
      case "centro_custo":
        colaborador.centroCustoAtual = record.u_valor_ec ?? colaborador.centroCustoAtual;
        break;
      case "salario": {
        const parsed = record.u_valor_ec ? Number(record.u_valor_ec) : NaN;
        colaborador.salarioAtual = Number.isFinite(parsed) ? parsed : colaborador.salarioAtual;
        break;
      }
      default:
        break;
    }

    byMatricula.set(key, colaborador);
  }

  return Array.from(byMatricula.values());
}
