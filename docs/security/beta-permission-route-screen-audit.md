# Auditoria de rotas e telas - Beta Fechado por Permissoes

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/security/beta-permission-route-screen-audit.md

## Objetivo
Registrar a conferência entre matriz beta, rotas backend, telas frontend, busca global e escopo de dados. Este documento acompanha `docs/security/commercial-permission-matrix.md` e deve ser revisado sempre que uma nova tela ou endpoint entrar no produto.

## Regra principal
A UI pode esconder atalhos, mas a API precisa bloquear de verdade. Busca global e serviços internos também devem respeitar role e escopo.

## Rotas comerciais
| Superficie | Rotas | Roles beta | Observacao |
| --- | --- | --- | --- |
| Dashboard comercial | `/v1/sales/dashboard`, `/v1/sales/dashboard.csv` | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | SAC nao acessa dados comerciais. |
| Central Hoje | `/v1/operations/today` | Todas comerciais | SAC recebe somente conhecimento, avisos, FAQ e notificacoes. |
| Notas/DANFEs | `/v1/sales/documents*` | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | Escrita/revisao limitada por rota e servico. |
| Revisao de notas | `/v1/sales/documents/:id/review`, `/manual-correction` | ADMIN, GESTOR, FINANCEIRO | SAC e SUPERVISOR bloqueados no beta. |
| Campanhas | `/v1/sales/campaigns*` | Leitura: roles comerciais com acesso a vendas. Gestao: ADMIN, GESTOR | SUPERVISOR acompanha; nao governa. |
| Ranking | `/v1/sales/ranking*` | ADMIN, GESTOR, VENDEDOR, SUPERVISOR | VENDEDOR escopado ao proprio perfil. |
| Extratos | `/v1/sales/statements*` | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | VENDEDOR escopado ao proprio perfil. |

## Rotas de conhecimento e atendimento
| Superficie | Rotas | Roles beta | Observacao |
| --- | --- | --- | --- |
| Wiki | `/v1/wiki*` | Todas comerciais | Governanca superior conforme handlers existentes. |
| FAQ | `/v1/faq/threads*` | Todas comerciais | SAC pode criar/comentar/reagir; moderacao/promocao fica em ADMIN/GESTOR/SUPERVISOR. |
| Avisos | `/v1/announcements*` | Leitura: todas comerciais. Gestao: ADMIN/GESTOR | SAC e vendedor leem conforme targeting. |
| Scriptoteca | `/v1/script-library*` | Leitura/copia/pessoais: todas comerciais. Gestao: ADMIN/GESTOR | SAC pode criar pessoal e sugerir canonizacao. |
| Fluxos | `/v1/service-flows*` | Uso: todas comerciais. Gestao: ADMIN/GESTOR | Atendimento guiado liberado para SAC. |
| Perfil/notificacoes | `/v1/profile`, `/v1/in-app-notifications*` | Todas comerciais | Escopo do proprio usuario. |

## Rotas administrativas
| Superficie | Rotas | Roles beta | Observacao |
| --- | --- | --- | --- |
| Usuarios/Times | `/v1/users*`, `/v1/commercial-user-options` | ADMIN | Criacao/alteracao centralizada no beta. |
| Configuracoes | `/v1/organization*` | ADMIN | Inclui defaults e configuracoes sensiveis. |
| Auditoria/diagnosticos | `/v1/audit-logs`, `/v1/diagnostics*` | ADMIN | SAC sem acesso. |
| Integracoes Google | `/v1/integrations/google*` | ADMIN | Fora de escopo de participantes externos. |

## Telas frontend
| Tela | Roles visiveis no beta | Observacao |
| --- | --- | --- |
| Dashboard | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | SAC nao ve atalho. |
| Perfil | Todas comerciais | Segunda posicao no menu lateral quando visivel. |
| Notas | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | Acoes de revisao dependem de `sales.review`. |
| Ranking | ADMIN, GESTOR, VENDEDOR, SUPERVISOR | Filtro de vendedor so ADMIN/GESTOR. |
| Campanhas | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | Gestao so ADMIN/GESTOR. |
| Extratos | ADMIN, GESTOR, FINANCEIRO, VENDEDOR, SUPERVISOR | VENDEDOR ve proprio escopo. |
| Avisos, Fluxos, Scriptoteca, Wiki, FAQ | Todas comerciais | Nucleo do beta SAC. |
| Usuarios/Times, Configuracoes, Auditoria | ADMIN | Bloqueio tambem no backend. |

## Busca global
- SAC: retorna apenas Wiki, FAQ, Avisos, Scriptoteca e Fluxos quando indexados.
- VENDEDOR: retorna conhecimento e dados comerciais do proprio vendedor.
- SUPERVISOR: retorna conhecimento e dados do grupo supervisionado.
- ADMIN/GESTOR/FINANCEIRO: retornos conforme permissao comercial e escopo.

## Riscos residuais
- Campanhas ainda podem aparecer para roles com leitura comercial; se a homologacao pedir ocultar para vendedor/financeiro, ajustar `campaign.read`.
- Rotas legadas SyLembra continuam opt-in por `ENABLE_LEGACY_SYLEMBRA`.
- Novas telas precisam ser adicionadas a este documento antes de entrar no beta.
