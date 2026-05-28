# Aceite final V1 - demo

## Ambiente de demo
- Seed: `npm run prisma:seed`
- Login admin: `admin@example.com` / valor impresso pelo seed ou `SEED_ADMIN_PASSWORD`
- Login RT: `rt@example.com` / valor impresso pelo seed ou `SEED_RT_PASSWORD`
- Login supervisor: `supervisor@example.com` / valor impresso pelo seed ou `SEED_SUPERVISOR_PASSWORD`
- Provider de notificacao: `fake` ate a chave Meta real ser preenchida.
- Link magico de demo: `/upload/<token-impresso-pelo-seed>` ou `SEED_UPLOAD_TOKEN`

## Roteiro curto
1. Entrar como admin e confirmar organizacao, unidade, setor e usuarios.
2. Abrir profissionais/licencas e mostrar os cenarios `REGULAR`, `EXPIRING` e `EXPIRED`.
3. Abrir dashboard e confirmar pendencias, vencidas, a vencer, documentos e falhas de notificacao.
4. Abrir relatorios e exportar CSV de vencidas, a vencer, documentos, notificacoes e regularizacao.
5. Abrir notificacoes e confirmar template, regra, job enviado fake e job com falha visivel.
6. Abrir `/upload/<token-impresso-pelo-seed>`, enviar um PDF/imagem pequeno e confirmar consumo do link.
7. Entrar como RT, validar ou recusar documento pendente.
8. Abrir auditoria e confirmar eventos de seed, upload publico, aprovacao/recusa e alteracoes operacionais.
9. Confirmar que a operacao usa banco/app como fonte principal, sem planilha manual.

## Checklist dos 14 criterios
1. Admin cadastra organizacao, unidade e setor: demonstravel via dados seedados e telas administrativas.
2. Admin cadastra usuarios superiores: demonstravel com admin, RT e supervisor seedados.
3. Admin/RT cadastra profissionais e licencas: demonstravel em profissionais/licencas e fluxo de RT escopado.
4. Sistema calcula regular, a vencer ou vencido: demonstravel com licencas `REGULAR`, `EXPIRING`, `EXPIRED`.
5. Profissional recebe WhatsApp oficial: contrato implementado com Meta provider; demo usa provider `fake` ate credenciais reais.
6. Profissional envia documento por link magico: demonstravel com o token impresso pelo seed.
7. RT/Admin valida ou recusa documento: demonstravel com documento pendente seedado.
8. Sistema mantem historico/auditoria: demonstravel na tela de auditoria e eventos seedados.
9. Dashboard mostra situacao geral e pendencias: demonstravel com dados mistos no seed.
10. Relatorios mostram vencidos, a vencer, validacoes e notificacoes: demonstravel nas telas e CSV.
11. Notificacoes ficam registradas com status: demonstravel com jobs `SENT` e `FAILED`.
12. Falhas de envio ficam visiveis: demonstravel com job `FAILED`.
13. Operacao acontece sem planilha manual como fonte principal: demonstravel pelo CRUD/relatorios no banco.
14. Sistema apresentado e real, nao prototipo descartavel: demonstravel pela mesma API/web/seed usados no app.

## Gaps
- Bloqueador: nenhum gap tecnico identificado para demo com provider fake.
- Pendente externo: preencher credenciais Meta reais para smoke de envio oficial.
- Pos-V1: E2E browser completo, logger estruturado com redacao e parecer juridico LGPD formal.

## Adendo pos-aceite V1 (2026-05-28)
As seguintes superficies externas foram adicionadas ao codigo apos o fechamento deste aceite:
- Google Sheets nativo via Service Account e OAuth por usuario (`TASK-IMP-002`, `TASK-IMP-003`) — commits `8391266`, `6dca974`.
- Provider Gemini para analise de documentos por IA (`TASK-AI-001`) — commit 2026-05-05.
- Audit log de `revokedRemotely` no disconnect Google OAuth — commit `3f47743`.
- Endurecimento do callback OAuth com validacao de `event.origin` e revogacao remota de refresh token.

Essas superficies nao foram cobertas pelo roteiro original e devem ser incluidas em um roteiro de aceite atualizado antes de qualquer beta externo.

## Evidencias esperadas
- `npm run check`
- `npm run prisma:seed`
- Screenshot/check manual do roteiro quando a demo for executada.
