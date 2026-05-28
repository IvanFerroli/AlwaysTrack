# Task Roadmap

## Metadata
- status: active-transition
- owner: task-planner
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/ROADMAP.md

## Objetivo
Preservar o historico da V1 SyLembra ja entregue e orientar a transicao do repositorio AlwaysTrack para uma base limpa de template/beta.

## Trilha atual - transicao para template
1. Resolver P0 de higiene e seguranca apontados em `docs/operations/auditoria-estado-atual-template-2026-05-27.md`. Status: completed em `b74975c` e `8fb6957`.
2. Sincronizar intake, runbooks e roadmap com o runtime real. Status: completed. Commits: `b89fa06` (intake/runbooks), `bca395c` (env.example IA + adendos pos-V1), `EXEC-TMP-002` (status tasks + provider Gemini).
3. Definir fronteira do template: starter de licencas/compliance, base operacional generica ou produto AlwaysTrack ja rebrandado. Status: accepted em `docs/adr/ADR-002-fronteira-template-alwaystrack.md`.
4. Escolher contrato de producao para banco e storage antes de prometer beta fora de ambiente controlado. Status: accepted em `docs/adr/ADR-003-contrato-banco-producao.md` e `docs/adr/ADR-004-contrato-storage-producao.md`.
5. Parametrizar marca, seed, tenant publico e templates apos a decisao de fronteira. Status: in-progress. Seed e flush-local-demo ja usam env vars; FAQ publica sem fallback demo-org (EXEC-TMP-004); parametrizacao de APP_NAME/cookie por env pendente de task propria.
6. Validar em clone limpo com `npm install`, `npm run setup` e `npm run check`. Status: gate-passed (114 testes, exit 0 em EXEC-TMP-005). Clone limpo real pendente antes do beta externo.

## Historico SyLembra preservado
A lista abaixo documenta a ordem original de construcao do MVP. Ela nao deve ser usada como plano futuro sem cruzar com a trilha de transicao acima.

## Ordem recomendada
1. `TASK-DOC-001` intake e baseline de escopo.
2. `TASK-SCF-001` scaffold do monolito modular.
3. `TASK-SCF-002` base API, contratos e observabilidade.
4. `TASK-QLT-001` gates minimos de qualidade.
5. `TASK-DAT-001` schema Prisma completo inicial.
6. `TASK-DAT-002` indices, constraints e seed minimo.
7. `TASK-AUD-001` audit log transversal.
8. `TASK-AUT-001` login e sessao.
9. `TASK-AUT-002` roles e escopo de acesso.
10. `TASK-UX-001` app shell e navegacao.
11. `TASK-UX-002` componentes operacionais de UI.
12. `TASK-ORG-001` organizacoes, unidades e setores.
13. `TASK-USR-001` gestao de usuarios superiores.
14. `TASK-PRO-001` profissionais.
15. `TASK-LIC-001` tipos de licenca e licencas.
16. `TASK-LIC-002` motor de status e regras de vencimento.
17. `TASK-FIL-001` storage privado.
18. `TASK-FIL-002` upload tokens.
19. `TASK-FIL-003` tela publica de upload.
20. `TASK-FIL-004` validacao/recusa de documentos.
21. `TASK-NOT-001` templates e regras.
22. `TASK-NOT-002` scanner diario cria jobs.
23. `TASK-NOT-003` provider Meta WhatsApp.
24. `TASK-NOT-004` worker de envio e retentativas.
25. `TASK-NOT-005` webhook da Meta.
26. `TASK-FAQ-001` FAQ administravel.
27. `TASK-FAQ-002` fluxo `wa.me`.
28. `TASK-DSH-001` cards e metricas.
29. `TASK-DSH-002` filas operacionais.
30. `TASK-AUD-002` consulta administrativa de auditoria.
31. `TASK-RPT-001` camada de queries de relatorio.
32. `TASK-RPT-002` relatorios de vencidas/a vencer.
33. `TASK-RPT-003` relatorios por RT/setor/unidade.
34. `TASK-RPT-004` relatorios de documentos.
35. `TASK-RPT-005` relatorios de notificacao e regularizacao.
36. `TASK-RPT-006` exportacao CSV.
37. `TASK-DEP-001` ambiente local e secrets.
38. `TASK-DEP-002` deploy e jobs em producao.
39. `TASK-QLT-002` testes de dominio e integracao.
40. `TASK-QLT-003` E2E do fluxo principal.
41. `TASK-QLT-004` revisao LGPD/seguranca.
42. `TASK-REL-001` seed, demo e aceite final da V1.

## Polimento pos-aceite
43. `TASK-UX-003` header persistente, navegacao e breadcrumbs.
44. `TASK-UX-004` microcopy, ajuda contextual e acentuacao.
45. `TASK-UX-005` pagina Como usar e ajuda operacional.
46. `TASK-UX-006` polimento de labels, formularios e tabelas.
47. `TASK-UX-007` Como usar robusto e ajuda contextual linkada.
48. `TASK-BRD-001` aplicar favicon e identidade web da marca.
49. `TASK-UX-008` ajuda contextual complementar e Como usar intuitivo.
50. `TASK-UX-009` icones SVG intuitivos na navegacao.
51. `TASK-IMP-001` importacao CSV de profissionais e licencas.
52. `TASK-IMP-002` modelo Google Sheets nativo com dropdowns baseados no banco. Status: completed-mvp.
53. `TASK-IMP-003` OAuth Google por usuario para geracao de planilhas de importacao. Status: completed-mvp.
54. `TASK-NOT-006` escalonamento para RT/superior nos ultimos avisos.
55. `TASK-PAT-001` patches MVP: telefone em usuarios, datas BR, logo e envio manual de notificacoes. Status: completed.
56. `TASK-AI-001` analise automatica de documentos por OCR/IA. Status: completed-mvp.
57. `TASK-UX-010` edicao por formularios operacionais. Status: completed.

## Gate final
A V1 so fecha quando os 14 criterios de sucesso do documento central estiverem demonstraveis em ambiente de demo ou producao.

## Cobertura dos criterios de sucesso
- 1-2: `TASK-ORG-001`, `TASK-USR-001`, `TASK-AUT-001`, `TASK-AUT-002`
- 3: `TASK-PRO-001`, `TASK-LIC-001`
- 4: `TASK-LIC-002`
- 5: `TASK-NOT-001` ate `TASK-NOT-005`
- 6: `TASK-FIL-001` ate `TASK-FIL-003`
- 7: `TASK-FIL-004`
- 8: `TASK-AUD-001`, `TASK-AUD-002`
- 9: `TASK-DSH-001`, `TASK-DSH-002`
- 10: `TASK-RPT-001` ate `TASK-RPT-006`
- 11-12: `TASK-NOT-004`, `TASK-NOT-005`, `TASK-RPT-005`
- 13-14: `TASK-QLT-003`, `TASK-QLT-004`, `TASK-REL-001`
