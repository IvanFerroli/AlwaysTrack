# Templates de Licencas Prontos para Meta

Entrega MVP: quatro templates de licenca criados na Meta e em analise em 2026-05-05.

Todos os templates abaixo:
- Categoria: `Utility`
- Idioma: `Portuguese (BR)` / `pt_BR`
- Tipo de variavel: `Numero`
- Amostra de midia: `Nenhum`
- Rodape: `SyLembra`
- Botoes: nenhum

## 1. license_expiration_notice

### Status Meta
Em analise.

### Nome do modelo
```text
license_expiration_notice
```

### Cabecalho
```text
Aviso de vencimento de licença
```

### Corpo
```text
Este é um aviso automático do SyLembra.
Olá, {{1}}. Identificamos que a licença {{2}}, número {{3}}, está com vencimento programado para {{4}}. Faltam {{5}} dias para o vencimento. Em caso de dúvida, entre em contato com o responsável técnico {{6}} para receber orientações sobre a regularização.
```

### Exemplos das variaveis
```text
{{1}} Maria Silva
{{2}} COREN
{{3}} COREN-12345
{{4}} 2026-06-04
{{5}} 30
{{6}} Ivan
```

### Ordem backend
1. `professionalName`
2. `licenseTypeName`
3. `licenseNumber`
4. `expiresAt`
5. `daysUntilExpiration`
6. `responsibleRtName`

### Body preview no SyLembra
```text
Este é um aviso automático do SyLembra.
Olá, {{professionalName}}. Identificamos que a licença {{licenseTypeName}}, número {{licenseNumber}}, está com vencimento programado para {{expiresAt}}. Faltam {{daysUntilExpiration}} dias para o vencimento. Em caso de dúvida, entre em contato com o responsável técnico {{responsibleRtName}} para receber orientações sobre a regularização.
```

### Evento
Profissional com licenca a vencer.

## 2. responsible_license_expiration_notice

### Status Meta
Em analise.

### Nome do modelo
```text
responsible_license_expiration_notice
```

### Cabecalho
```text
Aviso para responsável técnico
```

### Corpo
```text
Este é um aviso automático do SyLembra.
Olá, {{1}}. Identificamos que a profissional {{2}} possui a licença {{3}}, número {{4}}, com vencimento programado para {{5}}. Faltam {{6}} dias para o vencimento. Verifique a pendência no sistema e acompanhe a regularização.
```

### Exemplos das variaveis
```text
{{1}} Ivan
{{2}} Maria Silva
{{3}} COREN
{{4}} COREN-12345
{{5}} 2026-06-04
{{6}} 30
```

### Ordem backend
1. `responsibleRtName`
2. `professionalName`
3. `licenseTypeName`
4. `licenseNumber`
5. `expiresAt`
6. `daysUntilExpiration`

### Body preview no SyLembra
```text
Este é um aviso automático do SyLembra.
Olá, {{responsibleRtName}}. Identificamos que a profissional {{professionalName}} possui a licença {{licenseTypeName}}, número {{licenseNumber}}, com vencimento programado para {{expiresAt}}. Faltam {{daysUntilExpiration}} dias para o vencimento. Verifique a pendência no sistema e acompanhe a regularização.
```

### Evento
Responsavel/RT sobre profissional com licenca a vencer.

## 3. license_expired_notice

### Status Meta
Em analise.

### Nome do modelo
```text
license_expired_notice
```

### Cabecalho
```text
Aviso de licença vencida
```

### Corpo
```text
Este é um aviso automático do SyLembra.
Olá, {{1}}. Identificamos que sua licença {{2}}, número {{3}}, venceu em {{4}}. A licença está vencida há {{5}} dias. Em caso de dúvida, entre em contato com o responsável técnico {{6}} para receber orientações sobre a regularização.
```

### Exemplos das variaveis
```text
{{1}} Maria Silva
{{2}} COREN
{{3}} COREN-12345
{{4}} 2026-04-15
{{5}} 15
{{6}} Ivan
```

### Ordem backend
1. `professionalName`
2. `licenseTypeName`
3. `licenseNumber`
4. `expiresAt`
5. `daysExpired`
6. `responsibleRtName`

### Body preview no SyLembra
```text
Este é um aviso automático do SyLembra.
Olá, {{professionalName}}. Identificamos que sua licença {{licenseTypeName}}, número {{licenseNumber}}, venceu em {{expiresAt}}. A licença está vencida há {{daysExpired}} dias. Em caso de dúvida, entre em contato com o responsável técnico {{responsibleRtName}} para receber orientações sobre a regularização.
```

### Evento
Profissional com licenca vencida.

## 4. responsible_license_expired_notice

### Status Meta
Em analise.

### Nome do modelo
```text
responsible_license_expired_notice
```

### Cabecalho
```text
Aviso de licença vencida
```

### Corpo
```text
Este é um aviso automático do SyLembra.
Olá, {{1}}. Identificamos que a profissional {{2}} possui a licença {{3}}, número {{4}}, vencida desde {{5}}. A licença está vencida há {{6}} dias. Verifique a pendência no sistema e acompanhe a regularização.
```

### Exemplos das variaveis
```text
{{1}} Ivan
{{2}} Maria Silva
{{3}} COREN
{{4}} COREN-12345
{{5}} 2026-04-15
{{6}} 15
```

### Ordem backend
1. `responsibleRtName`
2. `professionalName`
3. `licenseTypeName`
4. `licenseNumber`
5. `expiresAt`
6. `daysExpired`

### Body preview no SyLembra
```text
Este é um aviso automático do SyLembra.
Olá, {{responsibleRtName}}. Identificamos que a profissional {{professionalName}} possui a licença {{licenseTypeName}}, número {{licenseNumber}}, vencida desde {{expiresAt}}. A licença está vencida há {{daysExpired}} dias. Verifique a pendência no sistema e acompanhe a regularização.
```

### Evento
Responsavel/RT sobre profissional com licenca vencida.

## Nota operacional sobre regra separada para RT
O backend e a UI agora permitem criar regra exclusiva para RT:
- marcar `Notificar RT`;
- desmarcar `Notificar profissional`;
- selecionar um template `responsible_*`.
