# TASK-AT-420 - API MVP de conversas e mensagens internas

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-420-internal-communication-api-mvp.md

## Modo
- mode: implementation
- priority: P0
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / API

## Origem documental
- `TASK-AT-417` a `TASK-AT-419`.

## Problema
O schema isolado não entrega uma jornada demonstrável nem garante que criação, envio, histórico e leitura usem as mesmas regras de autorização, ordenação e idempotência.

## Objetivo único
Expor contratos HTTP tenant-scoped para listar/criar conversas, enviar/listar mensagens e avançar leitura no MVP.

## Contexto mínimo
A API é a autoridade de membership, idempotência, cursor e limites; a Web nunca envia tenant ou role confiável.

## Inputs
- Schema/migration da `TASK-AT-419`.
- Permissions/helpers da `TASK-AT-418`.
- Padrões HTTP, validation e rate limit existentes.

## Escopo
1. Listar conversas do usuário com última mensagem e unread.
2. Abrir canal geral, direct, team ou group permitido.
3. Criar direct/group conforme capacidade do ator.
4. Enviar mensagem textual idempotente.
5. Paginar histórico por cursor estável e marcar leitura até uma mensagem válida.
6. Validar payloads, limites e URLs textuais seguras.

## Fora de escopo
- Tempo real push, presença, anexos e rich embeds.
- Busca full-text global.
- Editar, excluir, responder ou reagir.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — módulo futuro de Comunicação.
- `services/api/src/app.ts`.
- `services/api/src/core/validation/`.
- `docs/api/openapi.v1.yaml`.

## Requisitos funcionais
1. `GET` de conversas retorna cursor, preview redigido e unread consistente.
2. Histórico possui ordem determinística mesmo com timestamps iguais.
3. `POST` de mensagem repete resultado na mesma idempotency key.
4. Mark-read nunca retrocede cursor nem marca mensagem futura/inacessível.
5. Direct e group rejeitam usuário inativo ou de outro tenant.

## Requisitos de permissão, tenant e auditoria
1. Toda query parte de `actor.organizationId` e membership autorizado.
2. O service aplica a matriz da `TASK-AT-418`; handlers não contêm bypass por role.
3. Criação de grupo, gestão de membros e falhas sensíveis são auditadas sem corpo.
4. Erros cross-tenant e sem membership não revelam existência.

## Checklist de execução
1. Definir contratos/cursors/erros.
2. Implementar services e handlers por caso de uso.
3. Aplicar autorização e limites no backend.
4. Publicar OpenAPI.
5. Cobrir idempotência, ordenação e anti-IDOR.

## Critérios de aceite
1. As quatro modalidades funcionam por API dentro do escopo autorizado.
2. Mensagem aparece no histórico uma única vez e incrementa unread dos demais participantes.
3. Paginação não duplica nem salta itens em inserts concorrentes.
4. OpenAPI documenta payloads, limites, cursores e erros.

## Testes esperados
- Service e HTTP para happy paths dos quatro tipos.
- Anti-IDOR, membro removido, equipe encerrada, usuário inativo e payload malformado.
- Idempotência, cursor, ordenação concorrente e rate limit.
- Typecheck/API tests, OpenAPI contract e `git diff --check`.

## Riscos
- Fanout ou contagem unread fazer query N+1.
- Paginação por timestamp isolado perder mensagens.

## Dependências
- satisfeitas: validação runtime, rate limit e harness HTTP existentes.
- em aberto: `TASK-AT-419` concluída.

## Blockers possíveis
- Invariantes de membership/schema incompletos.
- SLO/limites de mensagem e paginação não aprovados.

## Definição de pronto
1. Rotas, services, contratos e erros publicados no OpenAPI.
2. Suite funcional e negativa cobre tenancy/membership/idempotência.
3. Métricas básicas de latência/erro não registram conteúdo.

## Evidência esperada
- Exemplos sanitizados de requests/responses e relatório de testes.
- Prova de paginação e idempotência.

## Próximo passo provável
`TASK-AT-421`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar a menor API completa antes da Web.
- constraints: sem protocolo realtime e sem features sociais avançadas.
