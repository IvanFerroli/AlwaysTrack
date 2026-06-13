# TASK-AT-073 - Diagnostico de DANFE e correcao manual auditavel

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-073-danfe-diagnostics-and-manual-correction.md

## Fase
- fase: B - Confiabilidade operacional
- prioridade: 5
- dependencias: TASK-AT-071 recomendada; fluxo de upload/extracao/reprocessamento existente.

## Objetivo unico
Criar area simples de diagnostico da DANFE/PDF/XML com dados extraidos, metodo, status, erros, duplicidade, reprocessamento e correcao manual auditavel.

## Contexto
Quando a IA/deterministico falhar, o usuario precisa ver o que aconteceu e corrigir com controle. O objetivo nao e "reaprender regra" agora; e transparencia operacional.

## Escopo funcional
1. Exibir arquivo/origem, nome, data, vendedor, status e metodo de extracao.
2. Exibir campos extraidos e divergencias basicas.
3. Exibir erro tecnico em linguagem operacional quando houver.
4. Exibir motivo de duplicidade e documentos relacionados.
5. Botao de reprocessar com feedback visivel.
6. Correcao manual de campos essenciais com comentario e auditoria.

## Arquivos candidatos
- `apps/web/src/views/notes.tsx`
- `services/api/src/core/sales-documents/**`
- `services/api/src/core/audit/**`
- `services/api/prisma/schema.prisma`
- `packages/shared/src/**`

## Plano de execucao
1. Mapear dados atuais de extracao e lacunas.
2. Criar endpoint de diagnostico por documento.
3. Adicionar painel de diagnostico na tela de Notas.
4. Implementar correcao manual minima com comentario obrigatorio.
5. Registrar auditoria de correcao/reprocessamento.
6. Cobrir fluxo com teste de API.

## Acceptance Criteria
1. Documento com sucesso, erro e duplicidade exibem diagnosticos diferentes e claros.
2. Reprocessamento sempre retorna feedback de sucesso/falha.
3. Correcao manual exige permissao adequada e comentario.
4. Auditoria registra quem corrigiu, quando e o que mudou.
5. A correcao manual nao duplica nota nem quebra ranking.

## Impacto na apresentacao
Mostra que erro de DANFE nao vira caixa-preta; vira fila controlavel.

## Riscos
- Correcao manual tocar campos que impactam ranking sem recalculo claro.
- Expor erro tecnico cru demais para usuario final.

## Execucao
- `EXEC-AT-073-danfe-diagnostics-and-manual-correction.md`
