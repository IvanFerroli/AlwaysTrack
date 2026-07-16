# Guia de apresentação do AlwaysTrack

## Metadata
- status: active
- owner: product-demo
- last-updated: 2026-07-16
- source-of-truth: docs/demo/guia-apresentacao-alwaystrack.md

## Objetivo da apresentação

Apresentar o AlwaysTrack como uma plataforma interna que conecta três necessidades da operação:

1. transformar documentos comerciais em vendas, ranking e extratos rastreáveis;
2. transformar procedimentos e respostas do SAC em atendimento guiado e conhecimento governado;
3. dar à TI contratos, segurança, testes, observabilidade e caminhos controlados de evolução.

**Mensagem de abertura sugerida:**

> O AlwaysTrack organiza a operação em torno de evidência. Uma nota aprovada passa a sustentar ranking e extrato; uma dúvida recorrente vira conhecimento governado; e um atendimento complexo vira um caminho guiado, sem retirar do operador a decisão final.

## Preparação rápida

1. Na raiz do projeto, executar `npm run up`.
2. Confirmar o Hub em `http://localhost:4173` e a aplicação em `http://localhost:5173`.
3. Entrar como `admin@example.com`, usando a senha local exibida pelo setup.
4. Usar somente dados fictícios do seed; não abrir sistemas ou credenciais reais.
5. No Hub, confirmar serviços saudáveis e relatórios disponíveis antes de começar.

## Roteiro recomendado — 15 minutos

| Tempo | Tema | O que mostrar | Mensagem principal |
| --- | --- | --- | --- |
| 1 min | Visão geral | Hub > Visão geral | Produto, arquitetura e evidências estão reunidos em uma superfície. |
| 3 min | Operação comercial | Dashboard, Nota pendente e Ranking > Explicar | A venda só entra nos resultados depois de revisão e mantém lastro documental. |
| 2 min | Campanhas e Extratos | Snapshot de campanha, consolidação e export | Ranking e financeiro usam os mesmos dados aprovados e filtros reproduzíveis. |
| 5 min | SAC e CaseFlow | Fluxos > piloto de saúde, ficha mínima, decisões e Scriptoteca | O atendente recebe orientação no momento certo, sem preencher um segundo sistema. |
| 2 min | Conhecimento e governança | FAQ promovida para Wiki, Auditoria e permissões | Conhecimento, alteração e ação sensível têm autoria e histórico. |
| 2 min | TI | Hub > Qualidade, Operação, Evolução e Documentação | A solução possui gates técnicos e deixa explícito o que ainda depende do ambiente alvo. |

## Módulos do produto

### Base e operação comercial

| Módulo | Resolve o quê | Como foi arquiteturado | O que mostrar |
| --- | --- | --- | --- |
| Dashboard | Reúne o estado operacional do dia e reduz procura entre telas. | Agrega indicadores e filas da API, mantendo os cards ligados às ações de origem. | Clicar em uma nota pendente ou alerta para provar que o painel não é decorativo. |
| Perfil | Centraliza identidade e preferências pessoais. | Sessão autenticada e atualização limitada ao próprio usuário. | Nome, identidade e preferências de notificação. |
| Notas | Recebe DANFEs, extrai dados, permite revisão e evita duplicidade. | Extração determinística de XML/PDF textual antes de qualquer fallback; revisão e timeline auditadas. | Abrir uma nota pendente, diagnóstico, timeline e decisão de revisão. |
| Ranking | Explica posições com base apenas em documentos aprovados. | Usa o mesmo contrato de filtros e escopo comercial; cada total pode ser decomposto por nota. | Abrir `Explicar` em um vendedor e mostrar documentos, ticket e total. |
| Campanhas | Define período, escopo e métrica das disputas comerciais. | Campanhas versionam regras e snapshots congelam uma fotografia comparável do ranking. | Campanha ativa e comparação entre snapshots. |
| Extratos | Consolida o resultado por vendedor e grupo para conferência. | Reutiliza a fonte de notas aprovadas e exporta com metadados dos filtros. | Alternar visão geral/grupo/vendedor e mostrar o CSV. |

### SAC e conhecimento

| Módulo | Resolve o quê | Como foi arquiteturado | O que mostrar |
| --- | --- | --- | --- |
| Avisos | Distribui comunicados internos com leitura e segmentação. | Conteúdo governado, notificações deduplicadas e links contextuais. | Aviso ativo, público-alvo e estado de leitura. |
| Fluxos | Conduz procedimentos longos sem depender de memória individual. | Grafo versionado com decisões auditadas; só o caminho escolhido é materializado. A ficha fixa contém apenas nome, CPF e produtos. | Iniciar o fluxo `Problema de saúde após suplemento — devolução, troca ou estorno`, preencher a ficha mínima e avançar por decisões. |
| Scriptoteca | Padroniza mensagens sem automatizar o envio ao cliente. | Scripts versionados com tags, placeholders seguros, vínculo com etapas e cópia auditada. | Abrir uma mensagem do fluxo, mostrar o preenchimento por dados do caso e copiar. |
| Wiki | Mantém procedimentos publicados, pesquisáveis e revisáveis. | Páginas por slug, revisões, sugestões, anexos e aprovação com autoria. | Abrir uma página, histórico e uma sugestão de alteração. |
| FAQ | Captura dúvida operacional antes de ela virar procedimento oficial. | Threads, respostas, reações e promoção explícita para a Wiki sem apagar a origem. | Abrir uma FAQ resolvida e seguir o vínculo para a Wiki promovida. |
| Como usar | Reduz dependência de treinamento informal. | Ajuda contextual organizada pelas mesmas áreas e papéis do produto. | Abrir uma seção correspondente ao módulo recém-demonstrado. |

### Administração e operação técnica

| Módulo | Resolve o quê | Como foi arquiteturado | O que mostrar |
| --- | --- | --- | --- |
| Usuários/Times | Controla papéis, grupos e escopos de visualização. | RBAC compartilhado e filtros por organização, unidade, setor, vendedor ou grupo. | Um usuário e sua associação de papel/escopo. |
| Configurações | Expõe padrões organizacionais sem espalhar constantes pelo sistema. | Configuração protegida por papel e contratos validados na API. | Matriz de permissões e defaults da organização. |
| Auditoria | Responde quem fez o quê, quando e em qual registro. | Eventos transversais com metadados redigidos e consulta restrita. | Filtrar por Notas, Fluxos ou Scriptoteca e abrir um evento. |
| Status CaseFlow | Mostra saúde de conectores e eficiência operacional. | Métricas e estados independentes por conector; falha parcial não derruba o caso inteiro. | Conectores, intervenções e indicadores de uso. |
| CaseFlow Admin | Administra casos, regras, diagnóstico, backup e restore. | Superfície separada da experiência diária, protegida por papel administrativo. | Histórico redigido, regras, conectores e export/backup de configuração. |

## Destaque principal — CaseFlow

O primeiro fluxo real é específico para relatos de problema de saúde após suplemento. Ele não representa todos os atendimentos e foi preservado como um procedimento independente, pronto para coexistir com outros fluxos futuros.

**Estado demonstrável:** versão 7, 46 nós, 80 transições, 9 encerramentos e 17 mensagens relacionadas.

**Sequência de demonstração:**

1. Em `SAC > Fluxos`, selecionar o fluxo de saúde.
2. Iniciar um atendimento e destacar a ficha mínima: nome, CPF e produtos do pedido.
3. Mostrar que CPF e produtos são exigidos somente quando o percurso precisa deles.
4. Clicar em uma decisão e observar a etapa seguinte receber foco automaticamente.
5. Na etapa 13, escolher entre iniciar a reversa ou dispensá-la; a reversa entra como subfluxo e depois retorna à solução principal.
6. Mostrar uma mensagem pronta com dados persistidos do caso.
7. Explicar retomada, reconfirmação após edição, reinício e resumo conciso para sussurro no encerramento.

**Frase-chave:**

> A ferramenta não pede tudo antes de ajudar. Ela conserva três dados reutilizáveis e pergunta o restante apenas quando uma decisão realmente depende deles.

## Arquitetura para a TI

| Camada | Responsabilidade | Limite importante |
| --- | --- | --- |
| Web React/Vite | Operação comercial, atendimento guiado e administração. | Não acessa diretamente banco ou páginas externas. |
| API Express/TypeScript | Regras, autenticação, tenancy, casos, fluxos, mensagens, auditoria e métricas. | Toda leitura e mutação passa por contratos e escopo do usuário. |
| Prisma + SQLite local | Persistência reproduzível da demonstração. | SQLite é adequado à demo local, não é apresentado como banco final de produção. |
| Shared contracts | Tipos, protocolo Companion, conectores e firewall de ações. | Evita contratos diferentes entre Core, Host e extensão. |
| CaseFlow Core | Normaliza fatos/evidências, explicita conflitos e compila o plano determinístico. | Não lê DOM, não guarda cookies e não depende de IA no caminho principal. |
| Companion Host | Orquestra consultas locais, cache, concorrência, timeout e resultados progressivos. | Processo separado, sem persistir credenciais dos sistemas consultados. |
| Extensão Chromium MV3 | Side panel, intake e interação controlada com páginas abertas. | Login, captcha, 2FA e qualquer confirmação crítica permanecem humanos. |
| Conectores | Isolam Rastreio, Loggi, Correios, Yampi, OMIE, JT/VIP, Lançador e AlwaysChat. | Drift ou timeout degrada apenas o conector afetado. |
| SmartScript Companion | Captura e organiza textos locais para importação ou exportação opcional ao Espanso. | Não recebe fatos do CaseFlow e não expande automaticamente em campos sem contexto validado. |

**Fluxo resumido:** sistema aberto pelo operador → extensão coleta contexto permitido → Host consulta conectores aplicáveis → Core normaliza evidências e compila o fluxo → interface apresenta passo, opções e mensagens → operador confirma ações externas.

## Qualidade, segurança e operação

### O que já pode ser demonstrado

| Evidência | Como explicar | Onde mostrar |
| --- | --- | --- |
| Gate completo | `npm run check` reúne lint, tipos, testes, startup e builds. Na última rodada, os seis workspaces executaram 1.077 testes, com 1 integração Redis opcional ignorada, além dos testes de startup. | Hub > Qualidade e terminal, se solicitado. |
| Coverage por risco | Cada workspace tem piso próprio e arquivos críticos têm metas maiores; o scorecard não esconde risco em uma média geral. | Hub > Qualidade > Coverage comparativo. |
| Testes de jornada | Há testes unitários, integração HTTP, contratos OpenAPI, E2E de navegador, acessibilidade, regressão visual, fuzzing e fixtures offline. | Relatórios Playwright e coverage dentro do Hub. |
| Segurança | Sessão, RBAC, tenancy, validação de entrada, uploads privados, redaction, auditoria e firewall de ações são protegidos por testes. | Administração > Auditoria e Hub > Documentação > Segurança. |
| Firewall CaseFlow | Envio, submit, pagamento, pedido, reversa, estorno, Slack, captcha e 2FA não podem ser concluídos automaticamente. | Decisões do fluxo e documentação de arquitetura. |
| Performance | Smoke local cobre login, dashboard, ranking, extratos, Wiki, FAQ, Fluxos, Scriptoteca e notificações. Há perfis mixed, stress, spike e soak. | Hub > Qualidade > relatório de carga. |
| Observabilidade | Health live/ready, métricas HTTP, requests/queries lentas, estados de conectores e logs estruturados. | Hub > Operação e Administração > Status CaseFlow. |
| Recovery | Existem reset/seed local, runbooks de backup, restore, rollback e recuperação do Companion. | Hub > Documentação > Operação. |

### Como falar de coverage

> Coverage é tratado como um gate por risco, não como uma nota única. Os componentes críticos, como protocolo, parsers e firewall, possuem metas específicas; cenários de negócio continuam protegidos por testes de jornada, contratos e navegador.

Evite usar percentual isolado como prova de qualidade. Mostre no scorecard: valor atual, piso, margem, arquivos sem execução e status por workspace.

## Limites atuais e evolução intencional

| Estado | Como apresentar |
| --- | --- |
| Demo local | Pronta para apresentação controlada com seed e dados fictícios. |
| Rollout interno do Companion | Ainda depende de validação no Windows/WSL, perfil corporativo, firewall/VPN, suspend/resume e smokes autorizados por conector. |
| Internet pública | Continua `NO-GO` até existir ambiente final com HTTPS, secrets, Postgres/storage, backup/restore, deploy e rollback comprovados. |
| Integrações live | Contratos e fixtures existem, mas nenhuma credencial ou scraping real deve ser alegado na apresentação. |
| Agente futuro | A arquitetura está preparada com contexto, capabilities e gates; o agente não foi implementado por decisão explícita. |
| Novos fluxos | O fluxo de saúde é o primeiro. Cada novo procedimento será modelado e homologado separadamente, sem generalização indevida. |

**Resposta sugerida para “já está pronto para produção?”:**

> O produto está pronto para uma demonstração local reproduzível. O núcleo funcional e os controles técnicos estão implementados, mas produção depende de infraestrutura, validações live e aprovações que o projeto registra explicitamente como gates, em vez de escondê-las.

## Fechamento

> O diferencial do AlwaysTrack não é apenas reunir telas. É preservar o vínculo entre dado, decisão e evidência: a venda tem nota, o ranking tem explicação, o procedimento tem versão, o atendimento tem histórico e a automação tem limite.

## Checklist imediatamente antes da reunião

- [ ] `git status --short` sem mudanças inesperadas.
- [ ] `npm run up` concluído e Hub aberto.
- [ ] Web, API e Hub marcados como saudáveis.
- [ ] Login administrativo testado.
- [ ] Fluxo de saúde iniciado em uma sessão nova na versão mais recente.
- [ ] Dashboard, nota, ranking, FAQ/Wiki, auditoria e relatórios técnicos carregando.
- [ ] Nenhum dado, credencial ou sistema real aberto.
- [ ] Limites de demo, rollout e produção mantidos separados na fala.
