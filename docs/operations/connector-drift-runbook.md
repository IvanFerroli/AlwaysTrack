# Connector Drift Runbook

## Deteccao e degradacao

Trate `FAILED_SELECTOR_DRIFT` ou `FAILED_UNEXPECTED_PAGE` como falha isolada. O Host reduz o diagnostico a campos permitidos; o Core registra `ConnectorHealthEvent(DEGRADED)` para a definicao afetada. Nao altere o caso para `FAILED`, nao cancele outros conectores e nao repita o conector degradado.

Campos permitidos: conector, versao do conector/seletor, codigo, tipo abstrato da pagina, duracao, horario e referencias `caseId`/`runId`. Nao persistir HTML, URL/query, screenshot, cookie, token, conversa, CPF, e-mail ou endereco por padrao.

## Resposta

1. Confirmar que somente a definicao afetada esta degradada.
2. Manter resultados parciais e oferecer fallback manual ao operador.
3. Reproduzir apenas com fixture sanitizada ou pagina fake.
4. Atualizar seletor/parser e seus testes isolados.
5. Publicar health recuperado apos validacao fake; isso libera novo retry.
6. Agendar smoke live manual posterior conforme checklist, sem credencial no repo.

Na area administrativa, registrar health somente pelos estados declarados `HEALTHY`, `DEGRADED` ou `UNAVAILABLE`. O controle nao aceita seletor, script, URL de execucao ou sistema arbitrario; mudancas de parser/seletor continuam no codigo versionado e passam por fixture/golden case.

## GO/NO-GO

GO: fixture sanitizada cobre a mudanca, diagnostico continua redigido, health volta a saudavel, retry cria novo run com identidades corretas e conectores paralelos permanecem operantes.

NO-GO: dependencia de HTML bruto, retry agressivo, identidade inferida da aba/ultimo caso, efeito global no caso, escrita automatica ou necessidade de credencial em teste.
