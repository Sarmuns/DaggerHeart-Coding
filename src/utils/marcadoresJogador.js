// Marcadores de personagem do Daggerheart. PV, Esperança, Estresse e
// Armadura são "tracks" marcados (valor atual / máximo); Evasão e os
// Limiares de Dano são números fixos (sem marcação). Fadiga é um marcador
// extra da mesa, fora do SRD oficial. Medo é o recurso do GM — não é por
// personagem, só existe pro jogador com a tag de DM.
export const MARCADORES_PADRAO = {
  pv: 10,
  pvMax: 10,
  esperanca: 2,
  esperancaMax: 6,
  estresse: 0,
  estresseMax: 6,
  fadiga: 0,
  fadigaMax: 6,
  armadura: 0,
  armaduraMax: 6,
  evasao: 10,
  limiarMaior: 7,
  limiarGrave: 14,
  fear: 0,
  fearMax: 12,
}

// Presence só carrega o que foi trackeado — nunca assume que um campo
// existe (jogador antigo, ainda carregando do banco, etc.).
export function marcadoresDoPresence(jg) {
  const marcadores = {}
  for (const campo of Object.keys(MARCADORES_PADRAO)) {
    marcadores[campo] = jg[campo] ?? MARCADORES_PADRAO[campo]
  }
  return marcadores
}
