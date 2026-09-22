import { isDM } from '../utils/diceSystem'

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Read-only rendering of a stat, shared by StatField and StatTrackField —
// used only by the party status panel (nobody edits anyone else's sheet
// there). A little "stone chip" instead of a disabled input box: same
// visual language as the PV/Evasão/Armadura badges on the dice card, just
// generalized to any label/value pair.
function StatReadout({ label, value }) {
  return (
    <div className="stat-readout">
      <span className="stat-readout-label">{label}</span>
      <span className="stat-readout-value">{value}</span>
    </div>
  )
}

// Single-value stat (e.g. Evasion, Damage Thresholds) — editable draft in
// the stats modal, read-only chip in the party status panel.
export function StatField({ label, value, editable, onChange }) {
  if (!editable) return <StatReadout label={label} value={value} />

  return (
    <label className="stat stat--simple">
      <span className="stat-label">{label}</span>
      <input
        type="number"
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
    </label>
  )
}

// Track stat: current value / max — editable draft in the stats modal,
// read-only chip in the party status panel.
export function StatTrackField({ label, value, max, editable, onChangeValue, onChangeMax }) {
  if (!editable) return <StatReadout label={label} value={`${value}/${max}`} />

  return (
    <div className="stat stat--track">
      <span className="stat-label">{label}</span>
      <div className="stat-track-values">
        <input
          type="number"
          value={value}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChangeValue(toNumber(e.target.value))}
        />
        <span className="stat-track-separator">/</span>
        <input
          type="number"
          value={max}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChangeMax(toNumber(e.target.value))}
        />
      </div>
    </div>
  )
}

// Small number field with up/down arrows, used for the single-click-away
// stats (PV, Evasão, Armadura) in the dice box. Typing still works too —
// the arrows are just a shortcut for the common "nudge by one" case.
function Stepper({ value, onChange, min = 0 }) {
  return (
    <span className="stat-stepper">
      <input
        type="number"
        className="stat-stepper-input"
        value={value}
        onFocus={(e) => e.target.select()}
        onChange={(e) => onChange(toNumber(e.target.value))}
      />
      <span className="stat-stepper-arrows">
        <button
          type="button"
          className="stat-stepper-btn stat-stepper-btn--up"
          aria-label="Aumentar"
          onClick={() => onChange(value + 1)}
        />
        <button
          type="button"
          className="stat-stepper-btn stat-stepper-btn--down"
          aria-label="Diminuir"
          onClick={() => onChange(Math.max(min, value - 1))}
        />
      </span>
    </span>
  )
}

// "HP / Evasion / Armor" row above the dice. Read-only for everyone else's
// box; in your own box it's live-editable (arrows + typing) — but nothing
// is sent anywhere until "Anotar na Ficha" is pressed (see PlayerDiceSet).
export function SummaryRow({ name, stats, editable, onChangeField }) {
  if (isDM(name)) return null

  if (!editable) {
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

  return (
    <div className="summary-row">
      <div className="summary-block summary-block--editable">
        <span className="summary-block-label">PV</span>
        <div className="summary-block-pair">
          <Stepper value={stats.hp} onChange={(v) => onChangeField('hp', v)} />
          <span className="summary-block-sep">/</span>
          <input
            type="number"
            className="summary-block-max"
            value={stats.hpMax}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onChangeField('hpMax', toNumber(e.target.value))}
          />
        </div>
      </div>
      <div className="summary-block summary-block--editable">
        <span className="summary-block-label">Evasão</span>
        <Stepper value={stats.evasion} onChange={(v) => onChangeField('evasion', v)} />
      </div>
      <div className="summary-block summary-block--editable">
        <span className="summary-block-label">Armadura</span>
        <div className="summary-block-pair">
          <Stepper value={stats.armor} onChange={(v) => onChangeField('armor', v)} />
          <span className="summary-block-sep">/</span>
          <input
            type="number"
            className="summary-block-max"
            value={stats.armorMax}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onChangeField('armorMax', toNumber(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

// Row of pips for one track (Hope/Stress/Fatigue, or Fear for the DM).
// Read-only elsewhere; in your own box each pip is clickable — click the
// Nth pip to fill up to it, click the last filled one again to peel it
// back. Same "nothing syncs until Anotar na Ficha" rule as the summary row.
function TrackPips({ label, value, max, editable, onSetValue }) {
  const total = Math.max(max, 0)
  return (
    <div className="track-pips">
      <span className="track-pips-label">{label}</span>
      <div className="track-pips-dots">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const filled = n <= value
          if (!editable) {
            return <span key={n} className={`pip${filled ? ' pip--filled' : ''}`} />
          }
          return (
            <button
              key={n}
              type="button"
              className={`pip pip--clickable${filled ? ' pip--filled' : ''}`}
              aria-label={`Marcar ${label.toLowerCase()} até ${n}`}
              onClick={() => onSetValue(n === value ? n - 1 : n)}
            />
          )
        })}
      </div>
    </div>
  )
}

// Pip rows below the dice: Hope, Stress and Fatigue for players; only Fear
// for the DM (in the physical Daggerheart game Fear is literally a row of
// tokens, so this is faithful to the tabletop).
export function PlayerPips({ name, stats, editable, onSetField }) {
  if (isDM(name)) {
    return (
      <div className="player-pips">
        <TrackPips
          label="Medo"
          value={stats.fear}
          max={stats.fearMax}
          editable={editable}
          onSetValue={(v) => onSetField('fear', v)}
        />
      </div>
    )
  }

  return (
    <div className="player-pips">
      <TrackPips
        label="Esperança"
        value={stats.hopeTokens}
        max={stats.hopeTokensMax}
        editable={editable}
        onSetValue={(v) => onSetField('hopeTokens', v)}
      />
      <TrackPips
        label="Estresse"
        value={stats.stress}
        max={stats.stressMax}
        editable={editable}
        onSetValue={(v) => onSetField('stress', v)}
      />
      <TrackPips
        label="Fadiga"
        value={stats.fatigue}
        max={stats.fatigueMax}
        editable={editable}
        onSetValue={(v) => onSetField('fatigue', v)}
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
      />
      <StatField label="Evasão" value={stats.evasion} editable={editable} onChange={change('evasion')} />
      <StatTrackField
        label="Armadura"
        value={stats.armor}
        max={stats.armorMax}
        editable={editable}
        onChangeValue={change('armor')}
        onChangeMax={change('armorMax')}
      />
      <StatTrackField
        label="Esperança"
        value={stats.hopeTokens}
        max={stats.hopeTokensMax}
        editable={editable}
        onChangeValue={change('hopeTokens')}
        onChangeMax={change('hopeTokensMax')}
      />
      <StatTrackField
        label="Estresse"
        value={stats.stress}
        max={stats.stressMax}
        editable={editable}
        onChangeValue={change('stress')}
        onChangeMax={change('stressMax')}
      />
      <StatTrackField
        label="Fadiga"
        value={stats.fatigue}
        max={stats.fatigueMax}
        editable={editable}
        onChangeValue={change('fatigue')}
        onChangeMax={change('fatigueMax')}
      />
      <StatField label="Limiar Maior" value={stats.majorThreshold} editable={editable} onChange={change('majorThreshold')} />
      <StatField label="Limiar Grave" value={stats.severeThreshold} editable={editable} onChange={change('severeThreshold')} />
    </div>
  )
}
