# ADR-001 - Governanca documental operacional

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-23
- source-of-truth: docs/adr/ADR-001-governanca-documental-operacional.md

## Contexto
O projeto Olympus Climb esta em formalizacao executavel e depende de rastreabilidade documental para sustentar pipeline, validacao e continuidade sem abrir implementacao funcional pesada.
Antes desta ADR, as regras ja existiam de forma distribuida, mas sem consolidacao em ADR aceita.

## Decisao
Adotar oficialmente a governanca documental operacional abaixo:
1. `docs/` e a superficie viva principal de engenharia e operacao; `doc/` permanece historico.
2. ADRs devem ser registradas em `docs/adr/` (nao em `docs/decisions/` neste ciclo).
3. O pipeline opera em `Compact Docs-First Mode`: detalhes longos em arquivos-alvo e chat com resumo operacional curto por padrao.
4. Em caso de impossibilidade de escrita direta, entregar patch/conteudo exato mantendo chat curto.

## Alternativas consideradas
1. Manter apenas consolidacao em chat, sem persistencia forte em `docs/`.
2. Reabrir superficie de ADR em `docs/decisions/`.

## Consequencias
- positivas:
  - maior rastreabilidade entre task package, execucao, verificacao e memoria operacional;
  - menor carga cognitiva no chat e melhor continuidade entre ciclos;
  - reduz ambiguidade de naming para ADR.
- negativas:
  - aumenta disciplina obrigatoria de escrita em arquivo por etapa;
  - exige atualizacao consistente de `docs/operations`.
- trade-offs:
  - menos detalhe no chat em troca de mais confiabilidade documental no repositorio.

## Impacto em artefatos
- specs relacionadas: n/a
- tasks relacionadas: TASK-DOC-002
- runbooks relacionados: n/a

## Validacao e evidencia esperada
- validacao: conferir existencia da ADR e aderencia ao protocolo de pipeline em `docs/operations/engineering-pipeline-protocol.md`.
- evidencia: arquivo ADR-001 materializado com metadata completa e decisao explicitamente operacional.

## Fora de escopo
Nao autoriza implementacao funcional de produto, runtime real, integracoes ou mudancas de capability.
