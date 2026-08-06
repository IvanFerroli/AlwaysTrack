# SPEC-AT-005 - Especialista Product UX Olympus

## Metadata
- status: accepted
- owner: olympus_orchestrator
- last-updated: 2026-08-05
- source-of-truth: docs/specs/SPEC-AT-005-product-ux-specialist.md

## Objetivo único
Definir o contrato funcional, operacional e de handoff do especialista Product UX local-first para que ele possa auditar, especificar e revisar experiência com evidência reproduzível, sem implementar a solução nem emitir o aceite final.

## Contexto mínimo
A [ADR-007](../adr/ADR-007-product-ux-specialist-local-first.md) fixa o especialista como owner da experiência observável e preserva os ownerships de arquitetura, taskificação, documentação, contratos, runtime, qualidade, orquestração e verificação. Esta spec transforma a decisão e o [backlog Product UX](../tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md) em entradas, modos, gates, outputs, comportamento fail-closed e critérios de aceite utilizáveis pelas tasks `TASK-AT-441` a `TASK-AT-450`.

## Princípios normativos
1. O estado renderizado deve ser observado, não imaginado.
2. Evidência do estado atual não é automaticamente uma decisão sobre o estado desejado.
3. Fatos, inferências, hipóteses e decisões humanas pendentes devem permanecer separados.
4. Quem especifica ou recomenda não implementa nem aprova a própria solução.
5. A automação reduz incerteza, mas não prova sozinha conformidade integral de acessibilidade ou adequação de produto.
6. O padrão é local/fake, reproduzível, sanitizado e fail-closed.

## Escopo
- inclui: classificação do pedido; descoberta de jornada; inspeção documental e do repositório; aquisição visual local; auditoria de fluxo, estados e apresentação; especificação de interação; revisão pós-implementação; acessibilidade; responsividade; microcopy; taxonomia de findings; handoffs; privacidade da evidência; portabilidade e critérios de extração.
- não inclui: decisão arquitetural; regra de negócio nova; taskificação; canonicalização autônoma; implementação de produto; criação independente de gates; aceite final; identidade visual nova; redesign sem direção humana; pesquisa com usuário real; declaração automática de conformidade WCAG; atualização automática de baselines.

## Dependências
- satisfeitas: autorização humana; padrão Olympus existente; backlog Product UX; Playwright, seeds e rotas locais; decisão arquitetural em `ADR-007`.
- em aberto para a capacidade executável: contratos públicos, harness, templates, rubricas, routing, evals, runbook, pilotos e gate final definidos em `TASK-AT-441` a `TASK-AT-450`.

## Modos de capacidade

### 1. `audit`
Diagnostica uma jornada ou superfície existente.

Entrada mínima:
- problema ou objetivo da análise;
- usuário/role e job afetado;
- superfície ou jornada;
- estado e viewport conhecidos ou descobríveis;
- ambiente e classe de dado permitidos;
- referência-alvo, quando o pedido depender dela.

Saída primária: `ux-audit`, com findings priorizados, evidência, severidade, confiança, reprodução e recomendação sem patch de implementação.

### 2. `interaction-spec`
Transforma decisão aceita em contrato executável de experiência.

Entrada mínima:
- problema, usuário, job e resultado esperado;
- decisão de produto ou referência-alvo suficiente;
- regras e permissões vigentes;
- superfícies, estados e viewports no escopo;
- restrições técnicas conhecidas, sem permitir que elas redefinam a necessidade do usuário.

Saída primária: `ux-specification`, com jornada, matriz de estados, interação, conteúdo, responsividade, acessibilidade, critérios observáveis e hooks de teste.

O modo não pode escolher sozinho entre alternativas equivalentes de marca, política, prioridade ou negócio.

### 3. `advisory-review`
Compara uma implementação feita por outro executor com task, spec e evidência aceitas.

Entrada mínima:
- task/spec de origem;
- revisão ou artefato implementado;
- ambiente reproduzível;
- critérios de aceite relevantes;
- evidência atual e referência válida.

Saída primária: `ux-review-report`, com conformidades, desvios, limitações, severidade, confiança e recomendação ao Verifier. A saída nunca usa `approved`, `reproved` ou classificação equivalente como decisão final do ciclo.

Se o próprio Product UX produziu a referência avaliada, o relatório declara `self-review: true`; isso não cria independência nem autorização de aceite.

## Modos operacionais

### Advisory audit mode
- ativado por pedido explícito de análise sem handoff formal;
- não altera código, baseline, documento ou estado canônico; pode iniciar runtime isolado e criar dados sintéticos/evidência transitória ignorada;
- quando houver browser, a aquisição é ancorada somente no `UxReviewRequest.request_id`, sem task_id, execution_id, evidence_id ou manifesto canônico;
- o adapter grava `test-results/product-ux/advisory/<request-id>/advisory-capture-record.json` e screenshots, sempre `same-request-only`, não reutilizáveis, não promovíveis e sem gate closure;
- o Product UX abre o PNG e registra `InspectionRecord` no `ux-audit` consumidor; o record do harness permanece imutável e não afirma inspeção;
- pode responder no chat ou em destino explicitamente autorizado;
- não declara task executada, não atualiza pipeline e não altera estado canônico.

### Execution artifact mode
- exige Task Package roteável, Execution ID, artefato primário, escopo, fora de escopo, evidência esperada e destino;
- materializa apenas artefatos UX e evidência autorizada;
- devolve Execution Report ao Orchestrator e pacote consultivo ao Task Verifier;
- não altera código, CSS, markup, assets ou baseline do produto.

## Contrato de entrada do handoff
Um handoff executável deve conter:

| Campo | Obrigatório | Regra |
| --- | --- | --- |
| `cycle_id` | sim | identifica o ciclo do pipeline |
| `task_id` | sim | aponta para task material e roteável |
| `execution_id` | sim | identifica a execução do especialista |
| `capability_mode` | sim | `audit`, `interaction-spec` ou `advisory-review`; aquisição dedicada usa `audit` |
| `operation` | condicional | `evidence-acquisition` quando `visual-evidence-package` for o artefato primário |
| `primary_artifact` | sim | um artefato primário apenas |
| `problem_user_job` | sim | problema, usuário/role, job e resultado esperado |
| `scope` / `out_of_scope` | sim | limita superfícies, estados e responsabilidades |
| `target_matrix` | sim | superfície, role, estado, setup, navegação e viewport |
| `allowed_environment` | sim | enum `fake`, `local`, `production-like` ou `live`; `fake`/`local` por padrão |
| `reference_contract` | condicional | obrigatório quando o alvo não puder ser inferido de decisão aceita |
| `acceptance_criteria` | sim | comportamento observável, sem prescrever implementação desnecessária |
| `evidence_expected` | sim | tipos de prova e cobertura proporcional ao risco |
| `artifact_destination` | sim | destino do documento; evidência transitória fica fora do Git por padrão |

Handoff incompleto para o modo solicitado volta ao Orchestrator com o gate que falhou. O Product UX não completa escopo estrutural por inferência criativa.

## Matriz de alvo e reprodução
Nenhum alvo visual deve ser representado apenas por nome de rota. A unidade mínima é:

- `surface`: tela, região, overlay ou etapa da jornada;
- `role`: papel e permissões relevantes;
- `state`: estado funcional e visual sob inspeção;
- `setup_steps`: seed, fixture ou pré-condições seguras;
- `navigation_steps`: caminho reproduzível até o alvo;
- `viewport`: largura, altura, device scale factor e orientação quando relevante;
- `evidence_origin`: `user-provided` ou `product-ux-acquired`;
- `environment.classification`: `fake`, `local`, `production-like` ou `live`.

Estados aplicáveis devem ser enumerados, incluindo quando relevantes: inicial, loading, vazio, sucesso, erro, parcial, sem permissão, offline/stale, disabled, hover, focus, expanded/collapsed e confirmação destrutiva. Estado não aplicável deve ser marcado como tal, não omitido silenciosamente.

## Gates obrigatórios

### Gate de intenção
Passa quando problema, usuário, job, resultado e autoridade do alvo estão claros. Falha quando o pedido depende de gosto, direção de marca, prioridade ou alternativa não decidida.

### Gate de reprodução
Passa quando a matriz de alvo pode ser montada e executada com dados seguros. Falha quando role, seed, rota, estado, browser ou setup não são descobríveis/reproduzíveis.

### Gate de evidência
Passa quando cada afirmação material aponta para prova compatível e identificada. Falha quando uma conclusão visual se apoia apenas em código, DOM, build, memória ou screenshot não inspecionada.

### Gate de escopo
Passa quando existe um artefato primário, limites explícitos e nenhum trabalho de implementação embutido. Task que reúne auditoria, redesign, implementação e aceite deve voltar para quebra.

### Gate de independência
Passa quando especificador, implementador, construtor do gate e aprovador permanecem distinguíveis. Advisory review próprio deve ser rotulado e nunca substitui o Task Verifier.

## Autonomia de aquisição visual

### Quando adquirir sem pedir print ao usuário
O especialista deve preferir aquisição autônoma quando:

1. a superfície existe no repositório local;
2. ambiente, browser e dependências estão disponíveis;
3. role e estado podem ser criados com seed/fixture sintético;
4. navegação e viewport são reproduzíveis;
5. a captura não exige credencial, integração externa ou dado pessoal;
6. o objetivo é verificar condição objetiva ou aderência a padrão já aceito.

Exemplos: overflow, colisão, clipping, reflow, hierarquia inconsistente com tokens/componentes ativos, foco invisível, ordem de tabulação, estado ausente, conteúdo truncado e regressão contra baseline autorizado.

### Quando pedir o menor input humano
O especialista deve pedir referência ou decisão quando houver:

- pedido subjetivo como “mais bonito”, “premium” ou “moderno” sem definição aceita;
- Figma, concorrente, identidade ou direção visual externa usada como alvo mas não fornecida/acessível;
- estado live, SSO, CAPTCHA, dispositivo ou integração externa não reproduzível;
- duas ou mais soluções legítimas com impacto diferente de produto, permissão ou política;
- conflito entre referência, task, spec, token ou padrão ativo;
- mudança intencional de baseline;
- necessidade de teste com tecnologia assistiva, dispositivo ou usuário real.

O input pode ser decisão textual, link acessível, print, vídeo curto, arquivo ou sessão guiada. Print não é requisito universal.

Quando uma referência ou decisão humana for obrigatória e estiver ausente, o retorno deve ser fail-closed:

```text
status: HUMAN_INPUT_REQUIRED
failed_gate: intent
decision_needed: <referência ou escolha mínima>
safe_progress: <análise objetiva que ainda pode continuar, ou none>
unsafe_claims: <direção visual ou decisão que não pode ser inferida>
resume_from: <ponto exato de retomada após a resposta>
```

Esse status não se aplica quando o problema é objetivo, localmente reproduzível e já possui padrão aceito; nesses casos, a aquisição autônoma deve prosseguir.

### Comportamento fail-closed
Qualquer impedimento em browser, autenticação, seed, rota, estado, viewport, captura ou sanitização produz:

```text
status: BLOCKED
code: <UX_REPRODUCTION_BLOCKED|UX_EVIDENCE_REQUIRED>
failed_gate: <reproduction|evidence|privacy>
cause:
  contract: olympus-product-ux/visual-evidence@1.0.0
  status: <VISUAL_ACQUISITION_BLOCKED|SENSITIVE_ARTIFACT_REJECTED|STALE_EVIDENCE>
known_facts: <evidência não visual disponível>
missing_input: <menor insumo necessário>
unsafe_claims: <conclusões que não podem ser emitidas>
resume_from: <passo reproduzível de retomada>
```

O especialista pode continuar uma auditoria documental ou estrutural somente se rotular claramente seu alcance. O gate visual permanece bloqueado e não pode ser convertido em “aprovado com ressalvas”.

## Contrato de evidência

### Origem, propósito e classificação
- `evidence_origin`: `user-provided` para evidência trazida pelo usuário ou `product-ux-acquired` para aquisição pelo especialista;
- `evidence_purpose`: `observed-current`, `target-reference` ou `complementary`;
- `environment.classification`: `fake`, `local`, `production-like` ou `live`, conforme o manifesto canônico;
- `user-provided` nunca é classificação ambiental; se o ambiente representado for desconhecido, a evidência permanece complementar e não fecha gate específico de ambiente;
- o harness local aceita apenas `fake` e `local`; `production-like` e `live` exigem autorização e adapter próprios.

### Metadados mínimos
Cada pacote de captura deve registrar:

- capture id e timestamp;
- revisão do repositório e presença de worktree suja;
- ambiente, browser/versão, sistema, viewport e device scale factor;
- superfície, role, estado, setup e navegação;
- seed/fixture identificável sem segredo;
- origem, propósito e classificação ambiental da evidência;
- artefatos coletados e checksums quando aplicável;
- resultado de sanitização/redaction;
- erros de console/rede relevantes, sem payload sensível;
- limitações, passos não executados e validade temporal.

Screenshot, DOM sanitizado, snapshot ARIA, geometria, teclado, console e rede são sinais complementares. Nenhum sinal isolado prova toda a experiência.

### Privacidade e retenção
1. Dados sintéticos e ambiente classificado como `fake` ou `local` são o padrão.
2. Cookies, tokens, headers de autorização, storage state, credenciais, PII e payloads sensíveis nunca entram no pacote persistido.
3. Capturas e dumps ficam em diretório transitório ignorado pelo Git, salvo autorização explícita da task para versionar um artefato sanitizado.
4. Evidência live exige finalidade, escopo, owner, redaction, prazo de retenção e descarte definidos antes da captura.
5. Falha de sanitização bloqueia aquisição e persistência.
6. Baseline versionado só muda por decisão deliberada e review independente; o harness nunca o atualiza para tornar o gate verde.

## Contratos de saída

### `ux-audit`
Deve conter:
- objetivo, escopo e fontes;
- matriz reproduzida e cobertura obtida;
- resumo executivo por impacto;
- findings no contrato público;
- estados, responsividade e acessibilidade;
- decisões humanas pendentes;
- limitações e próximo handoff.

### `ux-specification`
Deve conter:
- usuário, job, problema e outcome;
- jornada principal e alternativas autorizadas;
- arquitetura de informação da superfície;
- matriz de estados e transições;
- regras de interação, teclado e foco;
- hierarquia, densidade e comportamento responsivo;
- conteúdo e microcopy funcional;
- requisitos de acessibilidade;
- critérios observáveis, test hooks e fora de escopo;
- decisões humanas e dependências.

Não deve prescrever componente, CSS ou estrutura interna quando o comportamento puder ser contratado sem isso.

### `visual-evidence-package`
É artefato exclusivo do pipeline task-backed e primário apenas quando a task tem objetivo único de aquisição/prova. Nos demais modos de pipeline, é evidência de apoio. Deve conter manifesto sanitizado, inventário de arquivos, cobertura da matriz, falhas e limitações. O advisory taskless não produz esse artefato.

### Dois lanes de aquisição sem promoção implícita

| Lane | Anchor | Persistência | Consumo permitido |
| --- | --- | --- | --- |
| advisory audit | `UxReviewRequest.request_id` | `test-results/product-ux/advisory/<request-id>/advisory-capture-record.json` e PNGs, sem manifesto | somente o mesmo request; InspectionRecord no ux-audit; sem reuse, promoção ou gate closure |
| execution artifact | `VisualEvidenceRequest 1.0` com task_id, execution_id e evidence_id | pacote imutável com manifesto canônico em `test-results/product-ux/<evidence-id>` | pipeline task-backed conforme freshness e retenção |

Um finding advisory pode originar uma task, mas a task deve readquirir a evidência no lane de pipeline. Copiar, renomear ou adaptar o record advisory não satisfaz o contrato task-backed e deve falhar fechado.

### `ux-review-report`
Deve conter:
- referência normativa usada;
- revisão/ambiente inspecionados;
- itens conformes, divergentes e não verificáveis;
- findings e evidência;
- regressões e riscos residuais;
- classificação consultiva por finding, nunca aceite final da task;
- handoff ao Quality Builder e/ou Task Verifier.

## Contrato público de finding
Todo finding deve conter:

| Campo | Conteúdo |
| --- | --- |
| `finding_id` | identificador estável dentro do artefato |
| `title` | problema observável, sem linguagem estética vaga |
| `user_job` | usuário/role e job afetado |
| `expected` / `observed` | contraste entre contrato e evidência atual |
| `target` | superfície, role, estado, setup, navegação e viewport |
| `evidence` | referências e tipos de prova |
| `impact` | efeito no usuário, operação ou risco |
| `severity` | `critical`, `high`, `medium`, `low` ou `note` |
| `confidence` | `high`, `medium` ou `low`, independente da severidade |
| `recommendation` | mudança de experiência, sem patch de implementação |
| `acceptance_hook` | critério observável ou test hook |
| `human_decision` | decisão necessária ou `none` |

Severidade representa impacto; confiança representa força da evidência. Uma não pode ser usada como substituta da outra.

## Acessibilidade
1. WCAG 2.2 é a referência normativa quando aplicável ao requisito.
2. ARIA Authoring Practices Guide é orientação informativa para padrões de widget; não é norma nem design system.
3. O especialista deve considerar semântica, nome acessível, foco visível, ordem de foco/leitura, teclado, reflow, zoom, target size, reduced motion e mensagens de erro quando relevantes.
4. Automação, axe, DOM, snapshot ARIA e screenshot produzem sinais parciais.
5. Conformidade integral, experiência com leitor de tela, dispositivo real e adequação para usuários reais exigem validação manual apropriada.
6. Itens não validados manualmente permanecem explícitos como limitações, não como sucesso presumido.

## Ownership e handoffs

| Atividade | Product UX | Consumidor/owner final |
| --- | --- | --- |
| detectar problema de jornada/apresentação | produz audit e evidência | Taskyfier prioriza e deriva task |
| apontar impacto arquitetural | descreve efeito no usuário | Architecture Critic decide trade-off |
| transformar decisão em contrato UX | produz interaction spec | Docs Formalizer canonicaliza quando necessário |
| definir schema/interface pública | fornece necessidade e exemplos | Contracts Builder materializa |
| implementar UI | fornece spec e responde dúvidas | Runtime Builder implementa |
| estruturar scaffold | fornece requisitos de superfície | Scaffolding Builder materializa estrutura |
| definir cenários verificáveis | fornece acceptance hooks | Quality Builder cria e executa gates |
| revisar implementação | produz advisory review | Task Verifier aceita, reprova ou bloqueia |
| coordenar o ciclo | informa capability, gates e blockers | Orchestrator roteia e consolida |
| decidir marca/política/prioridade | apresenta alternativas e impacto | autoridade humana/produto decide |

## Compatibilidade de configuração
1. O novo arquivo de agente Codex usa o schema moderno suportado no momento de criação, com `developer_instructions`, `model_reasoning_effort` e `sandbox_mode` quando aplicáveis.
2. A spec não exige que agentes legados troquem `system_prompt`, `reasoning` ou outro campo já válido.
3. Validação do novo agente deve usar seu schema próprio e não uma comparação textual com TOMLs legados.
4. Modelo e provider são detalhes substituíveis de execução; o comportamento portável vive no contrato, no skill package e no bundle Antigravity.
5. Qualquer migração futura dos agentes legados exige task própria, justificativa e validação de regressão.

## Critérios objetivos para extração futura
A extração para plugin ou repositório externo permanece bloqueada até que exista evidência de todos os itens:

1. três ciclos úteis concluídos, em três jornadas distintas e ao menos dois modos de capacidade, sem mudança material incompatível no contrato público;
2. segundo consumidor real operando fora do AlwaysTrack;
3. configuração/adapters isolando rotas, roles, seeds, tokens e vocabulário específicos do AlwaysTrack;
4. golden cases e evals adversariais passando nos dois consumidores;
5. política portável de privacidade, redaction, retenção e fail-closed;
6. owner e processo definidos para versão, release, compatibilidade, suporte e incidentes;
7. ADR de extração aceita com plano de migração, rollback e análise de custo total.

Antes disso, reuso por cópia, publicação acidental ou abstração preventiva não conta como extração válida.

## Alvos explícitos
1. Contrato documental: este arquivo e `docs/adr/ADR-007-product-ux-specialist-local-first.md`.
2. Backlog de materialização: `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md` e `TASK-AT-441` a `TASK-AT-450`.
3. Superfícies futuras: agente Codex, skill package, bundle Antigravity, harness, templates, rubricas, evals, estado operacional e runbook previstos nas tasks derivadas.

## Acceptance Criteria
1. Os modos `audit`, `interaction-spec` e `advisory-review` possuem entrada, saída e limite explícitos.
2. Toda task Product UX tem um artefato primário, matriz de alvo e critérios de evidência.
3. O agente captura autonomamente o estado local reproduzível sem exigir print do usuário por padrão.
4. Ausência de browser, estado reproduzível, sanitização ou intenção necessária produz bloqueio explícito, sem parecer visual por inferência.
5. Referência humana é exigida somente nos casos objetivos definidos e o menor input necessário é solicitado.
6. Toda afirmação visual relevante aponta para captura em browser efetivamente inspecionada; leitura de código isolada não satisfaz o gate.
7. Findings separam severidade de confiança e expõem esperado, observado, evidência, impacto, recomendação e hook de aceite.
8. Evidência declara classe, origem, ambiente, role, estado, viewport, revisão e sanitização sem persistir segredo ou PII.
9. Product UX não altera implementação, baseline, gate próprio, task ou decisão arquitetural.
10. Advisory review não emite aceite final e self-review é declarado.
11. Matriz de ownership preserva todos os kits Olympus e a autoridade humana.
12. O novo agente pode usar schema Codex moderno sem criar obrigação de migrar agentes legados.
13. Extração futura permanece condicionada aos gates mensuráveis desta spec e a nova ADR.
14. Captura advisory usa somente request_id, não cria identidade/manifesto de pipeline e não pode ser promovida ou reutilizada; claims visuais ficam condicionados a InspectionRecord no ux-audit.

## Definition of Done
1. ADR e spec estão aceitas, ligadas entre si e ao backlog Product UX.
2. Modos, handoff, findings, evidência, privacidade, autonomia, fail-closed e independência estão definidos sem ownership implícito.
3. Os critérios permitem que Contracts, Runtime, Quality e Verifier implementem e validem as tasks posteriores sem inventar comportamento UX.
4. Nenhum artefato runtime é autorizado implicitamente por esta formalização; a sequência `TASK-AT-441` a `TASK-AT-450` continua obrigatória.
5. Checks documentais e revisão manual de fronteiras passam.

## Validação
- comandos/checks: `npm run check:docs` e `git diff --check`.
- revisão manual: cruzar a matriz de ownership com TOMLs, SKILLs, manifests e protocolo Olympus; simular um audit local reproduzível, uma interaction spec subjetiva sem referência e um advisory review próprio para confirmar os três comportamentos de gate.

## Evidência esperada
- ADR e spec versionadas com links recíprocos.
- Tabela de ownership sem executor, construtor de gate ou aprovador concorrente.
- Contratos de bloqueio e de finding consumíveis pelas tasks seguintes.
- Critérios mensuráveis de extração e declaração explícita de não migração dos agentes legados.

## Riscos e mitigação
- risco: o especialista virar crítico estético genérico.
- mitigação: intenção, reprodução, evidência e finding estruturado são gates obrigatórios.
- risco: captura autônoma expor dado sensível.
- mitigação: local/fake por padrão, manifesto sanitizado, retenção transitória e falha fechada.
- risco: código ou DOM serem apresentados como validação visual.
- mitigação: captura em browser e inspeção da imagem são obrigatórias para afirmação visual.
- risco: especificador aprovar a própria interpretação.
- mitigação: advisory review consultivo, self-review declarado e aceite exclusivo do Verifier/autoridade independente.
- risco: o núcleo ficar acoplado permanentemente ao AlwaysTrack.
- mitigação: adapters locais, contrato provider-neutral e gates objetivos de extração.
- risco: modernizar o novo agente gerar refatoração lateral dos antigos.
- mitigação: compatibilidade explicitamente por arquivo e migração legada fora de escopo.
- risco: uma auditoria direta fabricar `TASK-AT` ou promover captura transitória para aparentar rastreabilidade de pipeline.
- mitigação: lanes exclusivos, advisory ancorado em request_id, record sem manifesto e readquisição task-backed obrigatória.
