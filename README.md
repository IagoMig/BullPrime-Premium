# 🥩 Bull Prime Premium — Site Institucional

> Site institucional premium para a **Bull Prime**, referência em carnes nobres em Curitiba e Joinville. Desenvolvido com foco em performance, design de luxo e gestão de conteúdo dinâmica via Supabase.

![Status](https://img.shields.io/badge/Status-Produção-brightgreen)
![Versão](https://img.shields.io/badge/Versão-1.0.0-c9a96e)
![Autor](https://img.shields.io/badge/Dev-Iago%20Oliveira-blue)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Setup & Instalação](#-setup--instalação)
- [Configuração do Supabase](#-configuração-do-supabase)
- [Painel Administrativo](#-painel-administrativo)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)
- [Autor](#-autor)

---

## 🎯 Sobre o Projeto

O site Bull Prime Premium é uma plataforma institucional que apresenta a marca, seus produtos (Wagyu, Dry Aged, Angus, Cordeiro), unidades e serviços de eventos. Conta com:

- **Homepage** com hero banner, diferenciais, showcase de cortes, linhas de produtos e unidades
- **5 páginas secundárias**: Sobre, Cardápio, Unidades, Eventos e Contato
- **Painel administrativo** completo para gerenciar todo o conteúdo do site
- **Integração com Supabase** para conteúdo dinâmico e formulários de contato
- **Design premium** dark mode com acentos dourados, glassmorphism e animações suaves

---

## 🛠 Stack Tecnológica

| Tecnologia | Uso |
|---|---|
| **HTML5** | Estrutura semântica |
| **CSS3** | Design system completo (vanilla, sem frameworks) |
| **JavaScript ES6+** | Lógica, componentes dinâmicos e integrações |
| **Supabase** | Backend-as-a-Service (PostgreSQL, Auth, RLS) |
| **Google Fonts** | Tipografia (Lato) |
| **Fontes Custom** | Restweek (display), Lato Light (body) |

### Por que não usar frameworks?

A decisão de não utilizar React, Vue ou similares foi intencional:

1. **Performance máxima**: Zero overhead de runtime. O site carrega instantaneamente.
2. **SEO nativo**: HTML estático é indexável por qualquer crawler.
3. **Simplicidade de deploy**: Qualquer servidor estático (Netlify, Vercel, S3) serve o site.
4. **Manutenibilidade**: Sem build tools, sem node_modules, sem dependências complexas.

---

## 📐 Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  HTML5   │  │   CSS3   │  │   JS     │          │
│  │  Pages   │  │  Design  │  │  Logic   │          │
│  │          │  │  System  │  │          │          │
│  └────┬─────┘  └──────────┘  └────┬─────┘          │
│       │                           │                 │
│       └───────────┬───────────────┘                 │
│                   │                                 │
│         ┌─────────▼─────────┐                       │
│         │  Content Loader   │                       │
│         │  (localStorage    │                       │
│         │   cache 5min)     │                       │
│         └─────────┬─────────┘                       │
└───────────────────│─────────────────────────────────┘
                    │ REST API
          ┌─────────▼─────────┐
          │     SUPABASE      │
          │                   │
          │  ┌─────────────┐  │
          │  │ PostgreSQL  │  │
          │  │ (8 tabelas) │  │
          │  └─────────────┘  │
          │  ┌─────────────┐  │
          │  │    Auth      │  │
          │  │  (Admin)     │  │
          │  └─────────────┘  │
          │  ┌─────────────┐  │
          │  │    RLS       │  │
          │  │ (Policies)   │  │
          │  └─────────────┘  │
          └───────────────────┘
```

### Fluxo de dados:

1. O site carrega com **conteúdo estático** (fallback no HTML)
2. O `content.js` busca conteúdo atualizado do **Supabase** via REST API
3. O conteúdo é cacheado no **localStorage** por 5 minutos
4. Se o Supabase estiver indisponível, o conteúdo estático permanece visível
5. O **painel admin** usa Supabase Auth para autenticação e permite CRUD completo

---

## 🚀 Setup & Instalação

### Pré-requisitos

- Um navegador moderno (Chrome, Firefox, Edge, Safari)
- Conta no [Supabase](https://supabase.com) (gratuita)
- Servidor HTTP local para desenvolvimento (recomendado)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/bullprime-premium.git
cd bullprime-premium

# 2. Inicie um servidor local (opção 1: Python)
python -m http.server 8000

# 3. Ou use o Live Server do VS Code
# Instale a extensão "Live Server" e clique em "Go Live"

# 4. Acesse no navegador
# http://localhost:8000
```

> **Nota**: O site precisa ser servido via HTTP (não funciona abrindo o arquivo diretamente) por conta das chamadas ao Supabase e carregamento de componentes.

---

## 🗄 Configuração do Supabase

### 1. Criar o projeto

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote a **URL** e a **anon key**

### 2. Executar o schema

1. No painel do Supabase, vá em **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase/schema.sql`
3. Cole no editor e clique em **Run**
4. Isso criará todas as tabelas, triggers, policies RLS e dados iniciais (seed)

### 3. Configurar autenticação

1. No Supabase, vá em **Authentication > Users**
2. Clique em **Add User > Create New User**
3. Defina email e senha para o administrador
4. Esse usuário terá acesso ao painel admin do site

### 4. Atualizar credenciais (se necessário)

As credenciais do Supabase estão nos arquivos:

- `src/js/supabase.js` — Cliente para o site público
- `src/js/admin.js` — Cliente para o painel admin

```javascript
const SUPABASE_URL = 'https://sua-url.supabase.co';
const SUPABASE_KEY = 'sua-anon-key';
```

### Tabelas do banco

| Tabela | Descrição | RLS |
|---|---|---|
| `site_content` | Textos editáveis (key-value por seção) | Leitura pública, escrita admin |
| `hero_slides` | Slides do banner principal | Leitura de ativos, escrita admin |
| `product_lines` | Linhas de produtos (Black Series, etc.) | Leitura de ativos, escrita admin |
| `cuts` | Cortes individuais de carne | Leitura de ativos, escrita admin |
| `units` | Unidades/restaurantes | Leitura de ativos, escrita admin |
| `events` | Eventos | Leitura de ativos, escrita admin |
| `site_settings` | Configurações gerais | Leitura pública, escrita admin |
| `contact_submissions` | Formulários de contato | Insert público, leitura admin |

---

## 🔐 Painel Administrativo

Acesse o painel admin em `src/pages/admin/login.html`.

### Funcionalidades

- **Dashboard**: Visão geral com estatísticas e mensagens recentes
- **Conteúdo do Site**: Edição de todos os textos do site (hero, diferenciais, sobre, etc.)
- **Hero Banner**: Gerenciamento dos slides do banner principal
- **Linhas de Produtos**: CRUD das linhas (Black Series, 1906, Dia a Dia, etc.)
- **Cortes**: Gerenciamento dos cortes de carne
- **Unidades**: CRUD das unidades/restaurantes
- **Eventos**: Gerenciamento de eventos
- **Mensagens**: Visualização dos formulários de contato recebidos
- **Configurações**: Configurações gerais do site

### Segurança

- Autenticação via **Supabase Auth** (email/senha)
- **Row Level Security (RLS)** no PostgreSQL
- Leitura pública apenas de registros ativos
- Escrita restrita a usuários autenticados
- A chave `anon` do Supabase é segura no frontend (RLS garante a proteção)

---

## 📂 Estrutura do Projeto

```
BullPrime-PREMIUM/
│
├── index.html                    # Homepage
├── README.md                     # Documentação (este arquivo)
│
├── public/                       # Assets estáticos
│   ├── 01.wagyu.jpg              # Imagem Wagyu
│   ├── 02.dryaged.png            # Imagem Dry Aged
│   ├── 03.eventos.png            # Imagem Eventos
│   ├── 04.experiencias.jpg       # Imagem Experiências
│   ├── 05.restaurantes.png       # Imagem Restaurantes
│   ├── 06.blackseries.heic       # Imagem Black Series
│   ├── 07.1906.heic              # Imagem 1906
│   ├── 08.diadia.jpg             # Imagem Dia a Dia
│   ├── 09.cordeiro.jpg           # Imagem Cordeiro
│   ├── Restweek.otf              # Fonte display
│   └── Lato-Light.ttf            # Fonte corpo
│
├── src/
│   ├── css/
│   │   └── styles.css            # Design system completo
│   │
│   ├── js/
│   │   ├── supabase.js           # Cliente Supabase (público)
│   │   ├── content.js            # Carregamento dinâmico de conteúdo
│   │   ├── animations.js         # Animações de scroll e interações
│   │   └── admin.js              # Lógica do painel admin
│   │
│   ├── components/
│   │   ├── header.js             # Navbar dinâmica
│   │   └── footer.js             # Rodapé dinâmico
│   │
│   └── pages/
│       ├── sobre.html            # Página Sobre
│       ├── cardapio.html         # Página Cardápio
│       ├── unidades.html         # Página Unidades
│       ├── eventos.html          # Página Eventos
│       ├── contato.html          # Página Contato
│       └── admin/
│           ├── login.html        # Login admin
│           └── dashboard.html    # Dashboard admin
│
└── supabase/
    └── schema.sql                # Schema SQL completo (copiar no Supabase)
```

---

## 🌐 Deploy

### Netlify (recomendado)

```bash
# Basta fazer push para o GitHub e conectar ao Netlify
# Diretório de publicação: / (raiz)
# Sem build command necessário
```

### Vercel

```bash
# Conecte o repo ao Vercel
# Framework Preset: Other
# Build Command: (vazio)
# Output Directory: ./
```

### Qualquer servidor estático

O site é 100% estático (HTML/CSS/JS). Basta servir os arquivos de qualquer servidor web (Nginx, Apache, S3, etc.).

---

## 🎨 Design Tokens

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#0a0a0a` | Fundo principal |
| `--color-bg-secondary` | `#111111` | Fundo secundário |
| `--color-bg-card` | `#1a1a1a` | Fundo de cards |
| `--color-gold` | `#c9a96e` | Cor de acento principal |
| `--color-gold-light` | `#d4b87a` | Hover/destaque |
| `--color-gold-dark` | `#b8944f` | Variante escura |
| `--color-text` | `#f5f0eb` | Texto principal |
| `--color-text-muted` | `#8a8478` | Texto secundário |
| `--font-display` | `Restweek` | Títulos decorativos |
| `--font-body` | `Lato Light` | Texto corpo |

---

## 👤 Autor

**Iago Oliveira** — Desenvolvedor Full Stack Sênior

Apaixonado por criar experiências digitais premium que elevam marcas ao próximo nível. Especialista em front-end de alta performance, design systems e integrações backend-as-a-service.

---

## 📄 Licença

Este projeto é proprietário da **Bull Prime**. Todos os direitos reservados.

© 2025 Bull Prime — Desenvolvido por Iago Oliveira
