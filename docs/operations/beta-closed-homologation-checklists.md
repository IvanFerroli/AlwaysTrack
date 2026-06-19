# Checklists de homologacao - Beta Fechado

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/operations/beta-closed-homologation-checklists.md

## Objetivo
Validar a experiencia de participantes controlados antes de apresentar ou ampliar o beta. Estes checklists complementam a matriz de permissoes e o runbook Tailscale.

## Checklist geral
- Banner "Ambiente Beta Fechado" visivel.
- Usuario fora da allowlist nao autentica.
- Usuario permitido autentica.
- Perfil abre e permite consultar identidade/notificacoes.
- Busca global nao retorna conteudo fora da role.
- Logout funciona.

## Beta SAC
### Deve conseguir
- Acessar Perfil.
- Acessar Avisos e marcar ciencia.
- Acessar Fluxos de Atendimento.
- Acessar Scriptoteca, copiar scripts, criar scripts pessoais e sugerir canonizacao.
- Acessar Wiki.
- Acessar FAQ, criar pergunta, comentar e reagir.
- Buscar Wiki, FAQ, Avisos, Scriptoteca e Fluxos.

### Nao deve conseguir
- Abrir Dashboard comercial.
- Abrir Notas/DANFEs.
- Abrir Ranking.
- Abrir Extratos.
- Governar Campanhas.
- Promover FAQ para Wiki.
- Aprovar/rejeitar Wiki.
- Acessar Usuarios/Times, Configuracoes ou Auditoria.
- Encontrar notas, vendedores, campanhas, ranking ou extratos na busca global.

## Beta Vendedor
### Deve conseguir
- Acessar Perfil.
- Acessar Wiki, FAQ, Avisos, Scriptoteca e Fluxos.
- Enviar DANFE.
- Ver suas proprias notas.
- Ver seu proprio desempenho no ranking.
- Ver seu proprio extrato.
- Receber notificacoes sobre suas notas/avisos.

### Nao deve conseguir
- Ver faturamento individual de outro vendedor.
- Filtrar ranking por outros vendedores.
- Aprovar/rejeitar nota.
- Governar campanhas.
- Acessar Usuarios/Times, Configuracoes ou Auditoria.
- Encontrar dados comerciais identificaveis de terceiros na busca.

## Beta Supervisor
### Deve conseguir
- Acompanhar dados do grupo supervisionado.
- Acessar Wiki, FAQ, Avisos, Scriptoteca e Fluxos.
- Moderar FAQ e acompanhar governanca de conhecimento quando aplicavel.

### Nao deve conseguir
- Aprovar/rejeitar notas durante o beta.
- Gerenciar campanhas durante o beta.
- Acessar Usuarios/Times ou Configuracoes.
- Acessar Auditoria.

## Beta Admin/Gestor/Financeiro
- ADMIN valida criacao/alteracao de usuarios, configuracoes, auditoria e acesso total.
- GESTOR valida campanhas e revisao operacional sem administrar usuarios.
- FINANCEIRO valida notas/extratos/revisao sem governar campanhas.

## Evidencias recomendadas
- Print do banner beta.
- Print da busca SAC sem dados comerciais.
- Print do vendedor vendo apenas proprio ranking/extrato.
- Print de tentativa bloqueada por role, quando houver tela de erro.
- Log de `npm run env:check` com beta-local e allowlist.
