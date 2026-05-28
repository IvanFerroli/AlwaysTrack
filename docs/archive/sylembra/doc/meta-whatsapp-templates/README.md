# Templates Meta WhatsApp - SyLembra

Use estes arquivos para consultar os modelos criados no WhatsApp Manager.

Status em 2026-05-05: os quatro templates de licenca foram criados e estao em analise na Meta.

## Ordem recomendada
1. `license_expiration_notice`
2. `responsible_license_expiration_notice`
3. `license_expired_notice`
4. `responsible_license_expired_notice`

Os quatro acima ja sao compativeis com o backend atual e com a seed demo.

## Arquivos
- `templates-licencas-prontos-meta.md`: campos para copiar na tela da Meta.
- `templates-documentos-e-botoes-bloqueados.md`: ideias de documento e botao "Enviar documento", ainda dependentes de ajuste no backend.

## Configuracao geral na Meta
- Categoria: `Utility`
- Idioma: `Portuguese (BR)` / `pt_BR`
- Tipo de variavel: `Numero`
- Amostra de midia: `Nenhum`
- Cabecalho: conforme cada template
- Rodape: `SyLembra`
- Botoes: nenhum por enquanto

## Depois da aprovacao
Cadastre no SyLembra ou rode a seed atualizada:
- `key`: igual ao nome do template.
- `metaTemplateName`: igual ao nome aprovado na Meta.
- `language`: `pt_BR`.
- `bodyPreview`: versao com nomes de variaveis, indicada em cada template.

## Observacao sobre botoes
A Meta permite botoes, mas o backend atual ainda nao envia componente de botao nem gera link unico de upload dentro do job. Por isso, os quatro templates de licenca foram criados sem botoes.
