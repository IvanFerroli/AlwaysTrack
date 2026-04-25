# RUNBOOK Surface

## Objetivo
Padronizar procedimentos operacionais repetiveis com passos verificaveis e evidencia.

## Quando usar
- rotina operacional recorrente;
- validacao de entrega;
- troubleshooting ou resposta a incidente.

## Convencao minima
- ID: `RUNBOOK-###`
- Arquivo por runbook: `RUNBOOK-###-<slug>.md`
- Base inicial: `docs/runbooks/_template.md`

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Fora de escopo
- spec de arquitetura;
- task manifest;
- texto narrativo sem passos operacionais.

## Navegacao operacional atual
- iniciar em `GET /` para visualizar dashboard, rotas e ranking de vagas.
- usar `GET /workspace` para executar fluxos operacionais: ingest manual, profiles, CV analyzer, approvals, applications, memory e metrics.
- usar `GET /guide` para instrucoes de uso atualizadas.
- usar `GET /health` para verificar web/API.

## Validacao local padrao
1. Encerrar processos antigos se necessario: `fuser -k 3000/tcp 3001/tcp 2>/dev/null`.
2. Rodar gates: `npm run check`.
3. Subir runtime: `npm run dev`.
4. Abrir `http://localhost:3000/`.
5. Conferir `http://localhost:3001/health` e `http://localhost:3001/v1/metrics`.

## Observacoes de runtime
- O estado atual e em memoria; reiniciar a API limpa dados runtime nao persistidos.
- `npm run dev` usa `src/` via `tsx`.
- `npm run start:*` usa `dist/`; rode `npm run build` antes de usar start.
- Deep Score e CV parsing LLM dependem de `GEMINI_API_KEY` local.
- Servidores fazem bind em `127.0.0.1` por padrao; ajuste `HOST` apenas se quiser expor conscientemente.
