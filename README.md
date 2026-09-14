# People Hub — Gestão de Movimentações

Portal de autoatendimento de RH: dashboard de movimentações e formulário multi-step para novas solicitações (mudança de gestor, alteração salarial/promoção, transferência de centro de custo), integrado a um BFF via webhook n8n.

## Stack

- Next.js 14 (App Router) + TypeScript strict
- Tailwind CSS + shadcn/ui (Radix primitives)
- TanStack Query (cache/mutations) + TanStack Virtual (listas longas)
- React Hook Form + Zod (validação client-side)
- Sonner (toasts)

## Setup

```bash
npm install
cp .env.local.example .env.local   # aponte NEXT_PUBLIC_API_URL para o webhook do n8n
npm run dev
```

## Estrutura

```
app/                          rotas (App Router)
  page.tsx                    dashboard de movimentações
  movimentacoes/nova/page.tsx wizard de nova movimentação
components/ui/                primitivos shadcn/ui
components/layout/            casca da aplicação (header/nav)
features/movimentacoes/
  schemas.ts                  schema Zod único do wizard (validação por passo)
  types.ts                    tipos derivados dos schemas + DTOs da API
  api.ts                      chamadas HTTP ao BFF (n8n)
  hooks/                      hooks de query/mutation (TanStack Query)
  components/                 tabela do dashboard e passos do wizard
lib/
  api/http.ts                 wrapper fetch + ApiError
  auth.ts                     stub de sessão (gestorId) — plugar SSO real
```

## Contrato de integração (BFF)

- `GET  /api/v1/movimentacoes?gestorId=xxx&page&pageSize&search&status`
- `GET  /api/v1/colaboradores?search=xxx`
- `POST /api/v1/movimentacoes` — `multipart/form-data` com campo `payload` (JSON) + anexos (`offerLetter`, `creqEreq`, `justificativaAnexo`); resposta `202 Accepted` com `{ correlationId, status: "SUBMITTED" }`.

## Regras de validação (Zod)

- Percentual de reajuste salarial não pode ser negativo ou zero; novo salário deve ser maior que o atual.
- Anexo obrigatório conforme o tipo: offer letter para alteração salarial, C-req/E-req para transferência de CC.
- Data de vigência não pode retroagir mais de 15 dias.
- Anexos aceitam apenas PDF/PNG, até 5MB cada.
