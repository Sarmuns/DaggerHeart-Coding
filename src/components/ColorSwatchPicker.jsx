import { CORES } from '../utils/cores'

function ColorSwatchPicker({ label, corSelecionada, onSelecionar, coresOcupadas = [] }) {
  return (
    <>
      <p className="label-cores">{label}</p>
      <div className="cores">
        {CORES.map((c) => {
          const ocupada = c.valor !== corSelecionada && coresOcupadas.includes(c.valor)
          return (
            <button
              key={c.valor}
              type="button"
              disabled={ocupada}
              title={ocupada ? `${c.nome} já está em uso` : undefined}
              className={`cor-swatch${corSelecionada === c.valor ? ' selecionada' : ''}${ocupada ? ' cor-swatch--ocupada' : ''}`}
              style={{ background: c.valor }}
              aria-label={c.nome}
              onClick={() => onSelecionar(c.valor)}
            />
          )
        })}
      </div>
    </>
  )
}

export default ColorSwatchPicker
