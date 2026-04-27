# Olympus Climb — The Agentic Career Engine 🏔️

**Olympus Climb** é um ecossistema agêntico de alta performance projetado para automatizar o ciclo completo de aquisição de carreira: da descoberta inteligente de vagas à submissão estratégica, guiada por IA.

## 🏛️ Arquitetura e Estrutura
O projeto utiliza uma arquitetura de monorepo baseada em **TypeScript**, focada em separação de preocupações e rastreabilidade total de decisões agênticas.

-   **`apps/web`**: Dashboard operacional construído com React e Vanilla CSS. Foca em visualização de afinidade, gerenciamento de fila de aprovação e métricas de pipeline.
-   **`services/api`**: Núcleo lógico em Node.js seguindo princípios de Arquitetura Hexagonal (Domain, State, Features).
    -   **Persistence**: Prisma ORM com PostgreSQL para armazenamento de vagas, perfis e logs de auditoria.
    -   **Domain**: Lógicas de `matching` e `strategy` isoladas para testabilidade.
-   **`packages/shared-types`**: Contrato de tipos único que garante sincronia entre o runtime da API e o frontend.
-   **`docs/`**: A "Fonte da Verdade". Contém ADRs, Histórico de Tasks, Runbooks e a Memória do Taskyfier.

---

## 🚀 Capacidades Ativas (Capabilities)

### 1. Discovery & Ingestion
-   **Intelligent Scraping**: Captura multi-fonte (Remotive, Arbeitnow, LinkedIn, etc.) com descarte automático por afinidade (`auto-discard`).
-   **Keyword effective**: Normalização de termos e tratamento de aliases (ex: `node` = `node.js`).
-   **Job Acquisition**: Layer para ingestão manual e adaptadores para plataformas específicas.

### 2. Matching & Scoring Engine
-   **Score Ponderado**: Diferenciação entre skills técnicas e soft skills com pesos ajustáveis.
-   **Seniority Guardrail**: Penalidades controladas para mismatch de senioridade detectada no título.
-   **AI Deep Score**: Integração com LLMs para análise profunda de compatibilidade além das keywords.
-   **Calibration Baseline**: Dataset curado versionado para evitar regressão de ranking no top-k.

### 3. Execution & Strategy Gate
-   **Pipeline Unificado**: Ciclo `POST /v1/pipeline/run` que coordena coleta, triagem e proposta de estratégia.
-   **Approval Queue**: Interface para aprovação/rejeição de candidaturas antes da execução final.
-   **Shortlist Inteligente**: Geração de resumos e justificativas para cada proposta de ação.

### 4. Observability & Audit
-   **Decision Logs**: Registro detalhado da "razão" por trás de cada decisão da IA.
-   **Agent Runs**: Rastreabilidade de cada ciclo operacional com status e evidências de skills.
-   **Runtime Metrics**: Snapshots de performance (dedupe rate, ingestion volume, budget cuts).

---

## 🛠️ Tecnologias e Técnicas
-   **Linguagens**: TypeScript (100%), HTML5, Vanilla CSS.
-   **Runtime**: Node.js, Next-like custom SSR.
-   **Database**: PostgreSQL + Prisma.
-   **AI**: Gemini/Vertex AI integration (com fallbacks locais).
-   **Testing**: Testes determinísticos de ranking, smoke tests de API e regressão baseada em fixtures reais.
-   **Protocolo Operacional**: `Compact Docs-First Mode` para governança rigorosa de mudanças.

---

## 🌟 Diferenciais
-   **Rastreabilidade Total**: Diferente de ferramentas "black box", o Olympus Climb registra o racional de cada matching e o histórico de cada execução em `DecisionLog`.
-   **Calibração por Dataset**: O ranking não é aleatório; ele é testado contra um baseline de "Verdade-Terreno" (Ground Truth) a cada commit.
-   **Budget Awareness**: O sistema possui guardrails para evitar consumo excessivo de APIs de IA, aplicando cortes inteligentes de custo.

---

## 🗺️ Roadmap: O que falta?
-   **[ ] Pruning de Storage**: Implementação de limites e paginação para logs que crescem sem controle (Próxima TASK-ADM).
-   **[ ] UX Overhaul**: Refinamento da hierarquia visual e filtros reativos avançados (Em planejamento).
-   **[ ] Budget Policy**: Definição de limites financeiros rígidos por rodada de pipeline.
-   **[ ] Multi-Profile Context**: Suporte para alternar entre múltiplos currículos/headlines de forma fluida.

---

## 🏁 Como Rodar
1.  **Setup**: `npm install`
2.  **Database**: Certifique-se de ter um PostgreSQL rodando e configure o `.env`.
3.  **Migrate**: `npx prisma migrate dev` (dentro de `services/api`)
4.  **Dev Mode**: `npm run dev`
5.  **Checks**: `npm run check` & `npm run smoke`

---
*Olympus Climb — Built for those who scale.* 🏔️
