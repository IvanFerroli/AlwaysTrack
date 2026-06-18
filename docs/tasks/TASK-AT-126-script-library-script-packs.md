# TASK-AT-126 - Scriptoteca: pacotes e roteiros de atendimento

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-126-script-library-script-packs.md

## Modo
- mode: product

## Objetivo unico
Permitir agrupar scripts em pacotes/roteiros por fluxo de atendimento, como entrega atrasada, estorno, troca, produto com avaria ou duvida recorrente.

## Contexto
Nem todo atendimento e um unico texto. Muitas vezes o SAC segue uma sequencia: saudacao, coleta de dados, resposta principal, fallback e encerramento. A Scriptoteca pode virar um guia de conversa.

## Escopo funcional
1. Criar entidade simples de pacote/roteiro com nome, categoria, tags e ordem de scripts.
2. Exibir roteiro no modo atendimento com passos numerados.
3. Permitir copiar cada passo individualmente.
4. Mostrar Wiki/FAQ relacionados do pacote quando existirem.

## Acceptance Criteria
1. Supervisor/Admin monta pacote com scripts existentes.
2. SAC navega pelos passos sem perder contexto.
3. Cada copia continua auditada por script.
4. Pacote nao duplica corpo dos scripts; referencia scripts existentes.

## Riscos
- Virar construtor complexo de fluxo. MVP deve ser lista ordenada simples.
