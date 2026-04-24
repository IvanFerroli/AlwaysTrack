# PROTOCOL — Ativação de agentes para engines de IA

Este protocolo define o comportamento que qualquer engine de IA deve seguir
ao ser invocado com um alias de agente do Olympus Climb.

> **Leia `.antigravity/preamble.md` antes deste arquivo.**
> O preamble contém as regras universais (hierarquia de fontes, conflito TOML vs SKILL.md, etc.)
> que este protocolo pressupõe.

---

## Passo 1 — Identificar o agente invocado

Consulte `.antigravity/registry.md` para localizar o alias → nome canônico.
Cada alias tem um bundle em `.antigravity/agents/<alias>.md`.

**Leia o bundle do agente antes de qualquer outro arquivo** — ele define a ordem de carregamento
e resume a alma do agente.

---

## Passo 2 — Carregar os arquivos do agente (em ordem)

Para cada arquivo listado no registro:

**Se for um `.toml`:**
- Leia o campo `system_prompt` — esse é o comportamento do agente
- Ignore `model` e `reasoning` (são específicos do Codex CLI)
- Trate o `system_prompt` como regras absolutas de comportamento para este agente

**Se for um `SKILL.md`:**
- Leia integralmente
- Priorize as seções: Processo obrigatório, Regras, Saída esperada, Fallback
- Complemente o system_prompt do TOML (não substitui)

**Se for um `state.md` ou `memory.md` de `docs/operations/`:**
- Leia para entender o estado atual do projeto
- Nunca trate como superior ao TOML ou ao documento canônico
- Use para continuidade — o que já foi feito, o que está bloqueado, qual o próximo passo

---

## Passo 3 — Verificar modo de operação

Determine qual modo o usuário quer:

| Sinal na mensagem | Modo |
|---|---|
| "pipeline kickoff", "próxima task", "próximo passo" | Taskyfier: pipeline kickoff |
| "roteia", "executa TASK-XXX" | Orchestrator: single-turn pipeline mode |
| "verifica EXEC-XXX", "fecha ciclo" | Task Verifier: verification mode |
| "revisa", "audita", "analisa" | Critic ou Auditor: análise sob demanda |
| alias de especialista + objetivo | Especialista: execution artifact mode |

---

## Passo 4 — Operar segundo as regras do agente

- Siga o `system_prompt` estritamente
- Não misture comportamentos de agentes diferentes no mesmo turno (a menos que o protocolo de pipeline exija handoff sequencial)
- Em single-turn pipeline mode, execute handoffs formais em sequência dentro do mesmo turno (Taskyfier → Orchestrator → Especialista → Verifier)
- Anuncie explicitamente qual agente está ativo em cada seção da resposta

---

## Passo 5 — Persistir artefatos nos lugares certos

| Tipo de artefato | Destino |
|---|---|
| Task package completo | `docs/tasks/TASK-XXX-XXX.md` |
| Execution brief/report | `docs/tasks/TASK-XXX-XXX-execution.md` |
| Verification report | `docs/tasks/TASK-XXX-XXX-verification.md` |
| Update de memória macro | `docs/operations/taskyfier-memory.md` |
| Update de estado do Orchestrator | `docs/operations/orchestrator-state.md` |
| Update de estado de especialista | `docs/operations/<specialist>-state.md` |

Se a escrita direta não for possível no ambiente:
- Declare explicitamente
- Entregue patch/conteúdo exato para o usuário aplicar

---

## Passo 6 — Saída padrão (Compact Docs-First Mode)

Por padrão, mantenha o chat curto:
- task id
- agente ativo
- status
- próximo passo imediato

Saída longa no chat **apenas quando:**
- há erro
- há bloqueio real
- há ambiguidade que impede execução
- o usuário pediu explicitamente

---

## Regras de portabilidade

- **Os arquivos `.toml` e `SKILL.md` são a fonte canônica.** Este protocolo não os altera.
- **A memória viva está em `docs/operations/`** — é engine-agnostic por design.
- **Trocar de engine não quebra o pipeline** desde que o novo engine leia os mesmos arquivos.
- **Ao retomar uma sessão**, leia sempre `docs/operations/taskyfier-memory.md` primeiro — ela resume o estado completo do projeto.

---

## Retomada de sessão após troca de engine

Ao iniciar uma nova conversa com qualquer engine, use:

```
Leia .antigravity/preamble.md, .antigravity/protocol.md e .antigravity/registry.md.
Depois leia docs/operations/taskyfier-memory.md.
Me dê um resumo do estado atual do projeto e aguarde instrução.
```

Se for ativar um agente específico diretamente:

```
Leia .antigravity/preamble.md e .antigravity/agents/<alias>.md.
Depois ative o agente @<alias> para [objetivo].
```
