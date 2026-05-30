# Project Intake - AlwaysTrack

## Metadata
- status: accepted
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/project/intake.md

## Fonte canonica
- baseline de produto: `docs/specs/SPEC-AT-001-product-baseline.md`
- backlog ativo: `docs/tasks/ROADMAP.md`
- origem historica reaproveitavel: `docs/archive/sylembra/`

## Objetivo em uma frase
Transformar AlwaysTrack em uma ferramenta comercial para empresa de suplementos: upload de DANFE por vendedor, extracao de dados, ranking/campanhas, dashboard e extratos por perfil, grupo e visao geral.

## Restricoes explicitas
- Reaproveitar layout, auth, upload/storage, auditoria, dashboard estrutural e relatorios quando fizer sentido.
- Nao tratar licencas/RT/compliance como backlog ativo.
- Manter Google login como direcao de produto, com fallback local para desenvolvimento.
- Roles ativas: Admin, SAC, Financeiro, Vendedor, Supervisor e Gestor.
- Commits devem continuar auditaveis e subidos para `origin/main`.

## Realidade atual do runtime
- Frontend: React 19, TypeScript, Vite e CSS proprio em `apps/web`.
- Backend: Node.js, Express 5, TypeScript, Prisma.
- Banco local: SQLite via `DATABASE_URL=file:./dev.db`.
- Storage atual: local privado em `services/api/.storage/`.
- Modulos comerciais iniciais: roles comerciais, schema de vendedores/grupos/notas/itens/campanhas/ranking, upload autenticado de DANFE, dashboard comercial inicial e wiki transversal.
- Modulos legados ainda presentes como porao tecnico: professionals, licenses, documents antigos, notificacoes de vencimento e relatorios antigos.

## Incertezas
- Provedor final de extracao: parser deterministico, OCR, IA ou combinacao.
- Formato final de extrato: CSV, XLSX, HTML imprimivel ou PDF.
- Politica exata de campanhas e criterios de desempate.

## Proxima fatia recomendada
Completar extracao DANFE, revisao/aprovacao, motor de ranking, extratos e Google login real.
