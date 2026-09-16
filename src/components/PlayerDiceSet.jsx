import { DiceRoller } from '@gnuton/css-dice-roller'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

const STAGGER_FEAR_MS = 60
const VELOCIDADE_ROLAGEM_S = 2
const ESCALA_DADO = 92

function prefereMenosMovimento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const PlayerDiceSet = forwardRef(function PlayerDiceSet(
  { nome, cor, corHope, corFear, corTextoHope, corTextoFear, destaque },
  ref,
) {
  const palcoHopeRef = useRef(null)
  const palcoFearRef = useRef(null)
  const rollerHopeRef = useRef(null)
  const rollerFearRef = useRef(null)
  const dieHopeRef = useRef(null)
  const dieFearRef = useRef(null)
  const giroEmAndamentoRef = useRef(null)
  const [girandoHope, setGirandoHope] = useState(false)
  const [girandoFear, setGirandoFear] = useState(false)

  useEffect(() => {
    const rollerHope = new DiceRoller(palcoHopeRef.current, ESCALA_DADO)
    const [dieHope] = rollerHope.addDie('d12')
    rollerHope.updateSettings({ baseColor: corHope, textColor: corTextoHope, speed: VELOCIDADE_ROLAGEM_S })
    rollerHopeRef.current = rollerHope
    dieHopeRef.current = dieHope

    const rollerFear = new DiceRoller(palcoFearRef.current, ESCALA_DADO)
    const [dieFear] = rollerFear.addDie('d12')
    rollerFear.updateSettings({ baseColor: corFear, textColor: corTextoFear, speed: VELOCIDADE_ROLAGEM_S })
    rollerFearRef.current = rollerFear
    dieFearRef.current = dieFear

    return () => {
      rollerHope.clear()
      rollerFear.clear()
      rollerHopeRef.current = null
      rollerFearRef.current = null
      dieHopeRef.current = null
      dieFearRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ baseColor: corHope })
  }, [corHope])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ baseColor: corFear })
  }, [corFear])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ textColor: corTextoHope })
  }, [corTextoHope])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ textColor: corTextoFear })
  }, [corTextoFear])

  async function animar() {
    const reduzido = prefereMenosMovimento()
    rollerHopeRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
    rollerFearRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })

    if (reduzido) {
      const hope = await dieHopeRef.current.roll()
      const fear = await dieFearRef.current.roll()
      return [hope, fear]
    }

    setGirandoHope(true)
    setGirandoFear(true)

    const hopePromise = dieHopeRef.current.roll().then((valor) => {
      setGirandoHope(false)
      return valor
    })

    await new Promise((resolver) => setTimeout(resolver, STAGGER_FEAR_MS))

    const fearPromise = dieFearRef.current.roll().then((valor) => {
      setGirandoFear(false)
      return valor
    })

    return Promise.all([hopePromise, fearPromise])
  }

  useImperativeHandle(ref, () => ({
    async rolarPropria() {
      const [hope, fear] = await animar()
      return { hope, fear }
    },
    iniciarGiro() {
      giroEmAndamentoRef.current = animar()
    },
    async finalizarGiro(hope, fear) {
      if (giroEmAndamentoRef.current) {
        await giroEmAndamentoRef.current
        giroEmAndamentoRef.current = null
      }
      dieHopeRef.current.setResult(hope)
      dieFearRef.current.setResult(fear)
    },
  }))

  return (
    <div className={`conjunto-dados${destaque ? ' conjunto-dados--voce' : ''}`}>
      <span className="conjunto-dados-nome" style={{ color: cor }}>
        {nome}
      </span>
      <div className="dados">
        <div className="dado-estagio">
          <span className="dado-label" style={{ color: corHope }}>
            Esperança
          </span>
          <div
            ref={palcoHopeRef}
            className={`dado-palco${girandoHope ? ' dado-palco--rolando' : ''}`}
          />
        </div>
        <div className="dado-estagio">
          <span className="dado-label" style={{ color: corFear }}>
            Medo
          </span>
          <div
            ref={palcoFearRef}
            className={`dado-palco${girandoFear ? ' dado-palco--rolando' : ''}`}
          />
        </div>
      </div>
    </div>
  )
})

export default PlayerDiceSet
