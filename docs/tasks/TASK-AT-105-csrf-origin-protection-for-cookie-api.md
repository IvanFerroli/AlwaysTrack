# TASK-AT-105 - Seguranca: protecao CSRF e validacao de origem

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-105-csrf-origin-protection-for-cookie-api.md

## Modo
- mode: implementation

## Objetivo unico
Impedir que outro site consiga disparar acoes autenticadas usando o cookie do usuario.

## Contexto minimo
O AlwaysTrack autentica por cookie HTTP-only. Isso e bom contra roubo direto via JavaScript, mas cria uma classe de risco chamada CSRF: se o usuario esta logado e visita um site malicioso, aquele site pode tentar enviar um POST/PATCH/DELETE para a API, e o navegador pode anexar o cookie automaticamente.

`sameSite=lax` reduz parte do risco, mas nao deve ser a unica defesa para uma ferramenta interna com aprovacao de notas, usuarios, wiki, avisos e scripts.

## Inputs
- `services/api/src/app.ts`
- `services/api/src/core/auth/auth.handlers.ts`
- `apps/web/src/api.ts`
- todas as rotas mutantes `POST`, `PATCH`, `DELETE`

## Dependencias
- satisfeitas: CORS ja existe manualmente.
- em aberto: `TASK-AT-103` deve definir origem confiavel.

## Alvos explicitos
1. Middleware de validacao de `Origin`/`Referer` para metodos mutantes.
2. Estrategia CSRF token se validacao de origem nao for suficiente.
3. Excecoes controladas para webhooks/callbacks publicos.
4. Testes de request malicioso sem origem confiavel.

## Explicacao simples
CSRF e tipo alguem colocar um formulario escondido num site qualquer dizendo "aprovar nota X". Se o navegador manda o cookie do AlwaysTrack junto, o sistema pode achar que foi o usuario. A defesa e conferir se a chamada veio realmente do dominio do AlwaysTrack, ou exigir um token que site externo nao conhece.

## Fora de escopo
- Substituir cookies por bearer token.
- Criar login novo.
- Proteger webhooks com CSRF; webhooks usam assinatura/verificacao propria.

## Checklist
1. Listar rotas publicas que nao devem exigir CSRF: Google callback, Meta webhook, health e public legacy quando habilitado.
2. Para `POST/PATCH/DELETE`, validar `Origin` contra `CORS_ORIGIN` em producao.
3. Decidir se ambiente local aceita `localhost` e `127.0.0.1`.
4. Se necessario, adicionar endpoint/token CSRF e header `x-csrf-token` no cliente web.
5. Adicionar testes de bloqueio para origem ausente/errada.
6. Garantir que uploads raw continuam funcionando.

## Acceptance Criteria
1. Requisicao mutante de origem desconhecida retorna 403.
2. Requisicao legitima do frontend continua funcionando.
3. Webhooks e callbacks OAuth nao quebram.
4. Upload de DANFE e imagem Wiki continuam funcionando.
5. O comportamento local e producao esta documentado.

## Definition of Done
1. Middleware aplicado em local correto.
2. Testes cobrem origem valida, invalida e excecoes.
3. Docs explicam CSRF sem jargao excessivo.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- security`, `npm run test:e2e:api`
- revisao manual: login, aprovar nota, criar wiki, publicar aviso, copiar script.

## Evidencia esperada
- Teste com `Origin: https://evil.example` recebendo 403.
- Teste com origem configurada recebendo sucesso.

## Riscos
- Bloquear clientes legitimos se proxy remove `Origin`.
- Quebrar chamadas de popup/callback se excecoes forem amplas ou estreitas demais.

## Blockers possiveis
- Dominio final ainda indefinido.

## Retorno esperado
- Lista de rotas protegidas e rotas excepcionadas.
- Orientacao de env para producao.
