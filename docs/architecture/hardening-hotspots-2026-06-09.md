# Hardening Hotspots - 2026-06-09

## Metadata
- status: active
- owner: maintainability-maintainers
- related-task: TASK-AT-054

## Metodo
- Tamanho por `wc -l`.
- Churn aproximado por arquivos tocados nos ultimos 14 dias.
- Prioridade considera tamanho, churn, impacto operacional e risco de regressao.

## Top hotspots por tamanho
| Arquivo | Linhas | Risco |
| --- | ---: | --- |
| `apps/web/src/main.tsx` | 8265 | UI e logica operacional concentradas demais. |
| `services/api/src/core/sales-documents/sales-documents.service.ts` | 1296 | Fluxo critico DANFE/review/ranking. |
| `services/api/src/core/notifications/notifications.service.ts` | 837 | Mistura legado provider e in-app notifications. |
| `services/api/src/core/wiki/wiki.service.ts` | 775 | Wiki, revisoes, presenca e anexos no mesmo service. |
| `services/api/src/core/faq/faq.service.ts` | 658 | FAQ legado e threads novas juntos. |
| `services/api/src/app.ts` | 382 | Registro de rotas crescendo sem agrupamento por dominio. |

## Top hotspots por churn recente
| Arquivo | Toques recentes | Observacao |
| --- | ---: | --- |
| `apps/web/src/main.tsx` | 25 | Principal alvo para extracao por dominios. |
| `apps/web/src/styles.css` | 12 | Estilos globais podem virar gargalo visual. |
| `services/api/src/app.ts` | 10 | Rotas precisam agrupamento gradual. |
| `services/api/src/core/wiki/wiki.service.ts` | 9 | Separar comandos/revisoes/anexos quando houver cobertura e2e. |
| `services/api/src/core/sales-documents/sales-documents.service.ts` | 8 | Separar extracao, review e ranking por queries/commands. |

## Sequencia recomendada
1. Extrair cliente API tipado e hooks simples de `apps/web/src/main.tsx`.
2. Extrair views por dominio: Notes, Ranking, Campaigns, Statements, Wiki, FAQ, Users e Notifications.
3. Agrupar rotas de `services/api/src/app.ts` por router de dominio.
4. Separar `sales-documents.service.ts` em upload/extraction/review/ranking/statements.
5. Separar notificacoes in-app do legado Meta/WhatsApp.
6. Isolar legado SyLembra em modulo `legacy` ou remover quando nao houver uso.

## Guardrails
- Cada extracao deve manter `npm run check` verde.
- Mudanca de UI deve rodar Playwright quando as dependencias de SO estiverem disponiveis.
- Nao criar abstracao compartilhada antes de dois dominios realmente usarem.
