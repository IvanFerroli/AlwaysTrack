/**
 * Guide Page - current usage guide for Olympus Climb local alpha.
 */

import { headAssets, renderBreadcrumb, renderFooter, renderHeader, renderInfoIcon } from "../../core/styles.js";

interface GuidePageOptions {
  apiStatus: "ok" | "error";
  apiTime?: number;
}

export function renderGuidePage(opts: GuidePageOptions): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Como Usar - Olympus Climb</title>
  ${headAssets}
</head>
<body>
  <div class="page-container">
    ${renderHeader("Como usar", opts.apiStatus, opts.apiTime, "/guide")}
    ${renderBreadcrumb([{ label: "Dashboard", href: "/" }, { label: "Como usar" }])}
    <main class="page-content">
      <div class="layout">
        <section class="panel">
          <div class="section-header">
            <div>
              <h2>O que já dá para fazer</h2>
              <p class="subtle">Este guia descreve o estado implementado do alpha local em memória.</p>
            </div>
            ${renderInfoIcon("A fonte runtime é o código atual; docs históricas podem conter registros antigos")}
          </div>
          <div class="cards">
            <div class="metric-card"><strong>Scraper</strong><span class="subtle">Busca vagas em Remotive, Arbeitnow, RemoteOK, Jobicy, Himalayas e CryptoJobsList.</span></div>
            <div class="metric-card"><strong>Matching</strong><span class="subtle">Ranqueia vagas por overlap de skills e permite Deep Score com Gemini.</span></div>
            <div class="metric-card"><strong>CV/Profile</strong><span class="subtle">Cria resume profiles manualmente ou a partir de arquivos .txt em doc/.</span></div>
            <div class="metric-card"><strong>Gate humano</strong><span class="subtle">Estratégia abre approvals antes de registrar aplicação.</span></div>
          </div>
        </section>

        <section class="panel">
          <div class="section-header"><h2>Como rodar localmente</h2>${renderInfoIcon("Use a raiz do monorepo")}</div>
          <ol class="stack">
            <li>Rode <code>npm run dev</code> na raiz do projeto.</li>
            <li>Abra <code>http://localhost:3000/</code> para o Dashboard.</li>
            <li>A API fica em <code>http://localhost:3001</code>.</li>
            <li>Use <code>npm run check</code> antes de considerar um ciclo saudável.</li>
          </ol>
          <p class="subtle">Por padrão os servidores fazem bind local. Se precisar expor na rede, defina <code>HOST</code> conscientemente.</p>
        </section>

        <section class="panel">
          <div class="section-header"><h2>Rotas web</h2>${renderInfoIcon("Rotas servidas pelo app web")}</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Rota</th><th>Uso</th></tr></thead>
              <tbody>
                <tr><td><code>GET /</code></td><td>Dashboard, índice de rotas e vagas ranqueadas com filtros.</td></tr>
                <tr><td><code>GET /workspace</code></td><td>Workbench operacional para ingest manual, profiles, CV analyzer, approvals e aplicações.</td></tr>
                <tr><td><code>GET /guide</code></td><td>Esta página de uso.</td></tr>
                <tr><td><code>GET /health</code></td><td>JSON de health do web + API.</td></tr>
                <tr><td><code>POST /ingest</code></td><td>Form action para criar vaga manual e rodar score/strategy.</td></tr>
                <tr><td><code>POST /resume-profiles</code></td><td>Form action para criar profile manual.</td></tr>
                <tr><td><code>POST /main-cv/analyze</code></td><td>Form action para gerar profile a partir de CV .txt.</td></tr>
                <tr><td><code>POST /approve</code> / <code>POST /reject</code></td><td>Form actions para o gate humano.</td></tr>
                <tr><td><code>POST /applications/status</code></td><td>Form action para atualizar aplicação para interview/rejected.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel">
          <div class="section-header"><h2>Fluxo recomendado</h2>${renderInfoIcon("Caminho feliz para testar o produto atual")}</div>
          <ol class="stack">
            <li>Comece no <a class="route-btn" href="/">Dashboard</a> e rode o scraper com uma keyword opcional.</li>
            <li>Abra o <a class="route-btn" href="/workspace">Workspace</a> e confira/crie um resume profile.</li>
            <li>Volte ao Dashboard para filtrar vagas por score, fonte, local e status.</li>
            <li>Use tags/status para organizar vagas manualmente.</li>
            <li>Use Deep Score quando quiser análise LLM; requer <code>GEMINI_API_KEY</code>.</li>
            <li>Para uma vaga específica, use o formulário de ingest manual no Workspace.</li>
            <li>Revise approvals e registre aplicações/status no Workspace.</li>
          </ol>
        </section>

        <section class="panel">
          <div class="section-header"><h2>CV e dados</h2>${renderInfoIcon("Estado atual ainda é local e volátil")}</div>
          <ul class="stack">
            <li>O CV analyzer lista somente arquivos <code>.txt</code> dentro de <code>doc/</code>.</li>
            <li>Sem <code>GEMINI_API_KEY</code>, a extração usa parser local de linhas de stack/skills.</li>
            <li>Com <code>GEMINI_API_KEY</code>, partes do CV são enviadas ao provedor externo para extração.</li>
            <li>O estado de vagas, profiles e aplicações fica em memória; reiniciar a API limpa o runtime não persistido.</li>
          </ul>
        </section>

        <section class="panel">
          <div class="section-header"><h2>Validação rápida</h2>${renderInfoIcon("Checklist antes de abrir outra frente")}</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Comando/rota</th><th>Resultado esperado</th></tr></thead>
              <tbody>
                <tr><td><code>npm run check</code></td><td>Lint, typecheck e testes verdes.</td></tr>
                <tr><td><code>GET /health</code></td><td>JSON com web ok e API ok/degraded conforme disponibilidade.</td></tr>
                <tr><td><code>GET /v1/metrics</code></td><td>Snapshot de métricas da API.</td></tr>
                <tr><td><code>POST /v1/scraper/run</code></td><td>Resumo de fontes, vagas ingeridas/deduplicadas e erros por fonte.</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
    ${renderFooter()}
  </div>
</body>
</html>`;
}
