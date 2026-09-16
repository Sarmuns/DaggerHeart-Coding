import { DiceRoller } from '@gnuton/css-dice-roller'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { TEMA_PADRAO } from '../utils/temasDados'

const STAGGER_FEAR_MS = 60
const VELOCIDADE_ROLAGEM_S = 2
const ESCALA_DADO = 92
const ESCALA_DADO_MODIFICADOR = 60
const COR_MODIFICADOR_FUNDO = '#5b5b5b'
const COR_MODIFICADOR_BORDA = '#2a2a2a'
const COR_MODIFICADOR_TEXTO = '#ffffff'

function prefereMenosMovimento() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const PlayerDiceSet = forwardRef(function PlayerDiceSet(
  {
    nome,
    cor,
    corHope,
    corFear,
    corTextoHope,
    corTextoFear,
    corBordaHope,
    corBordaFear,
    temaHope,
    temaFear,
    destaque,
  },
  ref,
) {
  const palcoHopeRef = useRef(null)
  const palcoFearRef = useRef(null)
  const palcoModRef = useRef(null)
  const rollerHopeRef = useRef(null)
  const rollerFearRef = useRef(null)
  const rollerModRef = useRef(null)
  const dieHopeRef = useRef(null)
  const dieFearRef = useRef(null)
  const dieModRef = useRef(null)
  const giroEmAndamentoRef = useRef(null)
  const giroModEmAndamentoRef = useRef(null)
  const [girandoHope, setGirandoHope] = useState(false)
  const [girandoFear, setGirandoFear] = useState(false)
  const [girandoMod, setGirandoMod] = useState(false)
  const [modificadorVisivel, setModificadorVisivel] = useState(false)

  useEffect(() => {
    const rollerHope = new DiceRoller(palcoHopeRef.current, ESCALA_DADO)
    const [dieHope] = rollerHope.addDie('d12')
    rollerHope.updateSettings({
      baseColor: corHope,
      textColor: corTextoHope,
      secondaryColor: corBordaHope,
      theme: temaHope ?? TEMA_PADRAO,
      speed: VELOCIDADE_ROLAGEM_S,
    })
    rollerHopeRef.current = rollerHope
    dieHopeRef.current = dieHope

    const rollerFear = new DiceRoller(palcoFearRef.current, ESCALA_DADO)
    const [dieFear] = rollerFear.addDie('d12')
    rollerFear.updateSettings({
      baseColor: corFear,
      textColor: corTextoFear,
      secondaryColor: corBordaFear,
      theme: temaFear ?? TEMA_PADRAO,
      speed: VELOCIDADE_ROLAGEM_S,
    })
    rollerFearRef.current = rollerFear
    dieFearRef.current = dieFear

    const rollerMod = new DiceRoller(palcoModRef.current, ESCALA_DADO_MODIFICADOR)
    const [dieMod] = rollerMod.addDie('d6')
    rollerMod.updateSettings({
      baseColor: COR_MODIFICADOR_FUNDO,
      secondaryColor: COR_MODIFICADOR_BORDA,
      textColor: COR_MODIFICADOR_TEXTO,
      theme: 'theme-solid',
      speed: VELOCIDADE_ROLAGEM_S,
    })
    rollerModRef.current = rollerMod
    dieModRef.current = dieMod

    return () => {
      rollerHope.clear()
      rollerFear.clear()
      rollerMod.clear()
      rollerHopeRef.current = null
      rollerFearRef.current = null
      rollerModRef.current = null
      dieHopeRef.current = null
      dieFearRef.current = null
      dieModRef.current = null
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

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ secondaryColor: corBordaHope })
  }, [corBordaHope])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ secondaryColor: corBordaFear })
  }, [corBordaFear])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ theme: temaHope ?? TEMA_PADRAO })
  }, [temaHope])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ theme: temaFear ?? TEMA_PADRAO })
  }, [temaFear])

  async function animarPrincipal() {
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

  async function animarModificador() {
    const reduzido = prefereMenosMovimento()
    rollerModRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
    setGirandoMod(true)
    const valor = await dieModRef.current.roll()
    setGirandoMod(false)
    return valor
  }

  useImperativeHandle(ref, () => ({
    async rolarPropria(modo = 'normal') {
      setModificadorVisivel(modo !== 'normal')
      const principalPromise = animarPrincipal()
      const modificadorPromise = modo !== 'normal' ? animarModificador() : null

      const [hope, fear] = await principalPromise
      const valorModificador = modificadorPromise ? await modificadorPromise : null

      return {
        hope,
        fear,
        modificador: valorModificador === null ? null : { tipo: modo, valor: valorModificador },
      }
    },
    definirHope(valor) {
      dieHopeRef.current.setResult(valor)
    },
    iniciarGiro(modo = 'normal') {
      setModificadorVisivel(modo !== 'normal')
      giroEmAndamentoRef.current = animarPrincipal()
      giroModEmAndamentoRef.current = modo !== 'normal' ? animarModificador() : null
    },
    async finalizarGiro(hope, fear, modificador) {
      if (giroEmAndamentoRef.current) {
        await giroEmAndamentoRef.current
        giroEmAndamentoRef.current = null
      }
      dieHopeRef.current.setResult(hope)
      dieFearRef.current.setResult(fear)

      if (modificador) {
        setModificadorVisivel(true)
        if (giroModEmAndamentoRef.current) {
          await giroModEmAndamentoRef.current
          giroModEmAndamentoRef.current = null
        }
        dieModRef.current.setResult(modificador.valor)
      }
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
        <div
          className={`dado-estagio dado-estagio--modificador${modificadorVisivel ? '' : ' dado-estagio--oculto'}`}
        >
          <span className="dado-label">d6</span>
          <div
            ref={palcoModRef}
            className={`dado-palco dado-palco--pequeno${girandoMod ? ' dado-palco--rolando' : ''}`}
          />
        </div>
      </div>
    </div>
  )
})

export default PlayerDiceSet
