// Hero: nome, "mecânica à vista", imagem do relógio e botão da lista de espera.
// Os ponteiros desenhados giram pelo CSS; aqui só se acerta a hora real e se pausa o giro fora da tela.
export function init() {
  const secao = document.getElementById('hero')
  if (!secao) return

  const ponteiros = [...secao.querySelectorAll('.ponteiro')]
  if (!ponteiros.length) return

  // Recomeça a animação com o atraso da hora atual: o ponteiro já nasce no lugar certo
  const acertar = () => {
    const agora = new Date()
    const segundos = agora.getSeconds() + agora.getMilliseconds() / 1000
    const minutos = agora.getMinutes() * 60 + segundos
    const horas = (agora.getHours() % 12) * 3600 + minutos
    for (const ponteiro of ponteiros) {
      const atraso = ponteiro.classList.contains('ponteiro--segundos')
        ? segundos
        : ponteiro.classList.contains('ponteiro--minutos')
          ? minutos
          : horas
      ponteiro.style.animation = 'none'
      void ponteiro.getBoundingClientRect() // força o navegador a soltar a animação antiga
      ponteiro.style.animation = ''
      ponteiro.style.animationDelay = `-${atraso}s`
    }
  }
  acertar()

  // Fora da tela, pausa (economiza bateria); ao voltar, acerta a hora de novo, porque o relógio não parou
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        acertar()
        secao.classList.remove('hero--fora-da-tela')
      } else {
        secao.classList.add('hero--fora-da-tela')
      }
    }).observe(secao)
  }
}
