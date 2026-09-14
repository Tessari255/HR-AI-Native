import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stub local para a listagem de movimentações (dashboard). Não há ainda um
 * backend real por trás desta consulta — esta rota apenas evita os 404 em
 * background enquanto isso não existe, retornando uma página vazia no
 * formato esperado por MovimentacoesResponse.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const page = Number(params.get("page") ?? "1") || 1;
  const pageSize = Number(params.get("pageSize") ?? "50") || 50;

  return NextResponse.json({
    items: [],
    total: 0,
    page,
    pageSize,
  });
}
