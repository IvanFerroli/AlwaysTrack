# TASK-PAT-001 - Patches MVP

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-05-05
- source-of-truth: docs/tasks/TASK-PAT-001-patches-mvp.md

## Modo
- mode: implementation

## Entrega implementada
- Campo `WhatsApp` adicionado no cadastro/listagem/edicao de usuarios administrativos.
- Datas de leitura padronizadas com helpers `formatDateBr` e `formatDateTimeBr`, evitando deslocamento de timezone em datas `YYYY-MM-DD`.
- Logo da sidebar recebeu fundo claro, borda e sombra para contraste contra o verde/azulado.
- Criado endpoint administrativo `POST /v1/notifications/manual-license`.
- Tabela de licencas recebeu botao `Notificar`, que cria jobs aplicaveis por `licenseId`, respeita `dedupeKey` diario manual e processa imediatamente.
- Feedback operacional informa criadas, processadas/enviadas e ignoradas.

## Arquivos alterados
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`
- `services/api/src/app.ts`
- `services/api/src/core/notifications/notifications.handlers.ts`
- `services/api/src/core/notifications/notifications.service.ts`

## Objetivo unico
Agrupar patches pequenos de usabilidade e operacao percebidos no fechamento do MVP, sem abrir refatoracao ampla.

## Contexto minimo
Durante a validacao do fluxo Meta WhatsApp e da UI operacional, foram identificados detalhes que atrapalham uso real:

- cadastro de usuario/gestor pede email, mas nao pede telefone;
- datas precisam aparecer no formato brasileiro `DD/MM/YYYY`;
- logo verde sobre fundo verde nao destaca o suficiente;
- tabela de licencas precisa de acao para enviar notificacao manualmente;
- configuracoes de notificacao precisam continuar simples para operar templates oficiais Meta.

## Inputs
- Feedback visual do usuario em 2026-05-05.
- Prints da navegacao lateral e tabela de licencas.
- Fluxo atual em `apps/web/src/main.tsx`.
- Endpoints atuais:
  - `POST /v1/notifications/scan`
  - `POST /v1/notifications/process`
  - CRUD de usuarios/profissionais/licencas.

## Dependencias
- satisfeitas: `TASK-NOT-007`, `TASK-NOT-006`, `TASK-USR-001`, `TASK-PRO-001`, `TASK-LIC-001`
- em aberto: templates Meta ainda podem estar em analise ate aprovacao final.

## Alvos explicitos
1. `apps/web/src/main.tsx`
2. `apps/web/src/styles.css`
3. `services/api/src/core/users/users.service.ts`
4. `services/api/src/core/users/users.handlers.ts`
5. `services/api/src/core/notifications/notifications.service.ts`
6. `services/api/src/core/notifications/notifications.handlers.ts`
7. `services/api/src/app.ts`
8. testes focados em `services/api/src/core/**`
9. docs de ajuda em `apps/web/src/main.tsx`

## Fora de escopo
- Recriar layout inteiro.
- Mudar identidade visual completa.
- Criar notificacoes de documento.
- Implementar botoes Meta com link dinamico.
- Alterar `.env`, token, WABA ou templates aprovados na Meta.

## Checklist
1. Cadastro de usuarios/gestores com telefone
   - Adicionar campo `Telefone` no formulario de usuario em Configuracoes.
   - Enviar `phone` em `POST /v1/users`.
   - Garantir que edicao/listagem ja preservem telefone.
   - Manter telefone opcional, mas visivel e recomendado para RT/responsavel.

2. Datas em formato BR
   - Padronizar exibicao para `DD/MM/YYYY` onde hoje aparece data operacional.
   - Revisar tabelas de licencas, documentos, auditoria, notificacoes, dashboard e detalhes de profissional.
   - Preservar inputs HTML `type=date` se for o menor caminho seguro, mas exibir leitura em `pt-BR`.
   - Evitar `new Date("YYYY-MM-DD")` com deslocamento de timezone que possa virar dia anterior.

3. Logo com contraste
   - Ajustar a area do logo para destacar melhor no fundo verde/azulado.
   - Evitar verde sobre verde sem contraste.
   - Manter identidade SyLembra e nao alterar paleta global inteira.
   - Validar em sidebar estreita e tela desktop comum.

4. Envio manual de notificacoes na tabela de licencas
   - Adicionar acao visivel na coluna `Acoes` da tabela de licencas: `Notificar` ou icone equivalente.
   - Definir comportamento minimo:
     - criar job para a licenca selecionada usando regras ativas aplicaveis; ou
     - criar endpoint especifico para enviar/processar notificacao manual dessa licenca.
   - Preferencia de menor risco: endpoint administrativo que recebe `licenseId`, cria jobs aplicaveis para aquela licenca e opcionalmente processa imediatamente.
   - Mostrar feedback ao usuario: quantidade criada, ignorada e processada.
   - Nao reenviar duplicado sem avisar; respeitar `dedupeKey` ou exigir confirmacao explicita para reprocessar.

5. Ajuda e microcopy
   - Atualizar Como usar para explicar telefone em usuarios/RT.
   - Explicar quando usar envio manual de notificacao.
   - Indicar que envio real depende de template Meta aprovado e telefone em formato internacional.

## Acceptance Criteria
1. Admin consegue criar usuario/gestor/RT informando telefone pela UI.
2. O telefone salvo aparece na listagem/edicao de usuarios e pode ser usado como telefone de RT/responsavel.
3. Datas de leitura aparecem em formato brasileiro `DD/MM/YYYY` ou `DD/MM/YYYY HH:mm` quando horario for relevante.
4. Nenhuma data de vencimento exibida fica um dia antes/depois por problema de timezone.
5. Logo fica legivel e destacado contra a sidebar.
6. Tabela de licencas tem acao clara para envio manual de notificacao.
7. Envio manual gera/processa notificacoes sem expor token e com feedback operacional.
8. Tentativas duplicadas sao explicadas ao usuario como ignoradas, nao como sucesso silencioso.
9. Testes/typecheck passam.

## Definition of Done
1. Patch pequeno e localizado.
2. Sem refatoracao visual ampla.
3. Sem alterar `.env`.
4. Sem expor token ou payload sensivel.
5. Ajuda operacional atualizada.
6. Validacao manual em tela desktop.

## Validacao
- comandos/checks:
  - `npm run typecheck --workspace @sylembra/web`
  - `npm run typecheck --workspace @sylembra/api`
  - testes focados de usuarios/notificacoes se houver backend novo
  - `npm run build --workspace @sylembra/web`
- revisao manual:
  - criar usuario RT com telefone;
  - conferir telefone salvo;
  - abrir Licencas e revisar datas;
  - acionar envio manual em uma licenca a vencer;
  - conferir feedback e jobs criados/processados;
  - revisar sidebar/logo em desktop.

## Evidencia esperada
- Print do formulario de usuario com campo telefone.
- Print da tabela de licencas com datas BR e botao de notificacao manual.
- Log/API response do envio manual mostrando criados/ignorados/processados.
- Print da sidebar com logo mais legivel.

## Riscos
- Envio manual pode duplicar mensagens se ignorar dedupe.
- Datas podem sofrer regressao de timezone se formatadas sem cuidado.
- Adicionar muitas acoes na tabela pode poluir UI.
- Telefone mal formatado pode passar para Meta e falhar no envio.

## Blockers possiveis
- Definicao de se envio manual deve apenas criar job ou criar e processar imediatamente.
- Templates Meta ainda em analise/reprovados.
- Falta de telefone no RT/profissional escolhido.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Evidencia de validacao
- `npm run typecheck --workspace @sylembra/api`
- `npm run typecheck --workspace @sylembra/web`
- `npm run test --workspace @sylembra/api -- notifications.service.test.ts documents.service.test.ts`
