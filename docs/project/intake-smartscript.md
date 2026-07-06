# Project Intake - AlwaysTrack SmartScript

## Metadata

- status: accepted
- owner: product-builder
- product-area: script-library
- initiative-name: SmartScript
- last-updated: 2026-07-06
- source-of-truth: docs/project/intake-smartscript.md
- related-spec: docs/specs/SPEC-AT-004-smartscript.md
- related-baseline: docs/specs/SPEC-AT-001-product-baseline.md
- related-roadmap: docs/tasks/ROADMAP.md

## Fonte canônica

Este documento é a fonte canônica da iniciativa SmartScript.

O SmartScript deve ser tratado como uma evolução da Scriptoteca atual do AlwaysTrack, não como um produto externo independente.

Fontes já existentes que devem ser respeitadas:

- baseline de produto: `docs/specs/SPEC-AT-001-product-baseline.md`
- intake macro do produto: `docs/project/intake.md`
- backlog ativo: `docs/tasks/ROADMAP.md`
- domínio backend atual da Scriptoteca: `services/api/src/core/script-library/`
- view frontend atual da Scriptoteca: `apps/web/src/views/script-library.tsx`
- schema Prisma: `services/api/prisma/schema.prisma`
- contratos compartilhados: `packages/shared/src/`
- domínio de Fluxos de Atendimento: `services/api/src/core/service-flows/`
- view de Fluxos de Atendimento: `apps/web/src/views/service-flows.tsx`

## Objetivo em uma frase

Criar o SmartScript como uma camada inteligente da Scriptoteca que captura respostas reais do atendimento, identifica padrões repetitivos, gera candidatos de snippets pessoais, permite revisão humana simples e exporta os snippets aprovados para uso operacional via Espanso.

## Tese do produto

O conhecimento operacional não nasce pronto.

Ele aparece no trabalho diário, em mensagens repetidas, ajustes manuais, textos copiados do ChatGPT, respostas coladas no AlwaysChat e pequenas variações que o atendente escreve dezenas de vezes por semana.

O SmartScript existe para transformar esse conhecimento implícito em biblioteca viva.

A tese é:

> O AlwaysTrack deve observar o atendimento real, extrair padrões de escrita, sugerir scripts pessoais úteis e permitir que o operador aprove, refine e use esses scripts no dia seguinte com o mínimo de atrito.

## Nome do módulo

Nome único nas duas pontas:

- SmartScript

Uso no AlwaysTrack:

- `Scriptoteca > SmartScript`

Uso local:

- `SmartScript Local Companion`

Evitar nomes paralelos como `AlwaysLibrary Builder`, `Scriptoteca Intelligence` ou `Library Builder` nesta fase, para reduzir ambiguidade no pipeline de agentes.

## Posicionamento no AlwaysTrack

O SmartScript nasce dentro da Scriptoteca.

Motivo:

- a Scriptoteca já é o domínio de textos prontos do SAC;
- a Scriptoteca já possui conceitos de scripts pessoais;
- a Scriptoteca já possui sugestões;
- a Scriptoteca já possui métricas de cópia/uso;
- a Scriptoteca já se relaciona com Fluxos de Atendimento;
- o SmartScript é uma camada de captura, geração e melhoria, não uma substituição da Scriptoteca.

Direção arquitetural:

- No curto prazo: aba dentro da Scriptoteca.
- No futuro: pode virar módulo próprio se crescer.
- No MVP: não criar menu lateral próprio, salvo se a UI atual da Scriptoteca ficar inviável.

## Problema atual

A operação SAC depende de muito texto repetitivo.

Hoje existem três tipos de texto:

1. Scripts oficiais/canônicos da empresa.
2. Scripts pessoais criados manualmente.
3. Mensagens úteis que o atendente escreve/copia/cola durante o expediente, mas que nunca viram biblioteca.

O terceiro tipo é o maior vazamento de conhecimento.

Exemplos:

- resposta sobre NAC com cheiro forte;
- pedido de fotos para produto com problema;
- reenvio solicitado;
- estorno em cartão;
- boleto pendente;
- prazo de entrega;
- acareação aberta;
- pedido em separação;
- explicação de cápsula/cor/lote;
- resposta firme para caso suspeito;
- encerramento com pesquisa.

O problema não é só digitar muito.

O problema é repetir raciocínio e texto sem transformar isso em ativo operacional.

## Objetivos do SmartScript

O SmartScript deve:

1. Capturar material real do expediente.
2. Registrar textos candidatos a snippet.
3. Processar sessões locais de atendimento.
4. Remover ruído suficiente para tornar o material analisável.
5. Identificar mensagens repetidas ou semanticamente próximas.
6. Sugerir snippets pessoais.
7. Permitir revisão humana rápida.
8. Mover snippets aprovados para estado `Em uso`.
9. Exportar snippets `Em uso` para Espanso.
10. Medir uso dos snippets.
11. Sugerir melhoria contínua da biblioteca.
12. Permitir que bons snippets pessoais sejam sugeridos para canonização na Scriptoteca.

## Não objetivos

O SmartScript não deve, nesta fase:

1. Substituir a Scriptoteca atual.
2. Substituir Fluxos de Atendimento.
3. Publicar scripts canônicos automaticamente.
4. Enviar logs brutos para o AlwaysTrack.
5. Depender de provider externo de IA para funcionar localmente.
6. Capturar tudo do computador sem allowlist.
7. Criar um keylogger genérico invisível.
8. Gerar dezenas de snippets sem revisão humana.
9. Alterar snippets `Em uso` silenciosamente.
10. Misturar comandos internos `/` da Always com triggers pessoais `:`.

## Decisões aceitas

### 1. Nome

SmartScript nas duas pontas:

- módulo no AlwaysTrack;
- companion local.

### 2. Local no produto

Nasce dentro da Scriptoteca.

Preparar arquitetura para virar módulo próprio no futuro, mas não começar separado.

### 3. Fonte da verdade

AlwaysTrack é a fonte da verdade.

Espanso é runtime/exportador.

O Espanso não deve ser considerado banco principal.

### 4. Publicação no Espanso

Somente snippets `Em uso` podem ser exportados.

MVP pode exigir botão manual `Exportar agora`.

No futuro, pode haver exportação automática, mas apenas de snippets `Em uso`.

### 5. Estados visíveis

Usar apenas estados simples:

- `Em uso`
- `Gerados hoje`
- `Em revisão`

Não criar excesso de estados visuais.

### 6. Expiração de gerados hoje

Itens em `Gerados hoje` que não forem decididos devem migrar para `Em revisão`.

Regra inicial sugerida:

- `Gerados hoje` representa a sessão/processamento mais recente.
- Ao processar uma nova sessão, os itens ainda pendentes do ciclo anterior podem ir para `Em revisão`.

### 7. Alteração de snippet em uso

Agente nunca altera diretamente um snippet `Em uso`.

Toda alteração proposta em snippet ativo vira revisão pendente.

### 8. Manual/protegido

Não criar status `Manual` ou `Protegido` no MVP.

A proteção operacional será garantida por:

- agente não altera `Em uso` diretamente;
- toda mudança vira proposta;
- DecisionLog registra decisões.

### 9. Escopo inicial do logger

Capturar no MVP:

- clipboard;
- janela ativa;
- texto enviado no AlwaysChat;
- texto copiado do ChatGPT;
- texto colado no AlwaysChat;
- timestamps;
- origem/destino quando identificável.

### 10. Allowlist

Captura deve ocorrer por allowlist.

O usuário não quer controles extras complexos; se não quiser capturar, ele simplesmente não roda o companion local.

Allowlist inicial:

- AlwaysChat;
- ChatGPT;
- páginas/sistemas explicitamente definidos pelo usuário;
- opcionalmente Slack/WhatsApp se forem relevantes para respostas operacionais.

### 11. Logs brutos

Logs brutos ficam somente locais.

Logs brutos não entram no banco do AlwaysTrack.

O AlwaysTrack deve receber apenas:

- candidatos;
- textos processados;
- métricas úteis;
- decisões;
- exports;
- informações necessárias para governança da biblioteca.

### 12. Retenção dos logs brutos

Regra preferencial:

- guardar raw log por 1 dia.

Regra alternativa se der trabalho:

- apagar raw log ao final do processamento.

Nunca tratar raw log como histórico permanente.

### 13. Sanitização

Duas fases:

1. Sanitização/preparação antes da análise.
2. Verificação final antes de virar snippet.

A sanitização não precisa começar como sistema enterprise completo, mas deve impedir que snippets finais carreguem dados específicos de cliente.

### 14. Dados sensíveis

Como a ferramenta é inicialmente de uso pessoal/local, não criar uma esteira pesada de compliance nesta fase.

Ainda assim, snippet final não deve conter:

- CPF real;
- telefone real;
- email real;
- endereço real;
- número real de pedido;
- código real de rastreio;
- nome real de cliente;
- links sensíveis específicos;
- valores que só fazem sentido para um caso individual.

Motivo:

- não é apenas segurança;
- snippet com dado específico é snippet ruim.

### 15. Aprovação humana

Suportar dois modos:

1. Botões na interface:
   - Aprovar;
   - Rejeitar;
   - Editar;
   - Enviar para revisão.

2. Revisão numerada:
   - `1 sim`
   - `2 não`
   - `3 editar`
   - `4 revisão`

A revisão numerada deve atualizar os mesmos estados internos da interface.

### 16. Limite diário/de processamento

Regra única:

- o SmartScript pode sugerir no máximo 10 itens por processamento.

Não limitar quantos snippets o usuário pode aprovar.

Se virar bagunça, revisar depois.

### 17. Triggers

Triggers pessoais/exportáveis devem sempre usar `:`.

Exemplos:

- `:nac`
- `:nac-cheiro`
- `:estorno-card`
- `:reenvio-ok`
- `:aca-aberta`

Não usar `/`.

Motivo:

- `/` fica reservado para comandos internos da Always/AlwaysTrack;
- misturar `/` com popup interno pode dar conflito mental e técnico.

### 18. Canonização

Um snippet gerado/aprovado pelo SmartScript pode entrar no fluxo atual de sugestão para virar script canônico.

Fluxo desejado:

1. SmartScript gera candidato.
2. Usuário aprova como `Em uso`.
3. Usuário percebe que é útil para mais pessoas.
4. Usuário envia como sugestão para Scriptoteca canônica.
5. Admin/Gestor revisa.
6. Se aprovado, vira `OperationalScript`.

### 19. MVP

O MVP deve ser completo no sentido de fechar o ciclo inteiro:

- capturar;
- processar;
- sugerir;
- revisar;
- aprovar;
- exportar;
- usar;
- medir;
- sugerir melhoria.

Completo não significa perfeito, visualmente refinado ou enterprise.

Completo significa loop funcional ponta a ponta.

## Conceitos do domínio

### SmartScript Local Companion

Processo local iniciado pelo usuário no terminal.

Responsabilidades:

- iniciar sessão de captura;
- registrar eventos permitidos;
- salvar raw log local temporário;
- processar sessão localmente ou preparar pacote para processamento;
- gerar candidatos limpos;
- enviar/importar candidatos para AlwaysTrack quando o usuário decidir.

Comandos conceituais:

```bash
smartscript start
smartscript stop
smartscript status
smartscript process --today
smartscript import --today
smartscript export-espanso
```
