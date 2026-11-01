// O relógio se abre: um filme do relógio se desmontando, avançado pela rolagem, com a seção fixada (pin).
// O filme é o pico da página: as peças voam até a tela e param alinhadas na vista explodida.
// Com movimento reduzido (ou sem JS) fica a composição estática do HTML (foto explodida e os 4 passos).
// O GSAP só é baixado quando a animação vai rodar: com "reduzir movimento" ligado, ele nunca chega.

const MOVIMENTO_PERMITIDO = '(prefers-reduced-motion: no-preference)'
const DISTANCIA_DO_PIN = '+=250%' // 2,5 telas de rolagem (limite do plano: 3)
const CELULAR = '(max-width: 47.99rem)'
const TELA_EM_PE = '(max-aspect-ratio: 4 / 3)' // o mesmo corte do CSS: abaixo disso o filme não cobre a tela

// Filme: 1080p no desktop, 720p no celular, com quadro-chave denso (avança bem com a rolagem)
const base = import.meta.env.BASE_URL
const FILME = { desktop: `${base}video/abertura.mp4`, celular: `${base}video/abertura-m.mp4` }
const POSTER = `${base}img/abertura-inicio.webp`

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
function carregarFilme(video) {
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
    video.poster = POSTER
    video.src = window.matchMedia(CELULAR).matches ? FILME.celular : FILME.desktop
    video.preload = 'auto'
    video.load()
  }).then((ok) => {
    // iPhone: um play/pause mudo libera a troca de quadro pelo currentTime
    if (ok) video.play().then(() => video.pause()).catch(() => {})
    return ok
  })
}

function montar(gsap, secao, { video, quadro, cabecalho, tracos, rotulo, legendas, passos }) {
  secao.classList.add('abertura--animada')

  // A rolagem move este "tempo"; o quadro do filme acompanha, uma troca por quadro de tela
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

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: secao,
      start: 'top top',
      end: DISTANCIA_DO_PIN,
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
    const ampliacao = () => Math.min(1.9, Math.max(1, (window.innerHeight * 0.5) / (quadro.offsetWidth * 9 / 16)))
    tl.fromTo(quadro, { scale: ampliacao }, { scale: ampliacao, duration: 4 }, 1).to(quadro, { scale: 1, duration: 3, ease: 'power1.inOut' }, 5)
  }

  // 5,5–11: um passo por vez, a partir do momento em que o movimento aparece no filme; o último fica.
  passos.forEach((passo, i) => {
    const inicio = 5.5 + i * 1.5
    tl.fromTo(passo, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5 }, inicio)
    if (i < passos.length - 1) tl.to(passo, { opacity: 0, y: -12, duration: 0.4 }, inicio + 1.1)
  })

  // Pausa no fim, com tudo à mostra, antes de soltar a seção.
  tl.to({}, { duration: 1 }, 11)
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

        carregarFilme(partes.video).then((ok) => {
          // Sem filme (rede ruim, formato não suportado): fica a composição estática, que já está na tela
          if (!ativo || !ok) return
          // contexto.add: o que nasce depois do await também é desfeito pelo matchMedia.
          contexto.add(() => montar(gsap, secao, partes))

          // Imagens e fontes mudam as medidas da página: recalcula onde o pin começa e termina.
          const recalcular = () => ativo && ScrollTrigger.refresh()
          if (document.readyState === 'complete') recalcular()
          else window.addEventListener('load', recalcular, { once: true })
          document.fonts.ready.then(recalcular)
        })

        return () => {
          ativo = false
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
