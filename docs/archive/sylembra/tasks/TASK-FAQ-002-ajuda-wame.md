# TASK-FAQ-002 - Ajuda via wa.me

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-FAQ-002-ajuda-wame.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- runtime builder
- `olympus_task_verifier`

## Objetivo unico
Criar fluxo "Estou tendo problemas" que monta mensagem e abre `wa.me` para responsavel correto.

## Inputs
- documento central, secoes 10.2, 10.3 e 14.7

## Dependencias
- satisfeitas: `TASK-FAQ-001`, `TASK-PRO-001`
- em aberto: numero padrao de suporte

## Alvos explicitos
1. formulario publico de ajuda
2. resolucao de destinatario RT > supervisor > admin > suporte
3. geracao de URL `wa.me`

## Fora de escopo
- registrar conversa
- atendimento multiagente

## Acceptance Criteria
1. Usuario escolhe tipo de problema e descreve mensagem.
2. Sistema monta texto com dados minimos da pendencia.
3. Destinatario segue fallback definido.

## Validacao
- testes de resolucao de destinatario
- smoke manual do link gerado

## Riscos
- expor dado sensivel demais no texto

## Evidencias de entrega
- Criado endpoint publico `POST /v1/public-help/wa-link`.
- Resolucao de destinatario segue fallback: RT do profissional, supervisor de escopo, admin com telefone, `SUPPORT_PHONE`.
- Pagina publica `/faq` tem formulario `Estou tendo problemas`.
- Link `wa.me` monta mensagem com dados minimos da organizacao/profissional/licenca quando disponiveis.
- Conversa nao e registrada no sistema.

## Validacao realizada
- `npm run check` passou com 81 testes.
- `npm run setup` passou.
- `npm run build --workspace @alwaystrack/web` passou.
- Smoke local: gerar link `wa.me` publico usando fallback `SUPPORT_PHONE`.
