import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  calculateResult,
  calculateD20Result,
  calculateTotal,
  isD20Winner,
  rollDice,
  resultText as diceResultText,
} from '../utils/dice'
import {
  DICE_SYSTEM_D20,
  DICE_SYSTEM_DUALITY,
  primaryStyle,
  secondaryStyle,
  defaultDiceSystemFor,
} from '../utils/diceSystem'
import { DEFAULT_STATS, statsFromPresence } from '../utils/playerStats'
import { loadPlayerStats, savePlayerStats } from '../utils/playerStatsDb'
import { loadFearLog, logFearChange } from '../utils/fearDb'
import { colorForPlayer } from '../utils/players'
import { isCritical, pickCriticalEffect } from '../utils/criticalEffects'
import { playRollSound, playCriticalSound } from '../utils/sound'
import ColorSettingsPanel from './ColorSettingsPanel'
import Icon from './Icon'
import IconButton from './IconButton'
import PartyStatusModal from './PartyStatusModal'
import { Pill, PillGroup } from './Pill'
import PlayerDiceSet from './PlayerDiceSet'
import { TrackPips } from './PlayerSheet'

const CRITICAL_COLOR = '#aa3bff'
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'
const RESULT_DURATION_MS = 5000
const FEAR_MAX = 12
// Date filter for the history is already implemented, just hidden from the
// UI for now — flip to true to bring it back without rewriting anything.
const SHOW_DATE_FILTER = false

// "colors" here always arrives already resolved (hopeColor/fearColor =
// primary/secondary slot of the dice system in use), so it doesn't need to
// know duality vs d20.
function resultColor(winner, colors) {
  if (winner === 'hope' || winner === 'd20') return colors.hopeColor
  if (winner === 'fear') return colors.fearColor
  return CRITICAL_COLOR
}

function recordDate(isoString) {
  // Postgres writes a timezone-less "timestamp" using the session's UTC
  // time, so the string arrives without "Z" — without this the browser
  // would read it as local time, doubling the timezone error.
  return new Date(isoString.endsWith('Z') ? isoString : `${isoString}Z`)
}

function formatTime(date) {
  const formattedDate = date.toLocaleDateString('pt-BR', { timeZone: BRAZIL_TIMEZONE })
  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BRAZIL_TIMEZONE,
  })
  return `${formattedDate} ${formattedTime}`
}

// yyyy-mm-dd in the São Paulo timezone — directly comparable to the value
// of an <input type="date">, to filter the history by day.
function isoDateBrazil(date) {
  return date.toLocaleDateString('sv-SE', { timeZone: BRAZIL_TIMEZONE })
}

// Translation boundary: the `rolls` table/columns already exist in
// production (jogador, cor, dado_hope, dado_fear, resultado, vencedor,
// total, modificador_tipo/valor, cor_hope/cor_fear) — keep those exact
// literal names when reading/writing rows.
function rowToHistoryItem(row) {
  const date = recordDate(row.criado_em)
  return {
    id: row.id,
    kind: 'roll',
    at: date.getTime(),
    player: row.jogador,
    color: row.cor,
    hopeColor: row.cor_hope,
    fearColor: row.cor_fear,
    hope: row.dado_hope,
    fear: row.dado_fear,
    winner: row.vencedor,
    total: row.total,
    time: formatTime(date),
    dateISO: isoDateBrazil(date),
    modifier: row.modificador_tipo ? { type: row.modificador_tipo, value: row.modificador_valor } : null,
  }
}

// Uma mudança de Medo vira um item do mesmo histórico das rolagens, pra
// ficar visível quem mexeu e quando.
function fearRowToHistoryItem(row) {
  const date = recordDate(row.criado_em)
  return {
    id: row.id,
    kind: 'fear',
    at: date.getTime(),
    player: row.jogador,
    color: colorForPlayer(row.jogador),
    delta: row.delta,
    value: row.valor,
    time: formatTime(date),
    dateISO: isoDateBrazil(date),
  }
}

function mergeHistory(current, items) {
  const seen = new Set(current.map((item) => item.id))
  const fresh = items.filter((item) => !seen.has(item.id))
  if (fresh.length === 0) return current
  return [...current, ...fresh].sort((a, b) => b.at - a.at)
}

function Room({ room, player, onUpdatePlayer }) {
  const channelRef = useRef(null)
  const presenceKeyRef = useRef(crypto.randomUUID())
  const diceSetRefsRef = useRef(new Map())
  const [rolling, setRolling] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  // Latest result for each player (by presenceKey), to show "4 com
  // Esperança" etc. on everyone's dice box, not just the roller's. Clears
  // itself after a few seconds — the history keeps the permanent record.
  const [resultsByPlayer, setResultsByPlayer] = useState({})
  const resultTimersRef = useRef(new Map())

  function setPlayerResult(presenceKey, result) {
    setResultsByPlayer((current) => ({ ...current, [presenceKey]: result }))

    const previousTimer = resultTimersRef.current.get(presenceKey)
    if (previousTimer) clearTimeout(previousTimer)

    const timer = setTimeout(() => {
      setResultsByPlayer((current) => {
        const { [presenceKey]: _discarded, ...rest } = current
        return rest
      })
      resultTimersRef.current.delete(presenceKey)
    }, RESULT_DURATION_MS)
    resultTimersRef.current.set(presenceKey, timer)
  }

  useEffect(() => {
    const timers = resultTimersRef.current
    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [])

  // As soon as any player starts rolling, clear everyone's result messages —
  // avoids showing a stale result while a new roll is already in progress.
  function clearResults() {
    setResultsByPlayer({})
    resultTimersRef.current.forEach((timer) => clearTimeout(timer))
    resultTimersRef.current.clear()
  }

  const [history, setHistory] = useState([])
  // Fear tokens da mesa — compartilhado entre todos, cada ajuste vira uma
  // linha em fear_log (ver utils/fearDb). Qualquer jogador pode mexer; na
  // prática só o mestre costuma usar os botões.
  const [fear, setFear] = useState(0)
  const [dateFilter, setDateFilter] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [onlinePlayers, setOnlinePlayers] = useState([])
  const [rollMode, setRollMode] = useState('normal') // 'normal' | 'vantagem' | 'desvantagem'
  // Visual effect picked on every Critical — { id, type, presenceKey } to
  // allow playing the same type twice in a row (a new id forces React to
  // remount) and anchor the effect to the box of whoever rolled.
  const [criticalEffect, setCriticalEffect] = useState(null)

  function triggerCriticalEffect(type, presenceKey) {
    setCriticalEffect({ id: crypto.randomUUID(), type, presenceKey })
    playCriticalSound()
  }
  // Only whoever has the DM tag can toggle this — for everyone else it
  // stays fixed on the default (duality). The chosen value goes into
  // presence so everyone else in the room sees the DM's correct die.
  const [selectedDiceSystem, setSelectedDiceSystem] = useState(() => defaultDiceSystemFor(player.name))
  const [connected, setConnected] = useState(true)
  // Character stats (HP, Hope, Stress, etc.) — loaded from the database by
  // name, freely editable and synced via presence, just like the rest of
  // the player's profile.
  const [stats, setStats] = useState(DEFAULT_STATS)
  // Only starts saving once the initial load finishes — otherwise the save
  // effect fires with default values before the fetch resolves and
  // overwrites what was already saved in the database.
  const statsLoadedRef = useRef(false)

  useEffect(() => {
    let active = true
    statsLoadedRef.current = false
    loadPlayerStats(player.name).then((values) => {
      if (!active) return
      setStats(values)
      statsLoadedRef.current = true
    })
    return () => {
      active = false
    }
  }, [player.name])

  useEffect(() => {
    if (!statsLoadedRef.current) return
    const id = setTimeout(() => savePlayerStats(player.name, stats), 400)
    return () => clearTimeout(id)
  }, [player.name, stats])

  // Real editing only happens in the modal (with an explicit Save button) —
  // here we just swap the whole object at once.
  function saveFullStats(newValues) {
    setStats(newValues)
  }

  // Draft copy of the stats, edited freely inside the player's own dice box
  // (summary row arrows/typing, pip clicks) without touching `stats` — and
  // so without saving to the database or broadcasting to the table — until
  // "Anotar na Ficha" is pressed. Resyncs whenever `stats` itself changes
  // (initial load from the database, or right after a commit).
  const [draftStats, setDraftStats] = useState(DEFAULT_STATS)

  useEffect(() => {
    setDraftStats(stats)
  }, [stats])

  function updateDraftStatField(field, value) {
    setDraftStats((current) => ({ ...current, [field]: value }))
  }

  const hasPendingStatChanges = JSON.stringify(draftStats) !== JSON.stringify(stats)

  // "Anotar na Ficha" — commits the draft, with its own 5s cooldown (per
  // player) so a happy-clicker doesn't flood the database/table broadcast.
  const COMMIT_COOLDOWN_MS = 5000
  const [commitCooldownUntil, setCommitCooldownUntil] = useState(0)
  const canCommitStats = Date.now() >= commitCooldownUntil

  function commitDraftStats() {
    if (!hasPendingStatChanges || !canCommitStats) return
    saveFullStats(draftStats)
    setCommitCooldownUntil(Date.now() + COMMIT_COOLDOWN_MS)
    setTimeout(() => setCommitCooldownUntil(0), COMMIT_COOLDOWN_MS)
  }

  // Throws the draft away and goes back to whatever's actually saved — no
  // cooldown, it's purely local and there's nothing to protect the server
  // from.
  function discardDraftStats() {
    setDraftStats(stats)
  }

  useEffect(() => {
    let active = true

    async function loadHistory() {
      const { data, error } = await supabase
        .from('rolls')
        .select('*')
        .eq('room_id', room.roomId)
        .order('criado_em', { ascending: false })
        .limit(30)

      if (active && !error && data) {
        setHistory((current) => mergeHistory(current, data.map(rowToHistoryItem)))
      }
    }

    async function loadFear() {
      const rows = await loadFearLog(room.roomId)
      if (!active) return
      setFear(rows[0]?.valor ?? 0)
      setHistory((current) => mergeHistory(current, rows.map(fearRowToHistoryItem)))
    }

    setHistory([])
    loadHistory()
    loadFear()

    const channel = supabase.channel(`room:${room.roomId}`, {
      config: { presence: { key: presenceKeyRef.current } },
    })

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rolls', filter: `room_id=eq.${room.roomId}` },
        (payload) => {
          setHistory((current) => mergeHistory(current, [rowToHistoryItem(payload.new)]))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'rolls', filter: `room_id=eq.${room.roomId}` },
        (payload) => {
          setHistory((current) => current.filter((item) => item.id !== payload.old.id))
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fear_log', filter: `room_id=eq.${room.roomId}` },
        (payload) => {
          setFear(payload.new.valor)
          setHistory((current) => mergeHistory(current, [fearRowToHistoryItem(payload.new)]))
        },
      )
      .on('broadcast', { event: 'rolling' }, ({ payload }) => {
        clearResults()
        if (payload.presenceKey === presenceKeyRef.current) return
        playRollSound()
        diceSetRefsRef.current.get(payload.presenceKey)?.startSpin(payload.mode)
      })
      .on('broadcast', { event: 'result' }, ({ payload }) => {
        setPlayerResult(payload.presenceKey, {
          winner: payload.winner,
          hope: payload.hope,
          fear: payload.fear,
          modifier: payload.modifier,
        })
        if (payload.presenceKey === presenceKeyRef.current) return
        diceSetRefsRef.current
          .get(payload.presenceKey)
          ?.finishSpin(payload.hope, payload.fear, payload.modifier)
        // The Critical effect already comes picked by whoever rolled —
        // everyone in the room sees the same effect, not an independent
        // pick per client.
        if (payload.effect) triggerCriticalEffect(payload.effect, payload.presenceKey)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        // Every track() generates a new "meta" for the same key; until the
        // server confirms the previous one left, presenceState() can list
        // both at once. We keep only the most recent one to avoid
        // duplicating the player on screen.
        const list = Object.entries(state).map(([presenceKey, metas]) => ({
          presenceKey,
          ...metas[metas.length - 1],
        }))
        setOnlinePlayers(list)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setConnected(true)
          await channel.track({
            name: player.name,
            color: player.color,
            diceSystem: selectedDiceSystem,
            ...stats,
            hopeColor: player.hopeColor,
            fearColor: player.fearColor,
            hopeTextColor: player.hopeTextColor,
            fearTextColor: player.fearTextColor,
            hopeBorderColor: player.hopeBorderColor,
            fearBorderColor: player.fearBorderColor,
            hopeTheme: player.hopeTheme,
            fearTheme: player.fearTheme,
            d20Color: player.d20Color,
            d20BorderColor: player.d20BorderColor,
            d20TextColor: player.d20TextColor,
            d20Theme: player.d20Theme,
            d20ExtraColor: player.d20ExtraColor,
            d20ExtraBorderColor: player.d20ExtraBorderColor,
            d20ExtraTextColor: player.d20ExtraTextColor,
            d20ExtraTheme: player.d20ExtraTheme,
          })
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn('Room connection lost:', status)
          setConnected(false)
        }
      })

    channelRef.current = channel

    return () => {
      active = false
      channelRef.current = null
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room.roomId])

  useEffect(() => {
    const id = setTimeout(() => {
      channelRef.current?.track({
        name: player.name,
        color: player.color,
        diceSystem: selectedDiceSystem,
        ...stats,
        hopeColor: player.hopeColor,
        fearColor: player.fearColor,
        hopeTextColor: player.hopeTextColor,
        fearTextColor: player.fearTextColor,
        hopeBorderColor: player.hopeBorderColor,
        fearBorderColor: player.fearBorderColor,
        hopeTheme: player.hopeTheme,
        fearTheme: player.fearTheme,
        d20Color: player.d20Color,
        d20BorderColor: player.d20BorderColor,
        d20TextColor: player.d20TextColor,
        d20Theme: player.d20Theme,
        d20ExtraColor: player.d20ExtraColor,
        d20ExtraBorderColor: player.d20ExtraBorderColor,
        d20ExtraTextColor: player.d20ExtraTextColor,
        d20ExtraTheme: player.d20ExtraTheme,
      })
    }, 150)
    return () => clearTimeout(id)
  }, [
    player.name,
    player.color,
    selectedDiceSystem,
    stats,
    player.hopeColor,
    player.fearColor,
    player.hopeTextColor,
    player.fearTextColor,
    player.hopeBorderColor,
    player.fearBorderColor,
    player.hopeTheme,
    player.fearTheme,
    player.d20Color,
    player.d20BorderColor,
    player.d20TextColor,
    player.d20Theme,
    player.d20ExtraColor,
    player.d20ExtraBorderColor,
    player.d20ExtraTextColor,
    player.d20ExtraTheme,
  ])

  function registerDiceRef(presenceKey, node) {
    if (node) diceSetRefsRef.current.set(presenceKey, node)
    else diceSetRefsRef.current.delete(presenceKey)
  }

  async function resetHistory() {
    const confirmed = window.confirm('Apagar todo o histórico desta sala para todos os jogadores?')
    if (!confirmed) return
    const { error } = await supabase.from('rolls').delete().eq('room_id', room.roomId)
    if (error) {
      console.error('Error resetting history:', error)
      return
    }
    setHistory([])
  }

  async function setFearTo(target) {
    const next = Math.max(0, Math.min(FEAR_MAX, target))
    const previous = fear
    const delta = next - previous
    if (delta === 0) return
    setFear(next)
    const ok = await logFearChange(room.roomId, player.name, delta, next)
    if (!ok) setFear(previous)
  }

  async function recordRoll(result, modifier, diceSystem) {
    const total =
      diceSystem === DICE_SYSTEM_D20 ? result.hope : calculateTotal(result.hope, result.fear, modifier)
    // The table only has cor_hope/cor_fear — we store the primary/secondary
    // slot color resolved for the dice system in use (duality or d20), so
    // the history keeps coloring correctly regardless of the player.
    const primary = primaryStyle(player, diceSystem)
    const secondary = secondaryStyle(player, diceSystem)
    const { error } = await supabase.from('rolls').insert({
      room_id: room.roomId,
      jogador: player.name,
      cor: player.color,
      cor_hope: primary.color,
      cor_fear: secondary.color,
      dado_hope: result.hope,
      dado_fear: result.fear,
      resultado: diceResultText(result),
      vencedor: result.winner,
      total,
      modificador_tipo: modifier?.type ?? null,
      modificador_valor: modifier?.value ?? null,
    })
    if (error) console.error('Error recording roll:', error)
  }

  async function roll(forcedValues) {
    const myKey = presenceKeyRef.current
    const myDiceSet = diceSetRefsRef.current.get(myKey)
    if (rolling || !myDiceSet) return

    setRolling(true)
    setLastResult(null)
    clearResults()
    playRollSound()

    channelRef.current?.send({
      type: 'broadcast',
      event: 'rolling',
      payload: { presenceKey: myKey, mode: rollMode },
    })

    const diceSystem = selectedDiceSystem

    let rawResult
    if (diceSystem === DICE_SYSTEM_D20) {
      rawResult = await myDiceSet.rollOwn(rollMode)
    } else if (forcedValues) {
      rawResult = await myDiceSet.rollOwnToValues(forcedValues.hope, forcedValues.fear, rollMode)
    } else if (player.name === 'Samuel') {
      // Samuel's advantage: decides BEFORE spinning whether a result that
      // would be "with Fear" becomes "with Hope" — 20% chance, swapping
      // which die shows which number (the total never changes). The dice
      // already spin straight to the final value: the "real" value is
      // never revealed first only to be swapped, so the number never
      // visibly "jumps".
      const { hope: rolledHope, fear: rolledFear } = rollDice()
      const swap = rolledFear > rolledHope && Math.random() < 0.2
      const targetHope = swap ? rolledFear : rolledHope
      const targetFear = swap ? rolledHope : rolledFear
      rawResult = await myDiceSet.rollOwnToValues(targetHope, targetFear, rollMode)
    } else {
      rawResult = await myDiceSet.rollOwn(rollMode)
    }

    const { modifier } = rawResult
    const { hope, fear } = rawResult
    const result = diceSystem === DICE_SYSTEM_D20 ? calculateD20Result(hope, fear) : calculateResult(hope, fear)
    const effect = isCritical(result.winner) ? pickCriticalEffect() : null

    setLastResult({ ...result, modifier })
    setPlayerResult(myKey, {
      winner: result.winner,
      hope: result.hope,
      fear: result.fear,
      modifier,
    })
    setRolling(false)
    if (effect) triggerCriticalEffect(effect, myKey)

    channelRef.current?.send({
      type: 'broadcast',
      event: 'result',
      payload: {
        presenceKey: myKey,
        winner: result.winner,
        hope: result.hope,
        fear: result.fear,
        modifier,
        effect,
      },
    })

    recordRoll(result, modifier, diceSystem)
  }

  const myDiceSystem = selectedDiceSystem
  const filteredHistory = dateFilter ? history.filter((item) => item.dateISO === dateFilter) : history

  return (
    <section className="room">
      <header className="room-header">
        <div className="room-title">
          <h1 className="table-name">Age of Umbra</h1>
          <p className="room-subtitle">
            <strong>{room.code}</strong>
          </p>
        </div>
        <IconButton onClick={() => window.location.reload()} label="Atualizar sala" title="Recarregar sala">
          <Icon name="refresh" />
        </IconButton>
        <IconButton onClick={() => setPanelOpen((v) => !v)} label="Configurações" title="Configurações">
          <Icon name="gear" />
        </IconButton>
        <IconButton onClick={() => setStatusOpen((v) => !v)} label="Status da mesa" title="Ver status de todo mundo">
          <Icon name="list" />
        </IconButton>
      </header>

      {!connected && (
        <div className="notice notice--error">
          Conexão com a sala perdida.{' '}
          <button type="button" onClick={() => window.location.reload()}>
            Atualizar
          </button>
        </div>
      )}

      <section className="fear-board" aria-label="Medo da mesa">
        <div className="fear-board-head">
          <span className="fear-board-title">
            <Icon name="flame" />
            Medo da Mesa
          </span>
          <span className="fear-board-count">
            {fear}
            <span className="fear-board-max">/ {FEAR_MAX}</span>
          </span>
        </div>
        <div className="fear-board-body">
          <button
            type="button"
            className="fear-board-btn"
            aria-label="Remover 1 de Medo"
            onClick={() => setFearTo(fear - 1)}
            disabled={fear <= 0}
          >
            −
          </button>
          <TrackPips label="" value={fear} max={FEAR_MAX} editable onSetValue={setFearTo} tone="fear" />
          <button
            type="button"
            className="fear-board-btn"
            aria-label="Adicionar 1 de Medo"
            onClick={() => setFearTo(fear + 1)}
            disabled={fear >= FEAR_MAX}
          >
            +
          </button>
        </div>
      </section>

      {panelOpen && (
        <ColorSettingsPanel
          player={player}
          diceSystem={myDiceSystem}
          onUpdatePlayer={onUpdatePlayer}
          onClose={() => setPanelOpen(false)}
        />
      )}

      <div
        className="dice-table"
        style={{ '--dice-cols': Math.max(1, Math.ceil(Math.sqrt(onlinePlayers.length))) }}
      >
        {onlinePlayers.map((p) => {
          const playerDiceSystem = p.diceSystem ?? defaultDiceSystemFor(p.name)
          const primary = primaryStyle(p, playerDiceSystem)
          const secondary = secondaryStyle(p, playerDiceSystem)
          const playerResult = resultsByPlayer[p.presenceKey]
          const isMe = p.presenceKey === presenceKeyRef.current
          return (
            <PlayerDiceSet
              key={p.presenceKey}
              ref={(node) => registerDiceRef(p.presenceKey, node)}
              name={p.name}
              color={p.color}
              primaryColor={primary.color}
              primaryBorderColor={primary.border}
              primaryTextColor={primary.text}
              primaryTheme={primary.theme}
              secondaryColor={secondary.color}
              secondaryBorderColor={secondary.border}
              secondaryTextColor={secondary.text}
              secondaryTheme={secondary.theme}
              diceSystem={playerDiceSystem}
              isYou={isMe}
              resultText={playerResult ? diceResultText(playerResult) : null}
              resultColor={
                playerResult
                  ? resultColor(playerResult.winner, { hopeColor: primary.color, fearColor: secondary.color })
                  : null
              }
              stats={isMe ? draftStats : statsFromPresence(p)}
              statsEditable={isMe}
              onChangeStatField={isMe ? updateDraftStatField : undefined}
              onCommitStats={isMe ? commitDraftStats : undefined}
              onDiscardStats={isMe ? discardDraftStats : undefined}
              canCommitStats={canCommitStats}
              hasPendingStatChanges={hasPendingStatChanges}
              criticalEffect={criticalEffect?.presenceKey === p.presenceKey ? criticalEffect : null}
              onCriticalEffectEnd={() => setCriticalEffect(null)}
              onRoll={isMe ? () => roll() : null}
              rolling={isMe ? rolling : false}
            />
          )
        })}
      </div>

      {statusOpen && (
        <PartyStatusModal
          players={onlinePlayers}
          myPresenceKey={presenceKeyRef.current}
          getStats={(p) => (p.presenceKey === presenceKeyRef.current ? stats : statsFromPresence(p))}
          onClose={() => setStatusOpen(false)}
        />
      )}

      <PillGroup>
        <Pill active={selectedDiceSystem === DICE_SYSTEM_D20} onClick={() => setSelectedDiceSystem(DICE_SYSTEM_D20)}>
          d20
        </Pill>
        <Pill
          active={selectedDiceSystem === DICE_SYSTEM_DUALITY}
          onClick={() => setSelectedDiceSystem(DICE_SYSTEM_DUALITY)}
        >
          2d12
        </Pill>
      </PillGroup>

      <PillGroup>
        <Pill active={rollMode === 'normal'} onClick={() => setRollMode('normal')}>
          Normal
        </Pill>
        <Pill active={rollMode === 'vantagem'} onClick={() => setRollMode('vantagem')}>
          Vantagem
        </Pill>
        <Pill active={rollMode === 'desvantagem'} onClick={() => setRollMode('desvantagem')}>
          Desvantagem
        </Pill>
      </PillGroup>

      <button type="button" className="roll-button" onClick={() => roll()} disabled={rolling}>
        {rolling ? 'Rolando...' : 'Rolar'}
      </button>

      {player.name === 'Samuel' && myDiceSystem !== DICE_SYSTEM_D20 && (
        <button
          type="button"
          className="secundario"
          onClick={() => roll({ hope: 4, fear: 4 })}
          disabled={rolling}
        >
          Forçar 4:4
        </button>
      )}

      {lastResult && (
        <p
          className={`result${isD20Winner(lastResult.winner) ? ' result--d20' : ''}`}
          style={{
            color: resultColor(lastResult.winner, {
              hopeColor: primaryStyle(player, myDiceSystem).color,
              fearColor: secondaryStyle(player, myDiceSystem).color,
            }),
          }}
        >
          {diceResultText(lastResult)}
        </p>
      )}

      <div className="history">
        <div className="history-header">
          <h2>Histórico</h2>
          <button
            type="button"
            className="secundario"
            onClick={resetHistory}
            disabled={player.name !== 'Samuel'}
          >
            Resetar
          </button>
        </div>

        {SHOW_DATE_FILTER && (
          <div className="history-filters">
            <label className="history-filter-date">
              Filtrar por data
              <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </label>
            {dateFilter && (
              <button type="button" className="secundario" onClick={() => setDateFilter('')}>
                Limpar filtro
              </button>
            )}
          </div>
        )}

        <ul>
          {dateFilter && filteredHistory.length === 0 && (
            <li className="history-empty">Nenhuma rolagem nesse dia.</li>
          )}
          {filteredHistory.map((item) =>
            item.kind === 'fear' ? (
              <li key={item.id} className="history-item history-item--fear" style={{ borderLeftColor: item.color }}>
                <span className="history-time">{item.time}</span>
                <span className="history-player" style={{ color: item.color }}>
                  {item.player}
                </span>
                <span className="history-fear-delta">
                  {item.delta > 0 ? `+${item.delta}` : item.delta} Medo
                </span>
                <span className="history-result history-result--fear">
                  <Icon name="flame" />
                  {item.value}
                </span>
              </li>
            ) : (
            <li key={item.id} className="history-item" style={{ borderLeftColor: item.color }}>
              <span className="history-time">{item.time}</span>
              <span className="history-player" style={{ color: item.color }}>
                {item.player}
              </span>
              <span className="history-dice">
                {item.hope} / {item.fear}
                {item.modifier && (
                  <span className="history-modifier">
                    {item.modifier.value != null
                      ? `${item.modifier.type === 'vantagem' ? '+' : '−'}d6(${item.modifier.value})`
                      : item.modifier.type === 'vantagem'
                        ? 'Vantagem'
                        : 'Desvantagem'}
                  </span>
                )}
              </span>
              <span
                className={`history-result${isD20Winner(item.winner) ? ' history-result--d20' : ''}`}
                style={{ color: resultColor(item.winner, item) }}
              >
                {diceResultText(item)}
              </span>
            </li>
            ),
          )}
        </ul>
      </div>

    </section>
  )
}

export default Room
