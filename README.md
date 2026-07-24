# 💳 Fin Bank — Sistema Bancário

Uma carteira digital construída do zero: **API em Django** no
backend e **interface em React** no frontend, com autenticação, transferências
entre usuários (Pix) e extrato — tudo com as regras de negócio e as
preocupações de segurança de um sistema financeiro real, em escala reduzida.

Este projeto foi feito para estudar e demonstrar, na prática, como um sistema
full stack é construído de ponta a ponta: modelagem de dados, API REST, regras
de negócio, autenticação, e uma interface que consome tudo isso.

---

## Índice

- [O que o app faz](#-o-que-o-app-faz)
- [Como é por dentro (arquitetura)](#️-como-é-por-dentro-arquitetura)
- [Tecnologias usadas](#️-tecnologias-usadas)
- [Estrutura de pastas](#-estrutura-de-pastas)
- [Como rodar o projeto na sua máquina](#-como-rodar-o-projeto-na-sua-máquina)
- [Endpoints da API](#-endpoints-da-api)
- [Regras de negócio: pessoa física x empresa](#-regras-de-negócio-pessoa-física-x-empresa)
- [Segurança](#-segurança)
- [Testes automatizados](#-testes-automatizados)
- [Identidade visual](#-identidade-visual)
- [Deploy e CI/CD](#️-deploy-e-cicd)
- [Limitações conhecidas e próximos passos](#-limitações-conhecidas-e-próximos-passos)
- [Autora](#-autora)

---

## 📱 O que o app faz

Fin Bank é uma versão simplificada de uma carteira digital.
Um usuário pode:

1. **Criar uma conta**, como pessoa física (CPF) ou como empresa (CNPJ) — toda
   conta nova já começa com **R$ 500,00** de saldo.
2. **Fazer login** e ver seu saldo.
3. **Transferir dinheiro para outra pessoa (Pix)**, buscando o destinatário
   pelo CPF/CNPJ ou e-mail.
4. **Ver o extrato** de tudo que enviou e recebeu, com busca por nome.
5. **Receber um comprovante** ao final de cada transferência.

Contas do tipo **empresa** só podem *receber* dinheiro.

---

## 🏗️ Como é por dentro (arquitetura)

O projeto é dividido em duas partes que conversam por HTTP (API REST em
JSON), exatamente como um app bancário de verdade separa "o banco" (backend)
de "o aplicativo" (frontend):

```mermaid
flowchart LR
    subgraph Frontend["Frontend — React (Fin Bank)"]
        A[Login / Cadastro]
        B[Home]
        C[Extrato]
        D[Pix]
    end

    subgraph Backend["Backend — Django Ninja"]
        E["/api/users/*"]
        F["/api/payments/*"]
        G[(Banco de dados)]
    end

    A -- "e-mail/senha" --> E
    B -- "token Bearer" --> E
    C -- "token Bearer" --> F
    D -- "token Bearer" --> F
    E --> G
    F --> G
```

- O **backend** guarda os dados (usuários, saldos, transações), aplica as
  regras de negócio e expõe tudo através de uma API.
- O **frontend** é só a "vitrine": ele não confia em nada que o usuário
  digita sem antes confirmar com o backend. Toda regra importante (saldo
  suficiente, permissão para transferir, etc.) é validada nos dois lados —
  no frontend para dar feedback rápido, e no backend porque é lá que a regra
  realmente vale.
- A comunicação entre os dois é autenticada por **token**: depois do login,
  o frontend guarda um token e o envia em toda requisição, provando "quem ele
  é" para o backend.

---

## 🛠️ Tecnologias usadas

### Backend

| Tecnologia | Para que serve aqui |
|---|---|
| **Python 3.11 + Django 5** | Framework principal, cuida do banco de dados e das regras de negócio |
| **Django Ninja** | Cria a API REST (parecido com o Django REST Framework, mas mais leve e com validação de dados via Pydantic) |
| **SQLite** | Banco de dados local, simples de rodar sem instalar nada extra |
| **django-role-permissions** | Controla o que cada tipo de conta (pessoa física / empresa) pode fazer |
| **django-cors-headers** | Permite que o frontend (em outra porta) converse com a API com segurança |
| **Celery + Redis** | Fila de tarefas assíncronas — usada para disparar notificações de transação sem travar a resposta da API |

### Frontend

| Tecnologia | Para que serve aqui |
|---|---|
| **React 19 + TypeScript** | Interface do usuário, com tipagem para evitar bugs bobos |
| **Vite** | Servidor de desenvolvimento e build, rápido e moderno |
| **Tailwind CSS v4** | Estilização (o tema preto/branco/dourado da marca Fin Bank) |
| **React Router** | Navegação entre as telas (login, home, extrato, pix...) |
| **Axios** | Chamadas HTTP para a API do backend |

### Deploy e infraestrutura

| Tecnologia | Para que serve aqui |
|---|---|
| **Docker** | Empacota o backend (Python + Gunicorn) numa imagem única, igual em qualquer ambiente |
| **Azure Container Registry (ACR)** | Guarda as imagens Docker do backend |
| **Azure Container Apps** | Roda o container do backend em produção (plano Consumption, escala a zero) |
| **Azure Files** | Volume persistente montado no Container App, onde vive o `db.sqlite3` — sobrevive a restart/redeploy/scale-to-zero |
| **Azure Static Web Apps** | Hospeda o build estático do frontend (React) em produção |
| **GitHub Actions** | Pipeline de CI/CD: builda e publica backend e frontend a cada push na `main` |

---

## 📂 Estrutura de pastas

```
finbank/
├── core/                 # Configurações gerais do Django (settings, urls, celery)
├── users/                # Tudo sobre usuários: model, autenticação, validação de CPF/CNPJ
├── payments/             # Tudo sobre transferências: model, regras de negócio
├── requirements.txt      # Dependências do backend
├── manage.py             # Ponto de entrada do Django
│
└── frontend/             # Aplicação React (Fin Bank)
    └── src/
        ├── api/          # Funções que conversam com o backend (login, extrato, pix...)
        ├── components/   # Peças reutilizáveis de interface (botões, cards, menu...)
        ├── context/      # Estado global de autenticação (quem está logado)
        ├── hooks/        # Lógica reutilizável (ex: buscar transações)
        ├── pages/        # As telas em si (Login, Home, Extrato, Pix...)
        └── utils/        # Formatação de moeda/data e validações (CPF/CNPJ, e-mail...)
```

---

## 🚀 Como rodar o projeto na sua máquina

Pré-requisitos: **Python 3.11+** e **Node.js 18+** instalados. Redis é
opcional (só é usado se você quiser testar o envio assíncrono de
notificações — sem ele, o resto do app funciona normalmente).

### 1. Backend (a API)

```bash
# na raiz do projeto
python -m venv venv
source venv/bin/activate          # no Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate          # cria o banco de dados local
python manage.py runserver 8005   # sobe a API em http://localhost:8005
```

### 2. Frontend (a interface)

Em outro terminal:

```bash
cd frontend
cp .env.example .env    # já vem configurado para falar com localhost:8005
npm install
npm run dev              # sobe o app em http://localhost:3000
```

Abra **http://localhost:3000**, crie uma conta e pronto — o app já está
funcionando ponta a ponta.

---

## 📡 Endpoints da API

Todos os endpoints ficam sob o prefixo `/api/`. Os marcados com 🔒 exigem o
cabeçalho `Authorization: Bearer <token>` (obtido no login).

| Método | Rota | Protegido? | O que faz |
|---|---|:---:|---|
| `POST` | `/users/` | — | Cria uma conta nova (pessoa física ou empresa) |
| `POST` | `/users/login/` | — | Faz login e retorna um token de acesso |
| `POST` | `/users/logout/` | 🔒 | Invalida o token atual |
| `GET` | `/users/me/` | 🔒 | Retorna os dados e o saldo do usuário logado |
| `GET` | `/users/search/?q=` | 🔒 | Busca um destinatário por CPF/CNPJ ou e-mail (exato) |
| `POST` | `/payments/` | 🔒 | Faz uma transferência para outro usuário |
| `GET` | `/payments/` | 🔒 | Lista o extrato (envios e recebimentos) do usuário logado |

---

## 👥 Regras de negócio: pessoa física x empresa

O tipo de conta define o que o usuário pode fazer:

| Permissão | Pessoa física | Empresa |
|---|:---:|:---:|
| Enviar dinheiro | ✅ | ❌ |
| Receber dinheiro | ✅ | ✅ |

Ou seja: uma conta de **empresa** funciona como uma conta de recebimento (tipo
um lojista), ela pode vender e receber, mas não pode fazer transferências
para outras contas.

---

## 🔒 Segurança

Alguns cuidados que foram tomados de propósito, pensando em como um sistema
que mexe com dinheiro precisa se comportar:

- **Senhas nunca são guardadas em texto puro** — o Django faz o hash antes de
  salvar no banco.
- **Toda ação sensível exige autenticação** por token (ver extrato, transferir
  dinheiro, ver o próprio perfil).
- **Quem paga é sempre "quem está logado", nunca um ID enviado pelo
  cliente.** Isso evita um problema clássico de segurança (conhecido como
  IDOR), em que alguém mal-intencionado poderia tentar descontar saldo da
  conta de outra pessoa só trocando um número na requisição.
- **CPF/CNPJ são validados com o algoritmo real de dígito verificador**,
  tanto no frontend (feedback na hora) quanto no backend (validação que
  realmente vale).
- **CORS restrito**: só o endereço do frontend (`localhost:3000` em
  desenvolvimento) pode fazer requisições à API — não é uma API aberta para
  qualquer site.
- **Busca de destinatário só por dado exato** (CPF/CNPJ ou e-mail completo) —
  não existe uma busca por nome parcial, para não permitir que qualquer
  pessoa logada consiga "listar" outros usuários do sistema.

---

## 🧪 Testes automatizados

O backend tem testes cobrindo as partes mais sensíveis: autenticação, busca
de usuários e as regras de transferência (saldo insuficiente, permissões por
tipo de conta, impedir transferência para si mesmo).

```bash
python manage.py test
```

---

## 🎨 Identidade visual

O frontend segue uma identidade visual própria — **preto, branco e dourado**
— pensada para transmitir a seriedade de um app financeiro, com um toque
premium. A interface é **responsiva** e pensada primeiro para web: em telas
maiores, a navegação fica em uma barra lateral fixa e o conteúdo se organiza
em um painel amplo (saldo, dados da conta e transações lado a lado); em
telas pequenas, o mesmo conteúdo se reorganiza em uma única coluna com
navegação inferior, no formato de app.

---

## ☁️ Deploy e CI/CD

O app roda em produção na **Azure**, com backend e frontend publicados
separadamente:

```mermaid
flowchart LR
    subgraph GH["GitHub"]
        M[push na main]
    end

    subgraph Actions["GitHub Actions"]
        WB[backend.yml]
        WF[frontend.yml]
    end

    subgraph Azure["Azure"]
        ACR[(Container Registry)]
        CA[Container Apps
        backend / Django]
        AF[(Azure Files
        db.sqlite3)]
        SWA[Static Web Apps
        frontend / React]
    end

    M --> WB
    M --> WF
    WB -- "docker build/push" --> ACR
    ACR -- "az containerapp update" --> CA
    CA -- "volume mount" --- AF
    WF -- "npm run build" --> SWA
```

- **Backend** roda como container no **Azure Container Apps** (plano
  Consumption, escala a zero quando ocioso). A imagem é buildada a partir do
  [`Dockerfile`](Dockerfile) (Python 3.11 + Gunicorn) e publicada no **Azure
  Container Registry**. O [`entrypoint.sh`](entrypoint.sh) roda as migrations
  antes de subir o servidor.
- **Frontend** é buildado como site estático (`npm run build`) e publicado no
  **Azure Static Web Apps**, já apontando para a URL do backend via a
  variável `VITE_API_URL`.
- **CI/CD** é feito por dois workflows independentes do GitHub Actions, cada
  um disparado só quando os arquivos relevantes mudam num push na `main`:
  - [`.github/workflows/backend.yml`](.github/workflows/backend.yml): login
    na Azure, build e push da imagem Docker (tag com o SHA do commit e
    `latest`) e atualização do Container App para usar a nova imagem.
  - [`.github/workflows/frontend.yml`](.github/workflows/frontend.yml):
    instala dependências, builda o frontend e publica no Static Web Apps.
- O provisionamento inicial de toda a infraestrutura (resource group, ACR,
  ambiente do Container Apps, a Storage Account + File Share do Azure Files,
  o Container App e o Static Web App) é feito uma única vez pelo script
  [`deploy/azure-deploy.sh`](deploy/azure-deploy.sh) — depois disso, quem
  cuida de manter tudo atualizado são os workflows do GitHub Actions.
- **Persistência do banco:** o `db.sqlite3` fica num **volume do Azure
  Files** montado no Container App (`DB_PATH=/data/db.sqlite3`), então os
  dados sobrevivem a restart, redeploy e ao scale-to-zero do plano
  Consumption. `max-replicas` fica travado em `1` de propósito, já que
  SQLite sobre um share de rede não aguenta múltiplos writers concorrentes.

---

## 🔭 Limitações conhecidas e próximos passos

Este projeto tem escopo propositalmente enxuto. Coisas que ficaram de fora,
mas que dariam para evoluir:

- Depósito/recarga de saldo (hoje o saldo só muda por transferência).
- Cartão de crédito e fatura.
- Notificações reais por e-mail/push (hoje a fila do Celery já existe, mas a
  notificação em si é só um exemplo simples).
- Limite de tentativas de login (rate limiting).
- Banco de dados gerenciado em produção — hoje é SQLite sobre um volume do
  Azure Files (ver [Deploy e CI/CD](#️-deploy-e-cicd)), o que já resolve a
  persistência dos dados, mas não é o ideal para concorrência real. Um passo
  natural de evolução seria migrar para um Postgres gerenciado.

---

## 👩‍💻 Autora

Feito por **Bárbara de Figueredo Matias**
— [github.com/BarbaraFigueredo](https://github.com/BarbaraFigueredo)
