import { NOMES_JOGADORES } from '../utils/nomes'

function NomePicklist({ label, nomeSelecionado, onSelecionar, nomesOcupados = [] }) {
  return (
    <div className="nome-picklist">
      <p className="label-cores">{label}</p>
      <div className="cores">
        {NOMES_JOGADORES.map((nome) => {
          const ocupado = nome !== nomeSelecionado && nomesOcupados.includes(nome)
          return (
            <button
              key={nome}
              type="button"
              disabled={ocupado}
              title={ocupado ? `${nome} já está na sala` : undefined}
              className={`nome-opcao${nomeSelecionado === nome ? ' selecionada' : ''}${ocupado ? ' nome-opcao--ocupado' : ''}`}
              onClick={() => onSelecionar(nome)}
            >
              {nome}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default NomePicklist
