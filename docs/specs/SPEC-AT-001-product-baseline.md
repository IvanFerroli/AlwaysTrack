# SPEC-AT-001 - AlwaysTrack Product Baseline

## Metadata
- status: accepted
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/specs/SPEC-AT-001-product-baseline.md

## Objetivo
Definir o primeiro baseline ativo do AlwaysTrack depois da transicao: um starter vertical de licencas/compliance, pronto para evoluir em ciclos pequenos sem depender do backlog historico SyLembra.

## Produto
AlwaysTrack organiza uma operacao recorrente de controle de licencas, documentos, vencimentos, notificacoes e evidencias de auditoria.

## Usuario-alvo inicial
- Admin operacional que configura organizacao, usuarios, unidades, setores, tipos de licenca e regras.
- RT ou responsavel tecnico que acompanha profissionais, documentos e pendencias.
- Supervisor que consulta escopo limitado e acompanha riscos.

## Fluxo principal
1. Criar ou usar uma organizacao local seedada.
2. Cadastrar profissionais, tipos de licenca e licencas.
3. Acompanhar vencimentos no dashboard e relatorios.
4. Solicitar, receber e validar documentos.
5. Gerar jobs de notificacao e manter evidencia em auditoria.

## Vocabulario canonico
- `AlwaysTrack`: nome do produto/starter atual.
- `seed local`: dados sinteticos para desenvolvimento e demonstracao controlada.
- `starter vertical`: base funcional focada em licencas/compliance, nao scaffold SaaS generico.
- `beta externo`: uso fora de maquina local ou ambiente controlado interno.

## Fora de escopo imediato
- Renomear workspaces, rotas ou modelos de dominio.
- Transformar o produto em SaaS generico.
- Remover features de licencas/compliance que ja sustentam o fluxo principal.
- Habilitar integracoes externas reais por padrao.

## Criterios de aceite
- Roadmap e intake apontam para a trilha `TASK-AT-*`.
- Runtime publico nao usa copy "V1" para descrever a experiencia atual.
- Seed local nao referencia task historica como metadata operacional.
- Validacao minima `npm run check` passa.
