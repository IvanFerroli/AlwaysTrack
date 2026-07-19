# TASK-AT-098 - Fechamento da frente de Avisos

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-098-announcements-final-hardening.md
- execution: docs/tasks/EXEC-AT-098-announcements-final-hardening.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13.6
- dependencias: `TASK-AT-082`, `TASK-AT-083`, `TASK-AT-084`, `TASK-AT-085`, `TASK-AT-086`, `TASK-AT-087`

## Objetivo unico
Fechar a frente de Avisos para apresentacao, removendo pendencias de MVP e garantindo que comunicados vigentes, links, ciencia e CTAs funcionem de ponta a ponta.

## Escopo executado
1. Preservar filtro de vigencia ao combinar busca/status/tag para usuarios comuns.
2. Evitar que busca global retorne aviso agendado ou expirado para usuarios comuns.
3. Permitir multiplos links relacionados no editor de Avisos.
4. Abrir aviso especifico ao clicar em item da Central Operacional Hoje.
5. Expor recibos de ciencia na listagem para gestores.
6. Reforcar teste da Central com avisos ativos.
7. Corrigir a jornada gerencial de aviso unitario para limpar a selecao anterior, salvar/publicar por comando explicito e manter o item visivel depois da mutacao mesmo quando havia filtros ativos.

## Acceptance Criteria
1. Usuario comum nao recebe aviso fora da vigencia.
2. Busca global respeita vigencia de Avisos.
3. Central abre o comunicado certo.
4. Editor aceita mais de um link relacionado.
5. Testes e builds relevantes passam.
6. `Salvar e publicar` persiste o rascunho e usa o endpoint de publicacao que emite as notificacoes do publico alvo.

## Impacto na apresentacao
Transforma Avisos de MVP funcional em modulo pronto para demonstrar como canal operacional diario.

## Risco residual
- Versionamento completo de Avisos e grafo de substituicao ainda ficam fora da frente atual por decisao de escopo.

## Regressao 2026-07-18
- O editor nao oferece mais `PUBLISHED` como alteracao direta de status; publicacao passa pelo comando e endpoint governados.
- `Novo aviso` limpa o detalhe anterior, evitando que o botao `Publicar` aponte para outro registro.
- Depois de salvar, publicar ou arquivar, filtros sao limpos e o aviso afetado permanece selecionado.
- Validado com chamada HTTP real de criar/publicar/arquivar, builds Web/API, 34 testes Web adjacentes e 23 testes de servico de Avisos.
- Ocorrencias materializadas por uma serie sao somente leitura no editor unitario e continuam governadas pela serie.
- O endpoint de publicacao rejeita avisos avulsos fora da janela de vigencia, evitando notificacao de item ainda invisivel.
