# Overhaul File Matrix

## Metadata
- status: proposed
- owner: scaffolding-builder
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/OVERHAUL-FILE-MATRIX.md

## Objetivo
Classificar a arvore atual antes do overhaul para evitar remocoes acidentais e impedir que superficies do SyLembra sobrevivam no beta do Local Video to TXT Transcriber.

## Regra de execucao
Nenhuma remocao destrutiva deve acontecer antes de:
1. baseline Git estar preservado;
2. remoto `origin` apontar para `git@github.com:IvanFerroli/AlwaysTrack.git`;
3. diff da limpeza ser revisado;
4. `docs/operations/auditoria-estado-atual-template-2026-05-27.md` ser revisado ou explicitamente excluido do escopo.

## Manter no projeto transcriber
| Caminho | Motivo |
| --- | --- |
| `doc/documento-central-local-video-to-txt-transcriber.md` | Fonte de verdade do produto. |
| `docs/tasks/video-transcriber/` | Backlog, roadmap e tasks do overhaul. |
| `AGENTS.md` | Acordos operacionais do workspace enquanto o trabalho ocorrer aqui. |
| `.git/` | Historico e rastreio remoto. |

## Criar durante o scaffold
| Caminho | Motivo |
| --- | --- |
| `transcrever.py` | CLI principal da V1. |
| `requirements.txt` | Dependencias Python, incluindo `faster-whisper`. |
| `README.md` | Instalacao, uso, escopo e limitacoes. |
| `.gitignore` | Excluir `.venv/`, caches Python e saidas temporarias. |

## Remover ou arquivar apos aprovacao
| Caminho | Motivo |
| --- | --- |
| `apps/` | Frontend React fora do escopo V1. |
| `services/` | API, Prisma, jobs e modulos backend fora do escopo V1. |
| `packages/` | Shared TypeScript desnecessario para CLI Python. |
| `deploy/` | Deploy/nginx/cron fora do escopo local. |
| `Dockerfile.web` | Docker e web fora do escopo V1. |
| `Dockerfile.api` | Docker e API fora do escopo V1. |
| `package.json` | Monorepo Node fora do escopo final. |
| `package-lock.json` | Lockfile Node fora do escopo final. |
| `tsconfig.base.json` | TypeScript fora do escopo final. |
| `apps/web/` | Redundante com `apps/`; listado para revisao explicita. |
| `services/api/` | Redundante com `services/`; listado para revisao explicita. |
| `docs/tasks/TASK-*.md` | Tasks antigas do SyLembra nao devem orientar agentes futuros do transcriber. |
| `docs/tasks/ROADMAP.md` | Roadmap antigo do SyLembra. |
| `docs/adr/` | ADRs antigas, salvo se arquivadas fora do beta. |
| `docs/pipeline/` | Pipeline documental antigo fora do escopo CLI local. |
| `docs/runbooks/` | Runbooks antigos de ambiente/deploy fora do escopo final. |
| `docs/project/` | Intake antigo do SyLembra. |
| `doc/meta-whatsapp-templates/` | Templates Meta/WhatsApp fora do escopo. |
| `doc/Projeto-—-Sistema-Modular-de-Controle-de-Licenças-COREN-com-Notificações-WhatsAp.txt` | Documento de produto antigo. |
| `scripts/` | Scripts Node/demo antigos fora do escopo final. |
| `RELATORIO-PROJETO-2026-04-27.md` | Relatorio antigo do SyLembra. |
| `Dockerfile.*` | Qualquer Dockerfile remanescente deve ser removido da V1. |

## Decidir antes de remover
| Caminho | Decisao necessaria |
| --- | --- |
| `docs/operations/auditoria-estado-atual-template-2026-05-27.md` | Artefato untracked paralelo; revisar conteudo antes de incluir ou remover. |
| `IDENTITY.md` | Pode conter identidade operacional do workspace; decidir se pertence ao repo final. |
| `SOUL.md` | Pode conter contexto pessoal/workspace; nao incluir no beta sem revisao. |
| `USER.md` | Pode conter contexto pessoal; nao incluir no beta sem revisao. |
| `TOOLS.md` | Pode conter notas locais; nao incluir no beta sem revisao. |
| `HEARTBEAT.md` | Documento operacional do workspace; decidir se fica fora do repo final. |
| `.antigravity/` | Revisar se e metadado local ou artefato do projeto. |
| `docs/README.md` | Pode virar indice novo ou ser removido junto com docs antigas. |

## Varredura anti-escopo esperada
Antes do beta, os comandos abaixo nao devem encontrar superficies ativas fora do escopo:

```bash
find . -maxdepth 2 -type d | sort
rg -n "React|Vite|Express|Prisma|Docker|FastAPI|Flask|OpenAI|Meta|WhatsApp|Google|login|auth|database|batch|srt|vtt" .
```
