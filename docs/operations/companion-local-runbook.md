# Companion Local Runbook

## Metadata
- status: draft-until-host-shell
- owner: operations-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-195

## Preflight
1. Confirmar Chrome Stable e perfil exclusivo de trabalho.
2. Confirmar que WSL2 esta ativo e que `localhost` Windows encaminha para um endpoint descartavel no WSL.
3. Confirmar que o listener usa `127.0.0.1`; falhar o startup se receber `0.0.0.0` ou endereco de LAN.
4. Confirmar que nenhuma senha, cookie ou token de sistema externo foi configurado no Host.

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

## Proibicoes
Nao abrir firewall para rede publica, fixar IP interno do WSL, exportar cookie, automatizar login/captcha/2FA ou testar conectores reais neste runbook. Logs devem ser redigidos conforme o threat model do Companion.
