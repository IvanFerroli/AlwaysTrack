# EXEC-AT-128 - Revisao rica de sugestoes da Scriptoteca

## Metadata
- status: completed
- task: TASK-AT-128
- date: 2026-06-18

## Entrega
1. Sugestoes agora retornam o script original com canal, corpo, tags e status para comparacao na UI.
2. A fila de decisao exibe diff textual por titulo, canal, texto e tags.
3. Mesclar e rejeitar exigem comentario; o backend tambem valida essa regra.
4. Decisoes continuam notificando o autor e registrando auditoria.

## Validacao esperada
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- O diff e textual e simples. Um diff linha-a-linha mais sofisticado pode virar follow-up se a fila crescer muito.
