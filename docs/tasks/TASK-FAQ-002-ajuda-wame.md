# TASK-FAQ-002 - Ajuda via wa.me

## Metadata
- status: proposed
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
