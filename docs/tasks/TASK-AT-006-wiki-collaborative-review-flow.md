# TASK-AT-006 - Collaborative wiki review flow

## Metadata
- status: completed-mvp
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-006-wiki-collaborative-review-flow.md

## Modo
- mode: implementation

## Objetivo unico
Criar uma wiki em `/wiki` editavel por usuarios autenticados, com moderacao administrativa para edicoes feitas por nao-admins e indicadores de leitura/presenca.

## Contexto minimo
O AlwaysTrack precisa de uma base operacional viva para procedimentos, orientacoes e conhecimento interno. Admins podem publicar direto; usuarios sem permissao administrativa devem poder sugerir melhorias sem alterar o conteudo aprovado ate revisao.

## Inputs
- `apps/web/src/main.tsx`
- `services/api/prisma/schema.prisma`
- `services/api/src/core/*`
- `services/api/src/http/*`
- `services/api/src/core/audit/*`

## Dependencias
- satisfeitas: auth, roles, auditoria, app shell e schema wiki MVP
- em aberto: editor rico, permissoes granulares e UX avancada de revisao

## Alvos explicitos
1. Rota/tela `/wiki` com lista, leitura e busca inicial.
2. Paginas de wiki com versao publicada e historico minimo.
3. Edicao direta por Admin.
4. Edicao por RT/Supervisor como requisicao pendente para Admin aprovar ou reprovar.
5. Indicadores de leitura: quem leu, ultimo acesso e usuarios lendo agora quando houver sinal recente.
6. Auditoria para criacao, edicao, aprovacao, rejeicao e leitura relevante.

## Criterios de aceite
- Admin cria e publica uma pagina de wiki.
- Usuario nao-admin submete uma proposta de alteracao sem modificar a versao publicada.
- Admin aprova ou reprova a proposta com justificativa opcional.
- `/wiki` mostra estado de revisao quando houver proposta pendente.
- Pagina mostra leitores recentes e quem esta lendo agora por janela curta de presenca.
- Regras de escopo impedem leitura/edicao fora da organizacao do usuario.
- Testes cobrem permissao, fluxo de aprovacao e isolamento por organizacao.

## Fora de escopo
- Editor rich text completo.
- Comentarios em linha.
- Notificacao em tempo real por WebSocket.
- Publicacao anonima.
- Wiki publica sem login.

## Riscos
- Presenca em tempo real pode virar complexidade alta; iniciar com heartbeat/ping HTTP e janela curta.
- Historico de versoes deve evitar sobrescrever conteudo aprovado sem rastreabilidade.
- Conteudo de wiki pode conter dado sensivel; manter isolamento por organizacao desde o primeiro desenho.

## Checklist
1. Definir schema e politicas de permissao. Status: completed.
2. Implementar APIs de pagina, proposta, aprovacao e presenca. Status: completed.
3. Implementar tela `/wiki`. Status: completed.
4. Cobrir fluxo com testes de permissao e organizacao. Status: completed em service tests.
