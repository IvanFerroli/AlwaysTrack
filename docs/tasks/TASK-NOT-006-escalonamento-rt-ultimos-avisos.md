# TASK-NOT-006 - Escalonamento de notificacao para RT nos ultimos avisos

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-NOT-006-escalonamento-rt-ultimos-avisos.md

## Modo
- mode: execution

## Objetivo unico
Garantir que o RT/superior responsavel receba a ultima notificacao, ou as ultimas configuradas, junto com o profissional, com mensagem detalhada e aviso previo ao profissional de que o responsavel sera copiado.

## Contexto minimo
Hoje `NotificationRule` ja possui `notifyRt` e o scanner cria destinatarios `professional` e `rt` quando a regra permite. Isso resolve o envio manual por regra, mas nao deixa claro qual regra e o "ultimo aviso", nao melhora o texto com dados completos da licenca e nao avisa nas notificacoes anteriores que o RT/superior sera envolvido.

## Inputs
- Pedido de produto: superior deve receber ao menos a ultima notificacao junto da pessoa.
- Implementacao atual: `services/api/src/core/notifications/notifications.service.ts`.
- UI atual de regras/templates: `apps/web/src/main.tsx`, secao Configuracoes.
- Schema atual: `services/api/prisma/schema.prisma`, `NotificationRule.notifyRt`.

## Dependencias
- satisfeitas: `TASK-NOT-001`, `TASK-NOT-002`, `TASK-NOT-004`
- em aberto: decisao operacional sobre quantos ultimos avisos copiam RT por padrao

## Alvos explicitos
1. `services/api/prisma/schema.prisma`
2. `services/api/src/core/notifications/notifications.service.ts`
3. `services/api/src/core/notifications/notifications.service.test.ts`
4. `apps/web/src/main.tsx`
5. `apps/web/src/styles.css`
6. `services/api/prisma/seed.ts`
7. docs de uso em `apps/web/src/main.tsx` ou task de Como usar vigente

## Fora de escopo
- Alterar credenciais, `.env`, webhook Meta ou templates aprovados na Meta.
- Enviar para supervisores sem telefone cadastrado.
- Criar fluxo de aprovacao juridica/LGPD fora da mensagem operacional.
- Reescrever o motor inteiro de notificacoes.

## Decisao de produto recomendada
1. Manter o conceito de regras por dias antes do vencimento.
2. Considerar "ultimos avisos" as regras ativas com menor `daysBeforeExpiration` por organizacao, tipo de licenca e canal.
3. MVP seguro: adicionar configuracao explicita por regra, por exemplo `escalateToRt: boolean`, reutilizando `notifyRt` como destino efetivo e melhorando a UI para orientar que ele deve ser marcado nos ultimos avisos.
4. Se quiser automatizar depois, criar uma configuracao global `rtEscalationLastNoticeCount`, mas isso pode ficar fora do MVP.

## Checklist
1. [x] Mapear regras ativas por organizacao, tipo de licenca e canal para identificar aviso anterior e aviso com RT.
2. [x] Enriquecer `payloadJson` do job com `issuedAt`, `expiresAt`, `daysUntilExpiration`, `daysExpired`, `issuer`, `uf`, `responsibleRtName`, `responsibleRtPhoneMasked` e `willEscalateToRt`.
3. [x] Garantir que jobs para RT usem dedupe separado por destinatario, preservando o dedupe atual por `recipient.kind`.
4. [x] Ajustar template/preview seed para texto detalhado:
   - profissional: nome, numero da licenca, emissor/UF, emissao, vencimento e dias restantes.
   - RT: nome do profissional, numero da licenca, emissor/UF, emissao, vencimento e dias restantes.
5. [x] Nas notificacoes anteriores, quando houver RT cadastrado e regra futura de escalonamento, incluir dica do tipo: "Se nao houver regularizacao ate o ultimo aviso, {{responsibleRtName}} tambem sera notificado."
6. [x] Ajustar UI de Configuracoes para explicar claramente quando `Notificar RT` deve ser usado e quais variaveis podem aparecer no template.
7. [x] Documentar no Como usar o fluxo recomendado: avisos iniciais apenas ao profissional, ultimo aviso com RT.

## Implementacao
- `scanNotificationJobs` agora gera payload detalhado e calcula `willEscalateToRt` quando existe regra futura de ultimo aviso com RT.
- Jobs de profissional e RT usam `dedupeKey` separado por `recipient.kind`; a unicidade antiga por licenca/regra/periodo foi removida em migracao.
- RT sem telefone nao bloqueia o profissional e retorna item em `skipped` com `missing_rt` ou `missing_rt_phone`.
- UI de Configuracoes e Como usar explicam que `Notificar RT` e para os ultimos avisos.
- Seed demo inclui regra inicial sem RT e regra final com RT.

## Validacao executada
- `npm run test --workspace @sylembra/api -- notifications.service.test.ts`
- `npm run typecheck --workspace @sylembra/api`
- `npm run typecheck --workspace @sylembra/web`
- `npm run check`
- `npm run build --workspace @sylembra/web`
- `npx prisma validate --schema services/api/prisma/schema.prisma`

## Acceptance Criteria
1. Uma regra marcada para RT gera dois jobs no mesmo disparo quando profissional e RT tem telefone: `professional` e `rt`.
2. Uma regra sem RT continua gerando apenas job para o profissional.
3. O payload do job contem dados suficientes para mensagem detalhada sem buscar dados extras no provider.
4. Notificacoes anteriores conseguem indicar o nome do RT/superior que sera copiado no ultimo aviso.
5. Se nao houver RT ou telefone do RT, o envio ao profissional continua funcionando e o sistema registra/retorna que o RT foi ignorado.
6. UI deixa claro que `Notificar RT` e para escalonamento dos ultimos avisos, nao para todos os lembretes.
7. Seed/demo traz exemplo coerente de regra inicial e regra final com RT.

## Definition of Done
1. Testes unitarios cobrem regra sem RT, regra com RT, RT sem telefone e payload detalhado.
2. `npm run check` passa.
3. `npm run build --workspace @sylembra/web` passa se houver ajuste frontend.
4. Como usar/ajuda contextual explica quando o superior recebe copia.

## Validacao
- comandos/checks:
  - `npm run check`
  - `npm run build --workspace @sylembra/web`
- revisao manual:
  - criar regra 60 dias sem RT e regra 30 dias com RT
  - rodar scanner dry-run
  - confirmar jobs e payloads esperados
  - confirmar texto/tooltip na UI de Configuracoes

## Evidencia esperada
- Print ou log do dry-run mostrando job do profissional e job do RT no ultimo aviso.
- Teste mostrando `recipientKind: "rt"` separado de `recipientKind: "professional"`.
- Preview de template com dados completos da licenca.

## Riscos
- Duplicar mensagens se uma regra antiga ja estiver com `notifyRt` marcado sem intencao.
- LGPD: o RT/superior passa a receber dados identificaveis do profissional e da licenca.
- Templates Meta aprovados podem nao aceitar novas variaveis sem revisao/aprovacao.
- Ausencia de telefone do RT cria expectativa operacional se a UI nao avisar.

## Blockers possiveis
- Falta de decisao sobre quantos avisos finais devem copiar RT.
- Dados de RT/superior incompletos no cadastro.
- Template Meta real ainda nao aprovado com as variaveis novas.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
