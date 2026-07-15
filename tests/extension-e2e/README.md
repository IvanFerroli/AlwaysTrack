# Extension MV3 browser E2E

Harness local da `TASK-AT-318`. Ele usa o Chromium do Playwright com a extensao
unpacked de `apps/companion-extension/dist`, um Host WebSocket controlado em
`127.0.0.1:38472` e uma pagina totalmente sintetica.

## Executar

```bash
npm run build --workspace @alwaystrack/companion-extension
LD_LIBRARY_PATH=/tmp/alwaystrack-playwright-libs/root/usr/lib/x86_64-linux-gnu \
  node scripts/mv3-extension-e2e.mjs
```

O harness nao grava trace, video, screenshot, HTML, cookie ou token. A saida
contem somente nomes de checks e metadados sanitizados do protocolo.

## Escopo da evidencia

- `local/fake`: Chromium real, manifest MV3 real, service worker real, side panel
  real e Host local sintetico.
- Nao e evidencia `live` ou `production-like`.
- O runner reporta explicitamente superficies ausentes do wiring de producao;
  nao injeta permissoes ou content scripts apenas para fazer o teste passar.
