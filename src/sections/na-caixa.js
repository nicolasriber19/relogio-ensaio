// Na caixa: o relógio e as 3 pulseiras.
// A caixa: os pontos numerados acendem um a um quando a foto entra na tela (detalhes em caixa()).
// Ficha técnica: uma luz verde acompanha o mouse por dentro do bloco, acende a borda perto dele e
// fecha o tracejado das etiquetas por onde passa. Só com mouse (no toque não há "passar por cima");
// sem JS fica o bloco parado, igual.

const MOVIMENTO_PERMITIDO = '(prefers-reduced-motion: no-preference)'

export function init() {
  const secao = document.getElementById('na-caixa')
  if (!secao) return
  caixa(secao)
  luz(secao)
}

// Os pontos começam apagados (.caixa--viva) e acendem, um depois do outro, quando 60% da foto está
// na tela (.caixa--aberta, uma vez só). Sem JS ou com movimento reduzido já ficam à vista.
function caixa(secao) {
  const figura = secao.querySelector('[data-caixa]')
  if (!figura || !window.matchMedia(MOVIMENTO_PERMITIDO).matches) return
  figura.classList.add('caixa--viva')
  new IntersectionObserver(
    ([entrada], observador) => {
      if (!entrada.isIntersecting) return
      observador.disconnect()
      figura.classList.add('caixa--aberta')
    },
    { threshold: 0.6 },
  ).observe(figura)
}

function luz(secao) {
  const ficha = secao.querySelector('.ficha')
  if (!ficha || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

  const alvos = [ficha, ...ficha.querySelectorAll('.ficha__itens li')]
  ficha.classList.add('ficha--luz')

  // A posição do mouse vira --x e --y em cada alvo, relativa a ele; um cálculo por quadro, no máximo
  let pedido = 0
  let ultimo = null
  const desenhar = () => {
    pedido = 0
    for (const el of alvos) {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--x', `${(ultimo.clientX - r.left).toFixed(1)}px`)
      el.style.setProperty('--y', `${(ultimo.clientY - r.top).toFixed(1)}px`)
    }
  }
  ficha.addEventListener('pointermove', (e) => {
    ultimo = e
    if (!pedido) pedido = requestAnimationFrame(desenhar)
  })
}
