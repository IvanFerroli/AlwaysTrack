# AlwaysTrack - Onboarding tecnico

## Como estudar este projeto
Este TypeDoc e a porta de entrada para entender o AlwaysTrack de ponta a ponta. Use junto com:

- `docs/architecture/README.md`: mapa arquitetural.
- `docs/architecture/domains.md`: dominios do produto.
- `docs/architecture/maintenance-map.md`: onde mexer quando algo quebrar.
- `docs/architecture/flow-deep-dive.md`: leitura ponta a ponta dos fluxos principais.
- `docs/architecture/quick-diagnostic-checklist.md`: checklist curto para voltar ao projeto e diagnosticar falhas.
- `docs/architecture/testing-and-docs.md`: comandos de teste e documentacao.
- `docs/tasks/ROADMAP.md`: backlog e historico vivo.
- `docs/testing/strategy.md`: piramide de testes.
- `docs/performance/README.md`: carga e Artillery.

## Narrativa do produto
O AlwaysTrack resolve dois fluxos centrais:

1. DANFE enviada vira extracao, revisao, aprovacao, ranking, extrato, timeline e auditoria.
2. Duvida operacional vira FAQ, discussao, curadoria, Wiki validada, Avisos ou Scriptoteca consultavel.

## Caminho de leitura recomendado
1. Comece em `packages/shared/src/index.ts` para roles, permissoes e status canonicos.
2. Leia `services/api/src/config/env.ts` para entender configuracao local/producao.
3. Leia `auth/session`, `auth/auth.service`, `auth/google-login.service` e `auth/access-policy`.
4. Leia `sales-documents.service` e `danfe-deterministic` para o fluxo DANFE.
5. Leia `wiki.service`, `faq.service`, `announcements.service` e `script-library.service` para conhecimento operacional.
6. Leia `notifications.service`, `audit.service` e diagnosticos para rastreabilidade.
7. Leia `operations.service`, `dashboard.service`, `reports.service` e `search.service` para as telas executivas.
8. Leia `jobs/queue` e `ranking-snapshot.jobs` para trabalhos em background.

## Como debugar quando quebrar
- Erro de login/sessao: comece por auth, env e cookies.
- Nota nao processa: comece por upload, extracao deterministica, IA e auditoria de `SalesDocument`.
- Ranking estranho: revise documentos aprovados, campanhas e snapshots.
- Wiki/FAQ/Avisos/Scriptoteca: confira permissao, organizacao, status e eventos.
- Tela lenta: veja observabilidade HTTP/Prisma e paginação.
- Deploy inseguro: confira tasks `AT-102` a `AT-116`.

## Regra de ouro
Antes de editar, encontre:

- contrato compartilhado em `packages/shared`;
- service do dominio;
- handler Express;
- view React correspondente;
- teste mais proximo;
- task/exec que explica por que aquilo existe.

## Como transformar duvida em leitura
Quando voce nao souber por onde comecar, formule a duvida como fluxo:

- "Quem pode fazer isso?" leva a `packages/shared`, `auth/access-policy` e `requireRole`.
- "De onde esse dado vem?" leva ao service do dominio e ao schema Prisma.
- "Por que a tela mostra isso?" leva a view React, endpoint handler e parser de filtros.
- "Por que isso nao atualizou?" leva a auditoria, notificacoes, jobs e dedupe.
- "Isso e seguro?" leva a tasks `AT-102` a `AT-116`.
