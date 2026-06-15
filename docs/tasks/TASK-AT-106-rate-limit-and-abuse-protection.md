# TASK-AT-106 - Seguranca: rate limit e protecao contra abuso

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-106-rate-limit-and-abuse-protection.md

## Modo
- mode: implementation

## Objetivo unico
Adicionar limites de uso para reduzir brute force, spam, abuso de upload, abuso de IA e indisponibilidade por excesso de requisicoes.

## Contexto minimo
O AlwaysTrack tem endpoints sensiveis e/ou caros:
- login com senha;
- Google OAuth start/callback;
- upload de DANFE/PDF/XML/imagem;
- reprocessamento por IA;
- busca global;
- comentarios/reacoes FAQ;
- copiar script;
- webhooks Meta;
- endpoints admin.

Sem rate limit, um atacante ou script acidental pode tentar milhares de senhas, subir arquivos em massa, gastar provedor de IA ou deixar o app lento.

## Inputs
- `services/api/src/app.ts`
- `services/api/src/core/auth/*`
- `services/api/src/core/sales-documents/*`
- `services/api/src/core/document-ai/*`
- `services/api/src/core/search/*`
- `services/api/src/core/faq/*`
- `services/api/src/core/script-library/*`
- `services/api/src/core/jobs/queue.ts`

## Dependencias
- satisfeitas: request context e logs HTTP ja existem.
- em aberto: decidir se rate limit sera em memoria no MVP ou Redis/BullMQ em producao.

## Alvos explicitos
1. Middleware de rate limit por IP e por usuario.
2. Politicas diferentes por rota.
3. Resposta padrao `429 TOO_MANY_REQUESTS`.
4. Log/auditoria de abuso relevante.
5. Configuracao por env.

## Explicacao simples
Rate limit e uma catraca. Usuario normal quase nunca percebe. Bot ou atacante bate na catraca e recebe "tente de novo depois".

## Fora de escopo
- WAF externo.
- Captcha.
- Bloqueio permanente automatico de conta.

## Checklist
1. Definir chaves de limite: IP anonimo, usuario logado, rota e metodo.
2. Criar limites iniciais:
   - login: baixo e agressivo;
   - upload: moderado;
   - IA/reprocessamento: baixo por usuario;
   - busca: medio;
   - comentarios/reacoes/copia: alto o suficiente para uso real.
3. Considerar store em memoria para local e Redis para producao.
4. Incluir `Retry-After` quando possivel.
5. Registrar eventos de limite excedido.
6. Cobrir por testes.

## Acceptance Criteria
1. Login bloqueia tentativas repetidas sem afetar usuario normal.
2. Upload e reprocessamento por IA nao podem ser disparados indefinidamente.
3. Busca global e comentarios recebem limites razoaveis.
4. Limites sao configuraveis por env.
5. Logs mostram quando alguem bateu no limite.

## Definition of Done
1. Middleware reutilizavel criado.
2. Politicas aplicadas nas rotas de maior risco.
3. Testes provam `429` por excesso.
4. Docs explicam como ajustar limites.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- rate`, `npm run typecheck --workspace @alwaystrack/api`
- revisao manual: tentar varias chamadas repetidas com curl/Playwright API.

## Evidencia esperada
- Teste de brute force de login bloqueado.
- Teste de reprocessamento IA limitado.

## Riscos
- Limite agressivo demais pode atrapalhar apresentacao/demo.
- Store em memoria nao funciona bem com multiplas instancias; documentar isso se ficar para MVP.

## Blockers possiveis
- Redis ainda nao obrigatorio no deploy.

## Retorno esperado
- Tabela de limites por rota.
- Como ajustar envs sem alterar codigo.
