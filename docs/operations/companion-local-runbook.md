# Companion Local Runbook

## Metadata
- status: active-health-shell
- owner: operations-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-195

## Preflight
1. Confirmar Chrome Stable e perfil exclusivo de trabalho.
2. Confirmar que WSL2 esta ativo e que `localhost` Windows encaminha para um endpoint descartavel no WSL.
3. Confirmar que o listener usa `127.0.0.1`; falhar o startup se receber `0.0.0.0` ou endereco de LAN.
4. Confirmar que nenhuma senha, cookie ou token de sistema externo foi configurado no Host.

O diagnostico da extensao trata Chrome como referencia, Edge como secundario e qualquer sinal insuficiente como `UNKNOWN`. Marcadores de perfil sao opacos; nome, e-mail, caminho e conteudo do perfil nunca sao lidos. Perfil divergente deve ser sinalizado sem inferir identidade pessoal.

## Health shell
O Host permanece separado da API e nao entra em `npm run up` nesta fase. Para validacao manual: compilar com `npm run companion:host:build` e iniciar explicitamente com `npm run companion:host:start`. O unico endpoint e `GET http://127.0.0.1:38472/health`.

`COMPANION_HOST_BIND` aceita apenas `127.0.0.1`; qualquer outro valor encerra o processo antes do listen. `SIGINT` e `SIGTERM` fecham o servidor e liberam a porta. WebSocket, pairing e reconexao pertencem a `TASK-AT-211`.

O WebSocket usa `/companion` no mesmo listener. `COMPANION_HOST_ALLOWED_ORIGIN` e obrigatorio e aceita somente `chrome-extension://<id-real-de-32-caracteres>`. O token de pairing e efemero, de uso unico, enviado no corpo de `COMPANION_HELLO`, nunca em URL ou log. A autoridade real do challenge da API permanece para `TASK-AT-212`.

## Probe sem dados reais
Subir um endpoint temporario sem payload em porta nao reservada, consultar `http://localhost:<porta>` pelo PowerShell e encerrar o processo. Registrar apenas horario, sucesso, duracao e topologia; nao registrar headers, cookies ou corpo de paginas.

Repetir o probe apos:
- `wsl --shutdown` e nova inicializacao;
- suspensao/retomada;
- troca de Wi-Fi ou VPN;
- reinicio do Chrome;
- bloqueio temporario do Host.

## Recuperacao
- `HOST_UNAVAILABLE`: manter UI utilizavel, cancelar runs locais e tentar reconexao com backoff limitado.
- `PAIRING_REQUIRED`: solicitar novo pairing; nunca voltar a token revogado.
- `ORIGIN_REJECTED`: bloquear conexao e orientar verificacao da extensao/perfil.
- `WSL_FORWARDING_UNAVAILABLE`: executar Host no Windows ou aplicar proxy loopback aprovado pela arquitetura.
- `PROFILE_MISMATCH`: impedir coleta e orientar troca para o perfil de trabalho.

Depois de suspensao/retomada, considerar o Host indisponivel ate novo health. A extensao deve reconectar com backoff limitado, sem repetir runs terminais e sem migrar um run para outro caso. Pairing expirado exige novo fluxo; backup/rollback nunca restaura credencial de instalacao.

Procedimentos coordenados: `companion-update-rollback-runbook.md` e `companion-backup-restore-runbook.md`.

## Evidencia desta rodada
Builds, testes e fixtures podem ser validados localmente. Chrome/Windows/WSL, pairing real, firewall e suspensao fisica continuam como checklist manual pendente; nao registrar esses itens como aprovados sem evidencia do ambiente autorizado.

## Proibicoes
Nao abrir firewall para rede publica, fixar IP interno do WSL, exportar cookie, automatizar login/captcha/2FA ou testar conectores reais neste runbook. Logs devem ser redigidos conforme o threat model do Companion.
