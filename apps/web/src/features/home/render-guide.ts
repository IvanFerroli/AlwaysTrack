/**
 * Guide Page - Como usar o Olympus Climb
 * Documenta todas as funcionalidades e fluxos disponíveis
 */

import { globalStyles, renderHeader, renderBreadcrumb, renderFooter } from "../../core/styles.js";

interface GuidePageOptions {
  apiStatus: 'ok' | 'error';
  apiTime?: number;
}

export function renderGuidePage(opts: GuidePageOptions): string {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/' },
    { label: 'Como Usar' },
  ];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Como Usar - Olympus Climb</title>
  <style>${globalStyles}</style>
</head>
<body>
  <div class="page-container">
    ${renderHeader('Como usar o Olympus Climb', opts.apiStatus, opts.apiTime, '/guide')}
    ${renderBreadcrumb(breadcrumbs)}
    
    <main class="page-content">
      <div class="layout">
        <!-- Introduction -->
        <section class="panel">
          <h2>🎯 O que é o Olympus Climb?</h2>
          <p>
            <strong>Olympus Climb</strong> é uma plataforma de engenharia para:
          </p>
          <ul style="margin-left: 1rem;">
            <li><strong>Ingestão de oportunidades:</strong> Submeta job postings para análise e scoring automatizado</li>
            <li><strong>Análise de perfis:</strong> Crie e gerencie resume profiles para matching</li>
            <li><strong>Avaliação de CVs:</strong> Envie seu CV principal para análise de alinhamento com oportunidades</li>
            <li><strong>Aprovações:</strong> Gate humano para decisões importantes antes de execução</li>
            <li><strong>Rastreamento:</strong> Monitore aplicações, decisões e histórico de operações</li>
          </ul>
        </section>

        <!-- Dashboard Overview -->
        <section class="panel">
          <h2>📊 Dashboard (Página Inicial)</h2>
          <p><strong>URL:</strong> <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">/</code></p>
          
          <h3>O que você vê:</h3>
          <table>
            <thead>
              <tr>
                <th>Card</th>
                <th>Significado</th>
                <th>O que fazer</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Job Postings</strong></td>
                <td>Número total de job postings ingeridos</td>
                <td>Clique para ir ao Workspace e adicionar mais</td>
              </tr>
              <tr>
                <td><strong>Resume Profiles</strong></td>
                <td>Perfis de candidato criados</td>
                <td>Cada profile é usado para matching com jobs</td>
              </tr>
              <tr>
                <td><strong>Approvals Pending</strong></td>
                <td>Decisões aguardando aprovação manual</td>
                <td>Vá ao Workspace > Approval Queue para revisar</td>
              </tr>
              <tr>
                <td><strong>Applications</strong></td>
                <td>Aplicações enviadas para candidatos</td>
                <td>Monitore status em Workspace > Submitted Applications</td>
              </tr>
              <tr>
                <td><strong>Decisions</strong></td>
                <td>Decisões tomadas (aprovado/rejeitado)</td>
                <td>Revise o histórico e aprenda com padrões</td>
              </tr>
              <tr>
                <td><strong>Memory Entries</strong></td>
                <td>Histórico de operações e contexto</td>
                <td>Referência para troubleshooting</td>
              </tr>
            </tbody>
          </table>

          <p style="margin-top: 1rem;">
            <strong>Route Menu:</strong> Tabela de todas as rotas disponíveis (web + API) com métodos HTTP, URLs e descrições.
            Use para entender o que cada endpoint faz.
          </p>
        </section>

        <!-- Workspace -->
        <section class="panel">
          <h2>🛠️ Workspace (Centro Operacional)</h2>
          <p><strong>URL:</strong> <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">/workspace</code></p>
          
          <p>Este é o coração da operação. Todas as ações são feitas aqui.</p>

          <h3 style="margin-top: 1.5rem;">📝 1. Route Menu (Atalhos Rápidos)</h3>
          <p>
            Grid de botões clicáveis com links para:
          </p>
          <ul style="margin-left: 1rem;">
            <li>Rotas Web (/ | /workspace | /health | /guide)</li>
            <li>Endpoints da API (GET /jobs | POST /ingest | etc)</li>
          </ul>
          <p style="margin-top: 0.5rem; font-style: italic;">Dica: Clique em qualquer botão para abrir em nova aba.</p>

          <h3 style="margin-top: 1.5rem;">➕ 2. Ingest Job Posting (Formulário)</h3>
          <p>
            <strong>Para:</strong> Adicionar uma nova oportunidade para análise.
          </p>
          <table>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Descrição</th>
                <th>Exemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Title</strong></td>
                <td>Título da vaga</td>
                <td>Senior Software Engineer</td>
              </tr>
              <tr>
                <td><strong>Company</strong></td>
                <td>Nome da empresa</td>
                <td>Google</td>
              </tr>
              <tr>
                <td><strong>Level</strong></td>
                <td>Junior / Mid / Senior / Lead</td>
                <td>Senior</td>
              </tr>
              <tr>
                <td><strong>Tech Stack</strong></td>
                <td>Tecnologias (separadas por vírgula)</td>
                <td>TypeScript, React, Node.js</td>
              </tr>
              <tr>
                <td><strong>Description</strong></td>
                <td>Descrição da vaga (opcional)</td>
                <td>Build scalable APIs...</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            ✅ Resultado: Job é ingerido, scored automaticamente e adicionado ao histórico.
          </p>

          <h3 style="margin-top: 1.5rem;">👤 3. Create Resume Profile (Formulário)</h3>
          <p>
            <strong>Para:</strong> Criar um perfil de candidato para ser usado em matching.
          </p>
          <table>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Descrição</th>
                <th>Exemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Name</strong></td>
                <td>Nome do perfil / candidato</td>
                <td>Ivanilson Ferreira</td>
              </tr>
              <tr>
                <td><strong>Email</strong></td>
                <td>Email de contato</td>
                <td>ivan@example.com</td>
              </tr>
              <tr>
                <td><strong>Experience Level</strong></td>
                <td>Anos de experiência</td>
                <td>5+</td>
              </tr>
              <tr>
                <td><strong>Skills</strong></td>
                <td>Skills principais (separadas por vírgula)</td>
                <td>TypeScript, React, Node.js, AWS</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            ✅ Resultado: Profile é criado e usado para matching automático com jobs.
          </p>

          <h3 style="margin-top: 1.5rem;">📄 4. Main CV Analyzer (Formulário)</h3>
          <p>
            <strong>Para:</strong> Analisar seu CV principal contra oportunidades disponíveis.
          </p>
          <p style="color: #666;">
            <strong>Pré-requisito:</strong> Você deve ter um arquivo CV em <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">doc/</code>
          </p>
          <table>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>CV File</strong></td>
                <td>Selecione CV: EN-CV_IVANILSON_FERREIRA_2026.txt ou PT-CV_IVANILSON_FERREIRA_2026.txt</td>
              </tr>
              <tr>
                <td><strong>Analysis Type</strong></td>
                <td>quick | detailed | full (nível de análise desejado)</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            ✅ Resultado: Análise de alinhamento com jobs. Você vê % de match, skills faltantes, recomendações.
          </p>

          <h3 style="margin-top: 1.5rem;">📋 5. Recent Job Postings (Tabela)</h3>
          <p>
            Lista dos últimos jobs ingeridos com:
          </p>
          <ul style="margin-left: 1rem;">
            <li>ID do job</li>
            <li>Título e Company</li>
            <li>Score (qualidade/match da ingestão)</li>
            <li>Criado em (timestamp)</li>
          </ul>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            Clique em qualquer linha para ver detalhes completos (via API ou dashboard).
          </p>

          <h3 style="margin-top: 1.5rem;">✅ 6. Approval Queue (Tabela com Ações)</h3>
          <p>
            Decisões que precisam de aprovação manual antes de execução.
          </p>
          <table>
            <thead>
              <tr>
                <th>Coluna</th>
                <th>Significado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ID</strong></td>
                <td>ID único da aprovação</td>
                <td>-</td>
              </tr>
              <tr>
                <td><strong>Type</strong></td>
                <td>Tipo de decisão (match | reject | recommend)</td>
                <td>-</td>
              </tr>
              <tr>
                <td><strong>Profile + Job</strong></td>
                <td>Dados envolvidos</td>
                <td>-</td>
              </tr>
              <tr>
                <td><strong>Status</strong></td>
                <td>pending / approved / rejected</td>
                <td>-</td>
              </tr>
              <tr>
                <td><strong>Actions</strong></td>
                <td>Botões de controle</td>
                <td><strong>✓ Approve</strong> ou <strong>✗ Reject</strong></td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            🎯 Clique "Approve" ou "Reject" para tomar decisão. Sistema executará ação correspondente.
          </p>

          <h3 style="margin-top: 1.5rem;">📤 7. Submitted Applications (Tabela com Estado)</h3>
          <p>
            Rastreamento de todas as aplicações enviadas para candidatos.
          </p>
          <table>
            <thead>
              <tr>
                <th>Coluna</th>
                <th>Significado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ID</strong></td>
                <td>ID da aplicação</td>
              </tr>
              <tr>
                <td><strong>Candidate</strong></td>
                <td>Nome do candidato</td>
              </tr>
              <tr>
                <td><strong>Job Title</strong></td>
                <td>Título da vaga aplicada</td>
              </tr>
              <tr>
                <td><strong>Status</strong></td>
                <td>submitted → interview → rejected (máquina de estados)</td>
              </tr>
              <tr>
                <td><strong>Updated</strong></td>
                <td>Último update</td>
              </tr>
            </tbody>
          </table>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            Mudanças de status aparecem automaticamente quando eventos acontecem (novo feedback, rejeição, etc).
          </p>

          <h3 style="margin-top: 1.5rem;">💾 8. Memory Entries (Histórico)</h3>
          <p>
            Log de operações e contexto da plataforma. Útil para:
          </p>
          <ul style="margin-left: 1rem;">
            <li>Troubleshooting ("o que aconteceu com essa aplicação?")</li>
            <li>Auditoria (rastreabilidade de decisões)</li>
            <li>Aprendizado (padrões que funcionam)</li>
          </ul>

          <h3 style="margin-top: 1.5rem;">📊 9. Metrics Snapshot (KPIs)</h3>
          <p>
            Dashboard de métricas em tempo real:
          </p>
          <ul style="margin-left: 1rem;">
            <li><strong>Total Jobs:</strong> Jobs ingeridos até agora</li>
            <li><strong>Total Profiles:</strong> Perfis de candidatos criados</li>
            <li><strong>Avg Match Score:</strong> Score médio de matching</li>
            <li><strong>Approval Rate:</strong> % de aprovações vs rejeições</li>
            <li><strong>Processing Time:</strong> Tempo médio de processamento</li>
          </ul>
        </section>

        <!-- Health Check -->
        <section class="panel">
          <h2>❤️ Health Check</h2>
          <p><strong>URL:</strong> <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">/health</code></p>
          
          <p>
            Endpoint de diagnóstico da aplicação. Retorna JSON com:
          </p>
          <ul style="margin-left: 1rem;">
            <li><strong>status:</strong> "ok" ou "error"</li>
            <li><strong>timestamp:</strong> Quando foi checado</li>
            <li><strong>uptime:</strong> Tempo que a aplicação está rodando</li>
            <li><strong>api_health:</strong> Status da API externa</li>
          </ul>
          <p style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">
            Use para monitoramento e alertas.
          </p>
        </section>

        <!-- Workflow Examples -->
        <section class="panel">
          <h2>🔄 Workflows Comuns</h2>

          <h3 style="margin-top: 1.5rem;">Workflow 1: Adicionar Nova Oportunidade</h3>
          <ol style="margin-left: 1rem;">
            <li>Vá a <strong>/workspace</strong></li>
            <li>Preencha "Ingest Job Posting" com título, company, level, tech stack</li>
            <li>Clique "Ingest + Score"</li>
            <li>Veja em "Recent Job Postings" a nova vaga com score</li>
            <li>Sistema automaticamente tenta fazer matching com profiles existentes</li>
          </ol>

          <h3 style="margin-top: 1.5rem;">Workflow 2: Criar Novo Perfil de Candidato</h3>
          <ol style="margin-left: 1rem;">
            <li>Vá a <strong>/workspace</strong></li>
            <li>Preencha "Create Resume Profile" com nome, email, nível, skills</li>
            <li>Clique "Create Profile"</li>
            <li>Sistema automaticamente tenta fazer matching com jobs existentes</li>
            <li>Novas aprovações aparecem em "Approval Queue"</li>
          </ol>

          <h3 style="margin-top: 1.5rem;">Workflow 3: Revisar e Aprovar Decisões</h3>
          <ol style="margin-left: 1rem;">
            <li>Vá a <strong>/workspace</strong></li>
            <li>Procure "Approval Queue"</li>
            <li>Revise cada item (tipo de decisão, score, dados)</li>
            <li>Clique "✓ Approve" para aceitar ou "✗ Reject" para rejeitar</li>
            <li>Sistema executa ação (envia aplicação, registra rejeição, etc)</li>
            <li>Novo status aparece em "Submitted Applications"</li>
          </ol>

          <h3 style="margin-top: 1.5rem;">Workflow 4: Analisar CV Principal</h3>
          <ol style="margin-left: 1rem;">
            <li>Certifique que você tem CV em <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">doc/EN-CV_*.txt</code> ou <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">doc/PT-CV_*.txt</code></li>
            <li>Vá a <strong>/workspace</strong></li>
            <li>Preencha "Main CV Analyzer"</li>
            <li>Selecione arquivo CV e tipo de análise</li>
            <li>Clique "Analyze"</li>
            <li>Veja resultado com % match, skills faltantes, recomendações</li>
          </ol>
        </section>

        <!-- API Reference -->
        <section class="panel">
          <h2>🔌 API Reference Rápida</h2>

          <p>Consulte <strong><a href="/">Dashboard → Route Menu</a></strong> para a tabela completa com:</p>
          <ul style="margin-left: 1rem;">
            <li>Método HTTP (GET, POST, etc)</li>
            <li>URL do endpoint</li>
            <li>Descrição do que faz</li>
          </ul>

          <p style="margin-top: 1rem; padding: 0.5rem; background: #f0f0ff; border-left: 3px solid #0066cc;">
            <strong>Dica:</strong> Clique em qualquer rota do Route Menu para abrir direto no navegador (em nova aba).
          </p>
        </section>

        <!-- Tips & Tricks -->
        <section class="panel">
          <h2>💡 Dicas & Troubleshooting</h2>

          <h3 style="margin-top: 1rem;">❓ Status Vermelho na Aplicação?</h3>
          <p>Significa API está offline. Verifique:</p>
          <ul style="margin-left: 1rem;">
            <li>Se <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">npm run dev</code> está rodando na pasta <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">services/api</code></li>
            <li>Se URL da API em <code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">apps/web/src/config/env.ts</code> está correta</li>
            <li>Se não há firewall bloqueando a conexão</li>
          </ul>

          <h3 style="margin-top: 1rem;">❓ Forms não funcionam?</h3>
          <p>Verifique:</p>
          <ul style="margin-left: 1rem;">
            <li>Todos os campos obrigatórios estão preenchidos</li>
            <li>Console do navegador (F12) para ver erros JavaScript</li>
            <li>Se API está online (veja acima)</li>
          </ul>

          <h3 style="margin-top: 1rem;">❓ Onde está meu CV?</h3>
          <p>Arquivos CV devem estar em:</p>
          <ul style="margin-left: 1rem;">
            <li><code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">doc/EN-CV_IVANILSON_FERREIRA_2026.txt</code></li>
            <li><code style="background: #f0f0f0; padding: 0.25rem 0.5rem; border-radius: 2px;">doc/PT-CV_IVANILSON_FERREIRA_2026.txt</code></li>
          </ul>

          <h3 style="margin-top: 1rem;">❓ Como voltei para a página anterior?</h3>
          <p>Use o <strong>Header Navigation</strong> no topo:</p>
          <ul style="margin-left: 1rem;">
            <li><strong>Dashboard</strong> - volta para home</li>
            <li><strong>Workspace</strong> - vai para workbench</li>
            <li><strong>Health</strong> - verifica status</li>
            <li><strong>Como Usar</strong> - abre esta página</li>
          </ul>
        </section>

        <!-- Footer -->
        <section class="panel" style="background: #f9f9f9; border-top: 3px solid #0066cc;">
          <p style="text-align: center; color: #666; margin: 0;">
            <strong>📚 Documentação completa?</strong> Veja <code style="background: #fff; padding: 0.25rem 0.5rem; border-radius: 2px;">docs/README.md</code> no repositório.
          </p>
        </section>
      </div>
    </main>

    ${renderFooter()}
  </div>
</body>
</html>
  `;
}
