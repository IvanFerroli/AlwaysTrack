# Documento Central — Local Video to TXT Transcriber

## 1. Objetivo do projeto

Construir uma ferramenta local, pessoal e minimalista para transcrever **um vídeo por vez** em um arquivo `.txt` simples.

A primeira versão deve fazer apenas isto:

```txt
entrada: arquivo de vídeo ou áudio local
processamento: transcrição local com Whisper/faster-whisper
saída: arquivo .txt corrido, simples, sem timestamps
```

Este projeto **não é um SaaS**, **não precisa de frontend**, **não precisa de banco de dados**, **não precisa de login**, **não precisa de fila**, **não precisa de API HTTP** e **não precisa de suporte a múltiplos arquivos ao mesmo tempo**.

A saída será tratada com IA posteriormente, então o texto bruto pode ser simples. O foco é velocidade de implementação, uso local e estabilidade.

---

## 2. Escopo fechado da V1

### 2.1 O que a V1 deve fazer

A aplicação deve:

1. Receber o caminho de um arquivo local via terminal.
2. Validar se o arquivo existe.
3. Carregar um modelo local de transcrição.
4. Transcrever o conteúdo falado do vídeo/áudio.
5. Gerar um arquivo `.txt` no mesmo diretório do arquivo de entrada.
6. Escrever o texto de forma corrida/simples.
7. Exibir no terminal o caminho do `.txt` gerado.
8. Rodar localmente no PC do usuário.

Exemplo esperado:

```bash
python transcrever.py "/mnt/c/Users/ACER/Videos/aula.mp4"
```

Saída esperada:

```txt
TXT gerado: /mnt/c/Users/ACER/Videos/aula.txt
```

---

### 2.2 O que a V1 NÃO deve fazer

A V1 não deve implementar:

- Interface gráfica.
- Interface web.
- Upload por navegador.
- API REST.
- Banco de dados.
- Login.
- Histórico de arquivos.
- Processamento em lote.
- Fila de jobs.
- Separação por locutor.
- Legendas `.srt` ou `.vtt`.
- Timestamps.
- Tradução.
- Resumo automático.
- Correção com IA.
- Integração com OpenAI API.
- Cobrança.
- Docker.
- Deploy.
- Cloud.
- GPU obrigatória.

Qualquer agente que tentar adicionar esses itens deve ser corrigido. Eles pertencem a versões futuras, não à V1.

---

## 3. Stack escolhida

### 3.1 Linguagem

Usar **Python**.

Motivos:

- Simples para scripts locais.
- Ecossistema maduro para transcrição.
- Fácil de rodar no WSL/Ubuntu.
- Não exige backend completo.
- Menor atrito para MVP local.

---

### 3.2 Biblioteca principal

Usar **faster-whisper**.

Motivos:

- Permite rodar Whisper localmente.
- Não cobra por minuto.
- Funciona bem para transcrição offline depois que o modelo foi baixado.
- É mais adequado para uso local do que chamar uma API paga.
- Permite começar em CPU e evoluir para GPU depois.

---

### 3.3 Ambiente alvo

Ambiente principal:

```txt
PC pessoal
Windows + WSL2 Ubuntu
Python 3
CPU primeiro
GPU opcional no futuro
```

Hardware informado:

```txt
Notebook Predator Helios Neo 16
CPU: Intel i7-13650HX
GPU: RTX 4060
RAM: 16 GB
```

A V1 deve priorizar CPU para evitar atrito com CUDA/cuDNN. A GPU pode ser documentada como melhoria futura, mas não deve ser requisito de entrega.

---

## 4. Decisão importante: CPU primeiro

A primeira versão deve rodar em CPU.

Linha esperada:

```python
model = WhisperModel("small", device="cpu", compute_type="int8")
```

Motivo:

- Menos configuração.
- Menor chance de erro.
- Não depende de CUDA.
- Mais fácil para o pipeline agentic concluir rapidamente.
- O i7-13650HX é forte o suficiente para uso pessoal.

Aceleração via GPU pode entrar depois, trocando para:

```python
model = WhisperModel("medium", device="cuda", compute_type="float16")
```

Mas isso não faz parte da V1.

---

## 5. Modelo padrão

Modelo padrão da V1:

```txt
small
```

Justificativa:

- Melhor equilíbrio inicial entre velocidade, memória e qualidade.
- Mais confiável que `tiny`/`base`.
- Menos pesado que `medium`/`large-v3`.
- Adequado para primeira versão pessoal.

O código deve permitir alterar facilmente o modelo depois.

Sugestão:

```python
MODEL_SIZE = "small"
```

---

## 6. Estrutura de pastas desejada

Criar uma pasta simples:

```txt
video-transcriber/
├── transcrever.py
├── requirements.txt
├── README.md
└── outputs/                 # opcional; V1 pode salvar ao lado do vídeo
```

Para a V1, o comportamento preferido é salvar o `.txt` no mesmo diretório do arquivo original.

Exemplo:

```txt
entrada:
C:/Users/ACER/Videos/aula.mp4

saída:
C:/Users/ACER/Videos/aula.txt
```

No WSL, o caminho seria:

```txt
/mnt/c/Users/ACER/Videos/aula.mp4
/mnt/c/Users/ACER/Videos/aula.txt
```

---

## 7. Instalação local

### 7.1 Criar projeto

```bash
mkdir -p ~/video-transcriber
cd ~/video-transcriber
```

### 7.2 Criar ambiente virtual

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 7.3 Instalar dependências

```bash
pip install faster-whisper
```

### 7.4 Gerar requirements.txt

```bash
pip freeze > requirements.txt
```

---

## 8. Código-alvo da V1

Arquivo:

```txt
video-transcriber/transcrever.py
```

Conteúdo esperado:

```python
from pathlib import Path
import sys
from faster_whisper import WhisperModel


MODEL_SIZE = "small"
DEVICE = "cpu"
COMPUTE_TYPE = "int8"
LANGUAGE = "pt"


def validar_entrada(argv: list[str]) -> Path:
    if len(argv) < 2:
        print("Uso: python transcrever.py caminho/do/video.mp4")
        sys.exit(1)

    entrada = Path(argv[1]).expanduser()

    if not entrada.exists():
        print(f"Arquivo não encontrado: {entrada}")
        sys.exit(1)

    if not entrada.is_file():
        print(f"O caminho informado não é um arquivo: {entrada}")
        sys.exit(1)

    return entrada


def transcrever_arquivo(entrada: Path) -> str:
    model = WhisperModel(
        MODEL_SIZE,
        device=DEVICE,
        compute_type=COMPUTE_TYPE,
    )

    segments, info = model.transcribe(
        str(entrada),
        language=LANGUAGE,
        vad_filter=True,
    )

    partes: list[str] = []

    for segment in segments:
        texto = segment.text.strip()

        if texto:
            partes.append(texto)

    texto_final = " ".join(partes).strip()

    if not texto_final:
        print("Aviso: nenhuma fala foi transcrita.")
        return ""

    return texto_final


def salvar_txt(entrada: Path, texto: str) -> Path:
    saida = entrada.with_suffix(".txt")

    with open(saida, "w", encoding="utf-8") as arquivo:
        arquivo.write(texto)
        arquivo.write("\n")

    return saida


def main() -> None:
    entrada = validar_entrada(sys.argv)

    print(f"Arquivo de entrada: {entrada}")
    print("Iniciando transcrição...")

    texto = transcrever_arquivo(entrada)
    saida = salvar_txt(entrada, texto)

    print(f"TXT gerado: {saida}")


if __name__ == "__main__":
    main()
```

---

## 9. Comando de uso

Dentro da pasta do projeto:

```bash
cd ~/video-transcriber
source .venv/bin/activate
```

Rodar:

```bash
python transcrever.py "/mnt/c/Users/ACER/Videos/meu-video.mp4"
```

Resultado esperado:

```txt
/mnt/c/Users/ACER/Videos/meu-video.txt
```

---

## 10. README mínimo esperado

Arquivo:

```txt
video-transcriber/README.md
```

Conteúdo sugerido:

```md
# Local Video to TXT Transcriber

Ferramenta local e simples para transformar vídeo/áudio em texto `.txt`.

## Escopo

- Uso pessoal.
- Local.
- Um arquivo por vez.
- Entrada: vídeo ou áudio.
- Saída: `.txt` corrido.
- Sem API.
- Sem frontend.
- Sem banco.
- Sem SRT.
- Sem timestamps.

## Instalação

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Uso

```bash
python transcrever.py "/caminho/do/video.mp4"
```

## Saída

O arquivo `.txt` será salvo ao lado do arquivo original.
```

---

## 11. Critérios de aceite / Definition of Done

A task só está concluída quando:

1. O projeto possui `transcrever.py`.
2. O projeto possui `requirements.txt`.
3. O script roda via terminal.
4. O script aceita o caminho de um arquivo como argumento.
5. O script valida se o arquivo existe.
6. O script transcreve um arquivo de vídeo/áudio.
7. O script gera um `.txt` no mesmo diretório do arquivo original.
8. O `.txt` contém apenas texto corrido.
9. O `.txt` não contém timestamps.
10. O `.txt` não contém blocos SRT.
11. O projeto não possui frontend.
12. O projeto não possui backend/API.
13. O projeto não possui banco.
14. O projeto não usa serviços pagos.
15. O projeto roda localmente.

---

## 12. Tasks deriváveis para o pipeline agentic

### Task 1 — Criar estrutura inicial

Criar pasta do projeto com:

```txt
video-transcriber/
├── transcrever.py
├── requirements.txt
└── README.md
```

Critério de aceite:

- Arquivos existem.
- Nenhum framework desnecessário foi adicionado.

---

### Task 2 — Configurar dependência principal

Adicionar dependência:

```txt
faster-whisper
```

Critério de aceite:

- `requirements.txt` contém `faster-whisper` e dependências congeladas.
- Ambiente virtual consegue instalar dependências com `pip install -r requirements.txt`.

---

### Task 3 — Implementar validação de entrada

Implementar leitura de argumento via terminal:

```bash
python transcrever.py caminho/do/video.mp4
```

Critério de aceite:

- Sem argumento: mostra instrução de uso.
- Arquivo inexistente: mostra erro claro.
- Pasta em vez de arquivo: mostra erro claro.
- Arquivo válido: segue para transcrição.

---

### Task 4 — Implementar transcrição local

Usar `WhisperModel` com:

```python
MODEL_SIZE = "small"
DEVICE = "cpu"
COMPUTE_TYPE = "int8"
LANGUAGE = "pt"
```

Critério de aceite:

- Modelo carrega.
- Transcrição roda localmente.
- Não há chamada para API externa paga.
- O script funciona com vídeo local.

---

### Task 5 — Gerar TXT corrido

Salvar saída em:

```python
entrada.with_suffix(".txt")
```

Critério de aceite:

- O arquivo `.txt` é criado ao lado do vídeo.
- O texto está em formato corrido.
- Não há timestamps.
- Não há índice de legenda.
- Não há formato SRT.

---

### Task 6 — Criar README de uso

Documentar:

- Objetivo.
- Escopo.
- Instalação.
- Uso.
- Saída esperada.
- Limitações da V1.

Critério de aceite:

- README permite que o usuário rode o projeto sem perguntar nada.
- README não promete funcionalidades fora do escopo.

---

### Task 7 — Teste manual

Testar com um arquivo pequeno.

Critério de aceite:

- Rodar o comando com um vídeo real.
- Confirmar que o `.txt` foi gerado.
- Confirmar que o conteúdo é texto simples.
- Confirmar que o script não criou arquivos extras desnecessários.

---

## 13. Regras para agentes construtores

Os agentes devem obedecer às seguintes regras:

1. Não adicionar frontend.
2. Não adicionar Flask/FastAPI/Express.
3. Não adicionar banco de dados.
4. Não adicionar Docker.
5. Não adicionar upload.
6. Não adicionar batch/múltiplos arquivos.
7. Não adicionar `.srt`.
8. Não adicionar timestamp.
9. Não adicionar integração com API paga.
10. Não transformar o projeto em SaaS.
11. Não criar arquitetura complexa.
12. Não criar abstrações prematuras.
13. Não criar classes desnecessárias.
14. Não criar sistema de configuração complexo.
15. Não otimizar para GPU na V1.

O objetivo é entregar algo simples, funcional e local.

---

## 14. Possíveis melhorias futuras

Estas ideias não fazem parte da V1:

- Suporte a GPU.
- Parâmetro `--model`.
- Parâmetro `--language`.
- Parâmetro `--output`.
- Modo batch.
- Interface gráfica simples.
- Barra de progresso.
- Separação por locutor.
- Exportação `.srt`.
- Exportação `.vtt`.
- Pós-processamento com IA.
- Resumo automático.
- Correção gramatical.
- Watch folder.
- Integração com Obsidian/Notion.
- Empacotamento como `.exe`.

---

## 15. Estratégia de implementação recomendada

Implementar na seguinte ordem:

```txt
1. Criar pasta e arquivos
2. Criar venv
3. Instalar faster-whisper
4. Implementar validação do argumento
5. Implementar carregamento do modelo
6. Implementar transcrição
7. Juntar segmentos em texto corrido
8. Salvar .txt
9. Testar com vídeo curto
10. Ajustar README
```

Não pular direto para otimizações.

---

## 16. Testes manuais sugeridos

### Teste 1 — Sem argumento

Comando:

```bash
python transcrever.py
```

Resultado esperado:

```txt
Uso: python transcrever.py caminho/do/video.mp4
```

---

### Teste 2 — Arquivo inexistente

Comando:

```bash
python transcrever.py "/mnt/c/Users/ACER/Videos/nao-existe.mp4"
```

Resultado esperado:

```txt
Arquivo não encontrado: /mnt/c/Users/ACER/Videos/nao-existe.mp4
```

---

### Teste 3 — Vídeo válido

Comando:

```bash
python transcrever.py "/mnt/c/Users/ACER/Videos/teste.mp4"
```

Resultado esperado:

```txt
Arquivo de entrada: /mnt/c/Users/ACER/Videos/teste.mp4
Iniciando transcrição...
TXT gerado: /mnt/c/Users/ACER/Videos/teste.txt
```

---

### Teste 4 — Verificar saída

Abrir o `.txt`.

Resultado esperado:

```txt
Texto transcrito em formato corrido, sem timestamp e sem legenda.
```

---

## 17. Comportamento esperado em erros

A V1 deve tratar apenas erros básicos:

- Arquivo ausente.
- Caminho inválido.
- Caminho apontando para pasta.
- Transcrição sem fala detectada.

Não precisa implementar tratamento avançado para:

- Arquivo corrompido.
- Formato não suportado.
- Falta de memória.
- Instalação quebrada.
- GPU indisponível.

Esses casos podem ser tratados manualmente pelo usuário.

---

## 18. Decisão final de produto

Este projeto deve ser pensado como uma ferramenta pessoal de linha de comando.

A meta não é criar uma plataforma.
A meta não é impressionar visualmente.
A meta não é escalar.
A meta é resolver uma dor prática:

```txt
Tenho um vídeo local.
Quero obter um .txt rapidamente.
Vou usar esse texto em outro fluxo de IA depois.
```

Qualquer implementação que fuja disso deve ser considerada fora de escopo.
