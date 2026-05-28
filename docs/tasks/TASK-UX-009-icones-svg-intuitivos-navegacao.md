# TASK-UX-009 - Icones SVG intuitivos na navegacao

## Metadata
- status: done
- owner: olympus_taskyfier
- executor: olympus_orchestrator
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-009-icones-svg-intuitivos-navegacao.md

## Objetivo
Substituir simbolos textuais pouco intuitivos da navegacao por icones SVG profissionais, mantendo o charme da troca de cor no estado selecionado.

## Contexto
A navegacao lateral e superior usava caracteres como `⌂`, `◎`, `◈`, `□`, `▥`, `≡`, `?` e `↗`. Eles nao comunicavam bem o significado das secoes e davam aspecto amador. O projeto ainda nao possuia biblioteca de icones.

## Escopo
- Adicionar uma biblioteca leve de icones SVG.
- Mapear cada secao para um icone semanticamente claro.
- Manter o componente `Icon` centralizado.
- Preservar a troca de cor por CSS quando item esta ativo.
- Nao usar emoji.

## Mapeamento escolhido
- Dashboard: `LayoutDashboard`
- Profissionais: `Users`
- Licencas: `BadgeCheck`
- Documentos: `FileText`
- Relatorios: `BarChart3`
- Auditoria: `ScrollText`
- Configuracoes: `Settings`
- Como usar: `CircleHelp`
- Sair: `LogOut`
- Baixar: `Download`
- Aprovar: `Check`

## Arquivos envolvidos
- `apps/web/package.json`
- `package-lock.json`
- `apps/web/src/main.tsx`
- `docs/tasks/ROADMAP.md`

## Acceptance Criteria
- Navegacao lateral e superior usam icones SVG, nao caracteres/emoji.
- Estado ativo continua mudando cor junto com o texto.
- Tamanhos continuam coerentes com os ajustes visuais existentes.
- Build/check permanecem verdes.

## Validacao
- `npm run build --workspace @alwaystrack/web`
- `npm run check`

## Riscos
- Nova dependencia adiciona pequena superficie de manutencao.
- Icones podem precisar de ajuste fino de tamanho apos revisao visual.
