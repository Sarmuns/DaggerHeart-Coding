# Guia: Vite + Supabase Realtime (aprendizados deste projeto)

Checklist e padrões extraídos do Duality Dice pra reaproveitar em qualquer
app "sala + várias pessoas + tempo real" feito com Vite/React + Supabase.

---

## 1. Setup base

```bash
npm create vite@latest meu-app -- --template react
npm install @supabase/supabase-js
```

`.env.local` (nunca commitar — já deixa no `.gitignore` padrão do Vite):

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```

`src/lib/supabase.js`:

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
```

**Precaução:** só a `anon key` vai pro client. Nunca a `service_role key` —
essa só existe em ambiente de servidor/edge function. A anon key é pública
por natureza (fica no bundle JS), então qualquer regra de acesso séria
precisa estar em RLS (Row Level Security) no Postgres, não no client.

---

## 2. Os 3 mecanismos de realtime do Supabase (e quando usar cada um)

| Mecanismo | Pra que serve | Persiste? | Exemplo |
|---|---|---|---|
| `postgres_changes` | Espelhar mudanças de uma tabela | Sim (é a tabela) | histórico de rolagens, mensagens, itens de uma lista |
| `broadcast` | Evento efêmero entre clientes conectados agora | Não | "fulano está digitando", "dado girando", cursor de mouse |
| `presence` | Quem está online agora + metadados de cada um | Não (só enquanto conectado) | lista de jogadores na sala, cor de cada um, status |

Regra prática: **se o dado precisa sobreviver a um refresh ou aparecer pra
quem entrar depois, vai pra tabela + `postgres_changes`.** Se é só "estado
do momento" (alguém rolando um dado, um cursor se movendo), `broadcast` é
mais barato e mais rápido.

---

## 3. Um canal por "sala", montado uma vez só

```js
useEffect(() => {
  const canal = supabase.channel(`room:${roomId}`, {
    config: { presence: { key: presenceKeyRef.current } },
  })

  canal
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rolls',
        filter: `room_id=eq.${roomId}` }, (payload) => { /* ... */ })
    .on('broadcast', { event: 'algum-evento' }, ({ payload }) => { /* ... */ })
    .on('presence', { event: 'sync' }, () => { /* ... */ })
    .on('presence', { event: 'join' }, ({ newPresences }) => { /* toast */ })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => { /* toast */ })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await canal.track({ nome, cor /* ...metadados leves */ })
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConectado(false) // mostra banner "conexão perdida" + botão reload
      }
    })

  return () => supabase.removeChannel(canal)
  // dependências: só o identificador da sala (ex.: [roomId]).
  // Não inclua o objeto do jogador aqui — senão o canal reconecta a cada
  // troca de cor/nome. Pra reagir a mudanças de perfil, use um efeito
  // separado que só chama canal.track() de novo (ver seção 5).
}, [roomId])
```

**Aprendizado importante:** o `useEffect` que cria/assina o canal deve ter a
menor lista de dependências possível (normalmente só o id da sala). Se você
colocar o objeto do usuário inteiro nas deps, toda mudança de cor/tema
derruba e recria o canal inteiro — perde presence, rejoga toasts de
entrada/saída, etc.

---

## 4. `presenceKey` por aba, não por usuário

```js
const presenceKeyRef = useRef(crypto.randomUUID())
```

Gerar um UUID novo por *sessão do componente* (não por nome de usuário)
permite que a mesma pessoa abra duas abas/dispositivos sem colidir. Toda
lógica de "essa mensagem é minha" compara contra esse `presenceKey`, nunca
contra o nome.

### Dedupe do `presenceState()`

Ao reconectar, o Supabase pode listar a mesma `key` duas vezes por um
instante (o track antigo ainda não expirou). Sempre pegue só a meta mais
recente:

```js
canal.on('presence', { event: 'sync' }, () => {
  const estado = canal.presenceState()
  const lista = Object.entries(estado).map(([presenceKey, metas]) => ({
    presenceKey,
    ...metas[metas.length - 1], // a mais recente
  }))
  setJogadoresOnline(lista)
})
```

---

## 5. Debounce ao re-sincronizar presence

Se o metadado do usuário muda com frequência (cor, tema, texto digitando),
não chame `canal.track()` a cada keystroke — debounce:

```js
useEffect(() => {
  const id = setTimeout(() => {
    canalRef.current?.track({ nome, cor, /* ... */ })
  }, 150)
  return () => clearTimeout(id)
}, [nome, cor /* ...cada campo que deve re-sincronizar */])
```

Sem isso, cada tecla digitada dispara uma mensagem pra todo mundo na sala.

---

## 6. `broadcast` não volta pro remetente

Por padrão, quem envia um `broadcast` **não recebe o próprio evento de
volta**. Isso pega muita gente de surpresa: se toda a lógica de "aplicar o
resultado na tela" está dentro do handler `.on('broadcast', ...)`, o
próprio autor da ação nunca vê o efeito.

**Padrão correto:** aplique o efeito localmente de forma síncrona/direta
*e* mande o broadcast pra avisar os outros — nunca dependa do handler de
recepção pra atualizar o próprio estado:

```js
async function fazerAlgo() {
  const resultado = calcular()
  aplicarLocalmente(resultado)          // 1. efeito imediato, local
  canal.send({ type: 'broadcast', event: 'resultado', payload: resultado }) // 2. avisa os outros
}

canal.on('broadcast', { event: 'resultado' }, ({ payload }) => {
  if (payload.presenceKey === minhaChave) return // já apliquei acima
  aplicarLocalmente(payload)
})
```

### O payload do broadcast precisa ser autossuficiente

Não mande só os dados "crus" esperando que quem recebe recalcule a lógica
de negócio — o cliente que recebe pode não ter contexto suficiente (ex.: a
mecânica de jogo escolhida, um resultado derivado de aleatoriedade que só o
remetente rodou). Mande o resultado **já calculado** no payload
(`vencedor`, `total`, etc.), não só os números de entrada.

---

## 7. Notificações "toast" com auto-dismiss

```js
function adicionarAviso(texto) {
  const id = crypto.randomUUID()
  setAvisos((atual) => [...atual, { id, texto }])
  setTimeout(() => setAvisos((atual) => atual.filter((a) => a.id !== id)), 5000)
}

canal.on('presence', { event: 'join' }, ({ newPresences }) => {
  const nome = newPresences.at(-1)?.nome
  if (nome) adicionarAviso(`${nome} entrou na sala`)
})
```

Pra estado efêmero por-jogador (ex.: "resultado da rolagem" que deve sumir
sozinho), guarde um `Map` de timers num `useRef` pra poder **cancelar e
reiniciar** o timer se um novo evento chegar antes do anterior expirar —
senão uma ação nova pode ser apagada cedo demais pelo timer da ação
anterior:

```js
const timersRef = useRef(new Map())

function definirComExpiracao(chave, valor, duracaoMs) {
  setEstado((atual) => ({ ...atual, [chave]: valor }))
  clearTimeout(timersRef.current.get(chave))
  const t = setTimeout(() => {
    setEstado((atual) => { const { [chave]: _fora, ...resto } = atual; return resto })
    timersRef.current.delete(chave)
  }, duracaoMs)
  timersRef.current.set(chave, t)
}

// limpar tudo ao desmontar
useEffect(() => () => timersRef.current.forEach(clearTimeout), [])
```

---

## 8. Fuso horário: o erro mais chato do Postgres + JS

O Supabase (via Postgres `timestamp` sem timezone) devolve uma string tipo
`2026-09-16T13:37:00` — **sem `Z` no final**. Se você passar isso direto
pro `new Date()`, o navegador interpreta como horário *local*, dobrando o
erro de fuso quando você depois formata pra exibir.

```js
function paraData(isoString) {
  return new Date(isoString.endsWith('Z') ? isoString : `${isoString}Z`)
}
```

Prefira colunas `timestamptz` no schema quando puder escolher — evita esse
problema na raiz. Se for `timestamp` mesmo, sempre normalize com `Z` antes
de criar o `Date`.

Pra filtro por dia (ex.: "mostrar só rolagens de hoje") gere uma chave
`yyyy-mm-dd` no fuso certo com `toLocaleDateString('sv-SE', { timeZone })`
— esse locale devolve direto no formato ISO, comparável com o valor de um
`<input type="date">`.

---

## 9. Ações destrutivas: sempre confirmar

Qualquer ação que apaga dado de todo mundo na sala (resetar histórico,
encerrar sala, remover jogador) precisa de confirmação explícita — e o
efeito é visível pra todos, não só pra quem clicou:

```js
async function resetarHistorico() {
  if (!window.confirm('Apagar todo o histórico desta sala para todos os jogadores?')) return
  await supabase.from('rolls').delete().eq('room_id', roomId)
}
```

Pra MVP, `window.confirm` resolve. Num produto real, troque por um modal —
mas nunca remova a confirmação.

---

## 10. Checklist de setup no painel do Supabase (fácil de esquecer)

- [ ] Criar as tabelas via SQL editor
- [ ] **Ativar Realtime na tabela** (Database → Replication) — sem isso,
      `postgres_changes` simplesmente não dispara e não dá erro nenhum, só
      fica em silêncio. É o bug mais comum de "meu realtime não funciona".
- [ ] Decidir RLS: pra MVP fechado entre amigos, pode deixar aberto; pra
      qualquer coisa exposta publicamente, criar policies antes de lançar
- [ ] Variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
      configuradas tanto local (`.env.local`) quanto no painel do
      Vercel/Netlify — são dois lugares diferentes, fácil esquecer o
      segundo

---

## 11. Reconexão e feedback de estado da conexão

Sempre trate os status não-`SUBSCRIBED` do `.subscribe()` — sem isso, se a
conexão cair (wifi, celular saindo de app), o usuário fica olhando pra uma
tela "viva" que na verdade parou de sincronizar, sem saber:

```js
.subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    setConectado(true)
    await canal.track(meuEstado)
  } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
    setConectado(false)
  }
})
```

E na UI, um banner simples com botão de reload já resolve 90% dos casos —
não vale a pena implementar reconexão automática complexa pra um app
pequeno; forçar reload é mais previsível que tentar re-sincronizar estado
parcial.

---

## 12. Testar multiplayer localmente

Antes de deployar, sempre testar abrindo a **mesma sala em duas+ abas**
(ou uma aba normal + uma anônima, pra simular dois `presenceKey`
diferentes). Cobre:

- entrar/sair dispara toast pro outro lado
- ação de uma aba aparece na outra em tempo real
- cor/nome de um jogador não vaza pro estado de outro
- desconectar uma aba (fechar) não trava a outra

Só depois disso testar com duas pessoas de verdade em redes diferentes —
localhost esconde problemas de latência e de timing de reconexão que só
aparecem pela internet real.

---

## Resumo mental rápido

1. **Tabela = fonte da verdade duradoura** → `postgres_changes`.
2. **Momento passageiro** → `broadcast`, aplicado localmente primeiro,
   nunca esperando o próprio evento voltar.
3. **Quem está aqui agora** → `presence`, com `key` por aba e debounce nas
   atualizações.
4. Canal criado uma vez por sala, dependências mínimas no `useEffect`.
5. Ativar Replication na tabela no painel — sempre o primeiro suspeito
   quando "nada em tempo real funciona".
6. Fuso horário sem `Z` = bug garantido; normalize sempre.
7. Toda ação destrutiva multi-usuário pede confirmação.
