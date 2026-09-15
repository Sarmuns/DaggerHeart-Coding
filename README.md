# Duality Dice — Rolagem de Dados do Daggerheart

Site multiplayer leve para rolar os dois dados do Daggerheart (Esperança/Hope e
Medo/Fear) numa sala compartilhada, com animação, cor por jogador e cálculo
automático do resultado (Sucesso/Falha com Esperança ou Medo, ou Crítico).

## Stack

- **Frontend**: React 19 + Vite
- **Estado/Realtime**: Supabase (Postgres + Realtime)
- **Dados 3D**: [@gnuton/css-dice-roller](https://github.com/gnuton/css-dice-roller)

## Rodando o projeto localmente

### 1. Instalar as dependências

```bash
npm install
```

### 2. Configurar as variáveis de ambiente

Já existe um arquivo `.env.local` na raiz do projeto com as credenciais do
Supabase (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`). Se precisar recriar,
pegue os valores em:

https://supabase.com/dashboard/project/whujybpgnpiyuyjdwlzj/settings/api

```bash
VITE_SUPABASE_URL=https://whujybpgnpiyuyjdwlzj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

> A senha de acesso ao painel do Supabase é `daggerheartsupa`.

### 3. Rodar em modo desenvolvimento

```bash
npm run dev
```

Abre em `http://localhost:5173`. Para testar o multiplayer, abra a mesma URL
em duas abas/navegadores diferentes.

### 4. Buildar para produção

```bash
npm run build
```

Gera os arquivos finais em `dist/`.

### 5. Ver o build de produção localmente

```bash
npm run preview
```

### 6. Rodar o linter

```bash
npm run lint
```

## Estrutura do código

```
src/
├── App.jsx                      # Roteamento simples entre as 3 telas (Home → PlayerSetup → Room)
├── components/
│   ├── Home.jsx                 # Tela inicial: criar sala ou entrar em sala
│   ├── PlayerSetup.jsx          # Tela de identidade: nome + cores do jogador
│   ├── Room.jsx                 # Tela da sala: rolagem dos dados + histórico
│   ├── ColorSettingsPanel.jsx   # Painel para editar nome/cores dentro da sala
│   ├── ColorSwatchPicker.jsx    # Paleta de cores fixa reutilizável (jogador)
│   └── ColorInput.jsx           # Input de cor customizada (hex + color picker)
├── utils/
│   ├── dice.js                  # Regras do jogo: rolar dados e calcular resultado
│   ├── cores.js                 # Paleta fixa de cores dos jogadores
│   └── codigo.js                # Geração do código curto da sala
└── lib/
    └── supabase.js              # Cliente Supabase (usa as env vars acima)
```

## Regras da rolagem

- Rola 2 dados de 12 lados: um é **Hope**, outro é **Fear**.
- `Hope > Fear` → Sucesso/Falha **com Esperança**
- `Fear > Hope` → Sucesso/Falha **com Medo**
- `Hope == Fear` → **Crítico**

A lógica fica isolada em `src/utils/dice.js` (`rolarDados`, `calcularResultado`,
`textoResultado`) — sem estado, sem UI, fácil de testar.

## Setup do banco (Supabase)

Rodar no SQL editor do Supabase (uma vez só):

```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  senha_hash text not null,
  criada_em timestamp default now()
);

create table rolls (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  jogador text not null,
  cor text not null,
  dado_hope int not null,
  dado_fear int not null,
  resultado text not null,
  criado_em timestamp default now()
);
```

Depois, ativar o Realtime na tabela `rolls` em **Database > Replication**.

O checklist completo de fases do projeto (o que já foi feito e o que falta)
está em `claude.md`.

## Deploy

1. Subir o repositório pro GitHub.
2. Conectar no Vercel ou Netlify (free tier).
3. Configurar as mesmas variáveis de ambiente (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) no painel de deploy.
4. Deploy automático a cada push.
