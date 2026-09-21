import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  DEFAULT_D20_STYLE,
  DEFAULT_D20_EXTRA_STYLE,
  DEFAULT_FEAR_STYLE,
  DEFAULT_HOPE_STYLE,
} from '../utils/defaultDiceStyles'
import { colorForPlayer } from '../utils/players'
import { loadPlayerPreferences, savePlayerPreferences } from '../utils/playerPreferences'
import { loadPlayerStyle, savePlayerStyle } from '../utils/playerPreferencesDb'
import NamePicklist from './NamePicklist'

function PlayerSetup({ roomCode, roomId, onConfirm }) {
  const rememberedName = loadPlayerPreferences()?.name ?? ''
  const channelRef = useRef(null)

  const [name, setName] = useState('')
  const [hopeColor, setHopeColor] = useState(DEFAULT_HOPE_STYLE.backgroundColor)
  const [fearColor, setFearColor] = useState(DEFAULT_FEAR_STYLE.backgroundColor)
  const [hopeTextColor, setHopeTextColor] = useState(DEFAULT_HOPE_STYLE.textColor)
  const [fearTextColor, setFearTextColor] = useState(DEFAULT_FEAR_STYLE.textColor)
  const [hopeBorderColor, setHopeBorderColor] = useState(DEFAULT_HOPE_STYLE.borderColor)
  const [fearBorderColor, setFearBorderColor] = useState(DEFAULT_FEAR_STYLE.borderColor)
  const [hopeTheme, setHopeTheme] = useState(DEFAULT_HOPE_STYLE.theme)
  const [fearTheme, setFearTheme] = useState(DEFAULT_FEAR_STYLE.theme)
  const [d20Color, setD20Color] = useState(DEFAULT_D20_STYLE.backgroundColor)
  const [d20TextColor, setD20TextColor] = useState(DEFAULT_D20_STYLE.textColor)
  const [d20BorderColor, setD20BorderColor] = useState(DEFAULT_D20_STYLE.borderColor)
  const [d20Theme, setD20Theme] = useState(DEFAULT_D20_STYLE.theme)
  const [d20ExtraColor, setD20ExtraColor] = useState(DEFAULT_D20_EXTRA_STYLE.backgroundColor)
  const [d20ExtraTextColor, setD20ExtraTextColor] = useState(DEFAULT_D20_EXTRA_STYLE.textColor)
  const [d20ExtraBorderColor, setD20ExtraBorderColor] = useState(DEFAULT_D20_EXTRA_STYLE.borderColor)
  const [d20ExtraTheme, setD20ExtraTheme] = useState(DEFAULT_D20_EXTRA_STYLE.theme)
  const [takenNames, setTakenNames] = useState([])
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`)
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const currentMetas = Object.values(state).map((metas) => metas[metas.length - 1]).filter(Boolean)
        setTakenNames(currentMetas.map((m) => m.name).filter(Boolean))
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channelRef.current = null
      supabase.removeChannel(channel)
    }
  }, [roomId])

  useEffect(() => {
    if (rememberedName) selectName(rememberedName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyDefaultStyle() {
    setHopeColor(DEFAULT_HOPE_STYLE.backgroundColor)
    setFearColor(DEFAULT_FEAR_STYLE.backgroundColor)
    setHopeTextColor(DEFAULT_HOPE_STYLE.textColor)
    setFearTextColor(DEFAULT_FEAR_STYLE.textColor)
    setHopeBorderColor(DEFAULT_HOPE_STYLE.borderColor)
    setFearBorderColor(DEFAULT_FEAR_STYLE.borderColor)
    setHopeTheme(DEFAULT_HOPE_STYLE.theme)
    setFearTheme(DEFAULT_FEAR_STYLE.theme)
    setD20Color(DEFAULT_D20_STYLE.backgroundColor)
    setD20TextColor(DEFAULT_D20_STYLE.textColor)
    setD20BorderColor(DEFAULT_D20_STYLE.borderColor)
    setD20Theme(DEFAULT_D20_STYLE.theme)
    setD20ExtraColor(DEFAULT_D20_EXTRA_STYLE.backgroundColor)
    setD20ExtraTextColor(DEFAULT_D20_EXTRA_STYLE.textColor)
    setD20ExtraBorderColor(DEFAULT_D20_EXTRA_STYLE.borderColor)
    setD20ExtraTheme(DEFAULT_D20_EXTRA_STYLE.theme)
  }

  async function selectName(newName) {
    setName(newName)
    setError('')
    // The style is always whatever is saved in the database for that name
    // (or the default, if nobody saved yet) — never whatever was left on
    // screen from a previously selected name, so colors don't "leak" from
    // one player to another.
    const savedStyle = await loadPlayerStyle(newName)
    if (savedStyle) {
      setHopeColor(savedStyle.hopeColor)
      setFearColor(savedStyle.fearColor)
      setHopeTextColor(savedStyle.hopeTextColor)
      setFearTextColor(savedStyle.fearTextColor)
      setHopeBorderColor(savedStyle.hopeBorderColor)
      setFearBorderColor(savedStyle.fearBorderColor)
      setHopeTheme(savedStyle.hopeTheme)
      setFearTheme(savedStyle.fearTheme)
      setD20Color(savedStyle.d20Color ?? DEFAULT_D20_STYLE.backgroundColor)
      setD20TextColor(savedStyle.d20TextColor ?? DEFAULT_D20_STYLE.textColor)
      setD20BorderColor(savedStyle.d20BorderColor ?? DEFAULT_D20_STYLE.borderColor)
      setD20Theme(savedStyle.d20Theme ?? DEFAULT_D20_STYLE.theme)
      setD20ExtraColor(savedStyle.d20ExtraColor ?? DEFAULT_D20_EXTRA_STYLE.backgroundColor)
      setD20ExtraTextColor(savedStyle.d20ExtraTextColor ?? DEFAULT_D20_EXTRA_STYLE.textColor)
      setD20ExtraBorderColor(savedStyle.d20ExtraBorderColor ?? DEFAULT_D20_EXTRA_STYLE.borderColor)
      setD20ExtraTheme(savedStyle.d20ExtraTheme ?? DEFAULT_D20_EXTRA_STYLE.theme)
    } else {
      applyDefaultStyle()
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name) {
      setError('Escolha seu nome.')
      return
    }

    setChecking(true)
    const currentState = channelRef.current?.presenceState() ?? {}
    const stillTaken = Object.values(currentState).some(
      (metas) => metas[metas.length - 1]?.name === name,
    )
    setChecking(false)

    if (stillTaken) {
      setError(`${name} já está na sala. Escolha outro nome.`)
      return
    }

    const player = {
      name,
      color: colorForPlayer(name),
      hopeColor,
      fearColor,
      hopeTextColor,
      fearTextColor,
      hopeBorderColor,
      fearBorderColor,
      hopeTheme,
      fearTheme,
      d20Color,
      d20TextColor,
      d20BorderColor,
      d20Theme,
      d20ExtraColor,
      d20ExtraTextColor,
      d20ExtraBorderColor,
      d20ExtraTheme,
    }
    savePlayerPreferences(player)
    savePlayerStyle(player)
    onConfirm(player)
  }

  return (
    <section className="player-setup">
      <h1>Sala {roomCode}</h1>
      <form onSubmit={handleSubmit}>
        <NamePicklist
          label="Seu nome"
          selectedName={name}
          onSelect={selectName}
          takenNames={takenNames}
        />

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={checking}>
          {checking ? 'Verificando...' : 'Entrar na sala'}
        </button>
      </form>
    </section>
  )
}

export default PlayerSetup
