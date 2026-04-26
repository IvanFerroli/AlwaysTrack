# TASK-MCH-001 - Score aliases e evidencia de titulo

## Metadata
- id: TASK-MCH-001
- titulo: Robustecer afinidade local para cards publicos curtos
- capability: job-matching
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-25
- source-of-truth: code + tests + user feedback

## Objetivo unico
Corrigir score baixo em vagas de plataforma com cards publicos curtos quando o titulo contem stacks fortes do profile, como `Node` e `React`.

## Problema observado
Uma vaga `Junior Full Stack Developer | Node and React` aparecia com 20% porque apenas `react` batia. O profile usava `node.js`, mas o token da vaga era `node`; a regra antiga exigia `node` e `js`.

## Escopo implementado
- Aliases tecnicos comuns no matcher (`node`/`node.js`/`nodejs`, `react`/`react.js`/`reactjs`, `next`, `typescript`/`ts`, `javascript`/`js`, `postgres`/`postgresql`).
- Boost de skill no titulo sem substring frouxa.
- Stopwords no boost de headline para evitar inflar `developer`, `engineer`, `senior`, `junior`, `main`, `cv`.
- Match e Strategy continuam usando a mesma rotina compartilhada.
- Dashboard passa a chamar o score de `afinidade local` e mostra skills encontradas por card.

## Fora de escopo
- Novo modelo semantico/embedding.
- Mudanca de contrato de `RankedJobPosting`.
- Deep Score LLM.

## Evidencia
- Teste novo: card publico curto `Junior Full Stack Developer | Node and React` com skills `node.js` e `react` pontua acima de 70.
- Teste novo: titulo generico `Senior Software Engineer` sem skill tecnica segue com score 0.

## Riscos remanescentes
- Aliases aumentam recall, mas precisam continuar pequenos para evitar falso positivo.
- Cards de plataforma com descricao incompleta ainda dependem principalmente do titulo.

## Proximo passo recomendado
Adicionar explicabilidade estruturada ao contrato de ranking se o usuario quiser ver breakdown numerico do score por card.
