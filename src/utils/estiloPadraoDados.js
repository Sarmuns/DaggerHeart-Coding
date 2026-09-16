import { TEMA_PADRAO } from './temasDados'

export const ESTILO_PADRAO_HOPE = {
  corFundo: '#f5c518',
  corBorda: '#7a5c00',
  corTexto: '#1a1a1a',
  tema: TEMA_PADRAO,
}

export const ESTILO_PADRAO_FEAR = {
  corFundo: '#6f5aa8',
  corBorda: '#2e2447',
  corTexto: '#ffffff',
  tema: TEMA_PADRAO,
}

// Estilo do d20 é independente do de Esperança/Medo — jogadores na
// mecânica dualidade nunca usam isso, mas o campo já existe pra quem
// migrar pra d20 não precisar recriar nada.
export const ESTILO_PADRAO_D20 = {
  corFundo: '#3b3b3b',
  corBorda: '#1a1a1a',
  corTexto: '#ffffff',
  tema: TEMA_PADRAO,
}

export const ESTILO_PADRAO_D20_EXTRA = {
  corFundo: '#8a8a8a',
  corBorda: '#4a4a4a',
  corTexto: '#1a1a1a',
  tema: TEMA_PADRAO,
}
