// Ponto de entrada do site: o Vite começa por aqui e junta o resto.
import './styles/tokens.css'
import './styles/base.css'
import './styles/secoes.css'

import { init as initHero } from './sections/hero.js'
import { init as initAbertura } from './sections/abertura.js'
import { init as initMostrador } from './sections/mostrador.js'
import { init as initPulseiras } from './sections/pulseiras.js'
import { init as initNaCaixa } from './sections/na-caixa.js'
import { init as initListaEspera } from './sections/lista-espera.js'

// Cada seção tem um arquivo em src/sections/ com uma função init, na ordem da página.
// Uma seção com erro não pode derrubar as seguintes: o erro vai para o console e o resto segue.
const secoes = [initHero, initAbertura, initMostrador, initPulseiras, initNaCaixa, initListaEspera]

for (const iniciar of secoes) {
  try {
    iniciar()
  } catch (erro) {
    console.error('Uma seção não iniciou:', erro)
  }
}

// Funções pequenas usadas por várias seções (ex.: "reduzir movimento ligado?") vão em src/lib/.
