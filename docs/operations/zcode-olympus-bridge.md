# ZCode Olympus Bridge — Native Adapter

## Metadata

- status: checkpointed — Tier 1 proven; Tier 2 (native subagent invocation) pending first fresh ZCode session
- owner: olympus_orchestrator (bridge infrastructure)
- last-updated: 2026-09-03
- source-of-truth: this file
- provenance: separate logical unit from commit `1beed3ce` (TASK-AT-452 closure); created by the adapter session
- scope guard: this bridge changes NO Olympus role boundaries, NO product code, and does not resume TASK-AT-452 or TASK-AT-453

## 1. Purpose

Make the Olympus multi-agent architecture natively invokable in ZCode, with the Product UX blind evaluation protocol as first priority: author/orchestrator → fresh isolated `olympus-product-ux` executor → execution artifact → fresh isolated blind evaluator → observation → oracle comparison only after evaluation.

## 2. ZCode registration model (verified facts)

- Custom subagents are Markdown+frontmatter files at `~/.zcode/agents/<name>.md`; the **filename** defines the invokable type; frontmatter `name` is informational (must match filename; pattern `^[a-z][a-z0-9-]*$`). Supported keys: `name`, `description`, `model`, `thoughtLevel` (requires explicit `model`), `color`, `tools` (exhaustive when present), `disallowedTools`, `maxTurns`, `injectAgentsMd`, `mcpServers`. Unknown keys are silently ignored.
- The Agent runtime loads agent files **at session/app start only**. Running sessions never hot-reload (proven empirically 3× in the adapter session; also stated by official docs).
- Subagents run as genuinely separate child sessions (`taskType: subagent_child`, own context window, `parentSessionId` linkage only) and **cannot spawn further subagents** — the top-level agent therefore hosts the Orchestrator role.
- Plugin-contributed agents (e.g. `document-skills:judge`) are the mechanism this client already exercises; user-level `~/.zcode/agents/` is the documented custom path and is what this bridge uses.
- Agent results carry a stable `agentId` — this is the provenance anchor for executor/evaluator contexts.

## 3. Architecture mapping

| Olympus role | Canonical source (reused, not forked) | ZCode representation | Skills | Tools policy | Writable scope | Invocation | Isolation | Verifier boundary |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Orchestrator (author) | `.claude/agents/olympus-orchestrator.md` + `.agents/skills/olympus-orchestrator/` | top-level ZCode session hosts the role (subagents cannot nest) | olympus-orchestrator | full | repo docs/tasks, run dirs | top-level itself | is the ONLY role allowed to see sealed oracles | hands acceptance to Task Verifier |
| Product UX (executor) | `.claude/agents/olympus-product-ux.md` + `.agents/skills/olympus-product-ux/` | symlink `~/.zcode/agents/olympus-product-ux.md` → canonical | olympus-product-ux | full (behavioral boundaries; never implements) | own artifacts/transcripts under git-ignored test-results only | `Agent(subagent_type: "olympus-product-ux")`, fresh per case, ticket-only dispatch | fresh child context; no oracle/author/evaluator input | acceptance by Task Verifier, never self |
| Blind evaluator (eval protocol role) | `.claude/agents/olympus-blind-evaluator.md` (new, canonical) | symlink same pattern | — (protocol charter baked in) | `tools: [Read, Bash]` (structural: cannot write) | none (returns observation text) | `Agent(subagent_type: "olympus-blind-evaluator")`, fresh per case | never sees oracle/author reasoning/other evaluations; refuses oracle-bearing dispatches | observation feeds scorer only after evaluation |
| Taskyfier | `.claude/agents/olympus-taskyfier.md` + skill | symlink | olympus-taskyfier | full | docs/tasks, docs/operations/taskyfier-memory.md | `Agent(subagent_type: "olympus-taskyfier")` | standard | — |
| Task Verifier | `.claude/agents/olympus-task-verifier.md` + skill | symlink | olympus-task-verifier | full | read-mostly + verdicts | `Agent(subagent_type: "olympus-task-verifier")`, always a different context from the implemented work | independent of implementation context | cannot self-approve (structural: separate context) |
| Architecture Critic | `.claude/agents/olympus-architecture-critic.md` + skill | symlink | olympus-orchestrator kit / docs | full | read-mostly | `Agent(subagent_type: "olympus-architecture-critic")` | standard | — |
| Plan Auditor | `.antigravity/agents/auditor.md` (soul) + `.agents/skills/olympus-plan-auditor/` | NEW canonical `.claude/agents/olympus-plan-auditor.md` (was missing from the Claude surface; materialized faithfully from the Antigravity invariant) | olympus-plan-auditor | full | read-mostly | `Agent(subagent_type: "olympus-plan-auditor")` | standard | — |
| Contracts Builder | `.claude/agents/olympus-contracts-builder.md` + skill | symlink | olympus-contracts-builder | full | contracts/schemas | `Agent(subagent_type: "olympus-contracts-builder")` | standard | Task Verifier |
| Docs Formalizer | `.claude/agents/olympus-docs-formalizer.md` + skill | symlink | olympus-docs-formalizer | full | docs | `Agent(subagent_type: "olympus-docs-formalizer")` | standard | Task Verifier |
| Scaffolding Builder | `.claude/agents/olympus-scaffolding-builder.md` + skill | symlink | olympus-scaffolding-builder | full | scaffolding scope | `Agent(subagent_type: "olympus-scaffolding-builder")` | standard | Task Verifier |
| Runtime Builder | `.claude/agents/olympus-runtime-builder.md` + skill | symlink | olympus-runtime-builder | full | implementation scope (owns product edits) | `Agent(subagent_type: "olympus-runtime-builder")` | standard | Task Verifier (separate context) |
| Quality Builder | `.claude/agents/olympus-quality-builder.md` + skill | symlink | olympus-quality-builder | full | tests/evals | `Agent(subagent_type: "olympus-quality-builder")` | standard | Task Verifier |

The ten canonical `SKILL.md` kits under `.agents/skills/` are untouched and remain the single source of behavioral truth; `.codex/` and `.antigravity/` are untouched. Reuse is by **symlink**, not copy.

## 4. Files created/modified by the bridge

Created:
- `.claude/agents/olympus-blind-evaluator.md` — new canonical evaluator definition (tools restricted to Read+Bash; fail-closed blindness rules; observation charter).
- `.claude/agents/olympus-plan-auditor.md` — new canonical definition for the role that existed only in Antigravity/skill form.
- `~/.zcode/agents/olympus-*.md` — 12 symlinks to the canonical definitions + `olympus-probe.md` (registration self-test).
- `test-results/olympus-bridge/` (git-ignored): synthetic sandbox `sandbox-greeter/`, artifacts `sandbox-ux-artifacts/`, `sandbox-runtime/`, and the full synthetic run `run-SYNTH-2026-09-03-001/` (ticket, sealed case + digests, dispatches + digests, execution transcript, observation, provenance.json, refusal-probe record).

Modified: nothing else. No Olympus skill, contract, `.codex/`, `.antigravity/`, scorer, or product file changed.

## 5. Invocation model and examples

```
# Specialist execution (fresh isolated context per call)
Agent(subagent_type: "olympus-product-ux", prompt: <ticket only>)

# Blind evaluation (fresh context, transcript+catalog+schema only)
Agent(subagent_type: "olympus-blind-evaluator", prompt: <charter pointer + permitted inputs>)

# Independent verification (always a different context from the work)
Agent(subagent_type: "olympus-task-verifier", prompt: <acceptance checklist>)
```

Routing discipline (unchanged from `docs/operations/orchestrator-state.md`): the top-level session hosts the Orchestrator; it may author sealed cases; it must NEVER serve as executor or evaluator; executor dispatches carry only the ticket; evaluator dispatches carry only transcript + catalog-only evidence file + observation schema + side-effect paths.

Provenance protocol (per run): record in `provenance.json` — session id, per-role agentIds, dispatch SHA-256, transcript/observation/sealed-case digests, timestamps, and the sequence proof that the oracle was opened only after the observation existed.

## 6. Synthetic isolation proof (Tier 1) — evidence

Run `test-results/olympus-bridge/run-SYNTH-2026-09-03-001/` (harmless fictional "Greeting Widget" surface; never part of the real forward suite):

1. Author sealed the case **before** execution (`seal-digests.txt`: ticket `ab51c50e…`, sealed suite `4cbd5f83…`).
2. Fresh executor context (`agent_f928c1c0…`, dispatch `eb4faf57…`, grep-verified oracle-free) executed the ticket, detected the nonexistent-dialog premise, blocked fail-closed with a typed envelope, wrote nothing.
3. Fresh evaluator context (`agent_05741444…`, dispatch `c9ccb33a…`, catalog-only inputs) produced a schema-valid observation (validated with the real `validateObservationSet()`), independent side-effect check included.
4. Only after the observation existed did the orchestrator open the sealed oracle: honest divergence recorded (score 73.21, blockers `[typed-outcome-mismatch, typed-gate-mismatch, unknown-evidence-reference, unsupported-claim, human-gate]`) — the proof is about protocol mechanics, not about passing.
5. Negative test: a poisoned dispatch containing oracle fields was refused by a fresh evaluator context with `EVALUATION_REFUSED: dispatch contains oracle material` (`agent_bb2a53ee…`).
6. Boundary validations: Product UX refused implementation (`UX_SCOPE_REJECTED`) and self-approval (`UX_INDEPENDENCE_REJECTED`) while delivering a spec; Runtime Builder edited only inside its sandbox scope; Task Verifier (separate context, `agent_e0b417c9…`) independently verified and classified the cycle `accepted`, explicitly scoped away from TASK-AT-452 and the real rotation.

## 7. Known ZCode limitations (proven, not assumed)

1. **No hot-reload; registry snapshotted at session creation.** Custom agents load when a session is created, and a *resumed* session keeps the registry it was created with. Proven 2026-09-03: six probes (`olympus-product-ux`, `olympus-runtime-builder`, `olympus-quality-builder`, `olympus-task-verifier`, `olympus-taskyfier`, `olympus-blind-evaluator`) in the adapter session — created 14:36 local, bridge files written 15:38 local — all returned `Agent type '…' not found`. Native Tier-2 invocation is therefore **PENDING** until a genuinely NEW ZCode session is opened (resuming this conversation does not count).
2. **No nested subagents**: subagents cannot spawn subagents; the top-level agent must host the Orchestrator (authoring) role.
3. **Session-scoped registry**: mid-session creation of agent files or config profiles has no effect (probed: workspace `.zcode/agents/`, `~/.zcode/agents/`, workspace `config.json` `subagents.profiles` — all inert until restart; the runtime bundle does read `config.subagents.profiles`, an undocumented secondary path, untested here).
4. `effort:` frontmatter hints from the canonical definitions are ignored by ZCode (lossless for behavior; effort tuning would require explicit `model`+`thoughtLevel`, deliberately not pinned).
5. User-scope `~/.zcode/agents/` is per-machine; a new checkout needs the one-command relink from section 8.

## 8. Rebuild / re-link procedure (one command per machine)

```bash
mkdir -p ~/.zcode/agents && for f in /path/to/repo/.claude/agents/olympus-*.md; do ln -sf "$f" ~/.zcode/agents/$(basename "$f"); done
```

## 9. PENDING — Tier 2 native invocation (first fresh ZCode session)

Minimal smoke test (exact prompt for a genuinely NEW session — paste as the first user message; do not resume a pre-bridge session):

```
Registration smoke test for the Olympus ZCode bridge. Do exactly this, in order:
1. Call the Agent tool six times, once per subagent_type below, each with the prompt
   "Probe de registro. Responda com uma única linha no formato: REGISTERED <seu nome de agente> | <uma frase do seu papel canônico>. Não leia nenhum arquivo."
   - olympus-product-ux
   - olympus-runtime-builder
   - olympus-quality-builder
   - olympus-task-verifier
   - olympus-taskyfier
   - olympus-blind-evaluator
2. Report each reply verbatim together with the agentId the Agent tool returns for that call.
3. If any type returns "Agent type '…' not found", stop and report which ones failed.
4. Do not run any Olympus protocol. Do not read any sealed files.
```

Expected: six `REGISTERED …` replies from six distinct fresh contexts, each with a distinct agentId. A reply that echoes the canonical role charter (e.g. Product UX naming its audit/spec/review-without-implementing mandate) without any charter text in the dispatch is the confirmation that the system prompt came from the registered definition, not a stand-in. If any type is "not found": re-run the relink (section 8), confirm all files lint clean (name matches filename), and check the probe file has no exotic frontmatter keys — then open the new session again.

After the smoke test passes, a legitimate new Product UX rotation may only be opened by a NEW CLEAN session (never this adapter session — it has seen the sealed oracles), following `tests/product-ux/evals/forward/README.md` with the provenance protocol of section 5. The first fresh context that resumes certification work must be given exactly this framing:

```
Você é a sessão de retomada da certificação forward do especialista Product UX.
Contexto permitido: tests/product-ux/evals/forward/README.md, docs/operations/zcode-olympus-bridge.md,
docs/tasks/TASK-AT-452-product-ux-forward-rotation-completion.md (fechamento, para NÃO repetir defeitos
de autoria: verifique toda premissa contra o repositório antes de selar; torne tokens de oracle deriváveis
do ticket; inclua item de própria-inspeção no catálogo). É proibido ler: qualquer oracle ou transcript de
RUN-2026-08-06-001 / RUN-2026-09-02-002, docs/operations/product-ux-state.md (fica pilot-ready), e as
tasks TASK-AT-452/453 como autoridade. Você é autor; nunca execute nem avalie; use Agent(subagent_type:
"olympus-product-ux") fresco por caso e Agent(subagent_type: "olympus-blind-evaluator") fresco por caso,
com dispatches apenas de ticket / apenas de transcript+catálogo+schema, e registre provenance.json.
```

## 10. Status summary

- Complete and proven in-session (Tier 1): registration artifacts, blind protocol mechanics, refusal rule, role boundaries, verifier separation.
- Pending (Tier 2): native `subagent_type` invocation of the 12 Olympus types — requires the next fresh ZCode session (smoke test above, ~2 minutes).
- Not started / intentionally untouched: new real forward rotation, TASK-AT-452 (closed), TASK-AT-453, `product-ux-state.md` (stays `pilot-ready`).
