# ADR-002 - Fronteira do template AlwaysTrack

## Metadata
- status: accepted
- owner: task-planner
- last-updated: 2026-05-28
- source-of-truth: docs/adr/ADR-002-fronteira-template-alwaystrack.md

## Contexto
O repositorio AlwaysTrack nasceu a partir do MVP SyLembra. A auditoria em `docs/operations/auditoria-estado-atual-template-2026-05-27.md` concluiu que o codigo atual e um produto vertical de licencas/compliance, nao um scaffold SaaS generico pronto.

Sem uma fronteira explicita, ha risco de fazer rebrand amplo, remover dominio funcional ou prometer beta antes de limpar secrets, dados de instancia, docs antigas e contratos de producao.

## Decisao
A proxima etapa do AlwaysTrack sera tratada como **starter vertical de licencas/compliance**, preservando o dominio atual enquanto a base e saneada.

O trabalho imediato deve focar em:
- higiene de seguranca e remocao de artefatos locais;
- documentacao alinhada ao runtime real;
- parametrizacao gradual de marca, seed, tenant demo, integracoes e templates;
- validacao em clone limpo antes de beta.

Rebrand completo de pacotes, cookie, textos de UI, assets e nomes internos so deve ocorrer depois que a parametrizacao minima estiver definida.

## Alternativas consideradas
1. Template de pipeline agentico: manter apenas `docs/pipeline` e esqueletos documentais. Rejeitado porque descartaria o valor operacional ja implementado.
2. Starter SaaS organizacional generico: preservar auth, roles, auditoria e shell. Rejeitado por exigir refatoracao profunda de dominio antes de haver alvo beta claro.
3. Produto AlwaysTrack rebrandado imediatamente: rejeitado porque misturaria limpeza de instancia, rebrand e mudanca de escopo no mesmo ciclo.

## Consequencias
- positivas: reduz risco de quebrar o MVP funcional; cria caminho incremental para beta; mantem integracoes externas como modulos opcionais.
- negativas: o repositorio ainda tera nomes `@sylembra/*` e copy de dominio ate a fase de parametrizacao.
- trade-offs: velocidade de entrega e menor refatoracao agora em troca de uma etapa posterior de rebrand/extracao mais controlada.

## Impacto em artefatos
- specs relacionadas: n/a
- tasks relacionadas: `docs/tasks/ROADMAP.md`
- runbooks relacionados: `docs/runbooks/RUNBOOK-001-ambiente-local.md`, `docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md`

## Validacao e evidencia esperada
- validacao: `npm install`, `npm run setup` e `npm run check` em clone limpo.
- evidencia: auditoria atualizada, commits de saneamento no `origin/main` e roadmap apontando para a trilha de transicao.

## Fora de escopo
Esta ADR nao autoriza migrar banco, trocar storage, renomear workspaces, alterar dominio funcional ou remover features SyLembra. Essas mudancas precisam de tasks proprias.
