import { useState } from 'react'
import {
  DEFAULT_D20_STYLE,
  DEFAULT_D20_EXTRA_STYLE,
  DEFAULT_FEAR_STYLE,
  DEFAULT_HOPE_STYLE,
} from '../utils/defaultDiceStyles'
import { DICE_SYSTEM_D20, defaultDiceSystemFor } from '../utils/diceSystem'
import { DEFAULT_THEME } from '../utils/diceThemes'
import DiceColorModal from './DiceColorModal'
import Modal from './Modal'
import StatsModal from './StatsModal'

function ColorSettingsPanel({ player, diceSystem, stats, onUpdatePlayer, onSaveStats, onClose }) {
  const [openModal, setOpenModal] = useState(null) // 'hope' | 'fear' | 'stats' | null
  const isD20 = (diceSystem ?? defaultDiceSystemFor(player.name)) === DICE_SYSTEM_D20

  return (
    <>
      <Modal title="Suas configurações" onClose={onClose}>
        <p className="settings-panel-name">
          Jogando como <strong style={{ color: player.color }}>{player.name}</strong>
        </p>

        <div className="home-actions">
          <button type="button" onClick={() => setOpenModal('hope')}>
            {isD20 ? 'Dado d20' : 'Dado de Esperança'}
          </button>
          <button type="button" onClick={() => setOpenModal('fear')}>
            {isD20 ? 'Dado d20 extra' : 'Dado de Medo'}
          </button>
        </div>

        <button type="button" onClick={() => setOpenModal('stats')}>
          Marcadores do Personagem
        </button>
      </Modal>

      {openModal === 'hope' &&
        (isD20 ? (
          <DiceColorModal
            title="Dado d20"
            backgroundColor={player.d20Color}
            borderColor={player.d20BorderColor}
            textColor={player.d20TextColor}
            theme={player.d20Theme ?? DEFAULT_THEME}
            defaultStyle={DEFAULT_D20_STYLE}
            onApply={({ backgroundColor, borderColor, textColor, theme }) =>
              onUpdatePlayer({
                d20Color: backgroundColor,
                d20BorderColor: borderColor,
                d20TextColor: textColor,
                d20Theme: theme,
              })
            }
            onClose={() => setOpenModal(null)}
          />
        ) : (
          <DiceColorModal
            title="Dado de Esperança"
            backgroundColor={player.hopeColor}
            borderColor={player.hopeBorderColor}
            textColor={player.hopeTextColor}
            theme={player.hopeTheme ?? DEFAULT_THEME}
            defaultStyle={DEFAULT_HOPE_STYLE}
            onApply={({ backgroundColor, borderColor, textColor, theme }) =>
              onUpdatePlayer({
                hopeColor: backgroundColor,
                hopeBorderColor: borderColor,
                hopeTextColor: textColor,
                hopeTheme: theme,
              })
            }
            onClose={() => setOpenModal(null)}
          />
        ))}

      {openModal === 'fear' &&
        (isD20 ? (
          <DiceColorModal
            title="Dado d20 extra (vantagem/desvantagem)"
            backgroundColor={player.d20ExtraColor}
            borderColor={player.d20ExtraBorderColor}
            textColor={player.d20ExtraTextColor}
            theme={player.d20ExtraTheme ?? DEFAULT_THEME}
            defaultStyle={DEFAULT_D20_EXTRA_STYLE}
            onApply={({ backgroundColor, borderColor, textColor, theme }) =>
              onUpdatePlayer({
                d20ExtraColor: backgroundColor,
                d20ExtraBorderColor: borderColor,
                d20ExtraTextColor: textColor,
                d20ExtraTheme: theme,
              })
            }
            onClose={() => setOpenModal(null)}
          />
        ) : (
          <DiceColorModal
            title="Dado de Medo"
            backgroundColor={player.fearColor}
            borderColor={player.fearBorderColor}
            textColor={player.fearTextColor}
            theme={player.fearTheme ?? DEFAULT_THEME}
            defaultStyle={DEFAULT_FEAR_STYLE}
            onApply={({ backgroundColor, borderColor, textColor, theme }) =>
              onUpdatePlayer({
                fearColor: backgroundColor,
                fearBorderColor: borderColor,
                fearTextColor: textColor,
                fearTheme: theme,
              })
            }
            onClose={() => setOpenModal(null)}
          />
        ))}

      {openModal === 'stats' && (
        <StatsModal name={player.name} stats={stats} onApply={onSaveStats} onClose={() => setOpenModal(null)} />
      )}
    </>
  )
}

export default ColorSettingsPanel
