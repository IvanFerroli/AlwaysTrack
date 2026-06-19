# TASK-AT-143 - Validacao runtime em superficies residuais

## Metadata
- status: completed-mvp
- owner: olympus-orchestrator
- priority: high
- created: 2026-06-19
- completed: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-143-runtime-validation-residual-surfaces.md

## Objetivo
Fechar a lacuna operacional deixada por `TASK-AT-107` em endpoints recentes ou administrativos que ainda aceitavam payloads permissivos demais.

## Contexto
Wiki, usuarios, notas e Scriptoteca ja usam helper compartilhado de validacao runtime. As telas adicionadas depois, principalmente Avisos, Configuracoes, Notificacoes e Fluxos, ainda tinham parsers que ignoravam tipos errados, arrays grandes ou strings excessivas. Isso aumenta risco de dado inconsistente, payload acidentalmente gigante e comportamento silencioso em updates parciais.

## Escopo Executado
1. Avisos:
   - payload raiz precisa ser objeto.
   - limite de titulo, slug, resumo, conteudo, tags, links, roles, status e prioridade.
   - booleanos deixam de aceitar string acidental.
   - arrays ausentes continuam `undefined` para preservar updates parciais.
2. Organizacoes/configuracoes:
   - payload raiz precisa ser objeto.
   - limite de nome, documento, logo URL, unidade e setor.
   - booleanos precisam ser booleanos reais.
3. Notificacoes:
   - payload raiz precisa ser objeto.
   - limite de template key, canal, nome Meta, idioma, preview, rule IDs e flags.
   - scan/manual notification passam pelo mesmo contrato.
4. Fluxos de Atendimento:
   - payload raiz e steps precisam ser objetos.
   - limite de steps, tags, conteudo, notas, comentarios, scripts relacionados e ordenacao.
   - handler agora retorna `400 INVALID_INPUT` para erro de contrato.

## Arquivos Alterados
- `services/api/src/core/announcements/announcements.service.ts`
- `services/api/src/core/announcements/announcements.handlers.ts`
- `services/api/src/core/announcements/announcements.service.test.ts`
- `services/api/src/core/organizations/organizations.service.ts`
- `services/api/src/core/organizations/organizations.handlers.ts`
- `services/api/src/core/organizations/organizations.service.test.ts`
- `services/api/src/core/notifications/notifications.service.ts`
- `services/api/src/core/notifications/notifications.handlers.ts`
- `services/api/src/core/notifications/notifications.service.test.ts`
- `services/api/src/core/service-flows/service-flows.service.ts`
- `services/api/src/core/service-flows/service-flows.handlers.ts`
- `services/api/src/core/service-flows/service-flows.service.test.ts`

## Criterios de Aceite
1. Payload nao-objeto em endpoints mutaveis cobertos vira `400 INVALID_INPUT`.
2. Strings grandes e arrays acima do limite sao recusados antes do service executar regra de negocio.
3. Update parcial de Avisos nao apaga tags, links ou roles quando o campo nao veio.
4. Testes unitarios cobrem parsers principais das areas alteradas.
5. Typecheck da API passa.

## Riscos e Mitigacao
- Risco: algum formulario mandar boolean como string.
  - Mitigacao: frontend atual usa controles nativos e API passa a falhar cedo, evitando dado ambiguo.
- Risco: update parcial de Avisos virar limpeza indevida.
  - Mitigacao: arrays ausentes permanecem `undefined`; apenas arrays enviados alteram valor.

