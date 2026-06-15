# TASK-AT-109 - Seguranca: autorizacao, tenancy e testes anti-IDOR

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-109-authorization-tenancy-idOR-regression-suite.md

## Modo
- mode: verification

## Objetivo unico
Provar por testes que usuarios nao acessam dados de outra organizacao, vendedor ou permissao.

## Contexto minimo
O AlwaysTrack usa `organizationId`, roles e helpers de escopo. O risco classico aqui e IDOR: Insecure Direct Object Reference. Em portugues direto: usuario troca um ID na URL e consegue ver/alterar algo que nao deveria.

Exemplo: vendedor A chama `/v1/sales/documents/documento-do-vendedor-b`. Mesmo estando logado, ele nao deveria enxergar nem alterar esse documento.

## Inputs
- `services/api/src/core/auth/access-policy.ts`
- `services/api/src/core/sales-documents/*`
- `services/api/src/core/wiki/*`
- `services/api/src/core/faq/*`
- `services/api/src/core/announcements/*`
- `services/api/src/core/script-library/*`
- `services/api/src/core/notifications/*`
- `services/api/src/core/users/*`
- `tests/e2e/api-flows.api.spec.ts`

## Dependencias
- satisfeitas: matriz de permissoes e testes existentes.
- em aberto: `TASK-AT-102` para priorizar os dominios mais sensiveis.

## Alvos explicitos
1. Matriz de rotas x roles x resultado esperado.
2. Testes API para IDOR em rotas com `:id`.
3. Testes de isolamento por `organizationId`.
4. Testes de escopo VENDEDOR/SUPERVISOR em notas/ranking/extratos.
5. Testes de notificacao lida apenas pelo destinatario.

## Explicacao simples
Login responde "quem e voce?". Autorizacao responde "o que voce pode fazer?". Tenancy responde "de qual empresa sao esses dados?". IDOR acontece quando o sistema confere a primeira pergunta, mas esquece as outras.

## Fora de escopo
- Refatorar toda a matriz de permissoes.
- Criar UI nova.
- Alterar roles de negocio sem decisao de produto.

## Checklist
1. Gerar fixture com duas organizacoes.
2. Criar usuarios por role nas organizacoes.
3. Testar rotas criticas com IDs de outro usuario/organizacao.
4. Confirmar que erros nao vazam existencia do recurso quando apropriado.
5. Cobrir:
   - notas/DANFE;
   - ranking/extratos;
   - Wiki/anexos;
   - FAQ;
   - Avisos;
   - Scriptoteca;
   - notificacoes;
   - usuarios/configuracoes.
6. Documentar rotas ainda nao cobertas.

## Acceptance Criteria
1. Vendedor nao acessa nota de outro vendedor quando a regra exigir escopo proprio.
2. Usuario de uma organizacao nao acessa dados de outra.
3. Role sem permissao recebe 403.
4. Recurso fora do escopo retorna 404 ou 403 de forma consistente.
5. Testes ficam no CI.

## Definition of Done
1. Suite anti-IDOR criada.
2. Cobertura minima dos fluxos centrais concluida.
3. Falhas encontradas viram tasks corretivas separadas, se grandes.

## Validacao
- comandos/checks: `npm run test:e2e:api`, `npm run test --workspace @alwaystrack/api -- access-policy`
- revisao manual: ler matriz e confirmar com regra de negocio.

## Evidencia esperada
- Relatorio de rotas cobertas.
- Testes de acesso negado passando.

## Riscos
- Expor bug real de autorizacao e exigir correcao antes de continuar.
- Confundir regra de produto com regra de seguranca; precisa validar comportamento esperado.

## Blockers possiveis
- Falta de fixture multi-organizacao.

## Retorno esperado
- Matriz de permissao testada.
- Lista de gaps de autorizacao restantes.
