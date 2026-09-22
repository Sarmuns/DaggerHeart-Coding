import { isDM } from '../utils/diceSystem'

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

// Single stat, rendered as a little read-only "stone chip" — same visual
// language as the PV/Evasão/Armadura badges on the dice card. Used only by
// the party status panel: nobody edits anyone else's sheet there anymore,
// real editing happens right on each player's own dice box.
function StatField({ label, value }) {
  return (
    <div className="stat-readout">
      <span className="stat-readout-label">{label}</span>
      <span className="stat-readout-value">{value}</span>
    </div>
  )
}

// Track stat (current/max) — same chip, just formats the value as a pair.
function StatTrackField({ label, value, max }) {
  return <StatField label={label} value={`${value}/${max}`} />
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
function TrackPips({ label, value, max, editable, onSetValue, stacked }) {
  const total = Math.max(max, 0)
  return (
    <div className={`track-pips${stacked ? ' track-pips--stacked' : ''}`}>
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
          stacked
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

// Full read-only sheet, only inside the party status panel — brings
// together everything that isn't in the summary row or the quick pips.
// Editing lives entirely on each player's own dice box now (see
// PlayerDiceSet/SummaryRow/PlayerPips) — this is purely a snapshot.
export function FullStatSheet({ name, stats }) {
  if (isDM(name)) {
    return (
      <div className="player-sheet">
        <StatTrackField label="Medo" value={stats.fear} max={stats.fearMax} />
      </div>
    )
  }

  return (
    <div className="player-sheet">
      <StatTrackField label="PV" value={stats.hp} max={stats.hpMax} />
      <StatField label="Evasão" value={stats.evasion} />
      <StatTrackField label="Armadura" value={stats.armor} max={stats.armorMax} />
      <StatTrackField label="Esperança" value={stats.hopeTokens} max={stats.hopeTokensMax} />
      <StatTrackField label="Estresse" value={stats.stress} max={stats.stressMax} />
      <StatTrackField label="Fadiga" value={stats.fatigue} max={stats.fatigueMax} />
      <StatField label="Limiar Maior" value={stats.majorThreshold} />
      <StatField label="Limiar Grave" value={stats.severeThreshold} />
    </div>
  )
}
