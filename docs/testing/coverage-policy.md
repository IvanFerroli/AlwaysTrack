# Politica de coverage por risco

## Metadata
- status: active
- owner: quality-maintainers
- last-updated: 2026-07-15
- source-of-truth: docs/testing/coverage-policy.md
- related-task: docs/tasks/TASK-AT-315-risk-based-coverage-thresholds.md

## Contrato
`npm run coverage:check` executa coverage V8 sobre todos os fontes `src` dos seis workspaces, aplica pisos globais e metas maiores nos arquivos criticos, e gera `text-summary`, `json-summary` e HTML. O CI bloqueia qualquer resultado abaixo do piso e publica os diretorios `coverage/` por 14 dias.

Os pisos sao baselines incrementais, nao metas finais. Arquivos sem import por teste contam como zero; nao se deve excluir fonte apenas para elevar percentual. Aumento de threshold acompanha novos testes em commit revisavel. Reducao exige excecao temporaria com owner, justificativa, prazo e aprovacao de `quality-maintainers`.

## Baseline local

| Workspace | Linhas baseline / piso | Branches baseline / piso | Funcoes baseline / piso | Owner |
| --- | ---: | ---: | ---: | --- |
| Shared | 61.21 / 55 | 81.25 / 70 | 87.01 / 80 | platform/contracts |
| Extension | 61.23 / 58 | 73.86 / 70 | 78.22 / 75 | companion/extension |
| SmartScript | 16.04 / 15 | 68.18 / 60 | 81.81 / 75 | companion/smartscript |
| Web | 6.59 / 6 | 56.77 / 50 | 29.77 / 25 | web/product |
| API | 68.82 / 60 | 67.03 / 60 | 64.88 / 64 | api/core |
| Host | 89.52 / 85 | 80.27 / 75 | 93.10 / 90 | companion/host |

Baseline obtido localmente em 2026-07-15 com Node 24 e dados sinteticos. A evidencia e `local`, nao production-like ou live. SmartScript tem grande parte do fluxo exercitada em subprocesso E2E, que nao e atribuida ao processo Vitest; Web passou a medir toda a SPA e possui divida explicita. Os proximos marcos sao 25% de linhas no SmartScript e 10% no Web sem reduzir os demais pisos.

Excecao temporaria API: o inventario completo de 2026-07-15 encontrou 64.88% de funcoes, enquanto o piso inicial de 75% nunca havia sido exercitado pelo comando agregado. O owner `api/core` aceita piso executavel de 64% ate 2026-08-15; elevar de volta exige testes dos modulos adicionados depois do baseline original. Os thresholds criticos por arquivo permanecem inalterados.

## Superficies criticas
- Shared: protocolo Companion e parser generico de conectores.
- Extension: cliente de protocolo e action firewall, com firewall em 100%.
- SmartScript: processor e geracao Espanso, esta em 100%.
- Web: cliente API, navegacao acessivel de tabs e administracao CaseFlow.
- API: access policy, sessao, action firewall e validacao de entrada; firewall em 100%.
- Host: action firewall e seguranca do protocolo; firewall em 100%.

Os thresholds exatos vivem nos `vitest.config.ts` de cada workspace para que o proprio runner falhe antes da publicacao do artefato.

## Operacao
```bash
npm run coverage:check
```

Relatorios HTML ficam em `<workspace>/coverage/index.html`. Eles nao sao versionados. Em CI, baixar o artefato `workspace-coverage` do mesmo commit. Percentual nao substitui cenarios por risco, fuzzing, E2E de browser ou validacao live.
