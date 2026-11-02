// Pulseiras: o mesmo relógio, três pulseiras. Escolher um cartão troca a pulseira e o cenário.
// O relógio gira 360 graus: cada pulseira tem 120 fotos, uma a cada 3 graus, desenhadas num canvas,
// e entre duas vizinhas a tela mostra a mistura das duas, para o giro não andar aos saltos.
// Em repouso, fica parado de frente. Segurando e arrastando, a pessoa gira para qualquer lado,
// quantas voltas quiser; ao soltar, ele volta sozinho para a frente, suave, e para ali, numa foto
// inteira (parado, nunca fica a mistura de duas, que parece imagem dupla e cansa a vista).
// As três pulseiras usam o mesmo ângulo: na troca, a nova aparece da caixa para fora no mesmo ponto
// do giro, então só a pulseira parece mudar. O cenário troca com esmaecimento lento, sem piscar.
// Sem JS ou com movimento reduzido: o palco fica escondido e valem os cartões e as fotos de sempre.

const MOVIMENTO_PERMITIDO = '(prefers-reduced-motion: no-preference)'
const NOMES = { dia: 'Dia a dia', social: 'Social', fds: 'Fim de semana' }
const QUADROS = 120 // fotos por volta, uma a cada 3 graus
const ESPERA = 1200 // ms parado, depois do gesto, antes de voltar para a frente
const VOLTA_POR_LARGURA = 0.6 // arrastar a largura inteira do palco gira 60% de uma volta
const SEGUIR = 0.18 // a cada quadro, o relógio anda 18% do que falta até a mão: segue sem chicotear
const EMBALO_MAX = 1.2 // quadros por quadro de tela, no máximo, ao soltar
const FREIO = 0.86 // o embalo perde 14% por quadro: desliza um pouco e para

export function init() {
  const secao = document.getElementById('pulseiras')
  const troca = secao?.querySelector('[data-troca]')
  if (!troca || !window.matchMedia(MOVIMENTO_PERMITIDO).matches) return

  const palco = troca.querySelector('.troca__palco')
  const cartoes = [...troca.querySelectorAll('.pulseiras li[data-opcao]')]
  const ordem = cartoes.map((c) => c.dataset.opcao)
  const anuncio = troca.querySelector('[data-anuncio]')
  const descricao = troca.querySelector('[data-descricao]')
  if (!palco || cartoes.length < 2) return
  troca.classList.add('troca--viva')

  const pega = (seletor, opcao) => palco.querySelector(`${seletor}[data-opcao="${opcao}"]`)
  let atual = null
  let animacao = null
  let mexeu = false // a pessoa já escolheu ou girou: a demonstração automática não roda mais
  let naTela = false
  let pertoDaTela = false // só então as fotos começam a baixar

  // Fotos: a resolução sai da altura real do palco na tela (com a densidade de pixels)
  const altura = palco.getBoundingClientRect().height * (window.devicePixelRatio || 1) > 760 ? 1100 : 700
  const telas = [...palco.querySelectorAll('canvas.troca__relogio')]
  const fotos = {} // opcao -> Array(120) de Image (carregadas aos poucos)
  for (const tela of telas) {
    fotos[tela.dataset.opcao] = new Array(QUADROS).fill(null)
    tela.height = altura
    tela.width = Math.round(altura * (tela.width / 1100))
  }
  const caminho = (tela, i) =>
    `${import.meta.env.BASE_URL}img/giro/${tela.dataset.giro}/${altura}/${String(i).padStart(3, '0')}.webp`

  // Baixa as 120 fotos de uma pulseira: primeiro a cada 4 (já dá para girar), depois as do meio
  const baixar = (opcao) => {
    const tela = pega('canvas.troca__relogio', opcao)
    if (!tela || tela.dataset.baixando) return Promise.resolve()
    tela.dataset.baixando = '1'
    const fila = [...Array(QUADROS).keys()].sort((a, b) => (a % 4 === 0 ? 0 : 1) - (b % 4 === 0 ? 0 : 1) || a - b)
    // Seis por vez: o celular não engasga baixando e decodificando 120 fotos de uma vez
    const trabalhador = async () => {
      while (fila.length) {
        const i = fila.shift()
        const img = new Image()
        img.src = caminho(tela, i)
        try {
          // Decodifica fora do desenho: a primeira aparição de cada foto não engasga o giro
          await img.decode()
          fotos[opcao][i] = img
          if (opcao === atual) pedir()
        } catch {
          // foto que não veio: o desenho usa a vizinha
        }
      }
    }
    return Promise.all(Array.from({ length: 6 }, trabalhador))
  }
  // As outras pulseiras só quando o navegador está ocioso
  const quandoOcioso = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 500))

  // O ângulo é um número de quadro (0 a 120, dá a volta). Entre duas fotos vizinhas, a tela mostra a
  // mistura das duas na proporção do ângulo: o giro fica contínuo em qualquer velocidade, sem degraus.
  let angulo = 0
  // Aparelho que não acompanha (média acima de 22 ms por quadro): desenha só a foto mais próxima
  let misturar = true
  let mediaQuadro = 16.7
  const vizinha = (lista, i) => {
    for (let d = 0; d < QUADROS / 2; d++) {
      const img = lista[(i + d) % QUADROS] || lista[(i - d + QUADROS) % QUADROS]
      if (img) return img
    }
    return null
  }
  const desenhar = (opcao) => {
    const tela = pega('canvas.troca__relogio', opcao)
    const lista = fotos[opcao]
    if (!tela || !lista) return
    const a = ((angulo % QUADROS) + QUADROS) % QUADROS
    const i = Math.floor(a)
    const j = (i + 1) % QUADROS
    const mistura = Math.round((a - i) * 32) / 32 // 32 passos de mistura bastam ao olho
    const base = lista[i] || vizinha(lista, i)
    if (!base) return
    const seguinte = misturar && lista[i] && lista[j] && mistura > 0 ? lista[j] : null
    const chave = `${i}|${seguinte ? mistura : 0}|${base === lista[i]}`
    if (tela.dataset.chave === chave) return
    tela.dataset.chave = chave
    tela.dataset.quadro = String(i)
    const ctx = tela.getContext('2d')
    ctx.globalAlpha = 1
    ctx.drawImage(base, 0, 0, tela.width, tela.height)
    if (seguinte) {
      ctx.globalAlpha = mistura
      ctx.drawImage(seguinte, 0, 0, tela.width, tela.height)
      ctx.globalAlpha = 1
    }
    // A oval: o fundo preto das fotos some nas bordas e deixa o cenário aparecer em volta
    ctx.globalCompositeOperation = 'destination-in'
    ctx.drawImage(oval(tela.width, tela.height), 0, 0)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Máscara oval pronta (uma por tamanho): elipse de 52% x 50% em (50%, 52%), sólida até 66% do raio
  // e transparente aos 92%. Fica no canvas, em vez de uma máscara CSS refeita a cada quadro.
  const ovais = {}
  function oval(w, h) {
    const chave = `${w}x${h}`
    if (ovais[chave]) return ovais[chave]
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const g = c.getContext('2d')
    g.setTransform(0.52 * w, 0, 0, 0.5 * h, 0.5 * w, 0.52 * h)
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1)
    grad.addColorStop(0.66, '#000')
    grad.addColorStop(0.92, 'rgba(0, 0, 0, 0)')
    g.fillStyle = grad
    g.fillRect(-2, -2, 4, 4)
    ovais[chave] = c
    return c
  }

  const escolher = (opcao, origem = 'pessoa') => {
    if (origem === 'pessoa') mexeu = true
    if (opcao === atual || !NOMES[opcao]) return
    const novo = pega('.troca__relogio', opcao)
    const velho = atual && pega('.troca__relogio', atual)

    // Cenário: esmaece (CSS)
    palco.querySelectorAll('.troca__cena').forEach((c) => c.classList.toggle('ativa', c.dataset.opcao === opcao))

    // Relógio: o novo, no mesmo ângulo, fica por cima e se abre da caixa para fora; o velho só some depois
    animacao?.finish()
    palco.querySelectorAll('.troca__relogio').forEach((r) => (r.style.zIndex = r === novo ? '3' : r === velho ? '2' : '0'))
    if (pertoDaTela) baixar(opcao)
    desenhar(opcao)
    novo.classList.add('ativa')
    if (velho) {
      animacao = novo.animate(
        [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)' }],
        { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' },
      )
      animacao.onfinish = () => {
        velho.classList.remove('ativa')
        animacao = null
      }
    }

    for (const c of cartoes) {
      const ativo = c.dataset.opcao === opcao
      c.classList.toggle('ativa', ativo)
      c.querySelector('.troca__botao')?.setAttribute('aria-pressed', String(ativo))
    }
    if (anuncio && atual) anuncio.textContent = `Pulseira ${NOMES[opcao]}`
    // Celular: a descrição e o material da pulseira escolhida, embaixo dos botões
    if (descricao) {
      const cartao = cartoes.find((c) => c.dataset.opcao === opcao)
      descricao.textContent = [...cartao.querySelectorAll('p')].map((p) => p.textContent).join(' ')
    }
    atual = opcao
  }

  // Cartões: clicar escolhe; setas do teclado andam entre eles
  for (const c of cartoes) {
    const botao = c.querySelector('.troca__botao')
    botao?.addEventListener('click', () => escolher(c.dataset.opcao))
    botao?.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
      e.preventDefault()
      const i = ordem.indexOf(c.dataset.opcao)
      const proximo = ordem[(i + (e.key === 'ArrowRight' ? 1 : ordem.length - 1)) % ordem.length]
      escolher(proximo)
      cartoes[ordem.indexOf(proximo)].querySelector('.troca__botao')?.focus()
    })
  }

  // Movimento: o relógio fica parado de frente. Arrastando, gira; ao soltar, desliza um pouco no
  // embalo, espera um instante e volta para a frente pelo caminho mais curto, com aceleração e freio
  // suaves. O laço de desenho só roda enquanto algo se mexe.
  let alvo = 0 // ângulo pedido pela mão ou pelo embalo; o desenhado (angulo) vai atrás dele
  let arrasto = null // { x, alvo, ultimoX, ultimaHora }
  let embalo = 0 // quadros por quadro de tela, depois de soltar
  let volta = null // { de, para, inicio, duracao }: a viagem de volta para a frente
  let esperaVolta = 0
  let antes = 0
  let pedido = 0
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) // acelera e freia
  function pedir() {
    if (!pedido && naTela) pedido = requestAnimationFrame(passo)
  }
  function agendarVolta() {
    clearTimeout(esperaVolta)
    esperaVolta = setTimeout(() => {
      const frente = Math.round(angulo / QUADROS) * QUADROS // a frente mais próxima, para qualquer lado
      const distancia = Math.abs(frente - angulo)
      if (distancia < 0.01) return
      volta = { de: angulo, para: frente, inicio: performance.now(), duracao: 600 + (distancia / QUADROS) * 2400 }
      alvo = frente
      pedir()
    }, ESPERA)
  }
  function passo(agora) {
    pedido = 0
    const dt = antes ? Math.min(0.1, (agora - antes) / 1000) : 0
    antes = agora
    if (dt) {
      mediaQuadro = mediaQuadro * 0.95 + dt * 1000 * 0.05
      if (mediaQuadro > 24) misturar = false
      else if (mediaQuadro < 18) misturar = true
    }
    if (volta) {
      const t = Math.min(1, (agora - volta.inicio) / volta.duracao)
      angulo = volta.de + (volta.para - volta.de) * suave(t)
      if (t === 1) {
        angulo = alvo = volta.para
        volta = null
      }
    } else {
      if (!arrasto && embalo) {
        alvo += embalo
        embalo *= FREIO
        if (Math.abs(embalo) < 0.02) {
          embalo = 0
          agendarVolta()
        }
      }
      const falta = alvo - angulo
      angulo = Math.abs(falta) < 0.01 ? alvo : angulo + falta * SEGUIR
    }
    desenhar(atual)
    if (arrasto || embalo || volta || angulo !== alvo) pedir()
    else antes = 0
  }

  palco.style.touchAction = 'pan-y' // a rolagem vertical do celular continua livre
  // Sem o "arrastar imagem" do navegador: ele cortaria o giro quando o gesto começa no cenário
  palco.addEventListener('dragstart', (e) => e.preventDefault())
  palco.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (e.pointerType === 'mouse') e.preventDefault()
    mexeu = true
    embalo = 0
    volta = null
    clearTimeout(esperaVolta)
    alvo = angulo
    arrasto = { x: e.clientX, alvo, ultimoX: e.clientX, ultimaHora: performance.now() }
    palco.setPointerCapture(e.pointerId)
    troca.classList.add('troca--girando', 'troca--girou')
    pedir()
  })
  palco.addEventListener('pointermove', (e) => {
    if (!arrasto) return
    // Arrastar para a esquerda leva o giro adiante
    const quadrosPorPx = (QUADROS * VOLTA_POR_LARGURA) / palco.getBoundingClientRect().width
    const agora = performance.now()
    const dt = Math.max(1, agora - arrasto.ultimaHora)
    const bruto = ((arrasto.ultimoX - e.clientX) * quadrosPorPx * 16.7) / dt
    embalo = Math.max(-EMBALO_MAX, Math.min(EMBALO_MAX, bruto))
    arrasto.ultimoX = e.clientX
    arrasto.ultimaHora = agora
    alvo = arrasto.alvo + (arrasto.x - e.clientX) * quadrosPorPx
    pedir()
  })
  const soltar = () => {
    if (!arrasto) return
    // Só embala se a mão ainda estava em movimento ao soltar (soltar parado não dispara nada)
    if (performance.now() - arrasto.ultimaHora > 80) embalo = 0
    arrasto = null
    troca.classList.remove('troca--girando')
    if (!embalo) agendarVolta()
    pedir()
  }
  palco.addEventListener('pointerup', soltar)
  palco.addEventListener('pointercancel', soltar)

  escolher(ordem[0], 'inicio')

  // Perto da tela, as fotos baixam (a pulseira da vez primeiro, depois as outras);
  // na tela, o laço roda; fora dela, para
  new IntersectionObserver(
    ([entrada], observador) => {
      if (!entrada.isIntersecting) return
      observador.disconnect()
      pertoDaTela = true
      baixar(atual).then(() => quandoOcioso(() => ordem.reduce((p, o) => p.then(() => baixar(o)), Promise.resolve())))
    },
    { rootMargin: '600px 0px' },
  ).observe(palco)
  new IntersectionObserver(([entrada]) => {
    naTela = entrada.isIntersecting
    antes = 0
    pedir()
  }).observe(palco)

  // Na primeira vez que o palco aparece, uma troca sozinha mostra que dá para mexer
  new IntersectionObserver(
    ([entrada], observador) => {
      if (!entrada.isIntersecting) return
      observador.disconnect()
      setTimeout(() => !mexeu && escolher(ordem[1], 'demonstracao'), 1400)
    },
    { threshold: 0.6 },
  ).observe(palco)
}
