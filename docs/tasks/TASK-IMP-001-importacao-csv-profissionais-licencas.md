# TASK-IMP-001 - Importacao CSV de profissionais e licencas

## Metadata
- status: done
- owner: olympus_taskyfier
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-IMP-001-importacao-csv-profissionais-licencas.md

## Objetivo
Permitir que um Admin importe em massa profissionais e suas licencas por arquivo CSV, incluindo datas de emissao e validade, para viabilizar uma carga inicial realista de cerca de 600 profissionais sem cadastro manual.

## Diagnostico
Hoje o sistema possui exportacao CSV nos relatorios, mas nao foi encontrado fluxo de importacao em massa para profissionais/licencas. Para MVP operacional com base real grande, cadastro manual de 600 profissionais vira gargalo e risco de erro.

## Recomendacao de produto
MVP deve comecar por CSV, nao XLSX.

Motivos:
- CSV e simples de validar, versionar e debugar.
- Evita dependencia pesada de parser de planilha no backend.
- E suficiente para carga inicial se houver template claro.
- Google Sheets/Excel exportam CSV facilmente.

Depois do MVP, avaliar XLSX apenas como conveniencia de UX, mantendo o mesmo motor de validacao por tras.

## Escopo MVP
1. Template CSV oficial baixavel pela UI.
2. Upload CSV autenticado, apenas Admin.
3. Validacao em duas fases:
   - `dry-run`: le arquivo, valida linhas e mostra preview/erros sem gravar.
   - `commit`: grava apenas se o usuario confirmar.
4. Importar ou atualizar:
   - profissional;
   - unidade e setor existentes;
   - RT responsavel existente, quando informado;
   - tipo de licenca existente;
   - licenca com numero, emissor, UF, emissao, validade e status opcional.
5. Retorno detalhado:
   - linhas validas;
   - linhas com erro;
   - duplicidades;
   - quantos profissionais criados/atualizados;
   - quantas licencas criadas/atualizadas.
6. Auditoria da importacao:
   - `bulk_import.validate`
   - `bulk_import.commit`
   - contadores e hash/nome do arquivo, sem armazenar conteudo sensivel desnecessario.

## Formato CSV proposto
Cabecalho obrigatorio:

```csv
professional_name,cpf,email,phone,position,unit_name,sector_name,rt_email,license_type,license_number,issuer,uf,issued_at,expires_at,status,notes
```

Regras:
- `professional_name`: obrigatorio.
- `cpf`: obrigatorio para deduplicar profissional.
- `email`: opcional, mas recomendado.
- `unit_name` e `sector_name`: obrigatorios e precisam existir.
- `rt_email`: opcional; se informado, precisa existir como usuario RT ativo.
- `license_type`: obrigatorio e precisa existir.
- `license_number`: recomendado; usado com profissional/tipo para deduplicar licenca.
- `issued_at` e `expires_at`: formato `YYYY-MM-DD`.
- `status`: opcional; se vazio, backend calcula status pelo vencimento.
- `notes`: opcional; nao deve conter senhas, tokens ou credenciais.

## Alternativas consideradas
1. CSV unico para profissional + licenca
- Melhor para MVP.
- Uma linha por licenca.
- Profissional com varias licencas aparece em varias linhas.

2. Dois CSVs separados, profissionais e licencas
- Mais limpo para bases muito organizadas.
- Mais trabalhoso para usuario nao tecnico.
- Pode virar melhoria posterior.

3. XLSX
- Melhor experiencia para usuarios de Excel.
- Mais superficie de parser, upload e validacao.
- Recomendado como fase 2, usando o mesmo schema interno.

4. Google Sheets/importacao por link
- Conveniente, mas envolve permissao externa e risco operacional.
- Fora do MVP.

## Arquivos/projetos provavelmente envolvidos
- `services/api/src/core/professionals/*`
- `services/api/src/core/licenses/*`
- novo modulo `services/api/src/core/imports/*`
- `services/api/prisma/schema.prisma` se for necessario persistir historico de importacao
- `apps/web/src/main.tsx`
- `apps/web/src/components/operational.tsx`
- `apps/web/src/styles.css`
- `packages/shared/src/index.ts` para contrato de status/schema compartilhado, se fizer sentido

## API sugerida
- `GET /v1/imports/professionals-licenses/template`
  - baixa CSV exemplo.
- `POST /v1/imports/professionals-licenses/validate`
  - recebe arquivo CSV e retorna preview com erros.
- `POST /v1/imports/professionals-licenses/commit`
  - recebe arquivo ou `importSessionId` validado e grava.

Para manter simples no MVP, pode nao persistir sessao: validar e commit podem receber o mesmo arquivo, desde que a UI force o usuario a confirmar depois da validacao.

## UI sugerida
Adicionar em `Profissionais` ou `Configuracoes` uma secao "Importar CSV":
- botao "Baixar modelo";
- upload do CSV;
- botao "Validar";
- tabela de preview com status por linha;
- resumo de criados/atualizados/erros;
- botao "Confirmar importacao" habilitado apenas se nao houver erro bloqueante.

## Validacoes essenciais
- tamanho maximo do arquivo;
- encoding UTF-8;
- cabecalho exato ou mensagem clara de cabecalho invalido;
- datas validas;
- CPF duplicado na propria planilha;
- unidade/setor existentes;
- setor pertence a unidade;
- RT existe, esta ativo e tem perfil RT;
- tipo de licenca existe e esta ativo;
- status pertence ao contrato compartilhado;
- nao criar duplicidade de licenca para mesmo profissional/tipo/numero.

## Fora de escopo MVP
- importar documentos/anexos;
- importar por XLSX;
- criar unidade, setor, RT ou tipo de licenca automaticamente;
- chamar Meta/notificar automaticamente depois da importacao;
- processar arquivo gigante em background;
- integracao com Google Sheets.

## Acceptance Criteria
- Admin consegue baixar modelo CSV.
- Admin consegue validar arquivo antes de gravar.
- Erros sao mostrados por linha com mensagem compreensivel.
- Importacao grava profissionais e licencas de linhas validas apenas apos confirmacao.
- Operacao e auditada.
- Dados importados aparecem em Profissionais, Licencas, Dashboard e Relatorios.
- Build/check/testes permanecem verdes.

## Validacao esperada
- testes unitarios do parser/validador;
- testes de servico para criar/atualizar profissional e licenca;
- teste de permissao: nao Admin nao importa;
- teste de erro por linha;
- `npm run check`.

## Riscos
- Planilha real pode vir inconsistente; dry-run precisa ser muito claro.
- Importacao parcial pode confundir; decidir se MVP bloqueia commit quando houver qualquer erro.
- Deduplicacao por CPF/licenca precisa ser conservadora para nao sobrescrever dado errado.
- CSV com acentos/Excel pode vir com separador `;`; decidir se aceita `,` e `;` ou se documenta um unico formato.

## Decisao recomendada
Implementar primeiro CSV unico, com dry-run obrigatorio e commit bloqueado enquanto houver erro bloqueante. Aceitar separador `,` e `;` se o parser suportar sem gambiarra; caso contrario, padronizar `,` e deixar a mensagem de erro ensinar como exportar.

## Execucao 2026-04-30
- Backend criado em `services/api/src/core/imports`.
- Endpoints adicionados:
  - `GET /v1/imports/professionals-licenses/template`
  - `POST /v1/imports/professionals-licenses/validate`
  - `POST /v1/imports/professionals-licenses/commit`
- UI adicionada em `Profissionais` para baixar modelo, selecionar CSV, validar, revisar preview e confirmar importacao.
- `Como usar` recebeu anchor `#importacao-csv`.
- Auditoria registra `bulk_import.validate` e `bulk_import.commit`.
- Testes unitarios adicionados para validacao, permissao, erro por linha e commit.

## Validacao executada
- `npm run build --workspace @sylembra/web`
- `npm run typecheck --workspace @sylembra/api`
- `npm run test --workspace @sylembra/api -- professionals-licenses-import.service.test.ts`
- `npm run check`
