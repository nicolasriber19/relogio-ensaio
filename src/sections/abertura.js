// O relógio se abre: um filme do relógio se desmontando, avançado pela rolagem, com a seção fixada (pin).
// O filme é o pico da página: as peças voam até a tela e param alinhadas na vista explodida.
// Com movimento reduzido (ou sem JS) fica a composição estática do HTML (foto explodida e os 4 passos).
// O GSAP só é baixado quando a animação vai rodar: com "reduzir movimento" ligado, ele nunca chega.

const MOVIMENTO_PERMITIDO = '(prefers-reduced-motion: no-preference)'
// Rolagem da seção fixa: 6 unidades da linha do tempo por tela. Filme, pausa para ler os 4 passos e
// mergulho dão cerca de 4,5 telas; sem o mergulho, cerca de 3.
const UNIDADES_POR_TELA = 6
const CELULAR = '(max-width: 47.99rem)'
const TELA_EM_PE = '(max-aspect-ratio: 4 / 3)' // o mesmo corte do CSS: abaixo disso o filme não cobre a tela

// Filme: 1080p no desktop, 720p no celular, com quadro-chave denso (avança bem com a rolagem)
const base = import.meta.env.BASE_URL
const FILME = { desktop: `${base}video/abertura.mp4`, celular: `${base}video/abertura-m.mp4` }
const POSTER = `${base}img/abertura-inicio.webp`
const MERGULHO = { desktop: `${base}video/mergulho.mp4`, celular: `${base}video/mergulho-m.mp4` }

let carregamento = null

// Baixa o GSAP e o ScrollTrigger uma vez só, em paralelo, e já deixa os dois configurados.
function carregarGsap() {
  carregamento ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger)
      // A barra de endereço do celular muda a altura da janela; sem isto a página pula durante o pin.
      ScrollTrigger.config({ ignoreMobileResize: true })
      return { gsap, ScrollTrigger }
    },
  )
  return carregamento
}

// Carrega o filme até ter o primeiro quadro. Resolve true quando dá para avançar com a rolagem, false se falhou.
function carregarFilme(video, fontes = FILME, poster = POSTER) {
  if (video.dataset.pronto) return Promise.resolve(true)
  return new Promise((resolver) => {
    const fim = (ok) => {
      clearTimeout(limite)
      video.removeEventListener('loadeddata', pronto)
      video.removeEventListener('error', falhou)
      if (ok) video.dataset.pronto = '1'
      resolver(ok)
    }
    const pronto = () => fim(true)
    const falhou = () => fim(false)
    const limite = setTimeout(() => fim(video.readyState >= 2), 15000)
    video.addEventListener('loadeddata', pronto, { once: true })
    video.addEventListener('error', falhou, { once: true })
    if (poster) video.poster = poster
    video.src = window.matchMedia(CELULAR).matches ? fontes.celular : fontes.desktop
    video.preload = 'auto'
    video.load()
  }).then((ok) => {
    // iPhone: um play/pause mudo libera a troca de quadro pelo currentTime
    if (ok) video.play().then(() => video.pause()).catch(() => {})
    return ok
  })
}

// Tela em pé: a ampliação inicial do filme é a que cabe em metade da altura da tela (até 1,9x)
function ampliacaoDe(quadro) {
  if (!window.matchMedia(TELA_EM_PE).matches) return 1
  return Math.min(1.9, Math.max(1, (window.innerHeight * 0.5) / ((quadro.offsetWidth * 9) / 16)))
}

// A rolagem move um "tempo"; o quadro do filme acompanha, uma troca por quadro de tela
function guiarFilme(video) {
  const filme = { t: 0 }
  const duracao = () => Math.max(0, (video.duration || 10) - 0.05)
  let pedido = 0
  const mostrarQuadro = () => {
    pedido = 0
    const alvo = Math.min(filme.t, duracao())
    if (Math.abs(video.currentTime - alvo) > 0.01) video.currentTime = alvo
  }
  const pedirQuadro = () => {
    if (!pedido) pedido = requestAnimationFrame(mostrarQuadro)
  }
  return { filme, pedirQuadro }
}

function montar(gsap, secao, { video, mergulho, quadro, cabecalho, tracos, rotulo, legendas, passos }) {
  secao.classList.add('abertura--animada')
  const ampliacaoInicial = () => ampliacaoDe(quadro)
  const { filme, pedirQuadro } = guiarFilme(video)

  // O pin cresce com a linha do tempo: cerca de 6 unidades por tela de rolagem (o total só se sabe no fim)
  let total = 12
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: secao,
      start: 'top top',
      end: () => `+=${Math.round((total / UNIDADES_POR_TELA) * 100)}%`,
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
  })

  // 0–1: silêncio. O relógio fechado, quase parado: a pessoa reconhece o relógio do topo.
  // 1–8: o filme. A câmera avança, o cristal e o mostrador passam pela tela, tudo se alinha.
  tl.to(filme, { t: 10, duration: 7, onUpdate: pedirQuadro }, 1)
    // 1,5–2,5: o cabeçalho sai do caminho antes do pico
    .to(cabecalho, { opacity: 0, y: -24, duration: 1, stagger: 0.1 }, 1.5)
    // 8–9,5: o traço marca o movimento no último quadro; 9,5: o rótulo e as legendas
    .fromTo(tracos, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.5 }, 8)
    .fromTo(rotulo, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 9.5)
    .fromTo(legendas, { opacity: 0 }, { opacity: 1, duration: 0.5 }, 9.5)

  // Tela em pé: a faixa 16:9 inteira fica pequena. O filme começa ampliado (o relógio ocupa a largura e as
  // peças passam grandes pela tela) e só volta ao tamanho inteiro quando elas se alinham, sem cortar nenhuma.
  // A ampliação é a que cabe em metade da altura da tela (até 1,9x): em tela baixa o mostrador nasce abaixo do texto.
  if (window.matchMedia(TELA_EM_PE).matches) {
    tl.fromTo(quadro, { scale: ampliacaoInicial }, { scale: ampliacaoInicial, duration: 4 }, 1).to(quadro, { scale: 1, duration: 3, ease: 'power1.inOut' }, 5)
  }

  // Pausa para ler: o filme já parou na vista explodida. Um passo por vez, cada um com tempo de leitura
  // (2 unidades, cerca de meia tela de rolagem) e troca cruzada lenta: o próximo entra enquanto o anterior sai,
  // sem tela vazia entre eles e sem movimento no texto. O último fica.
  const INICIO_PASSOS = 9.5
  const POR_PASSO = 2
  const TROCA = 0.6
  passos.forEach((passo, i) => {
    const inicio = INICIO_PASSOS + i * POR_PASSO
    tl.fromTo(passo, { opacity: 0 }, { opacity: 1, duration: TROCA }, inicio)
    if (i < passos.length - 1) tl.to(passo, { opacity: 0, duration: TROCA }, inicio + POR_PASSO)
  })
  const fimPassos = INICIO_PASSOS + passos.length * POR_PASSO

  // Pausa no fim, com o último passo à mostra, antes de seguir.
  tl.to({}, { duration: 1.5 }, fimPassos)
  let fim = fimPassos + 1.5

  // O mergulho: a explicação sai, e a câmera entra no mostrador (o segundo filme começa no último quadro
  // do primeiro, então a troca não aparece). Termina no close do mostrador que a seção seguinte usa.
  if (mergulho) {
    const segundo = guiarFilme(mergulho)
    tl.to([passos.at(-1), ...legendas, rotulo, ...tracos], { opacity: 0, duration: 0.8 }, fim)
      .set(mergulho, { opacity: 1 }, fim + 0.8)
      .set(video, { opacity: 0 }, fim + 0.8)
      .to(segundo.filme, { t: 10, duration: 6, onUpdate: segundo.pedirQuadro }, fim + 1)
      .to({}, { duration: 1 }, fim + 7)
    fim += 8
  }
  total = fim // o refresh que vem logo depois (recalcular) aplica o tamanho novo do pin
}

// O mostrador sai do último quadro do mergulho e viaja até o palco da seção seguinte, onde a luz assume.
// Mesmo truque do relógio que desce do topo, ao contrário: uma cópia fixa na tela, já no lugar e no tamanho
// do palco, sai do tamanho da tela inteira (o filme) e encolhe até ele enquanto a página sobe.
function ponte(gsap, secaoAbertura, quadro) {
  const secao = document.getElementById('mostrador')
  const palco = secao?.querySelector('.mostrador__palco')
  const foto = palco?.querySelector('img')
  const texto = secao?.querySelector('.texto')
  if (!secao || !palco || !foto) return null
  secao.classList.add('mostrador--mergulho')
  foto.loading = 'eager'

  const viajante = document.createElement('div')
  viajante.className = 'viajante'
  viajante.setAttribute('aria-hidden', 'true')
  const copia = document.createElement('img')
  copia.alt = ''
  copia.src = foto.currentSrc || foto.src
  foto.addEventListener('load', () => (copia.src = foto.currentSrc || foto.src), { once: true })
  viajante.append(copia)
  document.body.append(viajante)

  // Medidas com a seção do mostrador no topo da tela (o fim da viagem) e o filme do tamanho da tela (o começo)
  const medir = () => {
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    const r = palco.getBoundingClientRect()
    const topo = r.top - secao.getBoundingClientRect().top
    const destino = { x: r.left, y: topo, w: r.width, h: r.height }
    const cobre = window.matchMedia('(min-aspect-ratio: 16 / 10)').matches
    const w = cobre ? Math.max(vw, (vh * 16) / 9) : vw
    const origem = { x: (vw - w) / 2, y: (vh - (w * 9) / 16) / 2, s: w / destino.w }
    Object.assign(viajante.style, { left: `${destino.x}px`, top: `${destino.y}px`, width: `${destino.w}px`, height: `${destino.h}px` })
    return { origem, destino }
  }
  let geo = null
  const g = () => (geo ??= medir())

  const mostrar = (p) => {
    const viajando = p > 0 && p < 1
    viajante.style.visibility = viajando ? 'visible' : 'hidden'
    quadro.style.visibility = p > 0 ? 'hidden' : ''
    palco.style.visibility = viajando ? 'hidden' : ''
    if (texto) texto.style.opacity = p >= 1 ? '' : String(Math.max(0, (p - 0.6) / 0.4))
    // A borda se dissolve aos poucos: tela inteira no começo, a mesma máscara do palco na chegada
    const a = (1 - p).toFixed(3)
    const borda = `rgb(0 0 0 / ${a})`
    const mascara = `linear-gradient(to bottom, ${borda}, #000 22%, #000 78%, ${borda}), linear-gradient(to right, ${borda}, #000 16%, #000 70%, ${borda})`
    viajante.style.maskImage = mascara
    viajante.style.webkitMaskImage = mascara
    viajante.style.maskComposite = 'intersect'
    viajante.style.webkitMaskComposite = 'source-in'
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: secao,
      start: 'top bottom',
      end: 'top top',
      scrub: true,
      invalidateOnRefresh: true,
      onRefreshInit: () => (geo = null),
      onUpdate: (self) => mostrar(self.progress),
      onRefresh: (self) => mostrar(self.progress),
    },
  })
  tl.fromTo(
    viajante,
    {
      x: () => g().origem.x - g().destino.x,
      y: () => g().origem.y - g().destino.y,
      scale: () => g().origem.s,
    },
    { x: 0, y: 0, scale: 1, ease: 'power2.inOut', duration: 1 },
  )

  return () => {
    viajante.remove()
    secao.classList.remove('mostrador--mergulho')
    quadro.style.visibility = ''
    palco.style.visibility = ''
    if (texto) texto.style.opacity = ''
  }
}

// Hora do relógio no primeiro quadro do filme (a foto original): 10:08:36, em graus no plano do mostrador
const HORA_DO_FILME = { horas: 304.6, minutos: 48.8, segundos: 215.1 }

// Ângulo atual de um ponteiro que gira por animação CSS (rotate em volta do centro do mostrador)
function anguloAtual(el) {
  const m = new DOMMatrix(getComputedStyle(el).transform)
  return ((Math.atan2(m.b, m.a) * 180) / Math.PI + 360) % 360
}

// O relógio do topo desce até a abertura e vira o primeiro quadro do filme.
// Uma cópia da foto do topo (com os ponteiros) fica fixa na tela, já no lugar e no tamanho do quadro do filme;
// a rolagem a leva da posição da foto do topo até lá (transform e clip-path), e os ponteiros andam até 10:08,
// a hora do filme. Quando a abertura chega ao topo da tela, a cópia some e o filme assume no mesmo quadro.
function viagem(gsap, ScrollTrigger, secao, { quadro, ampliacaoInicial, cabecalho }) {
  const hero = document.getElementById('hero')
  const foto = hero?.querySelector('.hero__imagem')
  const img = foto?.querySelector('img')
  const textoTopo = hero?.querySelector('.hero__texto')
  if (!foto || !img) return

  // A cópia: mesma foto e mesmos ponteiros, sem a animação CSS (aqui quem gira é a rolagem)
  const viajante = document.createElement('div')
  viajante.className = 'viajante'
  viajante.setAttribute('aria-hidden', 'true')
  const copia = foto.cloneNode(true)
  for (const el of copia.querySelectorAll('[id]')) {
    copia.querySelectorAll(`[fill="url(#${el.id})"]`).forEach((f) => f.setAttribute('fill', `url(#${el.id}-viajante)`))
    el.id = `${el.id}-viajante`
  }
  const pares = []
  for (const tipo of ['horas', 'minutos', 'segundos']) {
    const original = foto.querySelector(`.hero__ponteiros > g > .ponteiro--${tipo}`)
    copia.querySelectorAll(`.ponteiro--${tipo}`).forEach((g) => {
      g.classList.remove('ponteiro')
      g.dataset.ponteiro = tipo
      pares.push({ tipo, g, original })
    })
  }
  copia.querySelector('img')?.removeAttribute('fetchpriority')
  viajante.append(...copia.childNodes)
  document.body.append(viajante)

  // Geometria, recalculada a cada refresh do ScrollTrigger (mudança de tamanho de tela, fontes, imagens)
  let geo = null
  const medir = () => {
    if (geo) return geo
    const vw = document.documentElement.clientWidth
    const vh = window.innerHeight
    // Destino: o quadro do filme no instante em que a abertura fixa (centrado na tela, com a ampliação do celular)
    const largura = quadro.offsetWidth * ampliacaoInicial()
    const altura = (largura * 9) / 16
    const destino = { x: (vw - largura) / 2, y: (vh - altura) / 2, w: largura, h: altura }
    // Origem: a foto do topo como ela aparece com a página no início (object-fit: cover centrado)
    const caixa = foto.getBoundingClientRect()
    const topo = caixa.top + window.scrollY
    const escala = Math.max(caixa.width / img.naturalWidth, caixa.height / img.naturalHeight)
    const w = img.naturalWidth * escala
    const h = img.naturalHeight * escala
    // A cópia tem o formato do quadro (16:9); a foto do topo é 1600 x 904: casa pela largura
    const s = w / destino.w
    const origem = { x: caixa.left + (caixa.width - w) / 2, y: topo + (caixa.height - h) / 2, s }
    // Recorte inicial: só a parte da foto que aparece no topo (a caixa dela), em coordenadas da cópia
    const recorte = {
      topo: Math.max(0, (topo - origem.y) / s),
      direita: Math.max(0, destino.w - (caixa.left + caixa.width - origem.x) / s),
      base: Math.max(0, destino.h - (topo + caixa.height - origem.y) / s),
      esquerda: Math.max(0, (caixa.left - origem.x) / s),
    }
    Object.assign(viajante.style, {
      left: `${destino.x}px`,
      top: `${destino.y}px`,
      width: `${destino.w}px`,
      height: `${destino.h}px`,
    })
    // A borda esfumada da foto do topo (18% da caixa: à esquerda no desktop, embaixo no celular), em coordenadas
    // da cópia, para ela nascer igual à foto e só ficar inteira enquanto desce
    const lateral = getComputedStyle(foto).position === 'absolute'
    const borda = lateral
      ? { direcao: 'to right', ate: recorte.esquerda, de: recorte.esquerda + (0.18 * caixa.width) / s }
      : { direcao: 'to top', ate: recorte.base, de: recorte.base + (0.18 * caixa.height) / s }
    geo = { origem, destino, recorte, borda }
    return geo
  }

  // a = 0: borda tão esfumada quanto a da foto; a = 1: sem borda (o quadro inteiro do filme)
  const esfumar = (a) => {
    const { direcao, ate, de } = medir().borda
    const mascara = a >= 1 ? '' : `linear-gradient(${direcao}, rgb(0 0 0 / ${a}) ${ate}px, #000 ${de}px)`
    viajante.style.maskImage = mascara
    viajante.style.webkitMaskImage = mascara
  }
  ScrollTrigger.addEventListener('refreshInit', () => (geo = null))

  // Ponteiros: guardam a hora em que a viagem começou e andam para a frente até 10:08:36
  let inicio = null
  const acertarPonteiros = (p) => {
    if (!inicio) {
      inicio = {}
      for (const { tipo, original } of pares) {
        if (inicio[tipo] !== undefined) continue
        const de = original ? anguloAtual(original) : HORA_DO_FILME[tipo]
        let ate = HORA_DO_FILME[tipo]
        while (ate < de) ate += 360
        inicio[tipo] = { de, ate }
      }
    }
    const t = gsap.parseEase('power2.inOut')(Math.min(1, p / 0.7))
    for (const { tipo, g } of pares) {
      const { de, ate } = inicio[tipo]
      g.style.transform = `rotate(${de + (ate - de) * t}deg)`
    }
  }

  // Quem aparece em cada trecho: a foto do topo, a cópia viajando ou o filme
  const mostrar = (p) => {
    const viajando = p > 0 && p < 1
    viajante.style.visibility = viajando ? 'visible' : 'hidden'
    foto.style.visibility = viajando ? 'hidden' : ''
    quadro.style.opacity = p >= 1 ? '' : '0'
    // O cabeçalho da abertura só entra no fim da viagem: no meio dela ele passaria por cima do mostrador.
    // A opacidade vai no bloco de texto inteiro (os passos e a legenda dele ainda estão apagados nesse trecho),
    // não em cada título, que o pin também anima: assim as duas animações não brigam na volta.
    cabecalho.style.opacity = p >= 1 ? '' : String(Math.max(0, (p - 0.92) / 0.08))
    // O texto do topo sai de cena no primeiro terço: sobe um pouco e esmaece, e a tela fica só com o relógio
    const saida = Math.min(1, p / 0.3)
    if (textoTopo) {
      textoTopo.style.opacity = p <= 0 ? '' : String(1 - saida)
      textoTopo.style.transform = p <= 0 ? '' : `translateY(${-48 * saida}px)`
      textoTopo.style.pointerEvents = saida >= 1 ? 'none' : ''
    }
    if (viajando) esfumar(saida)
    if (p <= 0) inicio = null
    else acertarPonteiros(p)
  }

  gsap
    .timeline({
      scrollTrigger: {
        trigger: secao,
        start: 'top bottom',
        end: 'top top',
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => mostrar(self.progress),
        onRefresh: (self) => mostrar(self.progress),
      },
    })
    .fromTo(
      viajante,
      {
        x: () => medir().origem.x - medir().destino.x,
        y: () => medir().origem.y - medir().destino.y,
        scale: () => medir().origem.s,
        clipPath: () => {
          const r = medir().recorte
          return `inset(${r.topo}px ${r.direita}px ${r.base}px ${r.esquerda}px)`
        },
      },
      { x: 0, y: 0, scale: 1, clipPath: 'inset(0px 0px 0px 0px)', ease: 'power2.inOut', duration: 1 },
    )

  return () => {
    viajante.remove()
    foto.style.visibility = ''
    quadro.style.opacity = ''
    cabecalho.style.opacity = ''
    if (textoTopo) Object.assign(textoTopo.style, { opacity: '', transform: '', pointerEvents: '' })
  }
}

export function init() {
  const secao = document.getElementById('abertura')
  if (!secao) return

  const partes = {
    video: secao.querySelector('.abertura__video'),
    quadro: secao.querySelector('.abertura__quadro'),
    cabecalho: [...secao.querySelectorAll('.texto > .eyebrow, .texto > h2, .texto > p:not(.legenda)')],
    tracos: secao.querySelectorAll('.abertura__traco--video ellipse, .abertura__traco--video path'),
    rotulo: secao.querySelector('.abertura__rotulo'),
    legendas: [...secao.querySelectorAll('figcaption, .texto > .legenda')],
    passos: [...secao.querySelectorAll('.etapas li')],
  }
  if (!partes.video || !partes.quadro || !partes.rotulo || !partes.passos.length || !partes.cabecalho.length) return

  const iniciar = () => {
    carregarGsap().then(({ gsap, ScrollTrigger }) => {
      // matchMedia desfaz tudo (pin, estilos e a classe) quando a preferência de movimento muda.
      const mm = gsap.matchMedia()
      mm.add(MOVIMENTO_PERMITIDO, (contexto) => {
        let ativo = true
        let desfazerViagem = null
        let desfazerPonte = null
        const mergulho = secao.querySelector('.abertura__video--mergulho')

        Promise.all([
          carregarFilme(partes.video),
          mergulho ? carregarFilme(mergulho, MERGULHO, null) : Promise.resolve(false),
        ]).then(([ok, okMergulho]) => {
          // Sem filme (rede ruim, formato não suportado): fica a composição estática, que já está na tela
          if (!ativo || !ok) return
          // Sem o segundo filme, a abertura funciona como antes e a seção do mostrador fica como está
          const comMergulho = okMergulho ? mergulho : null
          // contexto.add: o que nasce depois do await também é desfeito pelo matchMedia.
          contexto.add(() => {
            montar(gsap, secao, { ...partes, mergulho: comMergulho })
            if (comMergulho) desfazerPonte = ponte(gsap, secao, partes.quadro)
            // Depois do pin: a viagem termina exatamente onde a abertura fixa
            desfazerViagem = viagem(gsap, ScrollTrigger, secao, {
              quadro: partes.quadro,
              ampliacaoInicial: () => ampliacaoDe(partes.quadro),
              cabecalho: secao.querySelector('.texto'),
            })
          })

          // Imagens e fontes mudam as medidas da página: recalcula onde o pin começa e termina.
          const recalcular = () => ativo && ScrollTrigger.refresh()
          if (document.readyState === 'complete') recalcular()
          else window.addEventListener('load', recalcular, { once: true })
          document.fonts.ready.then(recalcular)
        })

        return () => {
          ativo = false
          desfazerViagem?.()
          desfazerPonte?.()
          secao.classList.remove('abertura--animada')
        }
      })
    })
  }

  // Com "reduzir movimento" ligado, nada é baixado; se a pessoa desligar depois, a animação começa.
  const consulta = window.matchMedia(MOVIMENTO_PERMITIDO)
  if (consulta.matches) iniciar()
  else consulta.addEventListener('change', iniciar, { once: true })
}
