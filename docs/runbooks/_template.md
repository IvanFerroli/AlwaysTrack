# RUNBOOK-### - <titulo-curto>

## Metadata
- status: draft
- owner: <nome-ou-papel>
- secondary-owner: <nome-ou-papel>
- last-updated: YYYY-MM-DD
- review-by: YYYY-MM-DD
- last-exercised: YYYY-MM-DD ou never
- environment: <local|staging|production|host-windows-wsl>
- source-of-truth: docs/runbooks/RUNBOOK-###-<slug>.md

## Objetivo
<o que este procedimento garante>

## Gatilhos
- <quando executar>

## Pre-condicoes
- <pre-condicao 1>
- <pre-condicao 2>

## Impacto e dados
- impacto esperado: <indisponibilidade, perda potencial, escopo>
- sensibilidade da evidencia: <publica|interna|restrita>
- proibido registrar: <segredos, cookies, payloads, dados pessoais>

## Preflight
1. Confirmar ambiente, versao/commit, owner da janela e backup aplicavel.
2. Confirmar criterio de aborto e caminho de rollback.

## Passos operacionais
1. <passo 1>
2. <passo 2>
3. <passo 3>

## Validacao
- sinais esperados: <lista>
- checks/comandos: <lista>

## Evidencia
- manifesto com UTC, ambiente, operador, commit/versao, comandos e exit codes
- artefatos com checksum, redaction e classificacao de sensibilidade

## Rollback/contingencia
1. <acao 1>
2. <acao 2>

## Escalonamento
- owner primario: <nome-ou-papel>
- owner secundario: <nome-ou-papel>
- criterio de escalonamento: <sinal e prazo>

## Revisao pos-execucao
- resultado: <sucesso|sucesso-com-ressalvas|falha|abortado>
- RPO/RTO observado quando aplicavel: <valor>
- follow-ups, owner e prazo: <lista>
