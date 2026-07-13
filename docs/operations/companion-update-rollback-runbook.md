# Companion Update and Rollback Runbook

## Escopo e estado de validacao
Procedimento local para extensao MV3 e Companion Host. Os comandos de build e testes sao verificaveis no workspace; instalacao no Chrome, pairing real, suspensao do notebook e regras de firewall exigem execucao manual posterior. Este documento nao afirma que esses passos live foram validados.

## Preparacao obrigatoria
1. Registrar versoes atuais da extensao, Host, conector e seletores, sem IDs de perfil ou tokens.
2. Exportar a configuracao CaseFlow pela area `CaseFlow Admin > Backup` e conferir o checksum.
3. Manter disponivel o ultimo pacote conhecido como bom da extensao e do Host.
4. Executar `npm run companion:extension:build`, `npm run companion:host:build` e os testes dos dois workspaces.
5. Confirmar que o Host escuta somente `127.0.0.1` e que nenhuma regra abre porta para LAN/rede publica.

NO-GO: backup sem checksum, artefato anterior ausente, build/teste falho, necessidade de copiar cookie/token, ou alteracao simultanea de protocolo sem compatibilidade declarada.

## Instalacao local
1. Compilar a extensao e carregar `apps/companion-extension/dist` como extensao descompactada no perfil de trabalho.
2. Compilar/iniciar o Host explicitamente e conferir `GET http://127.0.0.1:38472/health`.
3. Conferir ID/origem permitida sem registrar token de pairing.
4. Fazer pairing pela UI quando a autoridade real estiver disponivel. Nao reutilizar challenge/token e nao colar valores em ticket ou terminal compartilhado.
5. Rodar apenas fixture/pagina fake antes de qualquer smoke autorizado.

## Atualizacao
1. Interromper novos runs; deixar runs ativos terminar ou cancelar de forma visivel.
2. Atualizar primeiro o Host quando houver compatibilidade retroativa; caso contrario, manter ambos parados durante a troca.
3. Recarregar a extensao e verificar health, reconexao e fixture sanitizada.
4. Liberar consultas gradualmente. Conector degradado permanece visivel e isolado.
5. Registrar somente versoes, horario, resultado e responsavel.

## Rollback
1. Parar novos runs e marcar a janela como NO-GO.
2. Restaurar os ultimos artefatos conhecidos como bons do Host e extensao.
3. Recarregar a extensao. Se o pairing for rejeitado, revogar a instalacao e iniciar novo pairing; nunca restaurar credencial antiga de backup.
4. Restaurar configuracao apenas pelo restore aditivo; versoes criadas na atualizacao permanecem na auditoria e sao desativadas por uma nova versao.
5. Validar health e fixture fake. Reabrir operacao somente com ambos verdes.

## Suspensao e retomada
A suspensao deve derrubar a conexao sem perder o isolamento por `caseId`/`runId`. Ao retomar: nao disparar submit, nao repetir run terminal, usar backoff limitado, exigir novo pairing quando a credencial expirou e mostrar `HOST_UNAVAILABLE` ate health real. Depois de troca de rede/VPN, reconfirmar que a porta continua restrita a loopback.

GO: health local, fixture sanitizada, reconexao limitada, versoes coerentes e nenhum segredo em log. NO-GO: pairing presumido, retry em massa, listener externo, run retomado em outro caso ou qualquer escrita automatica.
