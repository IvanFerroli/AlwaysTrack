# TASK-AT-426 - Anexos e compartilhamento estruturado na Comunicação

## Metadata
- status: proposed-phase-2
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-426-internal-communication-attachments-resource-sharing.md

## Modo
- mode: implementation
- priority: P2
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / Rich Content

## Origem documental
- Evolução prevista no contrato `TASK-AT-417` após o gate `TASK-AT-424`.

## Problema
URLs textuais não garantem preview autorizado, existência atual ou retenção segura. Anexos também exigem storage privado, antivírus, limites e lifecycle próprios.

## Objetivo único
Permitir anexar arquivos e compartilhar referências tipadas de recursos AlwaysTrack sem criar dependência de domínio ou vazar entidades inacessíveis.

## Contexto mínimo
O chat pode apontar para recursos existentes, mas o acesso continua pertencendo ao domínio alvo e deve ser revalidado no clique/download.

## Inputs
- MVP aprovado na `TASK-AT-424`.
- Storage/anexos operacionais e políticas de upload existentes.
- Catálogo de tipos/limites/retention aprovado.

## Escopo
1. Anexos de mensagem via contrato de storage privado e lifecycle auditável.
2. Referências tipadas a Fluxo, Scriptoteca, Wiki, FAQ e Aviso.
3. Resolver backend por tipo/id com fallback neutro e preview mínimo autorizado.
4. Download tenant/member-scoped e estado archived/removed.
5. Limites de tipo, tamanho, quota, malware scan e retenção.

## Fora de escopo
- Copiar conteúdo integral do recurso para a conversa.
- Upload público, streaming de vídeo ou galeria global.
- Replies, reações, edição e exclusão lógica.

## Arquivos ou domínios candidatos
- `services/api/src/core/attachments/`.
- `services/api/src/core/` — módulo futuro de Comunicação.
- `packages/shared/src/` — catálogo futuro de resource targets.
- `apps/web/src/views/` — integração futura na view de Comunicação.

## Requisitos funcionais
1. Mensagem pode ter anexo ou referência tipada sem exigir que chat importe o service do domínio alvo.
2. Preview é resolvido no acesso e degrada para item indisponível.
3. Arquivamento do recurso/anexo não corrompe histórico da mensagem.
4. Falha de upload não cria mensagem fantasma.

## Requisitos de permissão, tenant e auditoria
1. Upload/download exigem membership da conversa e tenant coincidente.
2. Referência só é criada se o ator puder acessar o recurso no momento do envio.
3. Destinatário sem permissão atual vê fallback sem metadata sensível.
4. Upload, archive e malware rejection são auditados sem conteúdo binário.

## Checklist de execução
1. Definir tipos, limites e targets.
2. Implementar upload/lifecycle/download autorizados.
3. Implementar resolver de recursos/fallback.
4. Integrar cards/anexos na Web.
5. Cobrir malware, quotas e anti-IDOR.

## Critérios de aceite
1. Anexo autorizado pode ser enviado, baixado e arquivado sem hard delete.
2. Cada tipo de recurso abre via resolver autorizado e fallback seguro.
3. Cross-tenant e sem permissão não vazam filename, título ou ID útil.
4. Comunicação continua independente da disponibilidade dos domínios referenciados.

## Testes esperados
- Upload/download/archive, malware fixture, quota e falha parcial.
- Resolver para cada tipo, recurso removido e permissão revogada.
- Anti-IDOR e content-disposition/MIME seguro.
- E2E de anexo e card de recurso; `git diff --check`.

## Riscos
- Anexo ampliar custo, superfície de malware e retenção LGPD.
- Preview resolver conteúdo cross-tenant por erro.

## Dependências
- satisfeitas: `OperationalAttachment`, storage privado e notification resolver como referências.
- em aberto: `TASK-AT-424` com GO; política humana de arquivo/quota/retenção.

## Blockers possíveis
- Política de malware/quota/retention ausente.
- Domínio alvo sem resolver autorizado suficiente.

## Definição de pronto
1. Contratos de anexo e recurso tipado com lifecycle seguro.
2. Testes de segurança/storage e fallback verdes.
3. Matriz de limites e retenção aprovada.

## Evidência esperada
- Matriz de tipos/limites/targets e resultados de malware/anti-IDOR.
- Roteiro de fallback para recurso arquivado.

## Próximo passo provável
`TASK-AT-427`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: implementar rich content sem acoplamento direto entre services.
- constraints: sem upload público e sem copiar conteúdo integral dos recursos.
