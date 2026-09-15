import { CORES } from '../utils/cores'

function ColorSwatchPicker({ label, corSelecionada, onSelecionar }) {
  return (
    <>
      <p className="label-cores">{label}</p>
      <div className="cores">
        {CORES.map((c) => (
          <button
            key={c.valor}
            type="button"
            className={`cor-swatch${corSelecionada === c.valor ? ' selecionada' : ''}`}
            style={{ background: c.valor }}
            aria-label={c.nome}
            onClick={() => onSelecionar(c.valor)}
          />
        ))}
      </div>
    </>
  )
}

export default ColorSwatchPicker
