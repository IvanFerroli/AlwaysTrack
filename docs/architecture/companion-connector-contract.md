# Companion Connector Contract

## Metadata
- status: active
- owner: architecture-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-200

Cada sistema externo possui um `ConsultativeConnector` independente. O contrato reutiliza `ConnectorId`, `EvidenceFact`, chaves normalizadas e capabilities do pacote compartilhado; conectores nao criam tipos concorrentes nem declaram capability proibida como executavel.

## Ciclo
`probe` verifica disponibilidade sem buscar dados. `resolveApplicability` decide se executa, nao se aplica ou aguarda dependencias. `buildSearchPlan` produz passos e onda. `execute` opera com cancelamento e progresso. `normalize` converte somente o resultado minimo em fatos. `detectIntervention` reconhece login, captcha, 2FA, drift e pagina inesperada. `healthCheck` reporta saude sem bloquear outros conectores.

Estados canonicos vao de `QUEUED` a `CANCELLED`, incluindo progresso, parcial, not found, bloqueios e falhas tipadas. Falha isolada nunca muda o caso para `FAILED`; fatos ja normalizados e resultados dos demais permanecem disponiveis.

## Declaracao obrigatoria
- dominios explicitos e risco;
- chaves aceitas e campos extraidos;
- capabilities consultivas/condicionadas;
- capabilities proibidas declaradas nominalmente, sem entrada no plano executavel;
- versao do conector e dos seletores;
- seletores primarios e fallback na ordem de estabilidade da SPEC;
- detector de pagina inesperada;
- fixtures sanitizadas e cenarios de parser;
- data da ultima validacao e health.

Fixtures nao contem cookie, senha, token, HTML real identificavel ou dados pessoais. Resultado vazio de uma fonte e `NOT_FOUND`, nunca inferencia global de inexistencia. Cache, timeout e concorrencia pertencem ao Host e nao podem alterar o significado do resultado.

As chaves minimas usam `EvidenceKey`. Extensoes futuras usam `CustomEvidenceKey` nominal, criado apenas por `customEvidenceKey` com namespace `custom.*` ou `connector.*`; strings arbitrarias continuam rejeitadas pelo contrato.
