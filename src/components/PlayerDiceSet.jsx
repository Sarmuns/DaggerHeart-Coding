import { DiceRoller } from '@gnuton/css-dice-roller'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { MECANICA_D20 } from '../utils/mecanicaJogador'
import { TEMA_PADRAO } from '../utils/temasDados'

const STAGGER_FEAR_MS = 60
const VELOCIDADE_ROLAGEM_S = 2
const ESCALA_DADO = 92
const ESCALA_DADO_D20 = 106
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
    // "Principal" e "secundária" são os dois slots de dado do conjunto:
    // Esperança/Medo na mecânica dualidade, ou d20/d20-extra na mecânica
    // d20 — cada mecânica manda seus próprios campos de estilo, nunca
    // compartilhados entre si.
    corPrincipal,
    corSecundaria,
    corTextoPrincipal,
    corTextoSecundaria,
    corBordaPrincipal,
    corBordaSecundaria,
    temaPrincipal,
    temaSecundaria,
    mecanica,
    destaque,
    resultadoTexto,
    resultadoCor,
  },
  ref,
) {
  const ehD20 = mecanica === MECANICA_D20
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
    const tipoDado = ehD20 ? 'd20' : 'd12'
    const escala = ehD20 ? ESCALA_DADO_D20 : ESCALA_DADO

    const rollerHope = new DiceRoller(palcoHopeRef.current, escala)
    const [dieHope] = rollerHope.addDie(tipoDado)
    rollerHope.updateSettings({
      baseColor: corPrincipal,
      textColor: corTextoPrincipal,
      secondaryColor: corBordaPrincipal,
      theme: temaPrincipal ?? TEMA_PADRAO,
      speed: VELOCIDADE_ROLAGEM_S,
    })
    rollerHopeRef.current = rollerHope
    dieHopeRef.current = dieHope

    const rollerFear = new DiceRoller(palcoFearRef.current, escala)
    const [dieFear] = rollerFear.addDie(tipoDado)
    rollerFear.updateSettings({
      baseColor: corSecundaria,
      textColor: corTextoSecundaria,
      secondaryColor: corBordaSecundaria,
      theme: temaSecundaria ?? TEMA_PADRAO,
      speed: VELOCIDADE_ROLAGEM_S,
    })
    rollerFearRef.current = rollerFear
    dieFearRef.current = dieFear

    let rollerMod = null
    if (!ehD20) {
      rollerMod = new DiceRoller(palcoModRef.current, ESCALA_DADO_MODIFICADOR)
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
    }

    return () => {
      rollerHope.clear()
      rollerFear.clear()
      rollerMod?.clear()
      rollerHopeRef.current = null
      rollerFearRef.current = null
      rollerModRef.current = null
      dieHopeRef.current = null
      dieFearRef.current = null
      dieModRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ehD20])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ baseColor: corPrincipal })
  }, [corPrincipal])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ baseColor: corSecundaria })
  }, [corSecundaria])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ textColor: corTextoPrincipal })
  }, [corTextoPrincipal])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ textColor: corTextoSecundaria })
  }, [corTextoSecundaria])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ secondaryColor: corBordaPrincipal })
  }, [corBordaPrincipal])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ secondaryColor: corBordaSecundaria })
  }, [corBordaSecundaria])

  useEffect(() => {
    rollerHopeRef.current?.updateSettings({ theme: temaPrincipal ?? TEMA_PADRAO })
  }, [temaPrincipal])

  useEffect(() => {
    rollerFearRef.current?.updateSettings({ theme: temaSecundaria ?? TEMA_PADRAO })
  }, [temaSecundaria])

  // Gira um dado até um valor já decidido, sem nunca revelar o valor
  // aleatório "de verdade" primeiro — usado pela vantagem do Samuel, pra
  // trocar hope/fear ser imperceptível (sem o dado mostrar um número e
  // "piscar" pra outro logo em seguida).
  async function girarParaValor(dieRef, alvo) {
    const die = dieRef.current
    if (die.settings.animation === 'none') {
      die.setResult(alvo)
      return alvo
    }
    die.element.style.setProperty('--dice-animation-name', `roll-${die.settings.animation}`)
    die.element.classList.add('is-rolling')
    await new Promise((resolver) => setTimeout(resolver, die.settings.speed * 1000))
    die.element.classList.remove('is-rolling')
    die.setResult(alvo)
    return alvo
  }

  async function animarParParaValores(hopeAlvo, fearAlvo) {
    const reduzido = prefereMenosMovimento()
    rollerHopeRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
    rollerFearRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })

    if (reduzido) {
      dieHopeRef.current.setResult(hopeAlvo)
      dieFearRef.current.setResult(fearAlvo)
      return [hopeAlvo, fearAlvo]
    }

    setGirandoHope(true)
    setGirandoFear(true)

    const hopePromise = girarParaValor(dieHopeRef, hopeAlvo).then((valor) => {
      setGirandoHope(false)
      return valor
    })

    await new Promise((resolver) => setTimeout(resolver, STAGGER_FEAR_MS))

    const fearPromise = girarParaValor(dieFearRef, fearAlvo).then((valor) => {
      setGirandoFear(false)
      return valor
    })

    return Promise.all([hopePromise, fearPromise])
  }

  async function animarPar() {
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

  // Mecânica dualidade (2d12: Esperança/Medo + d6 opcional de vantagem/desvantagem)
  async function rolarDualidade(modo) {
    setModificadorVisivel(modo !== 'normal')
    const principalPromise = animarPar()
    const modificadorPromise = modo !== 'normal' ? animarModificador() : null

    const [hope, fear] = await principalPromise
    const valorModificador = modificadorPromise ? await modificadorPromise : null

    return {
      hope,
      fear,
      modificador: valorModificador === null ? null : { tipo: modo, valor: valorModificador },
    }
  }

  // Igual rolarDualidade, mas os dados já giram direto pro valor final
  // definido por fora (hope/fear já decididos, incluindo qualquer troca de
  // vantagem) — nunca mostra um valor "de verdade" pra depois substituir.
  async function rolarDualidadeParaValores(hopeAlvo, fearAlvo, modo) {
    setModificadorVisivel(modo !== 'normal')
    const principalPromise = animarParParaValores(hopeAlvo, fearAlvo)
    const modificadorPromise = modo !== 'normal' ? animarModificador() : null

    const [hope, fear] = await principalPromise
    const valorModificador = modificadorPromise ? await modificadorPromise : null

    return {
      hope,
      fear,
      modificador: valorModificador === null ? null : { tipo: modo, valor: valorModificador },
    }
  }

  // Mecânica d20 (estilo D&D): normal rola só 1 dado; vantagem/desvantagem
  // rolam 2 (reaproveitando o slot do "fear" como o d20 extra) e ficam com
  // o maior/menor.
  async function rolarD20(modo) {
    const reduzido = prefereMenosMovimento()
    rollerHopeRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })

    if (modo === 'normal') {
      setModificadorVisivel(false)
      setGirandoHope(true)
      const valor = await dieHopeRef.current.roll()
      setGirandoHope(false)
      return { hope: valor, fear: valor, modificador: null }
    }

    setModificadorVisivel(true)
    rollerFearRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
    setGirandoHope(true)
    setGirandoFear(true)

    const v1Promise = dieHopeRef.current.roll().then((valor) => {
      setGirandoHope(false)
      return valor
    })

    await new Promise((resolver) => setTimeout(resolver, STAGGER_FEAR_MS))

    const v2Promise = dieFearRef.current.roll().then((valor) => {
      setGirandoFear(false)
      return valor
    })

    const [v1, v2] = await Promise.all([v1Promise, v2Promise])
    const mantido = modo === 'vantagem' ? Math.max(v1, v2) : Math.min(v1, v2)
    const descartado = mantido === v1 ? v2 : v1

    return { hope: mantido, fear: descartado, modificador: { tipo: modo, valor: null } }
  }

  // Versão "muda" das animações acima, usada só pra espelhar visualmente a
  // rolagem de outro jogador — o valor real chega depois via finalizarGiro.
  async function iniciarAnimacaoRemota(modo) {
    if (ehD20) {
      const reduzido = prefereMenosMovimento()
      rollerHopeRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
      if (modo === 'normal') return animarD20SoDado(dieHopeRef, setGirandoHope)
      rollerFearRef.current.updateSettings({ animation: reduzido ? 'none' : 'float' })
      const p1 = animarD20SoDado(dieHopeRef, setGirandoHope)
      await new Promise((resolver) => setTimeout(resolver, STAGGER_FEAR_MS))
      const p2 = animarD20SoDado(dieFearRef, setGirandoFear)
      return Promise.all([p1, p2])
    }

    giroModEmAndamentoRef.current = modo !== 'normal' ? animarModificador() : null
    return animarPar()
  }

  async function animarD20SoDado(dieRef, setGirando) {
    setGirando(true)
    const valor = await dieRef.current.roll()
    setGirando(false)
    return valor
  }

  useImperativeHandle(ref, () => ({
    async rolarPropria(modo = 'normal') {
      return ehD20 ? rolarD20(modo) : rolarDualidade(modo)
    },
    async rolarPropriaParaValores(hopeAlvo, fearAlvo, modo = 'normal') {
      return rolarDualidadeParaValores(hopeAlvo, fearAlvo, modo)
    },
    iniciarGiro(modo = 'normal') {
      setModificadorVisivel(modo !== 'normal')
      giroEmAndamentoRef.current = iniciarAnimacaoRemota(modo)
    },
    async finalizarGiro(hope, fear, modificador) {
      if (giroEmAndamentoRef.current) {
        await giroEmAndamentoRef.current
        giroEmAndamentoRef.current = null
      }
      dieHopeRef.current.setResult(hope)
      dieFearRef.current.setResult(fear)

      if (!ehD20 && modificador) {
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
          <span className="dado-label" style={{ color: corPrincipal }}>
            {ehD20 ? 'd20' : 'Esperança'}
          </span>
          <div
            ref={palcoHopeRef}
            className={`dado-palco${girandoHope ? ' dado-palco--rolando' : ''}`}
          />
        </div>
        {ehD20 ? (
          <div
            className={`dado-estagio${modificadorVisivel ? '' : ' dado-estagio--oculto'}`}
          >
            <span className="dado-label" style={{ color: corSecundaria }}>
              d20 extra
            </span>
            <div
              ref={palcoFearRef}
              className={`dado-palco${girandoFear ? ' dado-palco--rolando' : ''}`}
            />
          </div>
        ) : (
          <div className="dado-estagio">
            <span className="dado-label" style={{ color: corSecundaria }}>
              Medo
            </span>
            <div
              ref={palcoFearRef}
              className={`dado-palco${girandoFear ? ' dado-palco--rolando' : ''}`}
            />
          </div>
        )}
        {!ehD20 && (
          <div
            className={`dado-estagio dado-estagio--modificador${modificadorVisivel ? '' : ' dado-estagio--oculto'}`}
          >
            <span className="dado-label">d6</span>
            <div
              ref={palcoModRef}
              className={`dado-palco dado-palco--pequeno${girandoMod ? ' dado-palco--rolando' : ''}`}
            />
          </div>
        )}
      </div>
      {resultadoTexto && (
        <p
          className={`conjunto-dados-resultado${ehD20 ? ' conjunto-dados-resultado--d20' : ''}`}
          style={{ color: resultadoCor }}
        >
          {resultadoTexto}
        </p>
      )}
    </div>
  )
})

export default PlayerDiceSet
