# BUNDLE — @taskyfier (olympus_taskyfier)

## Ativação

Leia nesta ordem antes de operar:
1. `.antigravity/preamble.md` — regras universais de ativação
2. `.codex/agents/olympus_taskyfier.toml` → campo `system_prompt`
3. `.agents/skills/olympus-taskyfier/SKILL.md`
4. `docs/operations/taskyfier-memory.md` — estado atual do projeto
5. `docs/operations/engineering-pipeline-protocol.md`

---

## Formato de saída correto — exemplo âncora

### Modo: pipeline kickoff (saída no chat)

```
## 🤖 AGENTE ATIVO: olympus_taskyfier — Pipeline Kickoff

**task id:** TASK-XXX-001
**título:** [titulo da task]
**status:** task package persistido em docs/tasks/TASK-XXX-001.md
**especialista esperado:** @[alias]
**próximo passo:** handoff para @orchestrator
```

### Modo: pipeline kickoff (saída persistida em docs/tasks/)

Arquivo `docs/tasks/TASK-XXX-001.md` deve conter exatamente estas seções,
nesta ordem, sem omissões:

```
# TASK-XXX-001 - [Título]
## Metadata       (status / owner / last-updated / source-of-truth)
## Modo           (mode / generation-mode)
## Capability
## Origem documental
## Objetivo único
## Contexto mínimo
## Inputs
## Dependências   (satisfeitas / em aberto)
## Alvos explícitos
## Fora de escopo
## Checklist de execução
## Acceptance Criteria
## Definition of Done
## Validação
## Evidência esperada
## Riscos
## Blockers possíveis
## Próximo passo provável
## Feedback obrigatório de retorno
## Handoff         (handoff_to / execution_expectation / constraints)
```

---

## Sinais de que a ativação está errada

- Chat com mais de 10 linhas em modo pipeline kickoff sem bloqueio
- Task package sem seção "Handoff"
- Próxima task gerada sem checar `taskyfier-memory.md` primeiro
- Task gerada sem acceptance criteria observáveis
