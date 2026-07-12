# TASK-AT-196 - CaseFlow: topologia de autenticacao e confianca

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-196-caseflow-auth-trust-topology.md

## Modo
- mode: documentation
- generation-mode: corrective-spec-breakdown

## Capability
Security / Trust Boundary

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.7, 22, 23, 25, 34

## Objetivo unico
Definir quem chama a API AlwaysTrack, como extensao, host, instalacao local, usuario, navegador, sessao e caseId se correlacionam, e quais dados nao atravessam fronteiras.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-194`, `TASK-AT-195`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-194`, `TASK-AT-195`.

## Alvos explicitos
1. docs/security/caseflow-trust-topology.md
2. docs/architecture/companion-protocol.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Mapear Extensao <-> AlwaysTrack, Host <-> AlwaysTrack e Extensao <-> Host.
2. Definir emissao, rotacao, revogacao e escopo de tokens locais.
3. Definir anti-injecao local: usuario, instalacao, navegador, caseId e runId correlacionados.

## Acceptance Criteria
1. A extensao e o host tem responsabilidades de API inequivocas.
2. Outro processo local nao consegue injetar fatos sem vinculacao local valida.
3. Dados proibidos por fronteira estao documentados.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secoes 4.7, 22, 23, 25, 34 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Confundir sessao do navegador externo com sessao do AlwaysTrack.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-197`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
