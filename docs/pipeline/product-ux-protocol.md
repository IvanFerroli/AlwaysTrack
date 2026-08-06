# Product UX Pipeline Protocol

## Metadata

- status: active
- version: 1.0
- owner: olympus_product_ux
- last-updated: 2026-08-05
- source-of-truth: docs/pipeline/product-ux-protocol.md

## Finalidade

Integrar um especialista Product UX ao pipeline Olympus sem concentrar diagnóstico, implementação e aprovação no mesmo papel.

## Base aceita

- docs/adr/ADR-007-product-ux-specialist-local-first.md
- docs/specs/SPEC-AT-005-product-ux-specialist.md

## Papel lógico

O Product UX pode:

- auditar jornadas e interfaces;
- especificar experiência, interação, estados e apresentação;
- adquirir evidência visual e estrutural segura;
- revisar mudanças implementadas por outro executor.

O Product UX não pode:

- implementar UI ou alterar código, CSS, markup, tokens, assets ou baselines;
- decidir regra de produto ou arquitetura sem fonte aceita;
- criar ou sequenciar tasks;
- emitir aprovação final do ciclo;
- aprovar a própria recomendação ou especificação.

Pode iniciar runtime local não mutante e gravar evidência transitória em diretório ignorado. No pipeline, pode persistir os documentos UX explicitamente previstos pela task.

No advisory taskless, qualquer captura usa somente o `UxReviewRequest.request_id`. Ela não fabrica Task ID, Execution ID ou Evidence ID, não cria manifesto canônico e não se transforma em artefato de pipeline.

## Modo do Orchestrator

O modo oficial é product-ux.

Roteie para olympus_product_ux somente quando houver exatamente um artefato primário:

1. ux-audit
2. ux-specification
3. visual-evidence-package
4. ux-review-report

Task que combine artefato UX, implementação e aprovação deve voltar ao Taskyfier para quebra.

## Modos de capacidade

- audit: diagnosticar estado atual e produzir ux-audit;
- interaction-spec: transformar decisão aceita em ux-specification;
- advisory-review: comparar implementação de outro executor e produzir ux-review-report consultivo.

visual-evidence-package só é artefato primário no pipeline, quando a task tem objetivo único de aquisição/prova. Nesse caso, o handoff usa `capability_mode: audit` e `operation: evidence-acquisition`, regido pelo `VisualEvidenceRequest 1.0` task-backed, fora do `UxReviewRequest`. Se houver diagnóstico de pipeline, `ux-audit` é o artefato primário e o pacote visual permanece evidência de apoio. O advisory produz apenas registro transitório de apoio ao próprio audit.

## Contrato de entrada

Todo handoff de pipeline deve conter:

- cycle_id ou execution_id;
- task_id;
- execution_id;
- handoff_to: olympus_product_ux;
- execution_mode: execution artifact mode;
- capability_mode: audit, interaction-spec ou advisory-review;
- operation: evidence-acquisition quando o artefato primário for visual-evidence-package;
- primary_artifact;
- problem_user_job;
- scope;
- out_of_scope;
- expected_artifacts;
- acceptance_criteria;
- validation_plan;
- regression_risks;
- target_matrix inicial ou autorização de descoberta;
- allowed_environment;
- evidence_origin permitida;
- environment_classification máxima permitida;
- reference_contract quando condicionalmente necessário;
- evidence_expected;
- artifact_destination;
- validation_destination independente.

## Modelo de alvo

Não identificar uma tela apenas por URL. Registrar:

- surface;
- role;
- state;
- setup_steps;
- navigation_steps;
- viewport;
- route/path apenas quando existir e for estável.

Esse modelo é obrigatório porque o AlwaysTrack combina paths canônicos com navegação interna baseada em estado.

## Evidência

Usar docs/operations/evidence-manifest.schema.json como manifesto canônico. Seus enums de ambiente são:

- fake
- local
- production-like
- live

Registrar separadamente se a evidência foi fornecida pelo usuário ou adquirida pelo Product UX. Seed e fixture sintéticos devem aparecer nas notas do ambiente/procedimento.

`user-provided` é sempre origem. `local/fake` é apenas conveniência de prosa e deve ser materializado como classification `fake` ou `local`, com fixtures/dados sintéticos descritos nas notas. Não criar enum concorrente.

Screenshot, geometria/DOM, snapshot ARIA, teclado e revisão manual são complementares. Nenhum deles isoladamente prova toda a experiência.

Afirmação sobre aparência renderizada, reflow, overflow, colisão, foco visível, target size ou regressão visual exige execução em browser e inspeção da captura correspondente. Código, JSX, CSS, DOM, build ou documentação isolados não fecham o gate visual.

Evidência fake ou local não fecha gate que exige production-like ou live.

### Boundary advisory taskless

- anchor único: `UxReviewRequest.request_id`;
- captura: `capture.mjs --request-id <request-id>`;
- output: `test-results/product-ux/advisory/<request-id>/advisory-capture-record.json` e screenshots sanitizados;
- validação: validator advisory dedicado com record e request_id ativo;
- política: same-request-only, non-reusable, non-promotable, sem manifesto e sem gate closure;
- inspeção: o harness mantém `inspections: []`; o `ux-audit` registra InspectionRecord após abertura do PNG;
- fechamento: descartar no encerramento do request; task posterior readquire por `VisualEvidenceRequest 1.0`.

`ADVISORY_CAPTURED` e `ADVISORY_ACQUISITION_BLOCKED` são resultados internos do adapter, não statuses públicos Product UX. Falhas continuam mapeadas para `HUMAN_INPUT_REQUIRED` ou `BLOCKED`, mantendo o resultado visual especializado somente em `cause.status`.

## Autonomia e gate humano

O Product UX pode descobrir e capturar autonomamente defeitos objetivos e reproduzíveis no ambiente local, como overflow, colisão, reflow, foco, ordem de leitura, target size, estado ausente, semântica e regressão contra baseline vigente.

Deve pedir o menor input humano necessário quando houver:

- direção de marca, gosto ou pedido vago de beleza;
- redesign ou ruptura deliberada com padrões ativos;
- referências conflitantes;
- estado live ou externo não reproduzível;
- prioridade de negócio ausente;
- alternativas igualmente válidas;
- mudança intencional de baseline;
- validação que dependa de usuário ou tecnologia assistiva real.

## Acessibilidade

WCAG 2.2 é a referência normativa quando aplicável. ARIA Authoring Practices Guide é orientação informativa, não norma nem design system.

Automação não autoriza alegação de conformidade integral. Findings devem separar severidade de confiança e declarar o tipo de evidência: visual, DOM, ARIA, keyboard ou manual-needed.

## Contrato de finding

Cada finding deve registrar:

- id e título;
- usuário/job afetado;
- esperado e observado;
- alvo reproduzível completo;
- evidência e tipo;
- impacto;
- severidade;
- confiança;
- recomendação sem código;
- acceptance/test hook;
- decisão humana pendente.

## Contrato de saída

Destino padrão dos artefatos no pipeline:

- docs/tasks/<task-id>-ux-audit.md
- docs/tasks/<task-id>-ux-specification.md
- docs/tasks/<task-id>-ux-evidence.md
- docs/tasks/<task-id>-ux-review.md

Capturas transitórias ficam no diretório ignorado definido pelo harness. Baselines versionados só podem mudar em task explícita e após revisão independente de baseline, atual e diff.

No advisory não há arquivo `docs/tasks/<task-id>-...`. O audit permanece no chat ou em destino explicitamente autorizado, e sua captura fica apenas no diretório advisory do request. Nunca promover esse record; readquirir quando o Orchestrator abrir uma execução task-backed.

O pacote para o Task Verifier deve conter:

- task e execution ids;
- artefato materializado;
- evidências e classificações;
- limitações;
- critérios UX e respectivos status;
- declaração de self-review, quando aplicável;
- itens manual-needed;
- nenhuma classificação final de aceite.

## Independência do fechamento

O Product UX pode classificar itens como aligned, deviation, regression, not-reproduced ou manual-needed. A classificação aprovado, aprovado com ressalvas, reprovado ou bloqueado pertence ao Task Verifier.

Se o Product UX tiver produzido a especificação usada como referência, a revisão deve declarar self-review e exigir fechamento independente.

## Falha fechada

Quando faltar referência ou decisão humana obrigatória:

- status: HUMAN_INPUT_REQUIRED
- code: UX_INTENT_REQUIRED
- cause.status: REFERENCE_REQUIRED quando a causa vier do contrato visual
- failed_gate: intent
- decision_needed
- safe_progress
- unsafe_claims
- resume_from

Quando falhar browser, autenticação, seed, navegação, estado, viewport, captura ou sanitização:

- status: BLOCKED
- code: UX_REPRODUCTION_BLOCKED para reprodução ou UX_EVIDENCE_REQUIRED para integridade/privacidade/freshness
- cause.status: VISUAL_ACQUISITION_BLOCKED, SENSITIVE_ARTIFACT_REJECTED ou STALE_EVIDENCE conforme o contrato visual
- failed_gate: reproduction, evidence ou privacy
- known_facts
- missing_input
- unsafe_claims
- resume_from

Uma análise documental ou estrutural pode continuar apenas com alcance rotulado. O gate visual permanece bloqueado.

## Fontes relacionadas

- docs/pipeline/protocol.md
- docs/operations/evidence-manifest.schema.json
- docs/operations/product-ux-state.md
- docs/testing/visual-regression.md
- apps/web/src/styles.css
- tests/e2e/
