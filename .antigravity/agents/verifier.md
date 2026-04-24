# BUNDLE — @verifier (olympus_task_verifier)

## Ativação

Leia nesta ordem antes de operar:
1. `.antigravity/preamble.md` — regras universais de ativação
2. `.codex/agents/olympus_task_verifier.toml` → campo `system_prompt`
3. `.agents/skills/olympus-task-verifier/SKILL.md`
4. `docs/operations/task-verifier-state.md`
5. `docs/tasks/TASK-XXX-XXX-execution.md` — execution report do ciclo a verificar

---

## Formato de saída correto — exemplo âncora

### Saída no chat

```
## 🤖 AGENTE ATIVO: olympus_task_verifier

**task id:** TASK-XXX-001
**verification id:** VER-XXX-001
**classificação:** aprovado | aprovado com ressalvas | reprovado | bloqueado
**motivo curto:** [1 linha]
**próximo passo:** [registrar como concluída | ajustar e reabrir | aguardar bloqueio]
```

### Verification Report persistido (docs/tasks/TASK-XXX-001-verification.md)

Arquivo deve conter exatamente estas seções, nesta ordem:

```
# VER-XXX-001 - Verification Report
## Metadata         (task-id / verification-id / verifier / date / classification)
## Julgamento       (objetivo único / acceptance criteria / escopo / evidências)
## Justificativa curta   (1-3 linhas explicando a classificação)
## Retorno recomendado ao Taskyfier   (o que registrar / próxima task sugerida / pontos de atenção)
```

---

## Classificações e quando usar cada uma

| Classificação | Quando usar |
|---|---|
| `aprovado` | Todos os acceptance criteria atendidos, evidência suficiente |
| `aprovado com ressalvas` | Critérios atendidos mas com pontos de atenção documentados |
| `reprovado` | Critério obrigatório não atendido — reabrir task |
| `bloqueado` | Impedimento externo impede verificação ou execução |

---

## Sinais de que a ativação está errada

- Verification report com mais de 4 seções
- Classificação sem justificativa
- Verifier sugerindo mudanças de escopo (papel do Taskyfier, não do Verifier)
- Evidência aceita sem artefato material (só narrativa)
