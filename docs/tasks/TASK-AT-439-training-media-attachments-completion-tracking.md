# TASK-AT-439 - Mídia, materiais e tracking de conclusão

## Metadata
- status: proposed-phase-2
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-439-training-media-attachments-completion-tracking.md

## Modo
- mode: implementation
- priority: P2
- generation-mode: initiative-breakdown

## Capability
Training / Media

## Origem documental
- Evolução de `VIDEO_LINK`/`MATERIAL_LINK` da `TASK-AT-433` após `TASK-AT-437`.

## Problema
Link + confirmação cobre o MVP, mas não comprova acesso, progresso ou conclusão real de vídeo/material e pode quebrar fora do controle do tenant.

## Objetivo único
Adicionar lifecycle governado de mídia/material e tracking honesto de conclusão, sem alegar aprendizado com base apenas em playback.

## Contexto mínimo
Tracking de consumo é evidência de interação, não de compreensão; avaliação continua em cenário/questão.

## Inputs
- Storage privado e `OperationalAttachment`.
- Item types e progresso da `TASK-AT-433`/`434`.
- Decisão humana de provider, limites e evidência de consumo.

## Escopo
1. Escolher provider/link autenticado/upload privado via ADR curto.
2. Anexar material versionado a TrainingProgramVersion.
3. Player/download autorizado e progresso por checkpoints/eventos idempotentes.
4. Critério de conclusão explícito por tipo e fallback manual auditado.
5. Arquivamento, retenção, quota, malware scan e indisponibilidade.

## Fora de escopo
- DRM forte, live streaming, edição/transcodificação própria complexa.
- Inferir aprovação ou compreensão apenas pelo tempo assistido.
- Hospedar conteúdo público.

## Arquivos ou domínios candidatos
- `docs/adr/` — ADR futuro do provider de mídia.
- `services/api/src/core/` — módulo futuro de mídia de Treinamento.
- `services/api/src/core/attachments/`.
- `apps/web/src/views/` — integração futura na jornada do aluno.

## Requisitos funcionais
1. Material pertence à versão publicada ou snapshot equivalente.
2. Progresso suporta retry/múltiplas abas sem ultrapassar 100%.
3. Arquivo/provider indisponível mostra fallback e não conclui silenciosamente.
4. Completion event não substitui score/feedback avaliativo.
5. Nova mídia exige nova versão do programa.

## Requisitos de permissão, tenant e auditoria
1. Upload/download/player exigem enrollment/permission e tenant.
2. URL assinada possui TTL e não revela storage key.
3. Logs guardam checkpoints agregados, não hábitos detalhados além da policy.
4. Override manual exige motivo e auditoria.

## Checklist de execução
1. Aprovar ADR/provider/limites.
2. Implementar storage/model/lifecycle.
3. Implementar player/download e eventos idempotentes.
4. Integrar progresso/conclusão/fallback.
5. Cobrir segurança, carga e privacidade.

## Critérios de aceite
1. Vídeo/material versionado pode ser acessado e retomado pelo usuário autorizado.
2. Tracking é idempotente, limitado e descrito como consumo, não domínio.
3. Cross-tenant/URL expirada/provider indisponível fecham com segurança.
4. Upload passa por limites, validação e malware policy.

## Testes esperados
- Upload/download/signed URL, MIME, quota, malware e archive.
- Checkpoints reorder/duplicate/múltiplas abas e provider failure.
- Anti-IDOR, retenção e Web player accessibility.
- Carga de mídia fora da API quando aplicável e `git diff --check`.

## Riscos
- Custo de storage/egress e superfície de malware.
- Tracking invasivo ou usado como proxy indevido de aprendizado.

## Dependências
- satisfeitas: storage privado e anexos operacionais existentes.
- em aberto: `TASK-AT-437` com GO; provider/limites/retenção aprovados.

## Blockers possíveis
- Provider/contrato de vídeo não definido.
- Política de privacidade/retention de eventos de consumo ausente.

## Definição de pronto
1. ADR/provider, lifecycle, player/download e tracking entregues.
2. Security/privacy/load tests possuem evidência adequada.
3. Documentação distingue consumo, conclusão e aprovação.

## Evidência esperada
- Matriz provider/tipo/limite/retention e testes de falha.
- Roteiro de retomada e conclusão sem dados reais.

## Próximo passo provável
Follow-up somente após observar uso/custo do piloto.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: iniciar pela decisão de provider e manter avaliação separada.
- constraints: sem DRM/live complexo e sem inferir aprendizagem por playback.
