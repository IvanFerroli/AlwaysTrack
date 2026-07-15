# Avaliacao de Impacto de Privacidade do AlwaysTrack

## Metadata
- status: draft-pending-controller-and-legal-approval
- owner: security-maintainers
- business-owner: product-operations
- legal-approver: pending
- last-updated: 2026-07-15
- review-by: 2026-08-15
- source-of-truth: docs/security/lgpd-impact-assessment.md

## Decisao atual
- Demo com fixtures sinteticas e providers fake: permitida tecnicamente, desde que o pacote nao exponha dados locais.
- Homologacao com dados reais: condicionada a ambiente autorizado, minimizacao, owners e termo operacional.
- Providers externos reais de IA/Meta/Google Sheets: bloqueados ate aprovacao de fornecedor, base legal e transferencia.
- Rollout CaseFlow: permanece NO-GO enquanto gates live e manuais existentes estiverem pendentes.

## Necessidade e proporcionalidade
O produto precisa identificar usuario, tenant e contexto operacional para aplicar permissoes e orientar atendimento. O CaseFlow deve operar com fatos normalizados e referencias mascaradas; Extension e Host nao precisam de cookie, senha, storage de autenticacao ou HTML bruto. SmartScript deve manter captura local allowlisted e apagar eventos brutos rapidamente. Qualquer coleta alem desses limites exige nova avaliacao.

## Fluxos de maior risco
| Risco | Probabilidade | Impacto | Controle atual | Lacuna/acao | Aprovador |
| --- | --- | --- | --- | --- | --- |
| IDOR entre organizacoes | baixa-media | critico | escopo por organizationId, testes anti-dado-cruzado | manter regressao em toda rota nova | security-maintainers |
| Captura de conversa/DOM excessiva | media | alto | snapshots minimos, allowlist, sem HTML bruto | E2E MV3 e auditoria de drift | privacy + companion owners |
| Envio de documento a IA | media se ligado | critico | provider fake por default, resultado estruturado | DPA, regiao, retencao, treinamento e base legal | juridico + controlador |
| Token/cookie em log ou evidencia | baixa-media | critico | redaction e campos proibidos | scanner de evidencia e secret scan de historico | security-maintainers |
| Retencao acima do necessario | alta | alto | defaults CaseFlow e purge parcial | TASK-AT-328, politica de documentos/auditoria | privacy owner |
| Exclusao fora do tenant | baixa | critico | deleteServiceCaseData valida tenant | workflow autorizado, dry-run e testes anti-IDOR | security-maintainers |
| Provider externo indisponivel ou divergente | media | medio-alto | toggles off, timeout parcial e degradacao | contratos/sandbox TASK-AT-321 | integrations owner |
| Decisao automatica critica | baixa no escopo atual | critico | firewall, copy/draft e confirmacao humana | preservar proibicoes no agente futuro | product + security |
| Evidencia de demo com dado real | media | alto | fixtures fake existentes | manifesto TASK-AT-333 e limpeza pre-demo | demo owner |

## Principios aplicados
- Minimizacao: coletar somente fatos necessarios para o caso e operacao.
- Finalidade: nao reutilizar conversa, documento ou telemetria para treinamento sem nova decisao.
- Segregacao: tenant, perfil e caseId fazem parte do escopo de acesso/cache.
- Transparencia: operador deve distinguir sugestao, fato, conflito e acao manual.
- Intervencao humana: nenhuma decisao financeira, submit, envio ou Slack automatico no escopo inicial.
- Seguranca: fail-closed, loopback, tokens escopados, redaction e auditoria.

## Incidente de privacidade
1. Conter acesso/provider e preservar evidencia redigida.
2. Identificar categorias, titulares, tenants, periodo, volume e paises envolvidos.
3. Acionar security, controlador, encarregado e juridico.
4. Avaliar risco ou dano relevante e necessidade/prazo de comunicacao a ANPD e titulares.
5. Registrar decisao, comunicacoes, remediacao e prevencao sem anexar segredo ou payload completo.

## Criterios para encerramento do RIPD
- Controlador, operador, encarregado e aprovadores nomeados.
- Registro de tratamento e bases legais aprovados.
- Contratos/suboperadores e transferencias documentados.
- Retencao/purge e direitos do titular exercitados.
- Incidente tabletop executado.
- Gates tecnicos e live aplicaveis com evidencia valida.

Enquanto esses itens estiverem pendentes, este documento e um diagnostico tecnico e nao uma aprovacao de producao.
