# Commercial permission matrix

## Metadata
- status: active-beta-closed
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: `packages/shared/src/index.ts`

## Objetivo
Definir, em linguagem de produto e codigo, o que cada role comercial pode ver e executar no AlwaysTrack durante a Fase Beta Fechado por Permissoes.

## Diretriz beta
O AlwaysTrack continua sendo um produto unico, com todos os modulos ativos. A segregacao acontece por role, permissao, escopo e visibilidade. Frontend ajuda a orientar, mas backend e API sao a fonte da verdade.

## Roles ativas
- `ADMIN`: administra a plataforma, usuarios, integracoes, Wiki publicada, auditoria e operacao comercial.
- `GESTOR`: opera visoes comerciais amplas, campanhas, ranking, FAQ e revisao de notas, sem administrar usuarios/configuracoes globais.
- `SUPERVISOR`: acompanha a operacao, ranking/FAQ e visoes do seu grupo comercial; durante o beta nao revisa notas nem governa campanhas.
- `SAC`: acessa conhecimento, FAQ, Avisos, Scriptoteca, Fluxos e scripts pessoais; nao acessa dados comerciais nem auditoria.
- `FINANCEIRO`: acompanha extratos/notas e pode revisar notas, sem gerenciar campanhas ou usuarios.
- `VENDEDOR`: envia DANFEs, acompanha somente seu proprio desempenho comercial e acessa conhecimento operacional.

## Matriz
| Permissao | ADMIN | GESTOR | SUPERVISOR | SAC | FINANCEIRO | VENDEDOR |
| --- | --- | --- | --- | --- | --- | --- |
| `sales.read` | sim | sim | sim | nao | sim | sim |
| `sales.upload` | sim | sim | sim | nao | sim | sim |
| `sales.review` | sim | sim | nao | nao | sim | nao |
| `campaign.read` | sim | sim | sim | nao | sim | sim |
| `campaign.manage` | sim | sim | nao | nao | nao | nao |
| `ranking.read` | sim | sim | sim | nao | nao | sim |
| `ranking.filterSeller` | sim | sim | nao | nao | nao | nao |
| `statements.read` | sim | sim | sim | nao | sim | sim |
| `knowledge.read` | sim | sim | sim | sim | sim | sim |
| `knowledge.contribute` | nao | sim | sim | sim | sim | sim |
| `knowledge.publish` | sim | nao | nao | nao | nao | nao |
| `faq.moderate` | sim | sim | sim | nao | nao | nao |
| `announcements.read` | sim | sim | sim | sim | sim | sim |
| `announcements.manage` | sim | sim | nao | nao | nao | nao |
| `scriptLibrary.read` | sim | sim | sim | sim | sim | sim |
| `scriptLibrary.manage` | sim | sim | nao | nao | nao | nao |
| `scriptLibrary.copy` | sim | sim | sim | sim | sim | sim |
| `users.manage` | sim | nao | nao | nao | nao | nao |
| `audit.read` | sim | nao | nao | nao | nao | nao |
| `profile.manageSelf` | sim | sim | sim | sim | sim | sim |
| `notifications.readSelf` | sim | sim | sim | sim | sim | sim |

## Aplicacao no codigo
- Backend: grupos exportados por `@alwaystrack/shared` alimentam `requireRole(...)` nas rotas comerciais ativas e escopos nos servicos.
- Frontend: botoes e navegacao usam `canUseCommercialPermission(...)` ou os mesmos grupos compartilhados.
- Servicos comerciais ainda aplicam escopo de dados por vendedor/supervisor, especialmente em notas, ranking, extratos e campanhas.

## Regras importantes
1. Esconder botao na UI nunca substitui protecao no backend.
2. `SUPERVISOR` acompanha ranking, FAQ e grupo comercial, mas nao revisa notas nem governa campanhas durante o beta fechado.
3. `SAC` participa da construcao do conhecimento, scripts pessoais e FAQ, mas nao revisa notas nem acessa dados comerciais identificaveis.
4. `GESTOR` nao gerencia usuarios nem integracao Google; isso fica com `ADMIN`.
5. Publicacao direta/arquivamento/restauracao de Wiki fica com `ADMIN`; roles nao-admin contribuem por proposta.
6. `VENDEDOR` pode ver sua posicao, pontuacao, evolucao e agregados nao identificaveis, mas nao pode ver ranking detalhado nem faturamento individual de terceiros.
7. Allowlist de beta define quem entra; role define o que pode fazer.

## Validacao minima
- `npm run test --workspace @alwaystrack/api -- access-policy.test.ts auth.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
