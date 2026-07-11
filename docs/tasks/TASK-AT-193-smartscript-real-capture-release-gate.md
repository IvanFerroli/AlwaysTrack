# TASK-AT-193 - SmartScript: gate de captura real

## Metadata
- status: planned
- owner: olympus_orchestrator
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-193-smartscript-real-capture-release-gate.md

## Modo
- mode: verification

## Objetivo unico
Executar o gate final da captura real: `npm run up`, logger ativo, captura allowlisted, candidatos em `Gerados hoje`, aprovacao, export Espanso e prova de raw ausente no banco.

## Contexto minimo
Quando esta task terminar, o logging real pode ser considerado ativo para uso diario ou bloqueado por ambiente/SO com evidencia objetiva.

## Inputs
- `TASK-AT-192`
- `TASK-AT-181`
- `TASK-AT-182`
- ambiente local com AlwaysTrack, companion e Espanso

## Dependencias
- satisfeitas: `TASK-AT-192`, `TASK-AT-181`, `TASK-AT-182`.
- em aberto: host com adapters reais disponiveis.

## Alvos explicitos
1. ciclo real local
2. `npm run up`
3. `Scriptoteca > SmartScript`
4. Espanso
5. `docs/tasks/ROADMAP.md`

## Fora de escopo
- Implementar feature durante o gate.
- Capturar fonte pessoal nao permitida.
- Publicar canonico automaticamente.

## Checklist
1. Rodar `npm run up`.
2. Confirmar logger real ativo e demo diferenciada.
3. Capturar texto real em fonte permitida.
4. Tentar fonte bloqueada e confirmar descarte.
5. Processar/importar candidatos reais.
6. Revisar `Gerados hoje`.
7. Aprovar um snippet como `Em uso`.
8. Exportar para Espanso.
9. Acionar trigger `:`.
10. Conferir DecisionLog/metricas.
11. Conferir que raw logs nao entraram no banco.
12. Rodar regressao da `TASK-AT-192`.
13. Registrar GO/NO-GO.

## Acceptance Criteria
1. Captura real permitida gera candidato sem fixture manual.
2. Fonte bloqueada nao gera candidato.
3. AlwaysTrack recebe apenas dados processados/sanitizados.
4. Export Espanso contem apenas `Em uso`.
5. Status deixa claro se logging real esta ativo ou degradado.

## Definition of Done
1. Gate executado com evidencias.
2. Roadmap atualizado com decisao.
3. Blockers registrados em caso de NO-GO.

## Validacao
- comandos/checks: suite da `TASK-AT-192`, smoke do `npm run up`, smoke manual do Espanso.
- revisao manual: ciclo real completo.

## Evidencia esperada
- Output de comandos.
- Contagens sem texto bruto.
- Nota/print da aba SmartScript.
- Decisao GO/NO-GO.

## Riscos
- Permissoes locais/Espanso diferirem no host final.
- Captura real depender de permissao do SO.
- Heuristica gerar candidatos ruins.

## Blockers possiveis
- Adapter real indisponivel no host.
- Espanso nao rodando no Windows.

## Retorno esperado
- resumo do gate
- evidencias
- decisao GO/NO-GO
- proximos passos recomendados
