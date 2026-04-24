# REGISTRY — Agentes do Olympus Climb

Índice completo de agentes. Para cada agente: alias de invocação, arquivos a carregar (em ordem),
estado operacional e observações de portabilidade.

---

## Mapa de invocação rápida

| Alias | Nome canônico | Papel curto |
|---|---|---|
| `@taskyfier` | olympus_taskyfier | Planner stateful — deriva e sequencia tasks |
| `@orchestrator` | olympus_orchestrator | Router — verifica roteabilidade e faz handoff |
| `@verifier` | olympus_task_verifier | Verificador — valida evidência e classifica ciclo |
| `@critic` | olympus_architecture_critic | Crítico — revisa arquitetura, decisões e documentos |
| `@auditor` | olympus_plan_auditor | Auditor — audita planos e documentos estruturantes |
| `@docs` | olympus_docs_formalizer | Especialista documental — ADRs, specs, manifests |
| `@scaffold` | olympus_scaffolding_builder | Especialista scaffolding — estrutura, boilerplate |
| `@contracts` | olympus_contracts_builder | Especialista contratos — schemas, tipos, interfaces |
| `@runtime` | olympus_runtime_builder | Especialista runtime — handlers, módulos, ligações |
| `@quality` | olympus_quality_builder | Especialista qualidade — typecheck, lint, testes |

---

## Registros detalhados

### @taskyfier — olympus_taskyfier

**Papel:** Planner stateful. Transforma artefatos aceitos em tasks executáveis sequenciadas.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_taskyfier.toml` — system prompt + regras de comportamento
2. `.agents/skills/olympus-taskyfier/SKILL.md` — skill card operacional
3. `docs/operations/taskyfier-memory.md` — memória viva (estado atual do projeto)
4. `docs/operations/engineering-pipeline-protocol.md` — protocolo do pipeline

**Estado operacional:** `docs/operations/taskyfier-memory.md`

**Modos formais:** derivação inicial | continuidade guiada | pipeline kickoff

---

### @orchestrator — olympus_orchestrator

**Papel:** Router. Recebe task do Taskyfier, verifica roteabilidade, faz handoff para especialista.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_orchestrator.toml` — system prompt + regras
2. `.agents/skills/olympus-orchestrator/SKILL.md` — skill card operacional
3. `docs/operations/orchestrator-state.md` — estado operacional
4. `docs/operations/engineering-pipeline-protocol.md` — protocolo do pipeline

**Estado operacional:** `docs/operations/orchestrator-state.md`

**Modos de execução:** documental | scaffolding | contracts | runtime | quality | ops

---

### @verifier — olympus_task_verifier

**Papel:** Verificador. Valida evidência após execução e classifica o ciclo.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_task_verifier.toml` — system prompt + regras
2. `.agents/skills/olympus-task-verifier/SKILL.md` — skill card operacional
3. `docs/operations/task-verifier-state.md` — estado operacional

**Estado operacional:** `docs/operations/task-verifier-state.md`

**Classificações possíveis:** aprovado | aprovado com ressalvas | reprovado | bloqueado

---

### @critic — olympus_architecture_critic

**Papel:** Crítico arquitetural. Revisa decisões, detecta incoerências, propõe ADRs e specs.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_architecture_critic.toml` — system prompt + regras

**Observação de portabilidade:** Este agente não tem skill dir em `.agents/skills/`.
O TOML é completo e autossuficiente.

**Estado operacional:** não possui state file dedicado — opera por análise sob demanda.

---

### @auditor — olympus_plan_auditor

**Papel:** Auditor de planos. Audita documentos estruturantes antes de implementação pesada.

**Arquivos a carregar (em ordem):**
1. `.agents/skills/olympus-plan-auditor/SKILL.md` — skill card operacional (fonte única)

**Observação de portabilidade:** Este agente não tem TOML em `.codex/agents/`.
O SKILL.md é completo e autossuficiente para ativação.

**Estado operacional:** não possui state file dedicado — opera por análise sob demanda.

---

### @docs — olympus_docs_formalizer

**Papel:** Especialista documental. Produz ADRs, specs, manifests, runbooks e docs vivas.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_docs_formalizer.toml` — system prompt + regras
2. `.agents/skills/olympus-docs-formalizer/SKILL.md` — skill card operacional
3. `docs/operations/docs-formalizer-state.md` — estado operacional

**Estado operacional:** `docs/operations/docs-formalizer-state.md`

---

### @scaffold — olympus_scaffolding_builder

**Papel:** Especialista scaffolding. Cria estrutura de pastas, boilerplate e wiring inicial.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_scaffolding_builder.toml` — system prompt + regras
2. `.agents/skills/olympus-scaffolding-builder/SKILL.md` — skill card operacional
3. `docs/operations/scaffolding-builder-state.md` — estado operacional

**Estado operacional:** `docs/operations/scaffolding-builder-state.md`

---

### @contracts — olympus_contracts_builder

**Papel:** Especialista contratos. Produz schemas, tipos, interfaces e contratos públicos.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_contracts_builder.toml` — system prompt + regras
2. `.agents/skills/olympus-contracts-builder/SKILL.md` — skill card operacional
3. `docs/operations/contracts-builder-state.md` — estado operacional

**Estado operacional:** `docs/operations/contracts-builder-state.md`

---

### @runtime — olympus_runtime_builder

**Papel:** Especialista runtime. Cria handlers, módulos, skill runners e ligações entre serviços.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_runtime_builder.toml` — system prompt + regras
2. `.agents/skills/olympus-runtime-builder/SKILL.md` — skill card operacional
3. `docs/operations/runtime-builder-state.md` — estado operacional

**Estado operacional:** `docs/operations/runtime-builder-state.md`

---

### @quality — olympus_quality_builder

**Papel:** Especialista qualidade. Executa typecheck, lint, testes e validações.

**Arquivos a carregar (em ordem):**
1. `.codex/agents/olympus_quality_builder.toml` — system prompt + regras
2. `.agents/skills/olympus-quality-builder/SKILL.md` — skill card operacional
3. `docs/operations/quality-builder-state.md` — estado operacional

**Estado operacional:** `docs/operations/quality-builder-state.md`

---

## Assimetrias documentadas

| Agente | TOML | SKILL.md | Observação |
|---|---|---|---|
| olympus_architecture_critic | ✅ | ❌ | Usar só o TOML — completo e autossuficiente |
| olympus_plan_auditor | ❌ | ✅ | Usar só o SKILL.md — completo e autossuficiente |
| Todos os outros (8) | ✅ | ✅ | Carregar ambos na ordem do registro |
