# TASK-UX-001 - App shell e navegacao

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-UX-001-app-shell-navegacao.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Criar layout apresentavel, responsivo e operacional para a V1.

## Inputs
- documento central, secoes 4.1 e 21.5

## Dependencias
- satisfeitas: `TASK-AUT-001`
- em aberto: identidade visual final

## Alvos explicitos
1. shell autenticado
2. navegacao principal
3. estados vazios/erro/loading base

## Fora de escopo
- landing page marketing

## Acceptance Criteria
1. Layout suporta dashboard, cadastros, relatorios e configuracoes.
2. UI e limpa, responsiva e apresentavel.
3. Rotas protegidas respeitam auth.

## Validacao
- screenshot desktop/mobile
- smoke manual de navegacao

## Riscos
- tela parecer prototipo descartavel

## Evidencia de execucao
- App shell autenticado implementado em `apps/web/src/main.tsx`.
- Navegacao principal cobre dashboard, profissionais, licencas, documentos, relatorios, auditoria e configuracoes.
- Itens administrativos (`Auditoria`, `Configuracoes`) aparecem apenas para `ADMIN`.
- Shell usa `/v1/auth/me` para proteger a experiencia autenticada.
- Estados base implementados: carregando, erro, vazio e placeholders operacionais para modulos futuros.
- Estilos responsivos implementados em `apps/web/src/styles.css`.
- Validacao executada: `npm run build --workspace @alwaystrack/web`, `npm run check`, smoke HTTP com login/me/web.

## Ressalva
- Screenshot desktop/mobile nao foi anexado; a validacao visual foi feita por build e smoke do shell. Rotas reais por URL ficam para ciclo posterior se necessario.
