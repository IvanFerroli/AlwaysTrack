# TASK-AT-059 - User profile page

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-059-user-profile-page.md

## Modo
- mode: product-polish

## Objetivo unico
Criar pagina de perfil para o usuario interno gerenciar identidade basica, foto/avatar, senha local e historico de notificacoes.

## Contexto minimo
Uma pagina de perfil melhora a percepcao de produto acabado e concentra informacoes pessoais sem misturar com telas administrativas.

## Inputs
- Regra de upload/armazenamento de foto.
- Decisao se troca de senha local entra junto ou depende da `TASK-AT-058`.

## Dependencias
- satisfeitas: usuario autenticado e centro de notificacoes existem.
- em aberto: troca de senha propria fica para task futura; `TASK-AT-058` entregou reset por admin.

## Alvos explicitos
1. Criar rota/tela Perfil.
2. Permitir editar nome e foto/avatar.
3. Exibir email, role, vendedor/grupo vinculado e organizacao como dados somente leitura.
4. Exibir historico de notificacoes com filtros simples.
5. Permitir marcar notificacoes como lidas.
6. Permitir troca de senha local se o usuario nao usa apenas Google.

## Fora de escopo
- Redes sociais/campos pessoais extensos.
- Preferencias complexas de notificacao.
- Upload de imagens sem limite/tipo validado.

## Checklist
1. [x] Definir contrato API de perfil.
2. [x] Implementar leitura/atualizacao segura.
3. [x] Implementar avatar por URL validada e iniciais como fallback.
4. [x] Integrar historico de notificacoes.
5. [x] Cobrir testes e estados vazios.

## Acceptance Criteria
1. Usuario consegue atualizar nome e foto/avatar.
2. Usuario ve suas notificacoes historicas.
3. Usuario nao consegue alterar role/email/organizacao pelo perfil.
4. Layout funciona em desktop e mobile.

## Definition of Done
1. Perfil acessivel pelo topo/menu.
2. Dados sensiveis protegidos por permissao.
3. `npm run test:all` e build web passam.

## Execucao
- execucao: `EXEC-AT-060-user-profile-page.md`
- resultado: pagina Perfil criada com edicao de nome, telefone e avatar URL; email, role, organizacao e vinculos comerciais aparecem como somente leitura; historico de notificacoes tem filtros e acao para marcar lidas.
- nota tecnica: upload binario de avatar e troca de senha propria nao entram nesta leva. Avatar usa URL relativa/HTTP validada; senha propria deve ser desenhada separadamente para nao conflitar com login Google e reset por admin.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`, `npm run test --workspace @alwaystrack/api -- users.service.test.ts notifications.service.test.ts`, `npm run test:all`
- revisao manual: editar perfil e consultar historico.

## Evidencia esperada
- Print da pagina de perfil.
- Teste de API garantindo que role/email nao sao alteraveis pelo proprio usuario.

## Riscos
- Upload de avatar pode abrir risco de arquivo invalido se nao validar MIME/tamanho.
- Historico muito grande precisa paginacao.

## Blockers possiveis
- Falta de storage definitivo para imagens.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
