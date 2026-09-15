const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function gerarCodigoSala(tamanho = 5) {
  let codigo = ''
  for (let i = 0; i < tamanho; i++) {
    codigo += CARACTERES[Math.floor(Math.random() * CARACTERES.length)]
  }
  return codigo
}
