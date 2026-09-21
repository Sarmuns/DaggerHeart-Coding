import { DiceRoller } from '@gnuton/css-dice-roller'
import { useEffect, useRef } from 'react'

const PREVIEW_SCALE = 80

function DicePreview({ backgroundColor, borderColor, textColor, theme }) {
  const stageRef = useRef(null)
  const rollerRef = useRef(null)

  useEffect(() => {
    const roller = new DiceRoller(stageRef.current, PREVIEW_SCALE)
    const [die] = roller.addDie('d12')
    roller.updateSettings({
      baseColor: backgroundColor,
      secondaryColor: borderColor,
      textColor,
      theme,
      animation: 'none',
    })
    die.setResult(12)
    rollerRef.current = roller

    return () => roller.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    rollerRef.current?.updateSettings({
      baseColor: backgroundColor,
      secondaryColor: borderColor,
      textColor,
      theme,
    })
  }, [backgroundColor, borderColor, textColor, theme])

  return <div ref={stageRef} className="die-platform die-preview" />
}

export default DicePreview
