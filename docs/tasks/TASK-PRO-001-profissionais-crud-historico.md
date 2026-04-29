# TASK-PRO-001 - Profissionais, vinculos e historico

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-PRO-001-profissionais-crud-historico.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar cadastro, listagem, filtros e detalhe de Professional separado de User.

## Inputs
- documento central, secao 6.4

## Dependencias
- satisfeitas: `TASK-USR-001`, `TASK-UX-002`
- em aberto: n/a

## Alvos explicitos
1. modulo `modules/professionals`
2. API de profissionais
3. telas de lista/detalhe/formulario

## Fora de escopo
- importacao CSV/Excel
- login de profissional

## Acceptance Criteria
1. Profissional tem organization, unit, sector e responsibleRt.
2. Filtros por status, RT, setor e unidade funcionam.
3. Desativacao preserva historico.
4. Detalhe mostra licencas, documentos e notificacoes quando existirem.

## Validacao
- testes de service/filtros
- smoke manual do fluxo admin

## Riscos
- confundir profissional com usuario

## Evidencias de entrega
- Criado modulo `services/api/src/core/professionals` com service, handlers e testes.
- API entregue: `GET /v1/professionals`, `GET /v1/professionals/:professionalId`, `POST /v1/professionals`, `PATCH /v1/professionals/:professionalId`.
- Listagem respeita escopo por role: `ADMIN` por organizacao, `RT` por responsabilidade, `SUPERVISOR` por unidade/setor.
- Mutacoes ficam restritas a `ADMIN`, com validacao de organization/unit/sector, RT, usuario vinculado, CPF unico e soft deactivation.
- Detalhe retorna licencas, documentos e notificacoes quando existirem.
- Tela `Profissionais` substitui placeholder e usa componentes operacionais existentes.

## Validacao realizada
- `npm run check` passou com 28 testes.
- `npm run setup` passou.
- `npm run build --workspace @sylembra/web` passou.
- Smoke local: health, login admin, criar/listar/detalhar/desativar profissional e consultar auditoria `Professional`.
