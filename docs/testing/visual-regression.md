# Regressao visual e responsiva

## Metadata
- status: active
- owner: quality-maintainers
- last-updated: 2026-07-15
- source-of-truth: docs/testing/visual-regression.md

## Escopo do gate
O gate Playwright protege as superficies P0 usadas na apresentacao e na operacao diaria com dados sinteticos do seed local. Ele combina comparacao de pixels com assercoes estruturais que falham quando existe overflow horizontal inesperado, controle interativo fora do viewport ou sobreposicao entre regioes criticas.

| Superficie | Viewport | Baseline | Risco protegido |
| --- | --- | --- | --- |
| Login Web | 1024x768 e 320x700 | light | formulario, marca e chamada principal |
| CaseFlow Admin | 1440x900 e 360x800 | light | tabela de conectores, tabs e backup empilhado |
| Navegacao Web | 1024x768 | light | sidebar recolhida sem cobrir o workspace |
| Fluxos SAC | 390x844 | light | atendimento guiado no viewport de campo |
| Companion side panel | 320x700 e 600x900 | light | header fixo, caso, stepper e acoes de copia |

O AlwaysTrack Web e o side panel suportam atualmente apenas o tema claro. Um baseline escuro nao deve ser criado antes de existir contrato de produto e implementacao para esse tema.

## Execucao local
O gate usa o ambiente E2E isolado, banco SQLite temporario e bundle local da extensao. Nao usa credenciais, dados pessoais ou providers externos.

```bash
LD_LIBRARY_PATH=/tmp/alwaystrack-playwright-libs/root/usr/lib/x86_64-linux-gnu \
  npx playwright test tests/e2e/visual-responsive-web.desktop.spec.ts \
  tests/e2e/visual-responsive-web.mobile.spec.ts \
  tests/e2e/visual-responsive-side-panel.desktop.spec.ts \
  --project=desktop --project=mobile
```

Os sufixos `.desktop.spec.ts` e `.mobile.spec.ts` garantem que cada cenário rode apenas no projeto de viewport correspondente. O build do Companion executado pela spec produz somente artefatos ignorados em `apps/companion-extension/dist`.

## Atualizacao consciente de baseline
Snapshots nunca devem ser atualizados para apenas deixar o gate verde.

1. Rode a spec afetada sem `--update-snapshots` e abra o diff em `test-results/e2e-artifacts` ou `playwright-report`.
2. Confirme que a mudanca corresponde a uma decisao de produto ou correcao revisada e que as assercoes de geometria continuam verdes.
3. Gere apenas os baselines afetados com `--update-snapshots` e o projeto correto.
4. Inspecione lado a lado baseline anterior, imagem atual e diff antes do commit.
5. Registre no PR a superficie, o viewport, a razao da mudanca e a evidencia revisada.

Uma alteracao ampla, um diff sem explicacao ou uma atualizacao automatica de todos os snapshots deve bloquear a revisao. Os PNGs versionados nao podem conter dados reais, cookies, tokens ou identificadores de clientes.

## Determinismo e triagem
- Animacoes, transicoes, caret e movimento reduzido sao estabilizados pela fixture visual.
- Fontes sao aguardadas antes da captura e a pagina retorna ao topo.
- A tolerancia de pixels e limitada a 0,1%; overflow e sobreposicao nao possuem tolerancia semantica.
- Falha de geometria deve ser corrigida antes de qualquer decisao sobre o snapshot.
- Falha apenas de pixels deve ser classificada como regressao, mudanca esperada ou ruido de ambiente antes da atualizacao.

Evidencia gerada localmente e classificada como `local/fake`. Ela nao substitui validacao production-like, instalacao real da extensao no Chrome/Edge ou homologacao live.

## Regressao corrigida em 2026-07-15
A primeira execucao do gate encontrou overflow horizontal preexistente no shell autenticado. O documento chegou a `2187px` no viewport `1440px`, `1993px` no viewport `1024px`, `608px` no viewport `390px` e `629px` no viewport `360px`. No ultimo viewport, a sidebar tambem interceptou o clique da tab Backup.

A topbar passou a quebrar atalhos, as acoes refluem, Fluxos usa uma coluna no mobile e a sidebar virou faixa horizontal rolavel. As assercoes de geometria passaram nos oito cenarios antes da atualizacao seletiva dos quatro baselines afetados. O gate final ficou verde sem skips ou aumento de tolerancia.
