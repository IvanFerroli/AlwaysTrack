# TASK-AT-450 - Gate final de prontidao do especialista Product UX

## Metadata
- status: proposed
- pipeline: ALREADY_COVERED
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação de higiene do audit repo-wide (seção O.6): o gate final deste escopo já foi executado e registrado em 2026-08-06 (`docs/testing/product-ux-final-readiness-gate-2026-08-06.md`: GO-WITH-RISK pilot-ready / NO-GO active), com sequência posterior em `TASK-AT-452` (fechada, NO-GO certificado) e `TASK-AT-453` (paused-by-product-decision); o `status: proposed` está órfão/obsoleto. Classificação: ALREADY_COVERED — não ressuscitar
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-450-product-ux-final-readiness-gate.md

## Modo
- mode: verification
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Final Readiness Verification

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- Entregas, evals, runbook e pilotos de `TASK-AT-440` a `TASK-AT-449`.
- Protocolos Olympus de ownership, roteamento e verificacao.

## Objetivo unico
Classificar com evidencia a prontidao do especialista Product UX e autorizar ou negar sua ativacao sem corrigir artefatos durante o gate.

## Contexto minimo
Existencia de agente, skill ou screenshots nao prova readiness. O aceite exige fronteiras, contratos, aquisicao visual autonoma fail-closed, privacidade, eval adversarial, operacao, pilotos e handoffs funcionando em conjunto.

## Inputs
- Matriz requisito -> artefato -> eval -> piloto -> evidencia.
- Relatorios golden, forward e adversarial.
- Estado operacional e runbook exercitado.
- Pacotes de evidencia dos pilotos e blockers abertos.

## Dependencias
- satisfeitas: protocolo do Task Verifier e criterios definidos no backlog.
- em aberto: `TASK-AT-440` a `TASK-AT-449`.

## Alvos explicitos
1. Relatorio final de readiness com matriz de cobertura e links de evidencia.
2. Classificacoes separadas para ativacao local, captura autonoma, uso com referencia humana e paridade Codex/Antigravity.
3. Registro de `GO`, `GO-WITH-RISK` ou `NO-GO`, blockers e follow-ups.
4. Atualizacao do estado operacional somente apos decisao fundamentada.

## Fora de escopo
- Corrigir agente, skill, harness, evals, routing, docs ou UI do AlwaysTrack.
- Aceitar evidencia ausente, obsoleta, nao sanitizada ou produzida apenas por leitura de codigo.
- Converter risco bloqueante em backlog silencioso para emitir GO.
- Aprovar implementacoes de produto avaliadas nos pilotos.

## Checklist de execucao
1. Verificar completude e coerencia da matriz de requisitos.
2. Reexecutar amostra independente de capture, forward eval e handoff.
3. Confirmar ownership entre Product UX, Critic, Contracts, Docs, Runtime, Quality e Verifier.
4. Auditar fail-closed para browser, seed, autenticacao, rota, estado, viewport, sanitizacao e referencia humana.
5. Auditar secrets, PII, retencao, provenance e cleanup.
6. Classificar cada superficie de ativacao separadamente.
7. Emitir blockers/follow-ups com owner sem realizar correcao no gate.

## Acceptance Criteria
1. Toda capacidade declarada possui artefato, teste/eval, piloto e evidencia rastreavel.
2. O gate adversarial e o conjunto forward atingem thresholds aprovados sem contaminacao conhecida.
3. Aquisicao visual autonoma funciona em ambiente reproduzivel; qualquer falha relevante permanece fail-closed.
4. Referencia humana e solicitada somente nos casos definidos, com pergunta objetiva e sem alvo inventado.
5. O especialista audita, especifica e revisa; Runtime implementa; Quality mede; Task Verifier aceita.
6. Nenhum secret, cookie, token, PII ou screenshot nao autorizado aparece nos artefatos auditados.
7. Roteamento Codex e Antigravity respeita o mesmo contrato publico ou a divergencia impede paridade.
8. Privacidade, ownership, browser fail-closed, eval adversarial, routing e pilotos incompletos resultam obrigatoriamente em `NO-GO` para a superficie afetada.
9. `GO-WITH-RISK` e permitido apenas para risco nao bloqueante, com owner, prazo e mitigacao explicitos.

## Definition of Done
1. Relatorio e matriz final publicados com classificacao por superficie.
2. Estado operacional atualizado de acordo com o gate, sem promocao implicita.
3. Todo blocker e follow-up possui owner e proxima task recomendada.

## Validacao
- comandos/checks: reexecucao amostral independente, suites/evals relevantes, checks de sanitizacao, `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: Task Verifier confere evidencias primarias, fronteiras e classificacao sem aceitar autoatestacao do especialista.

## Evidencia esperada
- Matriz requirement-to-evidence completa.
- Resultado independente dos gates adversarial e forward.
- Relatorio GO/GO-WITH-RISK/NO-GO por superficie e estado operacional correspondente.

## Riscos
- Pressao para ativar por demonstracao convincente apesar de lacunas de evidencia.
- Misturar readiness do especialista com qualidade da UI auditada.
- Tratar paridade parcial entre engines como ativacao total.

## Blockers possiveis
- Dependencia nativa do browser ainda ausente.
- Forward eval contaminado ou thresholds nao atingidos.
- Pilotos sem jornada nova, sem captura real ou sem revisao independente.
- Falhas de sanitizacao, ownership ou roteamento.

## Proximo passo provavel
Ativar apenas as superficies classificadas como `GO` ou abrir tasks corretivas para cada blocker antes de repetir o gate.

## Feedback obrigatorio de retorno
- classificacao por superficie
- matriz e evidencias auditadas
- blockers e riscos aceitos
- estado operacional resultante
- tasks corretivas recomendadas

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear ao Task Verifier para decisao independente e bloquear ativacao quando faltar evidencia ou fronteira.
- constraints: sem correcoes dentro do gate, sem autoatestacao, sem evidencia fake/local promovida a live e sem aceite de UX do AlwaysTrack.
