# CaseFlow Coverage Matrix

## Escopo TASK-AT-278, 279, 287, 288, 291 e 299

| Task | SPEC | Implementacao/evidencia | Estado |
| --- | --- | --- | --- |
| AT-278 | 4.4, 20.12, 33 | guarda em `architecture.test.ts`; arquitetura sem provider/chave | coberto |
| AT-279 | 20.13 | modo opcional em `espanso.ts`; teste e RUNBOOK-004 | coberto |
| AT-287 | 27.7 | checklist manual por oito sistemas; nenhum smoke executado | documentado |
| AT-288 | 26.3, 36.1 | diagnostico redigido no Host; health degradado e retry suprimido no service | coberto |
| AT-291 | 36.5 | testes sequenciais A/B para diagnostico, run e evidencia | coberto |
| AT-299 | 6, 23, 30 | arquitetura, contrato de conector, protocolo e esta matriz | coberto |

## Conectores

| Conector | Fixture/parser | Drift/health | Live smoke posterior |
| --- | --- | --- | --- |
| AlwaysChat | sanitizado | isolado por definicao | checklist |
| Rastreio | sanitizado | isolado por definicao | checklist |
| Yampi | sanitizado | isolado por definicao | checklist |
| OMIE | sanitizado | isolado por definicao | checklist |
| Loggi | sanitizado | isolado por definicao | checklist |
| J&T | sanitizado | isolado por definicao | checklist |
| Correios/Reversa | sanitizado | isolado por definicao | checklist |
| Lancador | sanitizado | isolado por definicao | checklist |

## Limites verificados

- Sem runtime de IA, chave externa, scraping real ou credencial.
- Sem alteracao de UI, handlers API, manifests, ROADMAP ou arquivos de task.
- HTML, URL e screenshot ausentes do diagnostico persistivel por padrao.
- Caso A e caso B executados sequencialmente sem reaproveitar identidade.
