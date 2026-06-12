# TASK-AT-074 - Polimento visual final por prints reais

## Metadata
- status: proposed-blocked-by-user-input
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-074-final-visual-polish-by-real-screenshots.md

## Fase
- fase: A - Impacto para apresentacao
- prioridade: 6
- dependencias: usuario enviar prints reais apos as tasks principais de apresentacao.

## Objetivo unico
Executar uma rodada final de acabamento visual guiada apenas por prints reais da demo, sem redesign amplo.

## Contexto
O produto deve parecer ferramenta interna seria: denso, claro, governado e sem cara de prototipo. Esta task nao deve iniciar sem prints.

## Escopo visual
1. Header, sidebar, tabelas, filtros, cards e estados vazios.
2. Overflow, alinhamento, responsividade basica e densidade visual.
3. Ajustes pontuais de copy visual quando houver truncamento ou ambiguidade.
4. Verificacao dos fluxos de apresentacao em desktop.

## Arquivos candidatos
- `apps/web/src/styles.css`
- `apps/web/src/main.tsx`
- `apps/web/src/views/**`
- `apps/web/src/components/**`

## Plano de execucao
1. Receber prints da jornada de demo.
2. Numerar problemas por tela.
3. Aplicar patch minimo por lote.
4. Validar typecheck/build.
5. Se possivel, validar com screenshot/browser.

## Acceptance Criteria
1. Nenhum ajuste e feito sem print ou estado reproduzivel.
2. Cada print recebe status: corrigido, pendente ou nao reproduzido.
3. Nao ha texto/botao estourando nos prints corrigidos.
4. Visual segue padrao de ferramenta interna, sem landing page.
5. Build web passa.

## Impacto na apresentacao
Remove ruidos visuais que desviam atencao da narrativa de governanca.

## Riscos
- Virar refatoracao estetica infinita se nao limitar por prints.
- Corrigir desktop e quebrar mobile sem checagem basica.

