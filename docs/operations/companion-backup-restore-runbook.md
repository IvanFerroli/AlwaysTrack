# CaseFlow Configuration Backup and Restore

## Limite
Este backup logico cobre regras heuristicas versionadas, versoes publicadas de fluxos e definicoes declarativas de conectores. Nao cobre casos/evidencias, HTML, DOM, screenshots, cookies, senhas, tokens, sessoes, `credentialHash`, IDs de instalacao ou perfil. Para banco/storage completos, usar `backup-restore-runbook.md`.

## Export
1. Entrar como `ADMIN` e abrir `CaseFlow Admin > Backup`.
2. Exportar o envelope JSON e guardar em storage privado com ACL minima.
3. Conferir que `formatVersion` e suportada e preservar o `checksum` junto ao payload.
4. Fazer busca local pelos termos `password`, `secret`, `token`, `cookie`, `authorization`, `session` e `credential`; qualquer ocorrencia torna o artefato NO-GO.
5. Registrar apenas checksum, data, tamanho e responsavel.

## Restore aditivo e transacional
1. Fazer restore primeiro em organizacao/ambiente temporario.
2. Colar o envelope completo; checksum divergente deve falhar antes da transacao.
3. O restore cria novas `ServiceFlowVersion` e eventos versionados de regra/conector. Nao atualiza nem apaga snapshots anteriores.
4. Uma falha em qualquer item reverte toda a transacao.
5. Conferir o evento `case_flow.config.restore_completed`, contagens e `restoreId`.
6. Rodar golden cases/fixtures antes de ativar uma regra ou conector restaurado.

Conectores ou fluxos inexistentes no destino nao sao criados implicitamente: devem ser provisionados pelo processo declarativo aprovado e o restore repetido. Isso impede que um backup introduza sistema externo arbitrario.

## Rollback de configuracao
Rollback tambem e aditivo: criar nova versao baseada na ultima versao conhecida como boa ou restaurar um envelope anterior. Nunca apagar eventos, renumerar versoes ou editar JSON historico. Marcar conector como `DEGRADED`/`UNAVAILABLE` durante a investigacao.

GO: checksum valido, restore temporario completo, contagens esperadas, auditoria presente, testes fake verdes e zero chave sensivel. NO-GO: overwrite, restore parcial, seletor/DOM arbitrario, credencial no arquivo ou necessidade de pairing real para considerar o restore concluido.
