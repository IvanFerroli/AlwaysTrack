# Product UX State

## Metadata

- status: pilot-ready
- owner: olympus_product_ux
- last-updated: 2026-08-06
- source-of-truth: docs/operations/product-ux-state.md
- gate: docs/testing/product-ux-final-readiness-gate-2026-08-06.md (TASK-AT-450, GO-WITH-RISK por superfície, NO-GO para active irrestrito)
- piloto: docs/testing/product-ux-pilot-report-2026-08-05.md (TASK-AT-449, evidência atualizada em 2026-08-06)

## Missão vigente

Auditar, especificar, adquirir evidência e revisar UX no AlwaysTrack, preservando a independência entre Product UX, implementação e aprovação.

## Contrato canônico

- decisão: docs/adr/ADR-007-product-ux-specialist-local-first.md
- spec: docs/specs/SPEC-AT-005-product-ux-specialist.md
- protocolo: docs/pipeline/product-ux-protocol.md
- runbook: docs/operations/product-ux-runbook.md
- evidência: docs/operations/evidence-manifest.schema.json
- regressão visual: docs/testing/visual-regression.md
- configuração Codex local: .codex/agents/olympus_product_ux.toml
- skill kit local: .agents/skills/olympus-product-ux/
- bundle portátil local: .antigravity/agents/ux.md

Os diretórios .codex, .agents e .antigravity são configuração local ignorada pelo Git. Este estado e o protocolo rastreado preservam o contrato reconstruível do especialista.

## Capacidades ativas

1. audit -> ux-audit
2. interaction-spec -> ux-specification
3. advisory-review -> ux-review-report
4. visual-evidence-package como primário apenas para aquisição/prova dedicada

Aquisição dedicada de pipeline usa `capability_mode: audit`, `operation: evidence-acquisition` e `VisualEvidenceRequest 1.0` task-backed; não abre `UxReviewRequest` nem produz diagnóstico como artefato primário.

Aquisição de apoio no advisory audit usa somente `UxReviewRequest.request_id`, gera `test-results/product-ux/advisory/<request-id>/advisory-capture-record.json` sem manifesto e permanece same-request-only, não reutilizável, não promovível e sem gate closure. O InspectionRecord é adicionado ao ux-audit depois que o PNG real é aberto.

## Ciclo de vida

- draft: core ainda depende de contratos, harness ou evals; estado atual
- evaluation-ready: contratos, harness e golden cases podem ser executados com segurança
- pilot-ready: dry-runs e quality gate independentes passaram
- active: pilotos e readiness gate autorizaram uso regular
- degraded: capacidade limitada, sempre fail-closed no gate afetado
- disabled: ativação bloqueada; nenhuma aquisição ou parecer de pipeline permitido

## Boundaries ativos

- nenhuma implementação de UI;
- nenhuma alteração de código, CSS, markup, tokens, assets ou baselines;
- runtime local não mutante e evidência transitória ignorada são permitidos;
- ambiente live e dados sensíveis não são permitidos por padrão;
- nenhuma alegação integral de conformidade WCAG por automação;
- nenhuma aprovação da própria recomendação, especificação ou revisão;
- fechamento independente pelo Task Verifier.

## Roteamento

- modo do Orchestrator: product-ux
- especialista: olympus_product_ux
- handoff exige um artefato primário e matriz surface/role/state/setup/navigation/viewport
- task que misture UX e implementação volta ao Taskyfier para quebra
- visual-evidence-package primário exige operation evidence-acquisition; REFERENCE_REQUIRED interno mapeia para HUMAN_INPUT_REQUIRED/UX_INTENT_REQUIRED, enquanto blockers técnicos/sensíveis/stale mapeiam para BLOCKED com code público e cause.status visual
- advisory nunca inventa TASK-AT/Execution/Evidence IDs e nunca promove seu record; task posterior exige nova aquisição pelo lane de pipeline
- implementação segue para especialista executor separado
- aceite segue para Task Verifier

## Evidência e autonomia

- defeito objetivo e reproduzível pode ser capturado autonomamente em ambiente seguro;
- intenção estética, branding, redesign, prioridade e baseline intencional exigem decisão humana;
- usar manifesto canônico e seus enums fake, local, production-like e live;
- registrar origem da evidência separadamente da classificação do ambiente;
- screenshot, DOM, ARIA, teclado e manual são sinais complementares;
- evidência fake/local não promove gate production-like/live.
- afirmação visual exige browser e inspeção da captura; leitura de código isolada não fecha o gate.
- registro advisory vale somente para o request ativo, mesmo em worktree limpa; manifesto canônico continua exclusivo da aquisição task-backed.

## Integração material

- core do agente: materializado
- SKILL.md e metadados openai.yaml: materializados
- references, templates, rubrics e manifest do kit: materializados
- protocolo canônico: materializado
- roteamento do Orchestrator: materializado
- portabilidade Antigravity: materializada
- scripts de aquisição/harness: ownership do olympus_runtime_builder
- contratos machine-readable adicionais: ownership do olympus_contracts_builder
- evals e quality gate independentes: devem ser validados pelo olympus_quality_builder

## Compatibilidade Codex

O novo agente usa o schema atual de custom agents verificado em 2026-08-05:

- name
- description
- developer_instructions
- model = gpt-5.6-sol
- model_reasoning_effort = xhigh
- sandbox_mode = workspace-write

workspace-write existe para runtime local e evidência transitória. As instruções proíbem alteração do produto.

Os agentes Olympus anteriores ainda usam chaves legadas system_prompt e reasoning. Eles não foram migrados nesta frente para evitar alteração transversal sem task própria. A camada Antigravity deve aceitar developer_instructions atual e system_prompt legado.

## Riscos residuais

- captura visual pode variar por browser, fonte e sistema operacional;
- automação não substitui tecnologia assistiva ou usuário real;
- uma referência atual pode ser confundida com design alvo se a autoridade não for classificada;
- um record advisory pode ser promovido indevidamente se o consumidor ignorar `same-request-only`; o validator dedicado e a readquisição obrigatória bloqueiam essa transição;
- self-review pode gerar viés se o Task Verifier não mantiver independência;
- configuração local ignorada precisa ser reconstruída a partir deste protocolo em novo checkout.

## Próximo estado esperado

`pilot-ready` desde 2026-08-06: harness, evals de referência (37/37 testes, eval de calibração `gate: GO`), captura advisory taskless real e três modos de capacidade exercitados em contexto fresh sob pressão adversarial (`REFERENCE_REQUIRED`, ownership aggregation, self-review) foram verificados de forma independente — ver gate acima.

Promover para `active` irrestrito exige fechar o residual explícito do gate: completar os 6 slots restantes da rotação selada forward (`FWD-AUD-01`, `FWD-AUD-03`, `FWD-SPEC-01`, `FWD-SPEC-02`, `FWD-REV-02`, `FWD-REV-03`) sob o mesmo protocolo cego de autoria/execução/avaliação, obter `gate: GO` certificado por `run-evals.mjs --cases ... --observations ...` com os 9 slots completos, e corrigir a inconsistência de envelope formal identificada em `FWD-SPEC-03`. Até lá, uso é supervisionado: task-backed audit/spec/review com aceite humano, não autônomo em alto volume.

## Regra de precedência

Task e handoff > documento canônico > ADR/spec > protocolo Product UX > este estado > legado compatível.
