# TASK-AT-433 - Trilhas de onboarding, publicação e atribuições

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-433-onboarding-trails-assignments-publication.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
Training / Onboarding Orchestration

## Origem documental
- `TASK-AT-428`, `TASK-AT-430` e `TASK-AT-432`.

## Problema
Conteúdos existem isoladamente, mas não há trilha ordenada, publicada e obrigatória que combine conhecimento, fluxo e simulado com audiência e vigência controladas.

## Objetivo único
Permitir compor/versionar trilhas e atribuí-las por role, equipe ou usuário, materializando enrollments históricos sem duplicar domínios fonte.

## Contexto mínimo
`TrainingProgram` com tipo `ONBOARDING` representa a trilha; não será criado um segundo motor de curso.

## Inputs
- Persistência versionada da `TASK-AT-430`.
- Cenários/questões publicados da `TASK-AT-432`.
- Wiki, Scriptoteca, FAQ, Avisos, FlowVersion e storage/link policies existentes.

## Escopo
1. Itens `FLOW_TRAINING`, `SIMULATION`, `WIKI`, `SCRIPT`, `SCRIPT_PACK`, `FAQ`, `ANNOUNCEMENT`, `VIDEO_LINK` e `MATERIAL_LINK`.
2. Ordem, obrigatoriedade, pré-requisitos simples e critérios de conclusão.
3. Draft, preview, publicação imutável, vigência e arquivamento.
4. Atribuição obrigatória/opcional por role, SupportTeam ou usuário.
5. Materialização idempotente de enrollment e política explícita para novos membros.
6. Upgrade/reassignment explícito para nova versão.

## Fora de escopo
- Upload/player e tracking real de vídeo.
- Pré-requisitos condicionais complexos ou marketplace de cursos.
- Copiar governança editorial de Wiki/Scriptoteca para Treinamento.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — módulos futuros de programas e assignments.
- `apps/web/src/views/` — view administrativa futura de Treinamento.
- `services/api/src/jobs/` — materializador futuro, somente se necessário.

## Requisitos funcionais
1. Editor seleciona somente recursos autorizados do tenant e gera snapshot na publicação.
2. Atribuição resolve audiência de forma idempotente e preserva lineage.
3. Mudança de role/equipe segue policy `snapshot` ou `dynamic` explícita na atribuição.
4. Version nova não altera enrollment/tentativa anterior automaticamente.
5. Vídeo/material por link exige URL segura e confirmação simples, sem alegar consumo real.

## Requisitos de permissão, tenant e auditoria
1. Manage/publish/assign são permissions distintas.
2. Team/user/role targets e recursos precisam pertencer ao tenant.
3. Publicação, assignment, audience materialization, archive e upgrade são auditados.
4. Lista de audiência nominal respeita permissão e redaction.

## Checklist de execução
1. Implementar catálogo de item types e resolver de recursos.
2. Implementar editor/preview e validações de publicação.
3. Implementar assignment e materialização idempotente.
4. Definir política de membership/role changes e upgrade.
5. Cobrir vigência, archive e recursos indisponíveis.

## Critérios de aceite
1. Uma trilha combina todos os tipos MVP e publica snapshot reproduzível.
2. Role/team/user recebem enrollments sem duplicata.
3. Recurso alterado/arquivado após publicação não muda a versão atribuída.
4. Nova versão exige upgrade/reassignment explícito e mantém histórico.

## Testes esperados
- Resolver de cada item type e recurso cross-tenant/arquivado.
- Assignment role/team/user, idempotência e mudança temporal de membership.
- Vigência, publicação, versioning e upgrade.
- Web de composição/preview e `git diff --check`.

## Riscos
- Audiência dinâmica alterar obrigação histórica retroativamente.
- Link externo quebrar ou alegar tracking inexistente.

## Dependências
- satisfeitas: recursos e versionamentos existentes nos domínios fonte.
- em aberto: `TASK-AT-430`/`432`; decisão snapshot vs dynamic para audiência.

## Blockers possíveis
- Equipe canônica fora do SAC não definida.
- Política de recertificação/upgrade pendente.

## Definição de pronto
1. Editor, publicação, item resolver e assignments entregues.
2. Idempotência/audiência/versioning comprovados.
3. Limite de vídeo/material por link documentado sem claim de tracking.

## Evidência esperada
- Exemplo de trilha publicada e audience snapshot.
- Testes de alteração do recurso e nova versão.

## Próximo passo provável
`TASK-AT-434`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: orquestrar referências sem absorver seus domínios.
- constraints: sem player nativo e sem atualização silenciosa de enrollment.
