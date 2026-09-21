import { DiceRoller } from '@gnuton/css-dice-roller'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import CriticalEffect from './CriticalEffect'
import { PlayerPips, SummaryRow } from './PlayerSheet'
import { DICE_SYSTEM_D20 } from '../utils/diceSystem'
import { DEFAULT_THEME } from '../utils/diceThemes'

const STAGGER_FEAR_MS = 60
const ROLL_SPEED_S = 2
const DIE_SCALE = 92
const DIE_SCALE_D20 = 106
const DIE_SCALE_MODIFIER = 60
const MODIFIER_BACKGROUND_COLOR = '#5b5b5b'
const MODIFIER_BORDER_COLOR = '#2a2a2a'
const MODIFIER_TEXT_COLOR = '#ffffff'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const PlayerDiceSet = forwardRef(function PlayerDiceSet(
  {
    name,
    color,
    // "Primary" and "secondary" are the two die slots of the set: Hope/Fear
    // on the duality system, or d20/extra-d20 on the d20 system — each
    // system sends its own style fields, never shared between them.
    primaryColor,
    secondaryColor,
    primaryTextColor,
    secondaryTextColor,
    primaryBorderColor,
    secondaryBorderColor,
    primaryTheme,
    secondaryTheme,
    diceSystem,
    isYou,
    resultText,
    resultColor,
    stats,
    statsEditable,
    canAdjustStat,
    onAdjustStat,
    criticalEffect,
    onCriticalEffectEnd,
    onRoll,
    rolling,
  },
  ref,
) {
  const isD20 = diceSystem === DICE_SYSTEM_D20
  const boxRef = useRef(null)
  const hopeStageRef = useRef(null)
  const fearStageRef = useRef(null)
  const modStageRef = useRef(null)
  const hopeRollerRef = useRef(null)
  const fearRollerRef = useRef(null)
  const modRollerRef = useRef(null)
  const hopeDieRef = useRef(null)
  const fearDieRef = useRef(null)
  const modDieRef = useRef(null)
  const spinInProgressRef = useRef(null)
  const modSpinInProgressRef = useRef(null)
  const [hopeSpinning, setHopeSpinning] = useState(false)
  const [fearSpinning, setFearSpinning] = useState(false)
  const [modSpinning, setModSpinning] = useState(false)
  const [modifierVisible, setModifierVisible] = useState(false)

  useEffect(() => {
    const dieType = isD20 ? 'd20' : 'd12'
    const scale = isD20 ? DIE_SCALE_D20 : DIE_SCALE

    const hopeRoller = new DiceRoller(hopeStageRef.current, scale)
    const [hopeDie] = hopeRoller.addDie(dieType)
    hopeRoller.updateSettings({
      baseColor: primaryColor,
      textColor: primaryTextColor,
      secondaryColor: primaryBorderColor,
      theme: primaryTheme ?? DEFAULT_THEME,
      speed: ROLL_SPEED_S,
    })
    hopeRollerRef.current = hopeRoller
    hopeDieRef.current = hopeDie

    const fearRoller = new DiceRoller(fearStageRef.current, scale)
    const [fearDie] = fearRoller.addDie(dieType)
    fearRoller.updateSettings({
      baseColor: secondaryColor,
      textColor: secondaryTextColor,
      secondaryColor: secondaryBorderColor,
      theme: secondaryTheme ?? DEFAULT_THEME,
      speed: ROLL_SPEED_S,
    })
    fearRollerRef.current = fearRoller
    fearDieRef.current = fearDie

    let modRoller = null
    if (!isD20) {
      modRoller = new DiceRoller(modStageRef.current, DIE_SCALE_MODIFIER)
      const [modDie] = modRoller.addDie('d6')
      modRoller.updateSettings({
        baseColor: MODIFIER_BACKGROUND_COLOR,
        secondaryColor: MODIFIER_BORDER_COLOR,
        textColor: MODIFIER_TEXT_COLOR,
        theme: 'theme-solid',
        speed: ROLL_SPEED_S,
      })
      modRollerRef.current = modRoller
      modDieRef.current = modDie
    }

    return () => {
      hopeRoller.clear()
      fearRoller.clear()
      modRoller?.clear()
      hopeRollerRef.current = null
      fearRollerRef.current = null
      modRollerRef.current = null
      hopeDieRef.current = null
      fearDieRef.current = null
      modDieRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isD20])

  useEffect(() => {
    hopeRollerRef.current?.updateSettings({ baseColor: primaryColor })
  }, [primaryColor])

  useEffect(() => {
    fearRollerRef.current?.updateSettings({ baseColor: secondaryColor })
  }, [secondaryColor])

  useEffect(() => {
    hopeRollerRef.current?.updateSettings({ textColor: primaryTextColor })
  }, [primaryTextColor])

  useEffect(() => {
    fearRollerRef.current?.updateSettings({ textColor: secondaryTextColor })
  }, [secondaryTextColor])

  useEffect(() => {
    hopeRollerRef.current?.updateSettings({ secondaryColor: primaryBorderColor })
  }, [primaryBorderColor])

  useEffect(() => {
    fearRollerRef.current?.updateSettings({ secondaryColor: secondaryBorderColor })
  }, [secondaryBorderColor])

  useEffect(() => {
    hopeRollerRef.current?.updateSettings({ theme: primaryTheme ?? DEFAULT_THEME })
  }, [primaryTheme])

  useEffect(() => {
    fearRollerRef.current?.updateSettings({ theme: secondaryTheme ?? DEFAULT_THEME })
  }, [secondaryTheme])

  // Spins a die to an already-decided value, never revealing the "real"
  // random value first — used by Samuel's advantage, to make the hope/fear
  // swap imperceptible (the die never shows a number and then "jumps" to
  // another one right after).
  async function spinToValue(dieRef, target) {
    const die = dieRef.current
    if (die.settings.animation === 'none') {
      die.setResult(target)
      return target
    }
    die.element.style.setProperty('--dice-animation-name', `roll-${die.settings.animation}`)
    die.element.classList.add('is-rolling')
    await new Promise((resolve) => setTimeout(resolve, die.settings.speed * 1000))
    die.element.classList.remove('is-rolling')
    die.setResult(target)
    return target
  }

  async function spinPairToValues(hopeTarget, fearTarget) {
    const reduced = prefersReducedMotion()
    hopeRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })
    fearRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })

    if (reduced) {
      hopeDieRef.current.setResult(hopeTarget)
      fearDieRef.current.setResult(fearTarget)
      return [hopeTarget, fearTarget]
    }

    setHopeSpinning(true)
    setFearSpinning(true)

    const hopePromise = spinToValue(hopeDieRef, hopeTarget).then((value) => {
      setHopeSpinning(false)
      return value
    })

    await new Promise((resolve) => setTimeout(resolve, STAGGER_FEAR_MS))

    const fearPromise = spinToValue(fearDieRef, fearTarget).then((value) => {
      setFearSpinning(false)
      return value
    })

    return Promise.all([hopePromise, fearPromise])
  }

  async function spinPair() {
    const reduced = prefersReducedMotion()
    hopeRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })
    fearRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })

    if (reduced) {
      const hope = await hopeDieRef.current.roll()
      const fear = await fearDieRef.current.roll()
      return [hope, fear]
    }

    setHopeSpinning(true)
    setFearSpinning(true)

    const hopePromise = hopeDieRef.current.roll().then((value) => {
      setHopeSpinning(false)
      return value
    })

    await new Promise((resolve) => setTimeout(resolve, STAGGER_FEAR_MS))

    const fearPromise = fearDieRef.current.roll().then((value) => {
      setFearSpinning(false)
      return value
    })

    return Promise.all([hopePromise, fearPromise])
  }

  async function spinModifier() {
    const reduced = prefersReducedMotion()
    modRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })
    setModSpinning(true)
    const value = await modDieRef.current.roll()
    setModSpinning(false)
    return value
  }

  // Duality system (2d12: Hope/Fear + optional advantage/disadvantage d6)
  async function rollDuality(mode) {
    setModifierVisible(mode !== 'normal')
    const primaryPromise = spinPair()
    const modifierPromise = mode !== 'normal' ? spinModifier() : null

    const [hope, fear] = await primaryPromise
    const modifierValue = modifierPromise ? await modifierPromise : null

    return {
      hope,
      fear,
      modifier: modifierValue === null ? null : { type: mode, value: modifierValue },
    }
  }

  // Same as rollDuality, but the dice spin straight to the final value
  // decided outside (hope/fear already resolved, including any advantage
  // swap) — never shows a "real" value only to replace it.
  async function rollDualityToValues(hopeTarget, fearTarget, mode) {
    setModifierVisible(mode !== 'normal')
    const primaryPromise = spinPairToValues(hopeTarget, fearTarget)
    const modifierPromise = mode !== 'normal' ? spinModifier() : null

    const [hope, fear] = await primaryPromise
    const modifierValue = modifierPromise ? await modifierPromise : null

    return {
      hope,
      fear,
      modifier: modifierValue === null ? null : { type: mode, value: modifierValue },
    }
  }

  // d20 system (D&D-style): normal rolls just 1 die; advantage/disadvantage
  // roll 2 (reusing the "fear" slot as the extra d20) and keep the
  // higher/lower.
  async function rollD20(mode) {
    const reduced = prefersReducedMotion()
    hopeRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })

    if (mode === 'normal') {
      setModifierVisible(false)
      setHopeSpinning(true)
      const value = await hopeDieRef.current.roll()
      setHopeSpinning(false)
      return { hope: value, fear: value, modifier: null }
    }

    setModifierVisible(true)
    fearRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })
    setHopeSpinning(true)
    setFearSpinning(true)

    const v1Promise = hopeDieRef.current.roll().then((value) => {
      setHopeSpinning(false)
      return value
    })

    await new Promise((resolve) => setTimeout(resolve, STAGGER_FEAR_MS))

    const v2Promise = fearDieRef.current.roll().then((value) => {
      setFearSpinning(false)
      return value
    })

    const [v1, v2] = await Promise.all([v1Promise, v2Promise])
    const kept = mode === 'vantagem' ? Math.max(v1, v2) : Math.min(v1, v2)
    const discarded = kept === v1 ? v2 : v1

    return { hope: kept, fear: discarded, modifier: { type: mode, value: null } }
  }

  // "Silent" version of the animations above, only used to mirror another
  // player's roll — the real value arrives later via finishSpin.
  async function startRemoteAnimation(mode) {
    if (isD20) {
      const reduced = prefersReducedMotion()
      hopeRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })
      if (mode === 'normal') return spinD20DieOnly(hopeDieRef, setHopeSpinning)
      fearRollerRef.current.updateSettings({ animation: reduced ? 'none' : 'float' })
      const p1 = spinD20DieOnly(hopeDieRef, setHopeSpinning)
      await new Promise((resolve) => setTimeout(resolve, STAGGER_FEAR_MS))
      const p2 = spinD20DieOnly(fearDieRef, setFearSpinning)
      return Promise.all([p1, p2])
    }

    modSpinInProgressRef.current = mode !== 'normal' ? spinModifier() : null
    return spinPair()
  }

  async function spinD20DieOnly(dieRef, setSpinning) {
    setSpinning(true)
    const value = await dieRef.current.roll()
    setSpinning(false)
    return value
  }

  useImperativeHandle(ref, () => ({
    async rollOwn(mode = 'normal') {
      return isD20 ? rollD20(mode) : rollDuality(mode)
    },
    async rollOwnToValues(hopeTarget, fearTarget, mode = 'normal') {
      return rollDualityToValues(hopeTarget, fearTarget, mode)
    },
    startSpin(mode = 'normal') {
      setModifierVisible(mode !== 'normal')
      spinInProgressRef.current = startRemoteAnimation(mode)
    },
    async finishSpin(hope, fear, modifier) {
      if (spinInProgressRef.current) {
        await spinInProgressRef.current
        spinInProgressRef.current = null
      }
      hopeDieRef.current.setResult(hope)
      fearDieRef.current.setResult(fear)

      if (!isD20 && modifier) {
        setModifierVisible(true)
        if (modSpinInProgressRef.current) {
          await modSpinInProgressRef.current
          modSpinInProgressRef.current = null
        }
        modDieRef.current.setResult(modifier.value)
      }
    },
  }))

  return (
    <div ref={boxRef} className={`dice-set${isYou ? ' dice-set--you' : ''}`}>
      {criticalEffect && (
        <CriticalEffect
          key={criticalEffect.id}
          type={criticalEffect.type}
          boxRef={boxRef}
          onEnd={onCriticalEffectEnd}
        />
      )}
      <span className="dice-set-name" style={{ color }}>
        {name}
      </span>
      {stats && <SummaryRow name={name} stats={stats} />}
      <div className="dice-row">
        <div className="die-stage">
          <span className="die-label" style={{ color: primaryColor }}>
            {isD20 ? 'd20' : 'Esperança'}
          </span>
          <div
            ref={hopeStageRef}
            className={`die-platform${hopeSpinning ? ' die-platform--rolling' : ''}`}
          />
        </div>
        {isD20 ? (
          <div
            className={`die-stage${modifierVisible ? '' : ' die-stage--hidden'}`}
          >
            <span className="die-label" style={{ color: secondaryColor }}>
              d20 extra
            </span>
            <div
              ref={fearStageRef}
              className={`die-platform${fearSpinning ? ' die-platform--rolling' : ''}`}
            />
          </div>
        ) : (
          <div className="die-stage">
            <span className="die-label" style={{ color: secondaryColor }}>
              Medo
            </span>
            <div
              ref={fearStageRef}
              className={`die-platform${fearSpinning ? ' die-platform--rolling' : ''}`}
            />
          </div>
        )}
        {!isD20 && (
          <div
            className={`die-stage die-stage--modifier${modifierVisible ? '' : ' die-stage--hidden'}`}
          >
            <span className="die-label">d6</span>
            <div
              ref={modStageRef}
              className={`die-platform die-platform--small${modSpinning ? ' die-platform--rolling' : ''}`}
            />
          </div>
        )}
      </div>
      {stats && (
        <PlayerPips
          name={name}
          stats={stats}
          editable={statsEditable}
          canAdjust={canAdjustStat}
          onAdjust={onAdjustStat}
        />
      )}
      {onRoll && (
        <button
          type="button"
          className="roll-button-discreet"
          onClick={onRoll}
          disabled={rolling}
          title="Rolar"
          aria-label="Rolar"
        >
          {rolling ? '...' : '🎲 Rolar'}
        </button>
      )}
      {resultText && (
        <p
          className={`dice-set-result${isD20 ? ' dice-set-result--d20' : ''}`}
          style={{ color: resultColor }}
        >
          {resultText}
        </p>
      )}
    </div>
  )
})

export default PlayerDiceSet
