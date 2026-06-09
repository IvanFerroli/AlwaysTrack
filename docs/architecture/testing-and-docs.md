# Testing and Docs Maintenance

## Comandos principais
- `npm run check`: gate rapido atual.
- `npm run test:unit`: unit/service tests sem quality e2e.
- `npm run test:integration`: fluxo principal service-level.
- `npm run test:regression`: notas, Wiki, FAQ e notificacoes.
- `npm run docs:api`: TypeDoc.
- `npm run test:all`: check + TypeDoc.

## Onde documentar
- Arquitetura transversal: `docs/architecture`.
- Estrategia de testes: `docs/testing`.
- Task planejada: `docs/tasks/TASK-AT-*.md`.
- Execucao concluida: `docs/tasks/EXEC-AT-*.md`.
- Runbook operacional: `docs/runbooks`.

## Padrao de comentario no codigo
Use doc comments em exports quando houver:
- regra de negocio nao obvia;
- contrato de tenant/role;
- idempotencia/dedupe;
- efeitos colaterais como auditoria/notificacao;
- dependencia externa ou fallback.

Evite comentario que apenas repete o nome da funcao.

