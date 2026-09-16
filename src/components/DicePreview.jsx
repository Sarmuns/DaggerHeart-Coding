import { DiceRoller } from '@gnuton/css-dice-roller'
import { useEffect, useRef } from 'react'

const ESCALA_PREVIEW = 80

function DicePreview({ corFundo, corBorda, corTexto, tema }) {
  const palcoRef = useRef(null)
  const rollerRef = useRef(null)

  useEffect(() => {
    const roller = new DiceRoller(palcoRef.current, ESCALA_PREVIEW)
    const [die] = roller.addDie('d12')
    roller.updateSettings({
      baseColor: corFundo,
      secondaryColor: corBorda,
      textColor: corTexto,
      theme: tema,
      animation: 'none',
    })
    die.setResult(12)
    rollerRef.current = roller

    return () => roller.clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    rollerRef.current?.updateSettings({
      baseColor: corFundo,
      secondaryColor: corBorda,
      textColor: corTexto,
      theme: tema,
    })
  }, [corFundo, corBorda, corTexto, tema])

  return <div ref={palcoRef} className="dado-palco dado-preview" />
}

export default DicePreview
