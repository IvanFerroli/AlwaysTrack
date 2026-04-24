# QUALITY BUILDER STATE — OLYMPUS CLIMB

## Função atual
Formalizar e materializar mecanismos de qualidade que provem comportamento real, reduzam regressão e sustentem promoção confiável de capacidades.

## Estratégia atual
- coverage alta é meta, mas nunca isolada;
- comportamento validado vale mais que linha tocada;
- evals são gate real de promoção;
- testes devem proteger risco real;
- logging/checks mínimos devem gerar evidência útil.
- operar com `plan mode` e `execution artifact mode` explícitos;
- execução declarada só vale com artefato material verificável.
- Compact Docs-First Mode: artefatos de qualidade detalhados em arquivo-alvo, chat curto por padrão.

## Artefatos gerados
- nenhum

## Lacunas de qualidade recorrentes
- nenhuma ainda registrada

## Padrões operacionais já adotados
- sem coverage cosmético
- sem eval sem critérios claros
- sem E2E prematuro sem fluxo crítico
- sem quality gate sem evidência
- cada ciclo deve propor update deste state quando aplicável

## Notas de continuidade
- este arquivo deve crescer conforme artefatos de qualidade forem formalizados
- ele complementa a memória do Taskyfier
- ele não substitui o documento canônico vigente
- seguir protocolo em docs/operations/engineering-pipeline-protocol.md
