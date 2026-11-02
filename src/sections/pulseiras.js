// Pulseiras: o mesmo relógio, três pulseiras. Escolher um cartão troca a pulseira e o cenário.
// O relógio inteiro gira devagar num filme em laço, um por pulseira. Os três giram igual: na troca, o novo
// entra no mesmo ponto do giro e aparece da caixa para fora (para cima e para baixo), então só a pulseira
// parece mudar. O cenário troca com esmaecimento lento, sem piscar.
// Sem JS ou com movimento reduzido: o palco fica escondido, nenhum filme baixa e valem os cartões e as fotos.

const MOVIMENTO_PERMITIDO = '(prefers-reduced-motion: no-preference)'
const NOMES = { dia: 'Dia a dia', social: 'Social', fds: 'Fim de semana' }
const VELOCIDADE = 0.8 // o giro do filme dura 10 s; a 0,8 leva 12,5 s, tempo de ver cada detalhe

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
  let mexeu = false // a pessoa já escolheu: a demonstração automática não roda mais
  let naTela = false

  // Filmes: versão leve no celular; a capa é o primeiro quadro, igual nos três
  const celular = window.matchMedia('(max-width: 47.99rem)').matches
  const filmes = [...palco.querySelectorAll('video.troca__relogio')]
  for (const v of filmes) {
    const nome = v.dataset.filme
    v.poster = `${import.meta.env.BASE_URL}img/${nome}${celular ? '-700' : ''}.webp`
    v.src = `${import.meta.env.BASE_URL}video/${nome}${celular ? '-m' : ''}.mp4`
    v.defaultPlaybackRate = VELOCIDADE
    v.playbackRate = VELOCIDADE
  }
  const tocar = (v) => naTela && v?.play().catch(() => {})

  const escolher = (opcao, origem = 'pessoa') => {
    if (opcao === atual || !NOMES[opcao]) return
    if (origem === 'pessoa') mexeu = true
    const novo = pega('.troca__relogio', opcao)
    const velho = atual && pega('.troca__relogio', atual)

    // Cenário: esmaece (CSS)
    palco.querySelectorAll('.troca__cena').forEach((c) => c.classList.toggle('ativa', c.dataset.opcao === opcao))

    // Relógio: o novo fica por cima e se abre da caixa para fora; o velho só some quando o novo cobriu tudo
    animacao?.finish()
    palco.querySelectorAll('.troca__relogio').forEach((r) => (r.style.zIndex = r === novo ? '3' : r === velho ? '2' : '0'))
    // O novo filme entra no mesmo ponto do giro do velho
    if (velho && velho.readyState > 0 && novo.readyState > 0) novo.currentTime = velho.currentTime
    novo.classList.add('ativa')
    tocar(novo)
    if (velho) {
      animacao = novo.animate(
        [{ clipPath: 'inset(50% 0 50% 0)' }, { clipPath: 'inset(0% 0 0% 0)' }],
        { duration: 750, easing: 'cubic-bezier(0.65, 0, 0.25, 1)' },
      )
      animacao.onfinish = () => {
        velho.classList.remove('ativa')
        velho.pause()
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

  // Girar na mão: segurar e arrastar para os lados gira o relógio (o filme anda com o mouse ou o dedo).
  // Arrastar para a esquerda leva o giro adiante; a largura do palco inteira vale ~um giro completo.
  // Ao soltar, o relógio continua um pouco no embalo e para devagar; depois de um respiro, volta a girar
  // sozinho. A rolagem vertical do celular continua livre (touch-action: pan-y).
  const GIRO_POR_LARGURA = 0.9 // fração do filme percorrida ao arrastar a largura inteira do palco
  const RESPIRO = 1800 // ms parado antes de voltar a girar sozinho
  const EMBALO_MAX = 0.06 // no máximo 0,06 s de filme por quadro: um peteleco não dispara o relógio
  palco.style.touchAction = 'pan-y'
  let arrasto = null // { x, t, ultimoX, ultimaHora }
  let embalo = 0 // segundos de filme por quadro, depois de soltar
  let quadro = 0
  let retomar = 0
  const ativo = () => pega('.troca__relogio', atual)
  const levarPara = (v, t) => {
    const d = v.duration || 10
    v.currentTime = ((t % d) + d) % d
  }

  palco.addEventListener('pointerdown', (e) => {
    const v = ativo()
    if (!v || v.readyState < 1 || (e.pointerType === 'mouse' && e.button !== 0)) return
    mexeu = true
    clearTimeout(retomar)
    cancelAnimationFrame(quadro)
    v.pause()
    arrasto = { x: e.clientX, t: v.currentTime, ultimoX: e.clientX, ultimaHora: performance.now() }
    embalo = 0
    palco.setPointerCapture(e.pointerId)
    troca.classList.add('troca--girando', 'troca--girou')
  })

  palco.addEventListener('pointermove', (e) => {
    if (!arrasto) return
    const v = ativo()
    const largura = palco.getBoundingClientRect().width
    const segPorPx = ((v.duration || 10) * GIRO_POR_LARGURA) / largura
    // Velocidade do fim do gesto, para o embalo
    const agora = performance.now()
    const dt = Math.max(1, agora - arrasto.ultimaHora)
    const bruto = ((arrasto.ultimoX - e.clientX) * segPorPx * 16.7) / dt
    embalo = Math.max(-EMBALO_MAX, Math.min(EMBALO_MAX, bruto))
    arrasto.ultimoX = e.clientX
    arrasto.ultimaHora = agora
    levarPara(v, arrasto.t + (arrasto.x - e.clientX) * segPorPx)
  })

  const soltar = () => {
    if (!arrasto) return
    arrasto = null
    troca.classList.remove('troca--girando')
    const v = ativo()
    // Embalo: o giro continua e perde força a cada quadro
    const deslizar = () => {
      embalo *= 0.9
      if (Math.abs(embalo) > 0.004) {
        levarPara(v, v.currentTime + embalo)
        quadro = requestAnimationFrame(deslizar)
      } else {
        retomar = setTimeout(() => tocar(ativo()), RESPIRO)
      }
    }
    quadro = requestAnimationFrame(deslizar)
  }
  palco.addEventListener('pointerup', soltar)
  palco.addEventListener('pointercancel', soltar)

  escolher(ordem[0], 'inicio')

  // Perto da tela, os três filmes baixam (a troca fica instantânea); na tela, o escolhido gira; fora, para
  new IntersectionObserver(
    ([entrada], observador) => {
      if (!entrada.isIntersecting) return
      observador.disconnect()
      for (const v of filmes) v.preload = 'auto'
    },
    { rootMargin: '600px 0px' },
  ).observe(palco)
  new IntersectionObserver(([entrada]) => {
    naTela = entrada.isIntersecting
    const ativo = pega('.troca__relogio', atual)
    if (naTela) tocar(ativo)
    else filmes.forEach((v) => v.pause())
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
