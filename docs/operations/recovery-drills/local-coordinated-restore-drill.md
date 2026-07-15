# Local Coordinated Restore Drill

## Metadata
- status: active
- owner: ops/platform
- last-updated: 2026-07-15
- source-of-truth: docs/operations/recovery-drills/local-coordinated-restore-drill.md
- related-task: docs/tasks/TASK-AT-329-recovery-restore-rollback-drill.md

## Escopo e limite da evidencia
Este ensaio automatizado cobre SQLite, arquivos de evidencia fake, configuracao declarativa e rollback coordenado de artefatos Companion. Toda execucao ocorre abaixo do diretorio temporario do sistema operacional, sem credenciais, rede externa, storage real ou banco do usuario. O resultado e `local/fake`; nao substitui restore production-like, PITR Postgres, snapshot de bucket, pairing Chromium nem validacao live.

## Execucao

```bash
node scripts/recovery/restore-drill.mjs
node --test tests/recovery/restore-drill.test.mjs
```

A CLI imprime um relatorio JSON sanitizado e remove os recursos temporarios. `--keep-temporary` preserva o diretorio somente para diagnostico local; o harness ainda rejeita qualquer raiz fora do temporario do sistema.

## Sequencia automatizada
1. Cria SQLite temporario aplicando as migrations reais e insere uma fixture relacional minima de caso, fonte, run e evidencia.
2. Cria storage, configuracao e manifests Host/Extension sinteticos, todos sem segredo.
3. Gera snapshot coordenado e manifesto SHA-256 com inventario e tamanho de cada arquivo.
4. Corrompe banco ativo, remove storage, invalida configuracao e simula versoes Companion incompativeis.
5. Valida o snapshot antes de copiar e valida novamente o candidato restaurado.
6. Executa `PRAGMA integrity_check`, `PRAGMA foreign_key_check` e reconcilia caso, fonte, run e evidencia sem duplicar acao terminal.
7. Exige protocolo comum entre Host, Extension e contrato compartilhado antes do rollback.
8. Calcula RPO e RTO; qualquer objetivo excedido bloqueia a promocao.
9. Promove apenas o candidato totalmente validado e marca a prontidao como `LOCAL_ONLY`.

## Contrato GO/NO-GO
GO local exige checksums, inventario, integridade SQLite, zero violacao de chave estrangeira, contagens relacionais unitarias, storage/config reconciliados, protocolo Companion `1` e RPO/RTO dentro dos limites. Falha em qualquer check encerra com exit code `1`, `productionReadiness: BLOCKED` e `checks.promoted: false`.

O padrao local usa RPO de 1 hora e RTO de 2 horas, alinhado ao alvo recomendado para producao externa no runbook geral, embora esta evidencia nao prove esses objetivos em producao. O operador deve definir e registrar os objetivos aprovados no ambiente autorizado antes do ensaio production-like.

## Proximo ensaio production-like
- Restaurar backup Postgres/PITR e snapshot privado pareados pelo mesmo identificador.
- Medir congelamento de writes, restore, health e reabertura gradual com operador e janela registrados.
- Validar rollback de pacotes assinados reais do Host e da Extension em Windows/WSL/Chromium autorizado.
- Confirmar storage externo, ACL, criptografia, retencao e recuperacao de objeto apagado.
- Manter NO-GO ate todos os checks passarem; nunca inferir prontidao live deste ensaio local.
