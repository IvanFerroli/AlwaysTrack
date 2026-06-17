# EXEC-AT-102 - Seguranca: modelo de ameacas e auditoria base

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-102-security-threat-model-and-baseline-audit.md

## Entrega
Criado o baseline documental de seguranca para orientar a fase de hardening antes de exposicao externa do AlwaysTrack.

## Escopo coberto
1. Inventario de ativos sensiveis: DANFEs, ranking, usuarios, sessoes, conteudo operacional, anexos, auditoria, integracoes e segredos.
2. Separacao de rotas publicas, rotas autenticadas e dominios por role.
3. Mapa de atores: visitante, vendedor, supervisor, SAC, financeiro, gestor, admin, jobs e provedores externos.
4. Matriz de ameacas com impacto, probabilidade, evidencia no codigo e task de hardening vinculada.
5. Auditoria baseline com controles existentes, gaps e ordem recomendada de `TASK-AT-103` a `TASK-AT-116`.

## Arquivos criados/atualizados
- `docs/security/threat-model.md`
- `docs/security/security-baseline-audit.md`
- `docs/tasks/TASK-AT-102-security-threat-model-and-baseline-audit.md`
- `docs/tasks/ROADMAP.md`

## Validacao
- `git diff --check`
- Revisao manual dos documentos contra `services/api/src/app.ts`, auth, sales-documents, Wiki, FAQ, Avisos, Scriptoteca, Prisma schema, deploy e docs de arquitetura.

## Risco residual
- Nenhuma correcao funcional foi aplicada por escopo.
- O baseline e leitura estatica/documental; as proximas tasks precisam transformar os gaps em testes e controles executaveis.
