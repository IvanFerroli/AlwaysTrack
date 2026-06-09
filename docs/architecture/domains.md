# AlwaysTrack Domain Map

## Comercial
- `SellerProfile`: vendedor operacional.
- `SalesGroup`: grupo/time comercial.
- `SalesDocument`: DANFE/nota enviada.
- `SalesItem`: itens aprovados ou extraidos da nota.
- `SalesCampaign`: regra comercial de periodo/metrica.
- `RankingSnapshot`: congelamento historico de ranking.

## Conhecimento
- `WikiPage`: pagina publicada por slug.
- `WikiEditRequest`: proposta de alteracao revisavel.
- `WikiRevision`: historico de versoes.
- `FaqThread`: pergunta colaborativa.
- `FaqComment`: resposta/comentario.
- `FaqReaction`: reacao por usuario/tipo/alvo.

## Operacao
- `InAppNotification`: notificacao interna lida/nao lida por usuario.
- `AuditLog`: trilha de acoes sensiveis.
- `GoogleConnection` e `GoogleOauthState`: integracoes/autenticacao Google.

## Legado isolado
Profissionais, licencas, RT, upload publico e jobs antigos de notificacao pertencem ao recorte SyLembra. Manter compatibilidade quando necessario, mas nao usar como backlog ativo do AlwaysTrack comercial.

