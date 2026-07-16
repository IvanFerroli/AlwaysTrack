# TASK-AT-350 - Primeiro fluxo real Always Fit no CaseFlow

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-350-always-fit-health-flow-pilot.md

## Objetivo unico
Institucionalizar o procedimento `SAUDE-DEV-TROCA-ESTORNO` v0.1 como o primeiro fluxo operacional real demonstravel, compartilhando uma unica definicao entre Fluxos de Atendimento, Scriptoteca e CaseFlow sem generaliza-la para outros casos de saude.

## Fonte operacional
- `fluxo_saude_caseflow_always_fit.md`
- Codigo estavel: `SAUDE-DEV-TROCA-ESTORNO`
- Status de negocio: piloto controlado, com dez pendencias explicitas para validacao.

## Escopo
- Catalogar as 34 etapas, 21 decisoes numeradas, 23 regras, 17 mensagens, nove resultados e 19 testes de aceite.
- Migrar o placeholder anterior para o slug canonico sem duplicar o fluxo.
- Publicar grafo direcionado imutavel com scripts referenciados pela Scriptoteca.
- Manter textos sugeridos como `DRAFT` e textos integrais como `VALIDATED`.
- Fazer escolhas da sessao guiada registrarem a transicao e materializarem apenas o proximo no visitado.
- Selecionar o piloto somente quando o relato combinar contexto de suplemento/produto com sinal de mal-estar.
- Bloquear automacao de mensagem, reversa, Slack, estorno, cancelamento e geracao de pedido.
- Expor no Hub o estado real do primeiro fluxo e o backlog intencional dos proximos.

## Fora de escopo
- Tratar este procedimento como fluxo universal de saude.
- Criar ou inferir os demais fluxos operacionais.
- Resolver por suposicao qualquer uma das dez pendencias do documento.
- Executar scraping, login, captcha, 2FA, Slack, Correios, Lançador, estorno ou pedido real.
- Autorizar rollout CaseFlow ou uso produtivo com base em fixtures locais.

## Acceptance Criteria
1. Existe exatamente um fluxo canonico com slug `saude-dev-troca-estorno`; o placeholder antigo nao permanece duplicado.
2. A versao publicada possui 34 etapas operacionais, nove resultados e todas as transicoes validadas como grafo alcancavel.
3. A Scriptoteca possui 17 mensagens ligadas ao fluxo, preservando status e placeholders.
4. As 21 decisoes, 23 regras, dez pendencias e 19 testes da fonte possuem cobertura automatizada rastreavel.
5. Ao iniciar uma sessao versionada, somente o caminho visitado aparece; uma escolha valida e auditada abre a proxima etapa.
6. O CaseFlow seleciona este piloto para relato de mal-estar apos suplemento, mas nao para um relato generico de saude sem contexto de produto.
7. Acoes irreversiveis e mensagens permanecem humanas e proibidas no action firewall declarativo.
8. O Hub apresenta este item como primeiro fluxo real em piloto, sem alegar que os demais procedimentos ja foram modelados.

## Validacao
- `npm run check`
- `npm run check:docs`
- `npm run repo:hygiene`
- `npm run test --workspace @alwaystrack/api -- src/core/service-flows/catalog/always-fit-health-flow.test.ts src/core/case-flow/heuristics/golden-cases.test.ts src/core/service-flows/service-flows.service.test.ts`
- `npm run test --workspace @alwaystrack/web -- service-flows.test.tsx`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run prisma:seed` executado duas vezes para validar idempotencia.
- Smoke HTTP local com dados sinteticos em `Fluxos`, `Scriptoteca` e resolucao CaseFlow, incluindo caminho progressivo ate `RESULTADO-002`, bloqueio de finalizacao antecipada, aliases de placeholders e action firewall.

## Handoff
- handoff_to: sac-owner
- execution_expectation: validar as sete mensagens sugeridas e responder as dez pendencias antes de qualquer piloto operacional com clientes.
- constraints: cada proximo procedimento deve nascer como fluxo independente, com codigo, versao, scripts e testes proprios.
