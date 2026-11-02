// Mostrador: a luz que o visitante move. "A luz corre pelo verde conforme você move o pulso", ao pé da letra.
// Mouse: a luz aponta para onde está o mouse. Celular: acompanha a inclinação (no iPhone, com permissão).
// Sem mouse nem sensor: anda com a rolagem. Os itens da lista levam a luz até a peça de cada um.
// Com movimento reduzido (ou sem JS) fica a foto com uma luz parada.

const MOVIMENTO_PERMITIDO = '(prefers-reduced-motion: no-preference)'
const CENTRO = { x: 0.424, y: 0.586 } // centro do mostrador na foto (1600 x 904)
const JANELA = 16 // graus: o detalhe acende quando a luz passa a menos disso dele

// Diferença entre dois ângulos, de -180 a 180
const diferenca = (a, b) => ((((a - b) % 360) + 540) % 360) - 180

export function init() {
  const secao = document.getElementById('mostrador')
  if (!secao) return
  const palco = secao.querySelector('.mostrador__palco')
  if (!palco || !window.matchMedia(MOVIMENTO_PERMITIDO).matches) return

  const itens = [...secao.querySelectorAll('.detalhes li[data-alvo]')]
  const pontos = [...palco.querySelectorAll('[data-ponto]')]
  const dica = secao.querySelector('[data-dica]')
  const botaoInclinar = secao.querySelector('[data-inclinar]')
  secao.classList.add('mostrador--vivo')

  // Ângulo de cada detalhe visto do centro do mostrador, na proporção real do palco
  const angulos = {}
  const medirAngulos = () => {
    const { width, height } = palco.getBoundingClientRect()
    for (const p of pontos) {
      const x = parseFloat(p.style.getPropertyValue('--x')) / 100
      const y = parseFloat(p.style.getPropertyValue('--y')) / 100
      angulos[p.dataset.ponto] = (Math.atan2((x - CENTRO.x) * width, -(y - CENTRO.y) * height) * 180) / Math.PI
    }
  }
  medirAngulos()
  window.addEventListener('resize', medirAngulos)

  // Estado: para onde a luz vai (alvo) e onde está (atual); quem manda por último ganha
  let alvo = 300
  let atual = 300
  let comando = 'rolagem' // 'mouse', 'inclinacao', 'lista' ou 'rolagem'
  let ultimoComando = 0
  const mandar = (angulo, origem) => {
    alvo = angulo
    comando = origem
    ultimoComando = performance.now()
    pedir()
  }

  // Mouse (ou caneta) sobre a seção inteira: a luz aponta para ele
  secao.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return
    const r = palco.getBoundingClientRect()
    const cx = r.left + r.width * CENTRO.x
    const cy = r.top + r.height * CENTRO.y
    mandar((Math.atan2(e.clientX - cx, -(e.clientY - cy)) * 180) / Math.PI, 'mouse')
  })

  // Inclinação do celular: deitar para os lados gira a luz
  const aoInclinar = (e) => {
    if (e.gamma == null) return
    mandar(300 + e.gamma * 3 + (e.beta ?? 45) - 45, 'inclinacao')
  }
  const toque = window.matchMedia('(pointer: coarse)').matches
  if (toque && 'DeviceOrientationEvent' in window) {
    if (dica) dica.textContent = 'Toque num detalhe ou role a página: a luz acompanha.'
    if (typeof DeviceOrientationEvent.requestPermission === 'function' && botaoInclinar) {
      // iPhone: o sensor só liga com um toque e a permissão da pessoa
      botaoInclinar.hidden = false
      botaoInclinar.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission()
          .then((resposta) => {
            if (resposta !== 'granted') return
            window.addEventListener('deviceorientation', aoInclinar)
            botaoInclinar.hidden = true
            if (dica) dica.textContent = 'Incline o celular: a luz corre pelo verde.'
          })
          .catch(() => {})
      })
    } else {
      window.addEventListener('deviceorientation', aoInclinar)
    }
  }

  // Lista: passar o mouse, focar ou tocar num item leva a luz até a peça dele
  for (const item of itens) {
    const botao = item.querySelector('button')
    const ir = () => angulos[item.dataset.alvo] !== undefined && mandar(angulos[item.dataset.alvo], 'lista')
    botao?.addEventListener('click', ir)
    botao?.addEventListener('focus', ir)
    item.addEventListener('pointerenter', ir)
  }

  // Rolagem: quando ninguém está comandando, a luz anda com a página
  const aoRolar = () => {
    if (comando !== 'rolagem' && performance.now() - ultimoComando < 2500) return
    const r = secao.getBoundingClientRect()
    const progresso = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)))
    alvo = 200 + progresso * 220
    comando = 'rolagem'
    pedir()
  }
  window.addEventListener('scroll', aoRolar, { passive: true })

  // Um quadro por vez, só enquanto a luz ainda não chegou; acende o detalhe que a luz alcança
  let pedido = 0
  let visivel = false
  function pedir() {
    if (!pedido && visivel) pedido = requestAnimationFrame(desenhar)
  }
  function desenhar() {
    pedido = 0
    atual += diferenca(alvo, atual) * 0.12
    palco.style.setProperty('--ang', `${atual.toFixed(2)}deg`)
    for (const p of pontos) {
      const ligado = Math.abs(diferenca(atual, angulos[p.dataset.ponto])) < JANELA
      p.classList.toggle('ativo', ligado)
      itens.find((i) => i.dataset.alvo === p.dataset.ponto)?.classList.toggle('ativo', ligado)
    }
    if (Math.abs(diferenca(alvo, atual)) > 0.1) pedir()
  }

  // Fora da tela, nada é calculado; ao entrar, o palco cresce e a luz acorda
  new IntersectionObserver(([entrada]) => {
    visivel = entrada.isIntersecting
    if (visivel) {
      secao.classList.add('em-cena')
      aoRolar()
      pedir()
    }
  }, { threshold: 0.15 }).observe(secao)
}
