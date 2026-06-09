# TASK-AT-042 - FAQ threads MVP

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-042-faq-threads-mvp.md

## Modo
- mode: implementation

## Objetivo unico
Criar uma secao FAQ interna em formato de threads, onde usuarios autenticados perguntam, respondem/comentam, reagem e acompanham estado proprio da pergunta.

## Contexto minimo
Existe um modelo legado simples `FaqItem` com pergunta/resposta administravel e tela publica `/faq`, herdado do recorte SyLembra. O pedido atual e diferente: uma FAQ colaborativa interna, com perguntas de usuarios virando threads com respostas, comentarios, reacoes e estado. Referencias historicas de `TASK-FAQ-001` e `TASK-FAQ-002` servem apenas como padrao util de categoria/busca/auditoria, sem reabrir WAME, licencas ou fluxo publico legado.

## Inputs
- Pedido do usuario em 2026-06-08.
- `services/api/prisma/schema.prisma` (`FaqItem` historico).
- `apps/web/src/main.tsx` (nav ja tem label FAQ legado em configuracoes/publico).
- `docs/archive/sylembra/tasks/TASK-FAQ-001-faq-administravel.md`
- `docs/archive/sylembra/tasks/TASK-FAQ-002-ajuda-wame.md`

## Dependencias
- satisfeitas: autenticacao, roles comerciais, organizacao/tenant, auditoria, padroes operacionais de UI.
- em aberto: decidir nomes finais dos modelos novos para nao colidir semanticamente com `FaqItem` legado.

## Alvos explicitos
1. `services/api/prisma/schema.prisma`: modelos de FAQ thread, resposta/comentario e reacao, escopados por organizacao.
2. `services/api/src/core/faq/*`: service/handlers para CRUD de threads, respostas/comentarios, reacoes e estado.
3. Registro de rotas autenticadas `/v1/faq/threads`.
4. `apps/web/src/main.tsx`: nova secao operacional FAQ no app autenticado.
5. `apps/web/src/styles.css`: estilos pequenos para lista de threads, detalhe e reacoes.
6. Testes de service para tenant, estado, comentarios e reacoes.

## Fora de escopo
- WhatsApp, email, push ou atendimento externo.
- Reabrir FAQ publica SyLembra ou ajuda `wa.me`.
- Chatbot/IA respondendo perguntas.
- Editor Markdown completo para FAQ; usar texto simples ou Markdown seguro apenas se reaproveitamento for pequeno.
- Promover thread para Wiki; isso pertence a `TASK-AT-043`.

## Checklist
1. Definir estados iniciais da thread, por exemplo `OPEN`, `ANSWERED`, `RESOLVED`, `ARCHIVED`.
2. Criar modelos escopados por organizacao com autor, titulo/pergunta, corpo opcional, estado, datas e contadores derivados ou calculaveis.
3. Criar respostas/comentarios ordenados por data e vinculados a usuario.
4. Criar reacoes por usuario e tipo, impedindo duplicidade do mesmo tipo por usuario no mesmo alvo.
5. Implementar endpoints autenticados para listar, criar pergunta, responder/comentar, reagir/remover reacao e alterar estado conforme permissao.
6. Definir permissao minima: usuarios autenticados perguntam/respondem/reagem; admin/superior pode moderar estado/arquivar.
7. Criar tela FAQ interna com lista filtravel por texto/estado, formulario de pergunta e detalhe da thread.
8. Registrar auditoria `faq.thread.*` e `faq.comment.*` para eventos principais.
9. Adicionar seed pequeno apenas se necessario para smoke local, sem poluir legado.

## Acceptance Criteria
1. Usuario autenticado cria uma pergunta na FAQ interna.
2. A pergunta aparece como thread com autor, estado, data e contagem de respostas/reacoes.
3. Usuarios autenticados respondem ou comentam na thread.
4. Usuarios autenticados reagem a pergunta e/ou comentario, sem duplicar a mesma reacao do mesmo usuario.
5. Admin/superior consegue alterar estado da thread conforme regras definidas.
6. Lista permite filtrar por estado e buscar por texto.
7. Usuario de outra organizacao nao ve nem interage com threads alheias.
8. Fluxo legado publico `/faq` nao e expandido nem acoplado a WhatsApp/email.

## Definition of Done
1. FAQ interna em threads funciona ponta a ponta com API, UI e testes de service.
2. Modelos novos preservam tenant e auditoria.
3. Estados, comentarios e reacoes sao visiveis e rastreaveis.
4. Residual do legado `FaqItem` fica documentado sem reabrir SyLembra.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/api`, `npm run test --workspace @alwaystrack/api -- faq.service.test.ts`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: login com dois usuarios da mesma organizacao; criar pergunta; responder; reagir; mudar estado como admin; confirmar isolamento entre organizacoes quando houver fixture.

## Evidencia esperada
- Print ou relato da nova secao FAQ com lista e detalhe de thread.
- Testes cobrindo criacao, comentario, reacao, mudanca de estado e tenant.
- Auditoria ou logs para criacao/comentario/mudanca de estado.

## Riscos
- Misturar `FaqItem` legado com FAQ thread pode gerar UX/confusao de rotas.
- Reacoes podem virar contadores inconsistentes se nao houver unicidade por usuario/tipo/alvo.
- Estados demais podem atrasar o MVP; manter conjunto pequeno.

## Blockers possiveis
- Ausencia de uma role "superior" canonica alem de `ADMIN`/`SUPERVISOR`; usar role existente ou documentar decisao.
- Necessidade de migration cuidadosa se o Prisma atual estiver em ciclo de mudancas paralelas.

## Retorno esperado
- resumo curto da FAQ interna entregue
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
