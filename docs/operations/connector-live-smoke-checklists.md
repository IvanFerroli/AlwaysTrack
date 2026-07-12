# Connector Live Smoke Checklists

## Regra de execucao

Este documento prepara uma validacao manual posterior. Nao e teste automatizado, nao substitui fixtures e nao autoriza credenciais no repositorio, logs ou evidencias. Nesta rodada nenhum smoke live foi executado.

Antes de cada sistema: usar perfil de trabalho autorizado, confirmar ambiente nao produtivo quando disponivel, iniciar somente leitura, mascarar evidencias, registrar versao do conector/seletor e interromper diante de login, captcha, 2FA, pagina inesperada ou tentativa de escrita.

## Checklist comum por sistema

Aplicar a AlwaysChat, Rastreio, Yampi, OMIE, Loggi, J&T, Correios/Reversa e Lancador:

- Login expirado: detectado e pausado, sem armazenar senha/cookie.
- Captcha e 2FA: intervencao humana visivel, sem contorno automatico.
- Resultado vazio: `NOT_FOUND` apenas para a fonte consultada.
- Resultado multiplo: estado ambiguo visivel, sem escolha silenciosa.
- Timeout: run isolado e demais conectores continuam.
- Retomada: apenas o mesmo `caseId`/`runId`, apos intervencao valida.
- Drift: estado `DEGRADED`, diagnostico redigido e nenhuma tentativa destrutiva.
- Escrita: nenhum submit, envio, drag, mudanca de status, geracao ou confirmacao.

## Criterios especificos

| Sistema | GO | NO-GO |
| --- | --- | --- |
| AlwaysChat | intake somente leitura identifica conversa e caso corretos | envia, resolve, transfere ou mistura conversa anterior |
| Rastreio | extrai eventos de rastreio normalizados | interpreta vazio como inexistencia global |
| Yampi | consulta pedido/pagamento sem acionar recuperacao | abre pagamento, boleto ou WhatsApp |
| OMIE | le pedido/NF/status sem alterar registro | drag, edicao ou mudanca de status |
| Loggi | consulta entrega com timeout isolado | agenda ou confirma operacao |
| J&T | pausa em login/captcha e retoma o mesmo run | contorna captcha ou troca resultado primario silenciosamente |
| Correios/Reversa | pausa em login/2FA e consulta somente leitura | gera ou confirma reversa |
| Lancador | consulta dados e prepara somente capability autorizada | gera pedido, venda, pagamento ou submit |

GO exige todos os itens comuns e o criterio especifico verdes. Qualquer NO-GO encerra o smoke do conector, preserva os demais e abre diagnostico conforme `connector-drift-runbook.md`.
