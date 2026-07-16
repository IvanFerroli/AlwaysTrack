# TASK-AT-357 - Descoberta de sessoes e renderizacao integral da versao fixada

## Metadata
- status: pending
- owner: olympus_taskyfier
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-357-service-flow-session-discovery-versioned-rendering.md

## Objetivo unico
Permitir sair e retornar a um atendimento aberto sem criar duplicata e garantir que todo o conteudo exibido continue preso a versao iniciada.

## Escopo
- Listar sessoes abertas do proprio atendente por fluxo, com inicio e ultimo passo.
- Oferecer retomar ou iniciar novo atendimento de forma explicita.
- Renderizar instrucoes, decisoes, gates e revisoes de scripts pelo snapshot/versionamento da sessao.
- Preservar leitura de sessoes legadas sem snapshot integral.
- Impedir que republicacao altere silenciosamente um atendimento em andamento.

## Acceptance Criteria
1. Trocar de tela e voltar permite descobrir e retomar a sessao aberta.
2. Nova sessao nao e criada sem escolha explicita quando ja existe uma aberta.
3. Republicar o fluxo nao muda o conteudo de uma sessao iniciada.
4. Sessao legada permanece legivel por fallback controlado.
5. Testes cobrem duplicidade, tenant e mudanca de versao.

## Dependencias
- TASK-AT-249
- TASK-AT-353
- TASK-AT-356
