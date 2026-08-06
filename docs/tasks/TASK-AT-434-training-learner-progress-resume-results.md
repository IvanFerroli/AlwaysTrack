# TASK-AT-434 - Jornada do aluno, progresso, retomada e resultado

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-434-training-learner-progress-resume-results.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
Training / Learner Experience

## Origem documental
- `TASK-AT-431`, `TASK-AT-432` e `TASK-AT-433`.

## Problema
Mesmo com conteúdo e runtime, o usuário precisa descobrir obrigações, distinguir modos, continuar de onde parou e entender feedback/resultado sem confundir treino com atendimento real.

## Objetivo único
Entregar o hub do aluno e a execução integrada de trilhas com progresso persistido, retomada, tentativas e resultado próprio.

## Contexto mínimo
A UI deve tornar `Treinamento assistido`, `Simulado avaliativo` e `Atendimento real` inequivocamente diferentes em título, cor, microcopy e ações disponíveis.

## Inputs
- Runtime assistido da `TASK-AT-431`.
- Scoring/feedback da `TASK-AT-432`.
- Trilhas/enrollments da `TASK-AT-433`.

## Escopo
1. Rota `Treinamentos` com obrigatórios, opcionais, prazo, status e progresso.
2. Execução de itens ordenados e pré-requisitos simples.
3. Retomada do enrollment/attempt aberto sem duplicata.
4. Feedback conforme policy, score, aprovação/reprovação e tentativas restantes.
5. Histórico próprio de resultados e versão concluída.
6. Estados vazio, atrasado, expirado, bloqueado e conteúdo indisponível.

## Fora de escopo
- Dashboard gerencial, notificações e correção manual.
- Certificados, gamificação e ranking.
- Tracking real de player de vídeo.

## Arquivos ou domínios candidatos
- `apps/web/src/views/` — view futura do aluno.
- `apps/web/src/main.tsx`.
- `services/api/src/core/` — módulo futuro da jornada do aluno.
- `apps/web/test/` — testes futuros da jornada do aluno.

## Requisitos funcionais
1. Hub lista somente enrollments do usuário e catálogo opcional permitido.
2. Progresso usa itens obrigatórios da versão pinada.
3. Sair/voltar retoma passo e respostas sem iniciar nova tentativa.
4. Resultado mostra score, status, feedback liberado, versão e próxima ação.
5. Modo avaliativo não expõe gabarito antes da policy permitir.

## Requisitos de permissão, tenant e auditoria
1. Usuário lê/muta somente enrollment e attempts próprios.
2. IDs na URL são revalidados por tenant/owner.
3. UI não cacheia respostas livres ou gabarito em storage/log.
4. Start, resume, submit e complete geram eventos de treino redigidos.

## Checklist de execução
1. Integrar rota/navegação e APIs do aluno.
2. Implementar cards, filtros/status e empty states.
3. Implementar runner integrado e retomada.
4. Implementar tela de resultado/histórico.
5. Cobrir diferenciação visual e acessibilidade.

## Critérios de aceite
1. Usuário conclui uma trilha assistida e um simulado e vê resultados próprios.
2. Retomada não duplica attempt nem muda versão.
3. Atendimento real não é iniciado nem alterado pela jornada.
4. Desktop/mobile/teclado deixam o modo atual evidente.

## Testes esperados
- Component tests de catálogo, progresso, prazo, retomada e resultado.
- E2E de trilha assistida e simulado aprovado/reprovado.
- Cross-user/cross-tenant, gabarito oculto e tentativa esgotada.
- Acessibilidade, responsive, typecheck/build e `git diff --check`.

## Riscos
- Microcopy insuficiente levar usuário a tratar treino como operação real.
- Retomada criar attempt duplicado em clique/retry concorrente.

## Dependências
- satisfeitas: shell role-aware e patterns de estados operacionais.
- em aberto: `TASK-AT-431` a `TASK-AT-433`.

## Blockers possíveis
- Política de feedback/tentativas não definida.
- Design não distinguir os três modos de execução.

## Definição de pronto
1. Hub, runner e resultado próprios integrados e acessíveis.
2. Retomada/idempotência e isolamento têm testes.
3. Roteiro do aluno é reproduzível com seed sanitizado.

## Evidência esperada
- Capturas dos três modos e resultados dos testes.
- Prova de retomada na mesma versão/attempt.

## Próximo passo provável
`TASK-AT-435`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar somente jornada self-service do aluno.
- constraints: sem dashboard gerencial ou gamificação.
