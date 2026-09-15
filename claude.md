# Projeto: Site de Rolagem de Dados Daggerheart (Duality Dice)

## Contexto
Site multiplayer leve onde jogadores entram numa "sala" via código + senha e rolam
os dois dados do Daggerheart (2d12: um dado de Esperança / Hope e um dado de Medo /
Fear) em tempo real, vendo a rolagem uns dos outros com animação, cor por jogador,
e o resultado (Sucesso/Falha com Esperança ou Medo, ou Crítico em caso de empate).

## Stack
- Frontend: React + Vite (ou HTML/CSS/JS puro se preferir simplicidade)
- Backend/estado: Supabase (Postgres + Realtime), free tier
- Hospedagem frontend: Vercel ou Netlify (free tier, deploy via GitHub)

## Regras do jogo (lógica da rolagem)
- Rola 2 dados de 12 lados: um é "Hope", outro é "Fear"
- Hope > Fear → Sucesso/Falha **com Esperança**
- Fear > Hope → Sucesso/Falha **com Medo**
- Hope == Fear → **Crítico**
- (Sucesso vs Falha depende de modificador + dificuldade, mas para a v1 pode
  exibir só a soma dos dados e qual dado "venceu" — não precisa implementar
  dificuldade/modificador na primeira versão, deixar como próxima etapa)

---

## FASE 0 — Setup do projeto (rodar local)
- [x] Criar projeto Vite + React (`npm create vite@latest`)
- [x] Criar projeto no Supabase (supabase.com, free tier) — projeto:
      https://supabase.com/dashboard/project/whujybpgnpiyuyjdwlzj
- [x] Instalar client: `npm install @supabase/supabase-js`
- [ ] Criar arquivo `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
- [ ] Criar cliente Supabase em `src/lib/supabase.js`
- [x] Rodar `npm run dev` e confirmar que a página inicial carrega localmente

## FASE 1 — Schema no Supabase
Criar as tabelas (via SQL editor do Supabase):

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
- [ ] Rodar o SQL acima no Supabase
- [ ] Ativar Realtime na tabela `rolls` (Database > Replication)
- [ ] (Opcional) Ativar Row Level Security básica ou deixar aberto pro MVP

## FASE 2 — Fluxo de sala (local)
- [ ] Tela inicial com dois botões: "Criar sala" / "Entrar em sala"
- [ ] Criar sala: gerar código curto (ex: 5 letras/números), pedir senha,
      inserir na tabela `rooms` (hash da senha com bcrypt ou lib leve tipo `bcryptjs`)
- [ ] Entrar em sala: campo código + senha, validar contra `rooms`, redirecionar
      pra tela da sala se bater
- [ ] Guardar `room_id` no estado da aplicação (context ou state global simples)

## FASE 3 — Identidade do jogador (local)
- [x] Ao entrar na sala, pedir nome do jogador
- [x] Seletor de cor (paleta fixa de 6-8 cores é suficiente)
- [x] Seletor de cor dos dados de Esperança e de Medo, individual por jogador —
      suporta hex code digitado (`#rrggbb`) e color picker nativo
      (`<input type="color">`), com validação do hex (`ColorInput.jsx`)
- [ ] Guardar nome + cor no estado local (não precisa persistir no banco
      pra v1, só usar no broadcast/Realtime)

## FASE 4 — Lógica de rolagem (local, sem Realtime ainda)
- [x] Função `rolarDados()` que gera dois números 1-12
- [x] Função `calcularResultado(hope, fear)` que retorna:
      `{ vencedor: 'hope'|'fear'|'critico', hope, fear }`
- [x] Botão "Rolar" que chama as funções acima e mostra resultado na tela
      (ainda sem sincronizar com outros jogadores)
- [ ] Testar localmente que a lógica bate com as regras do Daggerheart

## FASE 5 — Sincronização em tempo real (local, testando com 2 abas)
- [ ] Ao rolar, inserir o resultado na tabela `rolls` com o `room_id` atual
- [ ] Inscrever a sala num canal Realtime do Supabase:
```js
supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${roomId}`
  }, (payload) => {
    // atualizar lista de rolagens na tela
  })
  .subscribe()
```
- [ ] Testar abrindo a mesma sala em duas abas do navegador (localhost) e
      confirmar que a rolagem de uma aba aparece na outra em tempo real

## FASE 6 — Animação dos dados (local)
- [x] Implementar animação simples: números trocando rapidamente por ~800ms-1s
      antes de "parar" no valor final (mais fácil que 3D)
- [ ] (Opcional, mais trabalho) animação 3D de dado girando via CSS transform
      ou lib tipo `@3d-dice/dice-box`
- [x] Aplicar a cor do jogador no destaque do resultado — cada dado (Esperança
      e Medo) usa a cor individual escolhida pelo jogador para esse dado

## FASE 7 — Exibição de resultado e histórico (local)
- [x] Mostrar os dois dados, qual venceu (cor/destaque), texto do resultado
      (ex: "Sucesso com Esperança", "Crítico!")
- [x] Lista/histórico das últimas rolagens da sala (nome do jogador, cor, resultado)
      — histórico guarda também as cores de Esperança/Medo usadas na rolagem
- [ ] Revisar responsividade básica (funcionar bem no celular)

## FASE 8 — Deploy e teste online
- [ ] Subir código pro GitHub (repositório novo)
- [ ] Conectar repositório no Vercel ou Netlify
- [ ] Configurar variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
      no painel do Vercel/Netlify
- [ ] Fazer o deploy e testar criando uma sala pelo link público
- [ ] Testar com duas pessoas em locais diferentes (não só duas abas locais)
      entrando na mesma sala e confirmando que a sincronização funciona
      pela internet, não só localmente

## Próximos passos (pós-MVP, não fazer agora)
- Modificadores e dificuldade nas rolagens
- Persistência de jogadores conectados (Presence do Supabase)
- Contagem de "Fear tokens" acumulados pela mesa
- Autenticação de dono da sala (só ele pode encerrar/resetar)
### supabase ja foi criado o projeto a senha é:
- "daggerheartsupa"

CRIE UM ARQUIVO COM A DOC DO PROJETO! COMO RODAR E TUDO MAIS. OS COMANDOS TD FACIL!!!