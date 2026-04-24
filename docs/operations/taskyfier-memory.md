# TASKYFIER MEMORY — OLYMPUS CLIMB

## Status do projeto
- classificação oficial de prontidão: não pronto para implementação funcional pesada
- status adicional: pronto para ciclo de formalização executável
- documento canônico vigente: Consolidado Canônico do Projeto Olympus Climb (Base Vigente)
- macro-objetivo atual: formalizar engenharia executável antes da implementação funcional pesada
- protocolo operacional de pipeline: docs/operations/engineering-pipeline-protocol.md

## Ordem de precedência usada pelo Taskyfier
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Esta memória operacional
6. GitFlow vigente
7. Legado compatível

## Capability atualmente ativa
- job-scraping

## Frente atualmente ativa
- nucleo scraper de vagas (fetch + parse + ingestão via POST /v1/job-postings/ingest)

## ADRs aceitas relevantes
- ADR-001 - governanca documental operacional (`docs/adr/ADR-001-governanca-documental-operacional.md`)

## Specs aceitas relevantes
- nenhuma ainda formalizada

## Task manifests existentes
- TASK-DOC-002 - formalizar ADR-001 (`docs/tasks/TASK-DOC-002-formalizar-adr-001.md`)
- TASK-SCF-001 - materializar scaffold base de workspaces (`docs/tasks/TASK-SCF-001-workspaces-base-scaffold.md`)
- TASK-QLT-001 - baseline de typecheck executavel (`docs/tasks/TASK-QLT-001-baseline-typecheck-executavel.md`)
- TASK-QLT-002 - baseline de lint executavel (`docs/tasks/TASK-QLT-002-baseline-lint-executavel.md`)
- TASK-CTR-001 - contrato tipado compartilhado minimo (`docs/tasks/TASK-CTR-001-contrato-tipado-compartilhado-minimo.md`)
- TASK-RTM-001 - bootstrap de runtime local (`docs/tasks/TASK-RTM-001-bootstrap-runtime-local.md`)
- TASK-PRD-001 - main CV workbench e menu de rotas (`docs/tasks/TASK-PRD-001-main-cv-workbench-and-route-menu.md`)
- TASK-SCR-001 - nucleo scraper de vagas (`docs/tasks/TASK-SCR-001-nucleo-scraper-vagas.md`)

## Tasks concluídas
- TASK-DOC-002 - formalizar ADR-001 (aprovada no ciclo VER-DOC-002)
- TASK-SCF-001 - scaffold base de workspaces (aprovada com ressalvas no ciclo VER-SCF-001)
- TASK-QLT-001 - baseline de quality/typecheck (aprovada no ciclo VER-QLT-001)
- TASK-QLT-002 - baseline de quality/lint (aprovada no ciclo VER-QLT-002)
- TASK-CTR-001 - contrato tipado compartilhado minimo (aprovada no ciclo VER-CTR-001)
- TASK-RTM-001 - bootstrap de runtime local (aprovada no ciclo VER-RTM-001)
- TASK-PRD-001 - main CV workbench e menu de rotas (entregue com evidencia local: check/build/smoke)
- TASK-SCR-001 - nucleo scraper de vagas (aprovada no ciclo VER-SCR-001 — 20 vagas ingeridas da Remotive)

## Tasks em andamento
- nenhuma

## Tasks bloqueadas
- nenhuma

## Dependências abertas
- specs mínimas obrigatórias
- primeiros task manifests executáveis
- rodar ciclos reais com o pipeline protocol e registrar evidência de continuidade
- persistência durável para resume profiles e candidaturas

## Decisões práticas recentes
- o consolidado canônico passa a governar o projeto
- branch por fase foi revogado
- o projeto é capability-driven, spec-driven e agent-centric
- o Taskyfier será o planner stateful para derivar e sequenciar tasks
- pipeline kickoff passa a exigir handoff formal para o Orchestrator
- retorno de ciclo deve incluir execução/bloqueio, evidência, validação, updates sugeridos e próximo passo
- modo padrão de saída do pipeline: Compact Docs-First Mode (detalhe em docs, chat curto)
- ADR-001 foi formalizada e aceita como base documental operacional do pipeline
- scaffold minimo de codigo em workspaces foi materializado sem abrir funcionalidade
- baseline de quality ficou executavel com `npm install` + `npm run typecheck` verde
- baseline de lint ficou executavel com `npm run lint` verde
- contrato tipado compartilhado foi restabelecido entre web/api e shared-types
- runtime local de web/api foi materializado e validado com smoke tests
- main CV analyzer por arquivo `.txt` em `doc/` foi materializado com criação de resume profile para matching
- menu operacional de rotas foi materializado no dashboard web para inspeção rápida
- contrato de navegacao web atualizado: `GET /` dashboard de rotas; `GET /workspace` superficie operacional detalhada

## Padrões já adotados
- nenhuma task entra em execução pesada sem base documental suficiente
- menor entrega útil primeiro
- toda task deve ter objetivo único, validação e evidência
- docs/ é a fonte viva; doc/ permanece como histórico
- Taskyfier mantém memória macro e não substitui validação do Verifier
- task package e updates de memória devem ser materializados em arquivo/payload antes de resumo no chat

## Pontos sensíveis
- evitar derivação criativa fora do canônico
- evitar task grande demais
- evitar abrir múltiplas frentes antes de fechar a formalização mínima
- evitar confundir brainstorming com task executável

## Próxima menor tarefa útil sugerida
- TASK-SCR-002 (agendamento automático do scraper) OU TASK-SCR-003 (strip HTML + múltiplas fontes)

## Notas de continuidade
- esta memória deve ser atualizada a cada task gerada, concluída, bloqueada ou replanejada
- o Taskyfier deve priorizar continuidade e feedback real sobre planejamento abstrato
- ultimo ciclo concluido: TASK-DOC-002 -> EXEC-DOC-002 -> VER-DOC-002 (classificacao: aprovado)
- ultimo ciclo concluido: TASK-SCF-001 -> EXEC-SCF-001 -> VER-SCF-001 (classificacao: aprovado com ressalvas)
- ultimo ciclo concluido: TASK-QLT-001 -> EXEC-QLT-001 -> VER-QLT-001 (classificacao: aprovado)
- ultimo ciclo concluido: TASK-QLT-002 -> EXEC-QLT-002 -> VER-QLT-002 (classificacao: aprovado)
- ultimo ciclo concluido: TASK-CTR-001 -> EXEC-CTR-001 -> VER-CTR-001 (classificacao: aprovado)
- ultimo ciclo concluido: TASK-RTM-001 -> EXEC-RTM-001 -> VER-RTM-001 (classificacao: aprovado)
- ultimo ciclo concluido: TASK-PRD-001 -> EXEC-PRD-001 -> VER-PRD-001 (classificacao: aprovado localmente com evidencias de runtime)
- pipeline kickoff iniciado: TASK-SCR-001 -> handoff para olympus-orchestrator (2026-04-24)
- ultimo ciclo concluido: TASK-SCR-001 -> EXEC-SCR-001 -> VER-SCR-001 (classificacao: aprovado — 20 vagas Remotive, typecheck/lint verdes)
