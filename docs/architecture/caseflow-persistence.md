# CaseFlow Persistence

## Metadata
- status: approved-slice
- owner: architecture-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-216

## Recorte persistido
Esta entrega cria `ServiceCase`, `ServiceCaseSource`, `ConnectorRun`, `EvidenceFact`, `EvidenceConflict`, `CompanionInstallation`, `ConnectorDefinition` e `ConnectorHealthEvent`. Todas as entidades carregam `organizationId`; casos e instalacoes pertencem a usuario, e runs registram usuario, instalacao e `browserProfileId` para verificacao de tenant e perfil.

As relacoes usam `ON DELETE RESTRICT`. Exclusao fisica em cascata nao faz parte do CaseFlow: encerramento, cancelamento, revogacao e desativacao usam estado e timestamps, preservando fatos, conflitos, runs e health para auditoria.

## Dados controlados
Campos variaveis usam `String` JSON por compatibilidade com SQLite, sempre produzidos por `stringifyCaseFlowJson` em `services/api/src/core/case-flow/persistence.ts`. O helper limita cada valor a 32 KiB, exige arrays nos campos de lista e rejeita chaves de senha, segredo, token, cookie, sessao, autorizacao, credencial bruta, HTML ou DOM. Tambem rejeita markup HTML em strings.

`EvidenceFact` guarda somente valor extraido e valor normalizado. `ConnectorRun` e health guardam diagnostico redigido e limitado. `CompanionInstallation` persiste somente `credentialHash` com prefixo de algoritmo e metadados de expiracao/revogacao; pairing challenge, host credential, extension session token, senha, cookie, storage externo, HTML bruto e screenshot nao sao persistidos.

`EvidenceConflict.factIdsJson` e uma lista controlada de IDs de fatos. `chosenFactId` permanece uma chave estrangeira opcional. A camada de servico deve validar que organizacao, caso, run, instalacao, usuario, perfil, conector e fatos pertencem ao mesmo tenant antes de escrever; APIs e regras dessa camada pertencem as tasks sucessoras.

## Entidades adiadas
O recorte aprovado adia explicitamente `HeuristicRule`, `HeuristicRuleVersion`, `CaseFlowCandidate`, `CaseFlowPlan`, `CaseFlowPlanNode`, `CaseFlowPlanTransition`, `ServiceFlowVersion`, `ServiceFlowNode`, `ServiceFlowTransition`, a evolucao CaseFlow de `ServiceFlowSessionStep` e `CompiledMessage`. Elas entram com as tasks de heuristica, compilacao de fluxo, execucao guiada e mensagens (`TASK-AT-238` em diante), quando seus contratos estiverem fechados. Nenhuma tabela placeholder foi criada.

## Reversao
A migration e aditiva. Para reverter em ambiente descartavel, primeiro anule `ServiceCase.primarySourceId`; depois remova, nesta ordem, `ConnectorHealthEvent`, `EvidenceConflict`, `EvidenceFact`, `ConnectorRun`, `ConnectorDefinition`, `CompanionInstallation`, `ServiceCaseSource` e `ServiceCase`. Em ambiente com dados, prefira uma migration compensatoria que arquive/exporte o ledger antes de remover tabelas; nao use cascade.

## Riscos de regressao
- SQLite nao aplica enums no banco; servicos sucessores devem validar estados com os contratos de `packages/shared`.
- A consistencia cruzada de `organizationId` e `browserProfileId` depende de validacao transacional na camada de servico.
- Alterar ou contornar o helper de JSON pode permitir payload sensivel; novos campos JSON devem ser adicionados a sua allowlist e cobertos por teste.
