# Commercial permission matrix

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-06-11
- source-of-truth: `packages/shared/src/index.ts`

## Objetivo
Definir, em linguagem de produto e codigo, o que cada role comercial pode ver e executar no AlwaysTrack.

## Roles ativas
- `ADMIN`: administra a plataforma, usuarios, integracoes, Wiki publicada, auditoria e operacao comercial.
- `GESTOR`: opera visoes comerciais amplas, campanhas, ranking, FAQ e revisao de notas, sem administrar usuarios/configuracoes globais.
- `SUPERVISOR`: opera campanhas/ranking/FAQ e visoes do seu grupo comercial; filtros de vendedor liberados para validacao.
- `SAC`: acompanha notas, Wiki, FAQ, extratos e pode revisar notas, sem gerenciar campanhas ou usuarios.
- `FINANCEIRO`: acompanha extratos/notas e pode revisar notas, sem gerenciar campanhas ou usuarios.
- `VENDEDOR`: envia DANFEs, acompanha suas notas, ranking, extratos, Wiki, FAQ e notificacoes.

## Matriz
| Permissao | ADMIN | GESTOR | SUPERVISOR | SAC | FINANCEIRO | VENDEDOR |
| --- | --- | --- | --- | --- | --- | --- |
| `sales.read` | sim | sim | sim | sim | sim | sim |
| `sales.upload` | sim | sim | sim | sim | sim | sim |
| `sales.review` | sim | sim | nao | sim | sim | nao |
| `campaign.read` | sim | sim | sim | sim | sim | sim |
| `campaign.manage` | sim | sim | sim | nao | nao | nao |
| `ranking.read` | sim | sim | sim | nao | nao | sim |
| `ranking.filterSeller` | sim | sim | sim | nao | nao | nao |
| `statements.read` | sim | sim | sim | sim | sim | sim |
| `knowledge.read` | sim | sim | sim | sim | sim | sim |
| `knowledge.contribute` | nao | sim | sim | sim | sim | sim |
| `knowledge.publish` | sim | nao | nao | nao | nao | nao |
| `faq.moderate` | sim | sim | sim | nao | nao | nao |
| `users.manage` | sim | nao | nao | nao | nao | nao |
| `audit.read` | sim | nao | nao | nao | nao | nao |
| `profile.manageSelf` | sim | sim | sim | sim | sim | sim |
| `notifications.readSelf` | sim | sim | sim | sim | sim | sim |

## Aplicacao no codigo
- Backend: grupos exportados por `@alwaystrack/shared` alimentam `requireRole(...)` nas rotas comerciais ativas.
- Frontend: botoes e navegacao usam `canUseCommercialPermission(...)` ou os mesmos grupos compartilhados.
- Servicos comerciais ainda aplicam escopo de dados por vendedor/supervisor, especialmente em notas, ranking, extratos e campanhas.

## Regras importantes
1. Esconder botao na UI nunca substitui protecao no backend.
2. `SUPERVISOR` pode gerenciar campanhas e FAQ, mas dados comerciais continuam escopados por grupo quando o servico tem recurso de escopo.
3. `SAC` e `FINANCEIRO` podem revisar notas nesta fase porque ambos participam do fluxo operacional de validacao.
4. `GESTOR` nao gerencia usuarios nem integracao Google; isso fica com `ADMIN`.
5. Publicacao direta/arquivamento/restauracao de Wiki fica com `ADMIN`; roles nao-admin contribuem por proposta.

## Validacao minima
- `npm run test --workspace @alwaystrack/api -- access-policy.test.ts auth.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
