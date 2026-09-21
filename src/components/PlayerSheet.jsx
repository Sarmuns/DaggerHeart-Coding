import { useState } from 'react'
import { isDM } from '../utils/diceSystem'

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Single-value stat (e.g. Evasion, Damage Thresholds) — used both in the
// status modal (compact) and the stats modal (larger editable draft).
export function StatField({ label, value, editable, onChange, compact }) {
  return (
    <label className={`stat stat--simple${compact ? ' stat--compact' : ''}`}>
      <span className="stat-label">{label}</span>
      <input
        type="number"
        value={value}
        disabled={!editable}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
    </label>
  )
}

// Track stat: current value / max — used both in the status modal
// (compact) and the stats modal (larger editable draft).
export function StatTrackField({ label, value, max, editable, onChangeValue, onChangeMax, compact }) {
  return (
    <div className={`stat stat--track${compact ? ' stat--compact' : ''}`}>
      <span className="stat-label">{label}</span>
      <div className="stat-track-values">
        <input
          type="number"
          value={value}
          disabled={!editable}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChangeValue(toNumber(e.target.value))}
        />
        <span className="stat-track-separator">/</span>
        <input
          type="number"
          value={max}
          disabled={!editable}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChangeMax(toNumber(e.target.value))}
        />
      </div>
    </div>
  )
}

// "HP / Evasion / Armor" row above the dice — read-only (real editing
// happens in the stats modal). Label on top, value below, each in its own
// block so it doesn't turn into a wall of text.
export function SummaryRow({ name, stats }) {
  if (isDM(name)) return null

  return (
    <div className="summary-row">
      <div className="summary-block">
        <span className="summary-block-label">PV</span>
        <span className="summary-block-value">
          {stats.hp}/{stats.hpMax}
        </span>
      </div>
      <div className="summary-block">
        <span className="summary-block-label">Evasão</span>
        <span className="summary-block-value">{stats.evasion}</span>
      </div>
      <div className="summary-block">
        <span className="summary-block-label">Armadura</span>
        <span className="summary-block-value">
          {stats.armor}/{stats.armorMax}
        </span>
      </div>
    </div>
  )
}

// Row of pips only, no interaction — used both in the dice box (read-only)
// and could be reused anywhere else.
function TrackPips({ label, value, max }) {
  const total = Math.max(max, 0)
  return (
    <div className="track-pips">
      <span className="track-pips-label">{label}</span>
      <div className="track-pips-dots">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span key={n} className={`pip${n <= value ? ' pip--filled' : ''}`} />
        ))}
      </div>
    </div>
  )
}

// Pips + "+N / -N" control (editable only) — the only way to adjust
// Hope/Stress/Fatigue directly from the dice box. Has a 5s cooldown
// (controlled by Room, shared between + and -) to avoid spamming writes to
// the database when several people click at once.
function TrackRow({ label, value, max, editable, canAdjust, onAdjust }) {
  const [amount, setAmount] = useState(1)
  const limit = Math.max(max, 1)

  return (
    <div className="track-row">
      {editable && (
        <div className="track-remove">
          <button
            type="button"
            className="track-button"
            disabled={!canAdjust}
            title={canAdjust ? `Remover ${label.toLowerCase()}` : 'Espera o cooldown acabar'}
            onClick={() => onAdjust(-amount)}
          >
            -
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            min={1}
            max={limit}
            value={amount}
            onFocus={(e) => e.target.select()}
            onClick={(e) => e.target.select()}
            onChange={(e) => setAmount(Math.min(Math.max(1, toNumber(e.target.value)), limit))}
          />
        </div>
      )}
      <TrackPips label={label} value={value} max={max} />
      {editable && (
        <button
          type="button"
          className="track-button track-button--add"
          disabled={!canAdjust}
          title={canAdjust ? `Adicionar ${label.toLowerCase()}` : 'Espera o cooldown acabar'}
          onClick={() => onAdjust(amount)}
        >
          +
        </button>
      )}
    </div>
  )
}

// Pip rows below the dice: Hope, Stress and Fatigue for players; only Fear
// for the DM (in the physical Daggerheart game Fear is literally a row of
// tokens, so this is faithful to the tabletop).
export function PlayerPips({ name, stats, editable, canAdjust, onAdjust }) {
  if (isDM(name)) {
    return (
      <div className="player-pips">
        <TrackRow
          label="Medo"
          value={stats.fear}
          max={stats.fearMax}
          editable={editable}
          canAdjust={canAdjust?.('fear')}
          onAdjust={(delta) => onAdjust('fear', delta)}
        />
      </div>
    )
  }

  return (
    <div className="player-pips">
      <TrackRow
        label="Esperança"
        value={stats.hopeTokens}
        max={stats.hopeTokensMax}
        editable={editable}
        canAdjust={canAdjust?.('hopeTokens')}
        onAdjust={(delta) => onAdjust('hopeTokens', delta)}
      />
      <TrackRow
        label="Estresse"
        value={stats.stress}
        max={stats.stressMax}
        editable={editable}
        canAdjust={canAdjust?.('stress')}
        onAdjust={(delta) => onAdjust('stress', delta)}
      />
      <TrackRow
        label="Fadiga"
        value={stats.fatigue}
        max={stats.fatigueMax}
        editable={editable}
        canAdjust={canAdjust?.('fatigue')}
        onAdjust={(delta) => onAdjust('fatigue', delta)}
      />
    </div>
  )
}

// Full editable sheet, only inside the status/stats modal — brings together
// everything that isn't in the summary row or the quick pips. This is where
// values are actually edited (with an explicit Save button outside, in the
// modal), instead of writing on every keystroke.
export function FullStatSheet({ name, stats, editable, onChangeField, compact = false }) {
  function change(field) {
    return (value) => onChangeField(field, value)
  }
  const wrapperClass = compact ? 'player-sheet' : 'stats-grid'

  if (isDM(name)) {
    return (
      <div className={wrapperClass}>
        <StatTrackField
          label="Medo"
          value={stats.fear}
          max={stats.fearMax}
          editable={editable}
          onChangeValue={change('fear')}
          onChangeMax={change('fearMax')}
          compact={compact}
        />
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      <StatTrackField
        label="PV"
        value={stats.hp}
        max={stats.hpMax}
        editable={editable}
        onChangeValue={change('hp')}
        onChangeMax={change('hpMax')}
        compact={compact}
      />
      <StatField label="Evasão" value={stats.evasion} editable={editable} onChange={change('evasion')} compact={compact} />
      <StatTrackField
        label="Armadura"
        value={stats.armor}
        max={stats.armorMax}
        editable={editable}
        onChangeValue={change('armor')}
        onChangeMax={change('armorMax')}
        compact={compact}
      />
      <StatTrackField
        label="Esperança"
        value={stats.hopeTokens}
        max={stats.hopeTokensMax}
        editable={editable}
        onChangeValue={change('hopeTokens')}
        onChangeMax={change('hopeTokensMax')}
        compact={compact}
      />
      <StatTrackField
        label="Estresse"
        value={stats.stress}
        max={stats.stressMax}
        editable={editable}
        onChangeValue={change('stress')}
        onChangeMax={change('stressMax')}
        compact={compact}
      />
      <StatTrackField
        label="Fadiga"
        value={stats.fatigue}
        max={stats.fatigueMax}
        editable={editable}
        onChangeValue={change('fatigue')}
        onChangeMax={change('fatigueMax')}
        compact={compact}
      />
      <StatField
        label="Limiar Maior"
        value={stats.majorThreshold}
        editable={editable}
        onChange={change('majorThreshold')}
        compact={compact}
      />
      <StatField
        label="Limiar Grave"
        value={stats.severeThreshold}
        editable={editable}
        onChange={change('severeThreshold')}
        compact={compact}
      />
    </div>
  )
}
