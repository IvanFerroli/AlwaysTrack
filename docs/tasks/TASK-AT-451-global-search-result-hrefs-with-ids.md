# TASK-AT-451 - Preencher IDs nos hrefs da busca global

## Metadata
- status: completed
- owner: Ivanilson Ferreira de Oliveira
- last-updated: 2026-09-02
- source-of-truth: docs/tasks/TASK-AT-451-global-search-result-hrefs-with-ids.md
- fonte-externa: T-2317 (Sprint 5, Story Points 2, Tipo: Melhoria)

## Modo
- mode: implementation

## Objetivo unico
Fazer os resultados de busca global de campanha, FAQ e script abrirem direto no item encontrado, em vez de apenas na tela de listagem.

## Contexto minimo
`globalSearch` em `services/api/src/core/search/search.service.ts` monta 5 grupos de resultado. A falha original estava nos grupos `campaigns`, `faq` e `scripts`, que usavam `href` estatico e abriam apenas a listagem. O escopo foi ampliado durante a implementacao porque o aceite ponta a ponta exigia que cada consumidor restaurasse, revelasse e focasse o item, inclusive com a tela ja montada e filtros conflitantes.

`packages/shared/src/notifications/targets.ts` ja resolve esse mesmo padrao de link para notificacoes via `queryHref`, com os `paramKeys` corretos por tipo:
- `SUPPORT_CAMPAIGN` -> `campaignId` (targets.ts:61, uso em queryHref targets.ts:197: `/campanhas?campaignId=...`)
- `FAQ_THREAD` -> `threadId` (targets.ts:57, uso em queryHref targets.ts:196: `/faq?threadId=...`)
- `SCRIPT_LIBRARY` -> `scriptId` (targets.ts:73, uso em queryHref targets.ts:200: `/scriptoteca?scriptId=...`)

A implementacao usa o mesmo formato de query param nos 3 hrefs e trata o identificador como uma intencao de navegacao prioritaria nos consumidores.

Nota de precisao: os numeros de linha citados no ticket original (131/157/183) nao correspondem ao arquivo atual; os alvos reais, conferidos nesta rodada, sao 138/166/194.

## Inputs
- `services/api/src/core/search/search.service.ts` (estado atual lido nesta rodada)
- `packages/shared/src/notifications/targets.ts:55-73,185-200` (padrao de referencia para os param keys e formato de query string)

## Dependencias
- satisfeita: T-2315, que estabeleceu bootstrap e contrato de URL de Scriptoteca/Fluxos.
- em aberto: nenhuma.

## Alvos explicitos
1. `services/api/src/core/search/search.service.ts` — hrefs com `campaignId`, `threadId` e `scriptId`, codificados para URL.
2. `apps/web/src/views/support-campaigns.tsx` — revelar, destacar e focar a campanha; um novo deep link limpa filtros conflitantes.
3. `services/api/src/core/faq/faq.service.ts` e `apps/web/src/views/faq.tsx` — lookup tenant-scoped, selecao/foco, IDs sucessivos e fallback autorizado.
4. `services/api/src/core/script-library/script-library.service.ts` e `apps/web/src/views/script-library.tsx` — lookup visivel por `scriptId`, inclusive fora do limite padrao; modo Atendimento e filtros/categoria compativeis.
5. `apps/web/src/main.tsx` e `apps/web/src/notification-navigation.ts` — bootstrap interno e encaminhamento dos intents, preservando a FAQ publica por `organizationId`.

## Fora de escopo
- Alterar o grupo `wiki` ou `announcements` (ja corretos).
- Mudar `notificationTargetCatalog`, `paramKeys` ou qualquer contrato em `targets.ts`.
- Extrair um helper compartilhado entre `search.service.ts` e `targets.ts` (nao pedido, nao necessario para o criterio de aceite).
- Implementar sincronizacao por Back/Forward.
- Revelar a existencia de itens fora da tenancy/permissao do usuario; nesses casos a tela cai para a listagem autorizada.

## Checklist
1. [x] Confirmar e completar o consumo frontend de `campaignId`, `threadId` e `scriptId`.
2. [x] Ajustar os 3 hrefs em `search.service.ts`, usando `item.id` codificado.
3. [x] Fazer deep links posteriores prevalecerem sobre filtros visuais conflitantes.
4. [x] Cobrir tenancy, fallback, IDs sucessivos, alvo fora do limite e colisao FAQ publica/interna.
5. [x] Rodar testes focados, suites amplas, typechecks e builds.

## Acceptance Criteria
1. Clicar num resultado de busca de campanha abre `/campanhas?campaignId=<id>` e posiciona no item.
2. Clicar num resultado de busca de FAQ abre `/faq?threadId=<id>` e posiciona no item.
3. Clicar num resultado de busca de script abre `/scriptoteca?scriptId=<id>` e posiciona no item.

## Definition of Done
1. [x] Os 3 hrefs incluem o identificador correto do item.
2. [x] Campanha, FAQ e Scriptoteca abrem no alvo autorizado mesmo apos filtros conflitantes.
3. [x] Nenhum outro grupo de busca (`wiki`, `announcements`) foi alterado.
4. [x] Testes e builds dos pacotes API/web passam sem erro novo.

## Validacao
- API completa: 979 testes aprovados; 1 teste Redis opcional ignorado.
- Web completa apos fechamento da auditoria: 170 testes aprovados.
- Typechecks e builds de API/web aprovados.
- Cobertura focada adicionada para hrefs, bootstrap, filtros conflitantes, foco/selecao, IDs sucessivos e FAQ publica.
- Smoke em navegador real nao executado: o ambiente local nao foi iniciado com dados/credenciais reproduziveis nesta rodada.

## Evidencia esperada
- Commits principais: `8463fab1`, `1d39db0f`, `b689579f`, `86668d1d`, `300e0cc1`, `f42f5115`.
- Fechamento das lacunas de auditoria: `4ecb1662`, `e2f4de46`, `5986ae73`, `7f1ce887`.

## Riscos
- Back/Forward continua fora do escopo; a sincronizacao implementada cobre bootstrap, troca de aba/estado prevista em T-2315 e novos intents recebidos pelo app.
- Alvo inexistente ou sem permissao faz fallback para a listagem autorizada, sem distinguir inexistencia de proibicao.
- `/faq?organizationId=...` continua sendo a FAQ publica; `/faq?threadId=...` usa a area interna autenticada.

## Blockers
- Nenhum blocker conhecido para o aceite.

## Retorno esperado
- Reportar na daily os commits e validacoes acima; nenhuma atualizacao automatica no Asana foi realizada.
