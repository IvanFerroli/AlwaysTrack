# TASK-AT-359 - Compliance de ciencia dos avisos

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-359-announcement-acknowledgement-compliance.md

## Objetivo
Transformar a ciencia de avisos obrigatorios em um acompanhamento operacional confiavel, sem gerar uma notificacao por leitura.

## Escopo
- calcular a audiencia por usuarios ativos da organizacao e papeis-alvo do aviso;
- distinguir quem marcou ciencia, quem abriu sem confirmar e quem ainda nao abriu;
- corrigir o botao de ciencia para considerar somente o usuario atual;
- impedir exposicao de recibos nominais a perfis sem governanca;
- mostrar resumo por hover/foco e nomes por expansao no Dashboard SAC;
- emitir uma unica notificacao deduplicada para ADMIN/GESTOR quando toda a audiencia confirmar;
- cobrir tenant, audiencia vazia, deduplicacao, navegacao e acessibilidade.

## Criterios de aceite
- nenhum recibo de outra pessoa pode ocultar o botao do usuario atual;
- `pendentes = audiencia ativa - cientes`, sem inferir quem nunca abriu a partir de recibos inexistentes;
- a conclusao de 100% nao ocorre para audiencia vazia;
- notificacao de conclusao nao se repete em acknowledgements idempotentes;
- Dashboard Geral permanece compacto e Dashboard SAC expande no maximo um aviso por vez;
- tooltip tambem funciona por foco de teclado e o detalhe possui nomes e estado.

## Validacao esperada
- testes de service/HTTP para audiencia, privacidade e notificacao;
- testes Web para botao individual, tooltip, expansao e alternancia do Dashboard;
- typecheck e build de API/Web;
- `git diff --check`.

## Resultado
- audiencia calculada por organizacao, usuario ativo e papel-alvo;
- estados nominais `ciente`, `abriu sem confirmar` e `nao abriu` restritos a ADMIN/GESTOR;
- botao de ciencia corrigido para o usuario atual e abertura registrada ao selecionar o aviso;
- Dashboard SAC com tooltip por hover/foco e expansao nominal de um aviso por vez;
- notificacao unica e deduplicada para ADMIN/GESTOR quando a audiencia nao vazia atinge 100%;
- 16 testes focados de API e 12 de Web aprovados;
- `npm run check` aprovado: 1.077 testes nos seis workspaces, 1 Redis opcional ignorado, 14 testes de startup e todos os builds.
