import { useEffect, useMemo, useRef } from 'react'

// Duração de cada efeito — precisa bater com a animação CSS mais longa de
// cada um (App.css), senão a Room desmonta o componente antes de terminar.
const DURACAO_MS = {
  faiscas: 1100,
  tremor: 650,
  fenda: 700,
  selo: 1500,
  moedas: 1500,
}

function gerarFaiscas(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `faisca-${i}`,
    angulo: (360 / n) * i + (Math.random() * 20 - 10),
    distancia: 70 + Math.random() * 50,
    atraso: Math.random() * 120,
  }))
}

function gerarMoedas(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `moeda-${i}`,
    esquerda: 4 + Math.random() * 92,
    atraso: Math.random() * 300,
    duracao: 800 + Math.random() * 400,
  }))
}

function EfeitoCritico({ tipo, onFim, caixaRef }) {
  // Guarda a versão mais recente de onFim numa ref pra não precisar dela nas
  // deps do efeito abaixo — Room re-renderiza por outros motivos (presence
  // sync etc.) e recria essa função a cada vez, o que resetava o timer antes
  // dele completar.
  const onFimRef = useRef(onFim)
  onFimRef.current = onFim

  useEffect(() => {
    const duracao = DURACAO_MS[tipo] ?? 1200
    const id = setTimeout(() => onFimRef.current(), duracao)
    return () => clearTimeout(id)
  }, [tipo])

  // Todo crítico sacode a caixa de quem rolou — pelo menos esse tremidão
  // sempre acontece, além do efeito visual específico sorteado. "Tremor" tem
  // uma classe mais forte/mais longa; os outros ganham um tremidão leve.
  useEffect(() => {
    const el = caixaRef?.current
    if (!el) return
    const classe = tipo === 'tremor' ? 'caixa-tremor-forte' : 'caixa-tremor-leve'
    const duracao = tipo === 'tremor' ? 500 : 350
    el.classList.add(classe)
    const id = setTimeout(() => el.classList.remove(classe), duracao)
    return () => {
      clearTimeout(id)
      el.classList.remove(classe)
    }
  }, [tipo, caixaRef])

  const faiscas = useMemo(() => gerarFaiscas(14), [])
  const moedas = useMemo(() => gerarMoedas(10), [])

  if (tipo === 'faiscas') {
    return (
      <div className="efeito-critico efeito-faiscas" aria-hidden="true">
        {faiscas.map((p) => (
          <span
            key={p.id}
            className="faisca"
            style={{ '--angulo': `${p.angulo}deg`, '--distancia': `${p.distancia}px`, animationDelay: `${p.atraso}ms` }}
          />
        ))}
      </div>
    )
  }

  if (tipo === 'tremor') {
    return <div className="efeito-critico efeito-tremor-flash" aria-hidden="true" />
  }

  if (tipo === 'fenda') {
    return (
      <div className="efeito-critico efeito-fenda" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="fenda-raio">
          <polyline points="60,0 45,30 58,32 30,70 40,45 25,42 50,0" />
        </svg>
      </div>
    )
  }

  if (tipo === 'selo') {
    return (
      <div className="efeito-critico efeito-selo" aria-hidden="true">
        <span className="selo-texto">CRÍTICO!</span>
      </div>
    )
  }

  if (tipo === 'moedas') {
    return (
      <div className="efeito-critico efeito-moedas" aria-hidden="true">
        {moedas.map((m) => (
          <span
            key={m.id}
            className="moeda"
            style={{ left: `${m.esquerda}%`, animationDelay: `${m.atraso}ms`, animationDuration: `${m.duracao}ms` }}
          />
        ))}
      </div>
    )
  }

  return null
}

export default EfeitoCritico
