import { NOMES_JOGADORES } from '../utils/nomes'

function NomePicklist({ label, nomeSelecionado, onSelecionar }) {
  return (
    <div className="nome-picklist">
      <p className="label-cores">{label}</p>
      <div className="cores">
        {NOMES_JOGADORES.map((nome) => (
          <button
            key={nome}
            type="button"
            className={`nome-opcao${nomeSelecionado === nome ? ' selecionada' : ''}`}
            onClick={() => onSelecionar(nome)}
          >
            {nome}
          </button>
        ))}
      </div>
    </div>
  )
}

export default NomePicklist
