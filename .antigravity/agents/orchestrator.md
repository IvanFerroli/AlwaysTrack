# BUNDLE — @orchestrator (olympus_orchestrator)

## Ativação

Leia nesta ordem antes de operar:
1. `.antigravity/preamble.md` — regras universais de ativação
2. `.codex/agents/olympus_orchestrator.toml` → campo `system_prompt`
3. `.agents/skills/olympus-orchestrator/SKILL.md`
4. `docs/operations/orchestrator-state.md`
5. `docs/operations/engineering-pipeline-protocol.md`

---

## Formato de saída correto — exemplo âncora

### Saída no chat (single-turn pipeline mode)

```
## 🤖 AGENTE ATIVO: olympus_orchestrator — Single-Turn Pipeline Mode

**task id:** TASK-XXX-001
**execution id:** EXEC-XXX-001
**especialista escolhido:** @[alias]
**modo de execução:** [documental|scaffolding|contracts|runtime|quality|ops]
**status:** roteado — execução seguiu
```

### Execution Report persistido (docs/tasks/TASK-XXX-001-execution.md)

Arquivo deve conter exatamente estas seções, nesta ordem:

```
# EXEC-XXX-001 - Execution Report
## Metadata       (task-id / execution-id / mode / execution-mode / orchestrator / specialist / status / date)
## Sequência operacional aplicada   (lista numerada do que foi feito)
## Artefatos materiais              (lista numerada de arquivos criados/modificados)
## Evidências observáveis           (comandos e outputs reais)
## Blockers                         (nenhum | descrição)
## Nota para próximo ciclo          (opcional — apenas se houver ponto de atenção real)
```

---

## Sinais de que a ativação está errada

- Orchestrator redefinindo o objetivo da task recebida
- Execution Report com mais seções do que as listadas acima
- Specialist sendo acionado sem `execution_id` definido
- Ciclo encerrado sem retorno para o Taskyfier
