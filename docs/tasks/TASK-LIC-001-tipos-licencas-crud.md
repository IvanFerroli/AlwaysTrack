# TASK-LIC-001 - Tipos de licenca e licencas

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-LIC-001-tipos-licencas-crud.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- contracts builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar LicenseType e License com multiplas licencas por profissional.

## Inputs
- documento central, secao 6.5

## Dependencias
- satisfeitas: `TASK-PRO-001`, `TASK-UX-002`
- em aberto: n/a

## Alvos explicitos
1. modulo `modules/licenses`
2. rotas de tipos/licencas
3. telas de cadastro e detalhe

## Fora de escopo
- upload de arquivo
- notificacoes

## Acceptance Criteria
1. Licenca referencia Professional e LicenseType.
2. Licenca aceita numero, emissor/UF, datas, observacoes e status.
3. Professional pode ter varias licencas.
4. Alteracoes relevantes geram auditoria.

## Validacao
- testes de CRUD e relacoes
- smoke manual no detalhe do profissional

## Riscos
- prender entidade apenas a COREN e bloquear documentos futuros

## Evidencias de entrega
- Criado modulo `services/api/src/core/licenses` com service, handlers e testes.
- API entregue para tipos: `GET /v1/license-types`, `POST /v1/license-types`, `PATCH /v1/license-types/:licenseTypeId`.
- API entregue para licencas: `GET /v1/licenses`, `POST /v1/licenses`, `PATCH /v1/licenses/:licenseId`.
- Leitura de licencas respeita escopo por role: `ADMIN` por organizacao, `RT` por responsabilidade e `SUPERVISOR` por unidade/setor.
- Mutacoes ficam restritas a `ADMIN`, com validacao de profissional, tipo, status compartilhado e dedupe basico de numero por profissional/tipo.
- Tela `Licencas` substitui placeholder e usa componentes operacionais existentes para filtros, tabelas, badges e confirmacoes.
- Alteracoes relevantes geram auditoria para `LicenseType` e `License`.

## Validacao realizada
- `npm run check` passou com 36 testes.
- `npm run setup` passou.
- `npm run build --workspace @alwaystrack/web` passou.
- Smoke local: health, login admin, listar/criar tipo, listar/criar licenca e consultar auditoria `license.create`.
