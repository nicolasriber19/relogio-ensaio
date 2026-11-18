/* Fone P9 · comportamento da página.
   O motor (scrollcraft.js) cuida de pin, parallax, drift, reveal e entradas.
   Aqui ficam as partes próprias desta página:
     1. o explode view, guiado pela rolagem (peças, voo do alto-falante, rótulos);
     2. a vedação: o cursor faz barulho e as almofadas se fecham com a rolagem;
     3. a luz do cursor na ficha técnica;
     4. o carimbo (navegação) com a vista atual;
     5. a profundidade do topo seguindo o mouse.
   Sem "reduzir movimento" ligado, tudo anima; com ele, a página fica estática e
   completa (o explode já vem desmontado e rotulado no HTML). */
(function () {
  'use strict'

  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches
  var mouseFino = matchMedia('(hover: hover) and (pointer: fine)').matches
  var celular = matchMedia('(max-width: 899px)')
  var $ = function (s, r) { return (r || document).querySelector(s) }
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)) }
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v }
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1) }
  var suave = function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 }
  var saida = function (t) { return 1 - Math.pow(1 - t, 3) }
  var lerp = function (a, b, t) { return a + (b - a) * t }

  // ------------------------------------------------------------ 1. explode --
  var explode = $('.explode')
  var ex = null
  if (explode) {
    if (reduz) {
      // Estático: sem pin, desenho já explodido e rotulado.
      explode.removeAttribute('data-sc-act')
      explode.removeAttribute('data-sc-span')
    } else {
      explode.classList.add('explode--vivo')
      $$('[data-cue]', explode).forEach(function (el) {
        el.setAttribute('data-sc-cue', el.getAttribute('data-cue'))
      })
      ex = prepararExplode()
    }
  }

  if (window.ScrollCraft) window.ScrollCraft.mount(document.body)

  function prepararExplode() {
    var svg = $('.explode__svg', explode)
    var base = svg.getAttribute('data-base').split(' ').map(Number)
    var N = [0.9, 0.1]
    var vista = { pc: [190, 44, 880, 720], cel: [320, 0, 630, 740] }
    var pecas = {}
    $$('.peca', svg).forEach(function (g) { pecas[g.getAttribute('data-peca')] = g })
    var rotulos = {}
    $$('.rotulo', svg).forEach(function (g) {
      rotulos[g.getAttribute('data-rotulo')] = {
        el: g,
        linhas: $$('.rotulo__linha', g),
        marcas: $$('.rotulo__marca, .rotulo__ponto', g)
      }
    })
    var passos = $$('.explode__passos li', explode).map(function (li) {
      var c = li.getAttribute('data-cue').split(' ').map(Number)
      return { id: li.getAttribute('data-passo'), de: c[0], ate: c[1] }
    })
    var ordemRotulos = ['almofada', 'falante', 'placa', 'bateria', 'concha', 'arco']
    var janelas = {
      almofada: [0.12, 0.3], falante: [0.14, 0.32], placa: [0.16, 0.33], bateria: [0.18, 0.34], concha: [0, 0.01]
    }
    var C0 = [base[0] + 197, base[1] - 82] // centro do fone montado
    var vb = vista.pc
    function aplicarVista() {
      vb = celular.matches ? vista.cel : vista.pc
      svg.setAttribute('viewBox', vb.join(' '))
    }
    aplicarVista()
    celular.addEventListener('change', function () { aplicarVista(); ultimo = -1 })

    var camera = $('.explode__camera', svg)
    var eixo = $('.eixo', svg)
    var ultimo = -1

    function pos(s, dy) { return [base[0] + N[0] * s, base[1] + N[1] * s + (dy || 0)] }
    function px(x, y) { return 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px)' }

    function desenhar(p) {
      if (Math.abs(p - ultimo) < 0.0004) return
      ultimo = p
      var Vc = [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2]

      // câmera: começa perto do fone fechado e recua enquanto ele se abre
      var ec = suave(seg(p, 0.03, 0.3))
      var z = lerp(1.16, 1, ec)
      var C = [lerp(C0[0], Vc[0], ec), lerp(C0[1], Vc[1], ec)]
      camera.style.transform = px(Vc[0], Vc[1]) + ' scale(' + z.toFixed(4) + ') ' + px(-C[0], -C[1])

      // voo do alto-falante (o pico)
      var sobe = saida(seg(p, 0.37, 0.46))
      var desce = suave(seg(p, 0.52, 0.6))
      var a = sobe * (1 - desce)
      var apaga = 1 - 0.82 * a

      // concha da direita sai; arco e hastes sobem
      var ed = suave(seg(p, 0.05, 0.2))
      var g = pecas.direita
      var s = +g.getAttribute('data-s0') + +g.getAttribute('data-extra') * ed
      var q = pos(s)
      g.style.transform = px(q[0], q[1])
      g.style.opacity = (1 - ed).toFixed(3)

      var ea = suave(seg(p, 0.07, 0.24))
      g = pecas.arco
      g.style.transform = px(base[0], base[1] - +g.getAttribute('data-levanta') * ea)
      g.style.opacity = apaga.toFixed(3)

      Object.keys(janelas).forEach(function (id) {
        var gp = pecas[id]
        var e = suave(seg(p, janelas[id][0], janelas[id][1]))
        var sp = +gp.getAttribute('data-s0') + +gp.getAttribute('data-extra') * e
        var qp = pos(sp)
        gp.style.transform = px(qp[0], qp[1])
        gp.style.opacity = apaga.toFixed(3)
      })

      // a face do alto-falante vem até a tela e se vira de frente
      var voo = pecas.voo
      if (a > 0.002) {
        var pf = pos(+voo.getAttribute('data-s'))
        var Smax = Math.min(vb[2], vb[3]) * 0.43 / 78
        var S = lerp(1, Smax, a)
        var x = lerp(pf[0], Vc[0], a), y = lerp(pf[1], Vc[1], a)
        voo.style.transform = px(x, y) + ' scale(' + S.toFixed(4) + ') matrix(' +
          lerp(1, 2.381, a).toFixed(4) + ',' + (0.476 * a).toFixed(4) + ',0,1,0,0)'
        voo.style.opacity = '1'
      } else {
        voo.style.opacity = '0'
      }

      // eixo de explosão e rótulos
      eixo.style.strokeDashoffset = (1 - suave(seg(p, 0.14, 0.34))).toFixed(4)
      eixo.style.opacity = apaga.toFixed(3)
      ordemRotulos.forEach(function (id, j) {
        var r = rotulos[id]
        var e = seg(p, 0.585 + j * 0.016, 0.645 + j * 0.016)
        r.linhas.forEach(function (l) { l.style.strokeDashoffset = (1 - saida(e)).toFixed(4) })
        var o = saida(seg(e, 0.45, 1)).toFixed(3)
        r.marcas.forEach(function (m) { m.style.opacity = o })
      })

      // peça em destaque = passo visível mais recente
      var ativo = null
      passos.forEach(function (ps) { if (p >= ps.de && p <= ps.ate) ativo = ps.id })
      ordemRotulos.forEach(function (id) { rotulos[id].el.classList.toggle('is-ativo', id === ativo) })
    }

    return {
      atualizar: function () {
        var r = explode.getBoundingClientRect()
        var curso = r.height - innerHeight
        if (curso <= 0) return
        if (r.bottom < -innerHeight || r.top > innerHeight * 2) return
        desenhar(clamp(-r.top / curso, 0, 1))
      }
    }
  }

  // ----------------------------------------------------------- 2. vedação --
  var vedacao = (function () {
    var sec = $('.vedacao')
    var tela = $('.vedacao__tela')
    if (!sec || !tela || !tela.getContext) return null
    sec.classList.add('vedacao--vivo')
    var dica = $('[data-dica]', sec)
    if (dica && !mouseFino) dica.textContent = 'Toque e arraste no desenho: você é o barulho. Role a página e veja as almofadas se fecharem.'
    var estado = $('[data-estado]', sec)
    var ctx = tela.getContext('2d')
    var W = 0, H = 0
    var aneis = []
    var fontes = [
      { x: 0.07, y: 0.14, cada: 1500, prox: 200 },
      { x: 0.93, y: 0.86, cada: 1800, prox: 900 },
      { x: 0.9, y: 0.12, cada: 2300, prox: 1500 }
    ]
    var vel = 150 // px por segundo
    var vedado = 0
    var rodando = false
    var ultimoEmit = 0
    var t0 = performance.now()

    function medir() {
      var dpr = Math.min(2, window.devicePixelRatio || 1)
      var r = tela.getBoundingClientRect()
      W = r.width; H = r.height
      tela.width = Math.round(W * dpr); tela.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    function emitir(x, y, agora) { aneis.push({ x: x, y: y, nasc: agora }); if (aneis.length > 90) aneis.shift() }

    function zona() {
      var zw = Math.min(W * 0.34, 210)
      var zh = Math.min(zw * 1.38, H * 0.64)
      return { x: W / 2 - zw / 2, y: H / 2 - zh / 2, w: zw, h: zh, r: zw * 0.44, cx: W / 2, cy: H / 2 }
    }
    function caminhoZona(z) {
      ctx.moveTo(z.x + z.r, z.y)
      ctx.arcTo(z.x + z.w, z.y, z.x + z.w, z.y + z.h, z.r)
      ctx.arcTo(z.x + z.w, z.y + z.h, z.x, z.y + z.h, z.r)
      ctx.arcTo(z.x, z.y + z.h, z.x, z.y, z.r)
      ctx.arcTo(z.x, z.y, z.x + z.w, z.y, z.r)
      ctx.closePath()
    }
    function vedacaoPelaRolagem() {
      var r = tela.getBoundingClientRect()
      var p = (innerHeight - r.top) / (innerHeight + r.height)
      var v = clamp((p - 0.28) / (0.6 - 0.28), 0, 1)
      return v * v * (3 - 2 * v)
    }

    function quadro(agora) {
      var t = (agora - t0) / 1000
      if (!reduz) {
        fontes.forEach(function (f) {
          if (agora >= f.prox + t0) { emitir(f.x * W, f.y * H, agora); f.prox += f.cada * (0.8 + Math.random() * 0.4) }
        })
      }
      vedado = reduz ? 1 : vedacaoPelaRolagem()
      if (estado) estado.textContent = vedado < 0.12 ? 'abertas' : vedado < 0.92 ? 'fechando' : 'fechadas'

      var z = zona()
      var raioMax = Math.hypot(W, H)
      var vivos = []
      var energia = 0
      aneis.forEach(function (a) {
        a.r = reduz ? a.r : ((agora - a.nasc) / 1000) * vel
        a.alfa = 0.55 * Math.pow(Math.max(0, 1 - a.r / raioMax), 1.6)
        if (a.alfa > 0.01) {
          vivos.push(a)
          var d = Math.hypot(a.x - z.cx, a.y - z.cy)
          if (Math.abs(a.r - d) < z.h / 2) energia += a.alfa
        }
      })
      aneis = vivos
      energia = Math.min(1.6, energia)

      ctx.clearRect(0, 0, W, H)
      var vaza = 0.12 + 0.88 * (1 - vedado)

      function ondas(mult) {
        ctx.lineWidth = 1.4
        aneis.forEach(function (a) {
          ctx.strokeStyle = 'rgba(157,174,194,' + (a.alfa * mult).toFixed(3) + ')'
          ctx.beginPath(); ctx.arc(a.x, a.y, Math.max(0.1, a.r), 0, Math.PI * 2); ctx.stroke()
        })
      }
      // fora da zona
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); caminhoZona(z); ctx.clip('evenodd'); ondas(1); ctx.restore()
      // dentro: o que vaza + a música
      ctx.save(); ctx.beginPath(); caminhoZona(z); ctx.clip()
      ctx.fillStyle = 'rgba(11,15,20,' + (0.35 + 0.5 * vedado).toFixed(3) + ')'
      ctx.fillRect(z.x, z.y, z.w, z.h)
      ondas(vaza)
      var largura = z.w * 0.74, x0 = z.cx - largura / 2
      ctx.beginPath()
      for (var i = 0; i <= 64; i++) {
        var u = i / 64
        var x = x0 + u * largura
        var env = Math.sin(Math.PI * u)
        var trem = vaza * energia * 9 * Math.sin(x * 0.9 + t * 13) * Math.sin(x * 0.31 + t * 7)
        var y = z.cy + env * (Math.sin(u * Math.PI * 4 - t * 2.2) * 13 + trem)
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y)
      }
      ctx.strokeStyle = 'rgba(140,188,245,0.95)'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.stroke()
      ctx.restore()

      // almofadas: duas metades que se fecham
      var folga = (1 - vedado) * Math.min(64, W * 0.08)
      var espessura = Math.max(18, z.w * 0.16)
      ;[-1, 1].forEach(function (lado) {
        ctx.save()
        ctx.beginPath(); ctx.rect(lado < 0 ? 0 : z.cx, 0, W / 2, H); ctx.clip()
        ctx.translate(lado * folga, 0)
        ctx.beginPath(); caminhoZona(z)
        ctx.lineWidth = espessura; ctx.strokeStyle = '#5E7088'; ctx.stroke()
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(160,178,200,0.55)'
        ctx.beginPath()
        var zi = { x: z.x + espessura / 2 - 2, y: z.y + espessura / 2 - 2, w: z.w - espessura + 4, h: z.h - espessura + 4, r: Math.max(4, z.r - espessura / 2) }
        caminhoZona(zi); ctx.stroke()
        ctx.restore()
      })
      // fontes de barulho
      ctx.fillStyle = 'rgba(157,174,194,0.6)'
      fontes.forEach(function (f) { ctx.beginPath(); ctx.arc(f.x * W, f.y * H, 3, 0, Math.PI * 2); ctx.fill() })

      if (rodando) requestAnimationFrame(quadro)
    }

    medir()
    if (reduz) {
      // Um quadro parado, com anéis já espalhados.
      var agora0 = performance.now()
      fontes.forEach(function (f) { [90, 180, 280].forEach(function (r) { aneis.push({ x: f.x * W, y: f.y * H, r: r, nasc: agora0 }) }) })
      quadro(agora0)
      addEventListener('resize', function () {
        medir(); aneis = []
        fontes.forEach(function (f) { [90, 180, 280].forEach(function (r) { aneis.push({ x: f.x * W, y: f.y * H, r: r, nasc: agora0 }) }) })
        quadro(performance.now())
      })
      return null
    }

    tela.addEventListener('pointermove', function (e) {
      var agora = performance.now()
      if (agora - ultimoEmit < 130) return
      ultimoEmit = agora
      var r = tela.getBoundingClientRect()
      emitir(e.clientX - r.left, e.clientY - r.top, agora)
    })
    tela.addEventListener('pointerdown', function (e) {
      var r = tela.getBoundingClientRect()
      emitir(e.clientX - r.left, e.clientY - r.top, performance.now())
    })
    addEventListener('resize', medir)
    new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && !rodando) { rodando = true; requestAnimationFrame(quadro) }
        else if (!en.isIntersecting) rodando = false
      })
    }).observe(tela)
    return true
  })()

  // -------------------------------------------------- 3. luz do cursor --
  ;(function () {
    var bloco = $('.ficha__bloco')
    if (!bloco || !mouseFino) return
    var alvos = [bloco].concat($$('.etiqueta', bloco))
    bloco.classList.add('is-lit')
    var quadroLuz = 0, ultimoEv = null
    function pintar() {
      quadroLuz = 0
      alvos.forEach(function (el) {
        var r = el.getBoundingClientRect()
        el.style.setProperty('--x', (ultimoEv.clientX - r.left).toFixed(1) + 'px')
        el.style.setProperty('--y', (ultimoEv.clientY - r.top).toFixed(1) + 'px')
      })
    }
    bloco.addEventListener('pointermove', function (e) {
      ultimoEv = e
      if (!quadroLuz) quadroLuz = requestAnimationFrame(pintar)
    })
  })()

  // ----------------------------------------------------------- 4. carimbo --
  ;(function () {
    var atual = $('[data-vista-atual]')
    var links = $$('.carimbo__lista a')
    var secoes = $$('[data-vista-nome]')
    if (!atual || !('IntersectionObserver' in window)) return
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return
        var id = en.target.id
        atual.textContent = en.target.getAttribute('data-vista-nome')
        links.forEach(function (a) {
          if (a.getAttribute('data-vista') === id) a.setAttribute('aria-current', 'true')
          else a.removeAttribute('aria-current')
        })
      })
    }, { rootMargin: '-48% 0px -48% 0px' })
    secoes.forEach(function (s) { io.observe(s) })
  })()

  // ------------------------------------------ 5. topo segue o mouse --
  var mouse = (function () {
    if (reduz || !mouseFino) return null
    var hero = $('.hero')
    var alvos = $$('[data-mouse]', hero).map(function (el) { return { el: el, m: +el.getAttribute('data-mouse') } })
    var alvo = [0, 0], atual = [0, 0]
    addEventListener('pointermove', function (e) {
      alvo = [(e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2]
    }, { passive: true })
    return {
      passo: function () {
        if (hero.getBoundingClientRect().bottom < 0) return
        atual[0] += (alvo[0] - atual[0]) * 0.08
        atual[1] += (alvo[1] - atual[1]) * 0.08
        alvos.forEach(function (a) {
          a.el.style.transform = 'translate3d(' + (atual[0] * a.m * 6).toFixed(2) + 'px,' + (atual[1] * a.m * 4).toFixed(2) + 'px,0)'
        })
      }
    }
  })()

  // Um laço só para o explode e o mouse do topo.
  if (ex || mouse) {
    var laco = function () {
      if (ex) ex.atualizar()
      if (mouse) mouse.passo()
      requestAnimationFrame(laco)
    }
    requestAnimationFrame(laco)
  }
})()
