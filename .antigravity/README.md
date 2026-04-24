# .antigravity — Camada de portabilidade de agentes

Este diretório torna o sistema de agentes do Olympus Climb utilizável com qualquer engine de IA
(Claude, GPT, Gemini, etc.), sem duplicar nem modificar os arquivos originais.

## Estrutura

```
.antigravity/
  README.md        ← este arquivo
  registry.md      ← índice de agentes: aliases, arquivos a carregar, estado operacional
  protocol.md      ← protocolo de ativação: o que qualquer engine deve fazer ao invocar um agente
```

## Como usar (com qualquer engine)

### Invocação direta
Diga ao assistente o alias do agente e o modo desejado:

```
@taskyfier pipeline kickoff para [objetivo]
@orchestrator roteia TASK-XXX-XXX
@verifier verifica EXEC-XXX-XXX
@critic revisa [documento ou decisão]
```

### O assistente deve
1. Ler `.antigravity/protocol.md` para entender o protocolo de ativação
2. Ler `.antigravity/registry.md` para localizar os arquivos do agente invocado
3. Carregar os arquivos na ordem definida no registry
4. Operar segundo as regras do agente até ser dispensado ou o ciclo encerrar

## Fontes canônicas (nunca modificar por aqui)

| Fonte | Localização |
|---|---|
| System prompts dos agentes | `.codex/agents/*.toml` |
| Skill cards operacionais | `.agents/skills/*/SKILL.md` |
| Memória viva do pipeline | `docs/operations/*.md` |
| Task manifests | `docs/tasks/*.md` |
| ADRs | `docs/adr/*.md` |
| Specs | `docs/specs/*.md` |

## Regra de ouro
`.antigravity/` nunca é fonte de verdade — é camada de ativação.
Qualquer conflito entre este diretório e `.codex/` ou `.agents/`, os originais ganham.
