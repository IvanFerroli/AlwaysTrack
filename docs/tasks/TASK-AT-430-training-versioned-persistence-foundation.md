# TASK-AT-430 - Persistência versionada de Treinamento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-430-training-versioned-persistence-foundation.md

## Modo
- mode: migration
- priority: P0
- generation-mode: initiative-breakdown

## Capability
Training / Persistence

## Origem documental
- `TASK-AT-428` e `TASK-AT-429`.

## Problema
Não há fonte de verdade para programas/trilhas, versões publicadas, cenários, questões, atribuições, matrículas, tentativas, respostas e progresso. Referências vivas não preservariam resultados históricos.

## Objetivo único
Criar schema e migration aditivos para o lifecycle versionado de Treinamento, com tentativas pinadas e snapshots imutáveis.

## Contexto mínimo
A estrutura deve orquestrar conteúdo existente sem copiar responsabilidades editoriais e sem relacionar tentativas a `ServiceFlowSession`.

## Inputs
- Contrato de snapshot/modos da `TASK-AT-428`.
- Matriz de acesso da `TASK-AT-429`.
- Models `ServiceFlowVersion`, Wiki, Scriptoteca, FAQ, Avisos, User e SupportTeam.

## Escopo
1. Modelar programa, versão, item ordenado, cenário, questão e feedback.
2. Modelar assignment por role/team/user, enrollment, attempt, answer/decision e progresso.
3. Fixar tentativa em `TrainingProgramVersion` e snapshots de conteúdo/`ServiceFlowVersion`.
4. Suportar lifecycle draft/published/archived, vigência e lineage.
5. Criar índices, constraints, migration/rollback e seed mínimo técnico.

## Fora de escopo
- Handlers/UI, cálculo de score e runner de Fluxos.
- Upload/player de mídia.
- Migrar sessões operacionais para tentativas.

## Arquivos ou domínios candidatos
- `services/api/prisma/schema.prisma`.
- `services/api/prisma/migrations/`.
- `services/api/src/core/` — módulo futuro de Treinamento.
- `packages/shared/src/` — contratos futuros de Treinamento.

## Requisitos funcionais
1. Versão publicada é imutável; edição cria draft/versão nova.
2. Attempt aponta para uma única versão e mantém snapshot necessário.
3. Assignment materializa enrollment sem reescrever conclusão anterior.
4. Retomada encontra attempt aberto sem criar duplicata silenciosa.
5. Conteúdo removido da origem não torna resultado ilegível.

## Requisitos de permissão, tenant e auditoria
1. Todas as relações são tenant-scoped e revalidadas no service.
2. Flow/content/user/team de outro tenant é rejeitado.
3. Publicação e assignment preservam autor/versão/timestamps para auditoria posterior.
4. Resposta livre não é replicada em snapshot de auditoria.

## Checklist de execução
1. Traduzir os agregados do ADR em models mínimos.
2. Definir constraints de versão, attempt e assignment.
3. Criar migration aditiva e rollback compatível.
4. Validar upgrade de banco existente e seed repetido.
5. Cobrir pinning e referências removidas.

## Critérios de aceite
1. Tentativa não muda ao republicar programa, Fluxo ou conteúdo.
2. Não existe FK/relation de tentativa para `ServiceFlowSession`.
3. Assignment duplicado é idempotente ou conflito determinístico.
4. Migration preserva todos os dados existentes e não cria programa automaticamente.

## Testes esperados
- Migration clean/upgrade/rollback e `prisma generate`.
- Imutabilidade, pinning, idempotência de assignment/enrollment e tenant.
- Conteúdo arquivado após publicação e attempt retomado.
- Typecheck API/Shared e `git diff --check`.

## Riscos
- Modelo grande demais acoplar todos os domínios por FK rígida.
- Snapshot incompleto ainda depender de conteúdo vivo.

## Dependências
- satisfeitas: versionamento de Fluxos e modelos de conteúdo existentes.
- em aberto: `TASK-AT-428` e `TASK-AT-429` concluídas.

## Blockers possíveis
- Estratégia de snapshot não aprovada.
- Banco alvo exigir constraint que SQLite local não prova.

## Definição de pronto
1. Models/migration aditivos, gerados e testados.
2. Diagrama de lineage e dicionário de estados atualizados.
3. Prova de pinning e não contaminação estrutural registrada.

## Evidência esperada
- ERD dos agregados e relatório de migration.
- Teste de republicação com attempt aberto.

## Próximo passo provável
`TASK-AT-431`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar persistência mínima antes de runtime/autoria.
- constraints: sem sessão operacional e sem FK rígida desnecessária a conteúdo vivo.
