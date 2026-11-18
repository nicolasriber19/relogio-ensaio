// Gera o desenho vetorial do Fone P9 e injeta no index.html, entre os marcadores
//   <!-- fone:defs:inicio --> ... <!-- fone:defs:fim -->
//   <!-- fone:explodido:inicio --> ... <!-- fone:explodido:fim -->
// Uso: node tools/desenha-fone.mjs
//
// Projeção: vista 3/4 ortográfica. Cada peça da concha é desenhada "de frente"
// (coordenadas locais) e projetada com a matriz U/V; a espessura vai no eixo N.
//   U (horizontal da face) -> (0.42, -0.20)
//   V (vertical)           -> (0, 1)
//   N (profundidade)       -> (0.90, 0.10)
// A concha da esquerda é vista por dentro (almofada virada para a câmera); a da
// direita, por fora. O ponto (0,0) é o centro da concha da esquerda em s = 0.

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const aqui = dirname(fileURLToPath(import.meta.url))
const arquivo = join(aqui, '..', 'index.html')

const N = [0.9, 0.1]
const MAT = (x, y) => `matrix(0.42 -0.2 0 1 ${f(x)} ${f(y)})`
const f = (n) => Number(n.toFixed(2))
const at = (s) => [N[0] * s, N[1] * s]
const lerpHex = (a, b, t) => {
  const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16))
  const pb = b.match(/\w\w/g).map((h) => parseInt(h, 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')
}
const rr = (w, h, r) => {
  const x = w / 2, y = h / 2
  return `M${-x + r} ${-y}H${x - r}A${r} ${r} 0 0 1 ${x} ${-y + r}V${y - r}A${r} ${r} 0 0 1 ${x - r} ${y}H${-x + r}A${r} ${r} 0 0 1 ${-x} ${y - r}V${-y + r}A${r} ${r} 0 0 1 ${-x + r} ${-y}Z`
}

// Extrusão: cópias da silhueta ao longo de N, do fundo (escuro) para a face.
function extruda(id, t, c0, c1, passo = 2.2) {
  const n = Math.max(2, Math.ceil(t / passo))
  let s = ''
  for (let k = 0; k <= n; k++) {
    const [x, y] = at((t * k) / n)
    s += `<use href="#${id}" transform="${MAT(x, y)}" fill="${lerpHex(c0, c1, k / n)}"/>`
  }
  return s
}
const face = (t, conteudo) => {
  const [x, y] = at(t)
  return `<g transform="${MAT(x, y)}">${conteudo}</g>`
}

// ---------------------------------------------------------------- peças --
const T = { concha: 36, bateria: 8, placa: 3, falante: 14, almofada: 34, conchaFora: 38 }

const silhuetas = `
<path id="sil-concha" d="${rr(180, 210, 74)}"/>
<path id="sil-almofada" d="${rr(194, 224, 82)}"/>
<path id="sil-bateria" d="${rr(118, 66, 10)}"/>
<circle id="sil-placa" r="72"/>
<circle id="sil-falante" r="78"/>`

const gradientes = `
<linearGradient id="g-corpo" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#9AABC2"/><stop offset=".45" stop-color="#6B7F99"/><stop offset="1" stop-color="#46566C"/>
</linearGradient>
<linearGradient id="g-fora" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0" stop-color="#A9B9CE"/><stop offset=".38" stop-color="#7D90AA"/><stop offset="1" stop-color="#4A5A70"/>
</linearGradient>
<radialGradient id="g-brilho" cx=".34" cy=".26" r=".6">
  <stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="g-fundo-concha" cx=".5" cy=".42" r=".62">
  <stop offset="0" stop-color="#344153"/><stop offset="1" stop-color="#1A222D"/>
</radialGradient>
<linearGradient id="g-bateria" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="#C7D2DF"/><stop offset="1" stop-color="#8794A6"/>
</linearGradient>
<radialGradient id="g-cone" cx=".42" cy=".38" r=".7">
  <stop offset="0" stop-color="#4C5D74"/><stop offset=".6" stop-color="#28323F"/><stop offset="1" stop-color="#151B24"/>
</radialGradient>
<radialGradient id="g-tampa" cx=".36" cy=".32" r=".75">
  <stop offset="0" stop-color="#B5C3D5"/><stop offset=".5" stop-color="#5E7089"/><stop offset="1" stop-color="#2B3543"/>
</radialGradient>
<linearGradient id="g-cromo" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="#7D8897"/><stop offset=".35" stop-color="#F2F5F8"/><stop offset=".6" stop-color="#B9C2CD"/><stop offset="1" stop-color="#5D6876"/>
</linearGradient>
<linearGradient id="g-arco" x1="0" x2="0" gradientUnits="userSpaceOnUse" y1="-340" y2="-150">
  <stop offset="0" stop-color="#93A5BD"/><stop offset="1" stop-color="#55677F"/>
</linearGradient>
<pattern id="pat-malha" width="7" height="7" patternUnits="userSpaceOnUse">
  <rect width="7" height="7" fill="#5E7088"/><circle cx="3.5" cy="3.5" r="1.25" fill="#465569"/><circle cx="0" cy="0" r=".7" fill="#7486A0"/>
</pattern>
<pattern id="pat-pano" width="5" height="5" patternUnits="userSpaceOnUse">
  <rect width="5" height="5" fill="#1C2430"/><circle cx="2.5" cy="2.5" r=".8" fill="#2A3442"/>
</pattern>`

// Concha (vista por dentro), com botões na lateral visível.
function pConcha() {
  let botoes = ''
  for (const y of [-22, 4, 30]) {
    const [nx, ny] = at(T.concha * 0.48)
    botoes += `<rect x="${f(-37.8 + nx - 5)}" y="${f(18 + y + ny - 8)}" width="10" height="16" rx="5" fill="#7D90A9" stroke="#2A3442" stroke-width="1.2"/>`
  }
  return `<g id="p-concha">${extruda('sil-concha', T.concha, '#1F2833', '#465870')}${botoes}${face(T.concha, `
    <use href="#sil-concha" fill="url(#g-corpo)"/>
    <path d="${rr(150, 180, 62)}" fill="url(#g-fundo-concha)"/>
    <path d="${rr(150, 180, 62)}" fill="none" stroke="#11171F" stroke-width="3" opacity=".7"/>
    <g fill="#3A475A" stroke="#55667E" stroke-width="1.5">
      <circle cx="-46" cy="-58" r="6"/><circle cx="46" cy="-58" r="6"/><circle cx="-46" cy="58" r="6"/><circle cx="46" cy="58" r="6"/>
    </g>
    <path d="M-30 0H30M0 -40V40" stroke="#2A3442" stroke-width="2" opacity=".6"/>`)}</g>`
}

function pBateria() {
  return `<g id="p-bateria">${extruda('sil-bateria', T.bateria, '#5D6A7C', '#8E9BAD', 1.6)}${face(T.bateria, `
    <use href="#sil-bateria" fill="url(#g-bateria)"/>
    <rect x="-52" y="-14" width="104" height="5" rx="2" fill="#93A1B3"/>
    <rect x="-52" y="4" width="70" height="3" rx="1.5" fill="#A3B0C0"/>
    <rect x="52" y="-12" width="10" height="24" rx="2" fill="#313B48"/>
    <path d="M62 -6c14 0 18 -10 30 -12M62 6c16 0 20 10 32 12" fill="none" stroke="#C9D3DF" stroke-width="2.2" stroke-linecap="round"/>`)}</g>`
}

function pPlaca() {
  return `<g id="p-placa">${extruda('sil-placa', T.placa, '#0B1A2A', '#173450', 1)}${face(T.placa, `
    <use href="#sil-placa" fill="#12304B" stroke="#2F5375" stroke-width="2"/>
    <g fill="none" stroke="#7FB2F0" stroke-width="1.6" stroke-linecap="round" opacity=".7">
      <path d="M-50 -20H-30V-40H10"/><path d="M-28 22H-6V40H30"/><path d="M18 -6H44V18"/><path d="M-12 -34V-52H24"/>
    </g>
    <path d="M22 -58l8 6 -8 6 8 6 -8 6 8 6" fill="none" stroke="#9CC6F5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="-26" y="-16" width="44" height="32" rx="3" fill="#0A1520" stroke="#3B6087" stroke-width="1.5"/>
    <rect x="26" y="24" width="18" height="14" rx="2" fill="#0A1520" stroke="#3B6087" stroke-width="1.2"/>
    <rect x="-46" y="26" width="12" height="8" rx="1.5" fill="#26425F"/>
    <circle cx="-52" cy="-2" r="8" fill="#1A2230" stroke="#B7CBE2" stroke-width="2"/>
    <circle cx="-52" cy="-2" r="3" fill="#7FB2F0"/>`)}</g>`
}

function pFalante() {
  return `<g id="p-falante">${extruda('sil-falante', T.falante, '#151B23', '#2E3846', 1.6)}${face(T.falante, `
    <use href="#sil-falante" fill="#2A333F"/>
    <circle r="74" fill="none" stroke="#45546A" stroke-width="3"/>
    <g fill="#3A475A"><rect x="-6" y="-80" width="12" height="10" rx="2"/><rect x="-6" y="70" width="12" height="10" rx="2"/><rect x="-80" y="-6" width="10" height="12" rx="2"/><rect x="70" y="-6" width="10" height="12" rx="2"/></g>
    <circle r="64" fill="url(#g-cone)"/>
    <circle r="62" fill="none" stroke="#5A6C85" stroke-width="4" opacity=".8"/>
    <circle r="50" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="2"/>
    <circle r="38" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
    <circle r="22" fill="url(#g-tampa)"/>`)}</g>`
}

function pFalanteFace() {
  return `<g id="p-falante-face"><g transform="${MAT(0, 0)}">
    <use href="#sil-falante" fill="#2A333F"/>
    <circle r="74" fill="none" stroke="#45546A" stroke-width="3"/>
    <circle r="64" fill="url(#g-cone)"/>
    <circle r="62" fill="none" stroke="#5A6C85" stroke-width="4" opacity=".8"/>
    <circle r="50" fill="none" stroke="#fff" stroke-opacity=".06" stroke-width="2"/>
    <circle r="38" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
    <circle r="22" fill="url(#g-tampa)"/></g></g>`
}

function pAlmofada() {
  return `<g id="p-almofada">${extruda('sil-almofada', T.almofada, '#36445A', '#5A6C84', 2.4)}${face(T.almofada, `
    <path d="${rr(194, 224, 82)} ${rr(110, 146, 46)}" fill-rule="evenodd" fill="url(#pat-malha)"/>
    <path d="${rr(110, 146, 46)}" fill="url(#pat-pano)"/>
    <path d="${rr(118, 154, 49)}" fill="none" stroke="#8B9DB5" stroke-width="3" opacity=".55"/>
    <path d="${rr(188, 218, 79)}" fill="none" stroke="#91A3BB" stroke-width="2" opacity=".5"/>
    <path d="${rr(110, 146, 46)}" fill="none" stroke="#0F141B" stroke-width="4" opacity=".6"/>`)}</g>`
}

// Concha da direita, vista por fora: só a lateral da almofada e a casca.
function pConchaFora() {
  let botoes = ''
  for (const y of [-26, 0, 26]) {
    const [nx, ny] = at(T.conchaFora * 0.5)
    botoes += `<rect x="${f(-37.8 + nx - 5)}" y="${f(18 + y + ny - 8)}" width="10" height="16" rx="5" fill="#8EA0B8" stroke="#2A3442" stroke-width="1.2"/>`
  }
  return `<g id="p-concha-fora">
    ${extruda('sil-almofada', T.almofada, '#2F3B4D', '#55677F', 2.4)}
    <g transform="translate(${f(at(T.almofada)[0])} ${f(at(T.almofada)[1])})">
      ${extruda('sil-concha', T.conchaFora, '#2B3644', '#58698A')}${botoes}${face(T.conchaFora, `
      <use href="#sil-concha" fill="url(#g-fora)"/>
      <use href="#sil-concha" fill="url(#g-brilho)"/>
      <path d="${rr(172, 202, 70)}" fill="none" stroke="#C3D0DF" stroke-width="1.5" opacity=".45"/>`)}
    </g></g>`
}

// ----------------------------------------------------------- arco e hastes --
const ARCO = { sc: 222, rs: 204, h0: 153, rh: 190 }
function pontoArco(fi, du = 0, dh = 0) {
  const s = ARCO.sc - ARCO.rs * Math.cos(fi)
  const h = ARCO.h0 + (ARCO.rh + dh) * Math.sin(fi)
  const [x, y] = at(s)
  return [x + 0.42 * du, y - h - 0.2 * du]
}
function caminhoArco(du, dh, a0 = 0, a1 = Math.PI) {
  let d = ''
  const n = 48
  for (let i = 0; i <= n; i++) {
    const [x, y] = pontoArco(a0 + ((a1 - a0) * i) / n, du, dh)
    d += (i ? 'L' : 'M') + f(x) + ' ' + f(y)
  }
  return d
}
function pArco() {
  const [ex, ey] = pontoArco(0, 0)
  const [dx, dy] = pontoArco(Math.PI, 0)
  const tampa = (x, y) => `<rect x="${f(x - 11)}" y="${f(y - 4)}" width="22" height="20" rx="7" fill="#3E4C60" stroke="#6E819B" stroke-width="1.2"/>`
  return `<g id="p-arco">
    <path d="${caminhoArco(-16, 0)}" fill="none" stroke="#2E3A4A" stroke-width="24" stroke-linecap="round"/>
    <path d="${caminhoArco(4, -16, 0.18, Math.PI - 0.18)}" fill="none" stroke="#56687F" stroke-width="16" stroke-linecap="round"/>
    <path d="${caminhoArco(4, -16, 0.24, Math.PI - 0.24)}" fill="none" stroke="#3B4859" stroke-width="2.6" stroke-dasharray="0.1 7" stroke-linecap="round"/>
    <path d="${caminhoArco(10, 0)}" fill="none" stroke="url(#g-arco)" stroke-width="22" stroke-linecap="round"/>
    <path d="${caminhoArco(14, 6, 0.3, Math.PI - 0.3)}" fill="none" stroke="#C2CEDD" stroke-width="2" stroke-linecap="round" opacity=".55"/>
    ${tampa(ex, ey)}${tampa(dx, dy)}
  </g>`
}
function pHastes() {
  const haste = (s) => {
    const [x, y] = at(s)
    return `<rect x="${f(x - 4.5)}" y="${f(y - 153)}" width="9" height="50" fill="url(#g-cromo)"/>
      <rect x="${f(x - 8)}" y="${f(y - 108)}" width="16" height="9" rx="3" fill="#2A3442"/>`
  }
  return `<g id="p-hastes">${haste(18)}${haste(426)}</g>`
}

// Posições montadas (s inicial de cada peça).
const S0 = { concha: 0, bateria: 14, placa: 24, falante: 28, almofada: 38, direita: 372 }
// Afastamento extra ao longo de N na vista explodida.
const EXTRA = { concha: 0, bateria: 110, placa: 210, falante: 320, almofada: 450 }
const LEVANTA = 92 // o arco sobe com as hastes
const SAI_DIREITA = 520

const tr = (s, dy = 0) => {
  const [x, y] = at(s)
  return `translate(${f(x)} ${f(y + dy)})`
}

const montado = `<g id="fone-montado">
  <use href="#p-concha" transform="${tr(S0.concha)}"/>
  <use href="#p-bateria" transform="${tr(S0.bateria)}"/>
  <use href="#p-placa" transform="${tr(S0.placa)}"/>
  <use href="#p-falante" transform="${tr(S0.falante)}"/>
  <use href="#p-almofada" transform="${tr(S0.almofada)}"/>
  <use href="#p-hastes"/><use href="#p-arco"/>
  <use href="#p-concha-fora" transform="${tr(S0.direita)}"/>
</g>`

const defs = `<!-- fone:defs:inicio -->
<svg class="fone-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>
${gradientes}
${silhuetas}
${pConcha()}
${pBateria()}
${pPlaca()}
${pFalante()}
${pFalanteFace()}
${pAlmofada()}
${pConchaFora()}
${pArco()}
${pHastes()}
${montado}
</defs></svg>
<!-- fone:defs:fim -->`

// ----------------------------------------------------------- vista explodida --
// Base no viewBox 0 0 1200 760. Peças com posição explodida no atributo (sem JS
// é o que aparece); o JS sobrescreve com style.transform durante a rolagem.
const BASE = [384, 486]
const meio = (peca) => S0[peca] + EXTRA[peca] + T[peca] / 2
const centroFace = (peca) => {
  const s = S0[peca] + EXTRA[peca] + T[peca]
  return [BASE[0] + N[0] * s, BASE[1] + N[1] * s]
}
const alturas = { concha: 105, bateria: 33, placa: 72, falante: 78, almofada: 112 }

// Rótulos: número, nome curto, ponto de ancoragem na peça e ponto do texto.
const rotulos = [
  { id: 'almofada', n: '1', nome: ['Almofada', 'over-ear'], lado: 'baixo' },
  { id: 'falante', n: '2', nome: ['Alto-falante'], lado: 'cima' },
  { id: 'placa', n: '3', nome: ['Placa Bluetooth', '5.1 e microfone'], lado: 'baixo' },
  { id: 'bateria', n: '4', nome: ['Bateria'], lado: 'cima' },
  { id: 'concha', n: '5', nome: ['Concha', 'com botões'], lado: 'baixo' },
]

// Abaixo da fila: disco numa linha só e nome em até duas linhas, centrado.
// Acima: disco no vão sob o arco e nome à esquerda do disco.
function linhaRotulo(r) {
  const [cx, cy] = centroFace(r.id)
  const baixo = r.lado === 'baixo'
  const ax = cx
  const ay = baixo ? cy + alturas[r.id] + 10 : cy - alturas[r.id] - 10
  const ty = baixo ? 678 : 330
  const linhaFim = baixo ? ty - 14 : ty + 14
  const nome = baixo
    ? `<text class="rotulo__nome" text-anchor="middle" y="36">${r.nome.map((l, i) => `<tspan x="0" dy="${i ? 20 : 0}">${l}</tspan>`).join('')}</text>`
    : `<text class="rotulo__nome" text-anchor="end" x="-22" y="5">${r.nome[0]}</text>`
  return `<g class="rotulo" data-rotulo="${r.id}">
    <path class="rotulo__linha" d="M${f(ax)} ${f(ay)}V${f(linhaFim)}" pathLength="1"/>
    <circle class="rotulo__ponto" cx="${f(ax)}" cy="${f(ay)}" r="3.5"/>
    <g class="rotulo__marca" transform="translate(${f(ax)} ${f(ty)})">
      <g class="rotulo__disco"><circle r="13"/><text class="rotulo__num" text-anchor="middle" dy="5">${r.n}</text></g>
      ${nome}
    </g></g>`
}

// Rótulo do arco e das hastes, acima.
function rotuloArco() {
  const [x, y] = pontoArco(Math.PI * 0.32, 10)
  const yy = y - LEVANTA
  const [hx, hy] = at(426)
  const hastY = hy - 130 - LEVANTA
  return `<g class="rotulo" data-rotulo="arco">
    <path class="rotulo__linha" d="M${f(BASE[0] + x)} ${f(BASE[1] + yy - 14)}L${f(BASE[0] + x - 60)} ${f(BASE[1] + yy - 64)}H${f(BASE[0] + x - 120)}" pathLength="1"/>
    <circle class="rotulo__ponto" cx="${f(BASE[0] + x)}" cy="${f(BASE[1] + yy - 14)}" r="3.5"/>
    <g class="rotulo__marca" transform="translate(${f(BASE[0] + x - 136)} ${f(BASE[1] + yy - 64)})">
      <g class="rotulo__disco"><circle r="13"/><text class="rotulo__num" text-anchor="middle" dy="5">6</text></g>
      <text class="rotulo__nome" x="-22" y="5" text-anchor="end">Arco acolchoado</text>
    </g>
    <path class="rotulo__linha" d="M${f(BASE[0] + hx + 8)} ${f(BASE[1] + hastY)}H${f(BASE[0] + hx + 120)}" pathLength="1"/>
    <circle class="rotulo__ponto" cx="${f(BASE[0] + hx + 8)}" cy="${f(BASE[1] + hastY)}" r="3.5"/>
    <g class="rotulo__marca" transform="translate(${f(BASE[0] + hx + 136)} ${f(BASE[1] + hastY)})">
      <g class="rotulo__disco"><circle r="13"/><text class="rotulo__num" text-anchor="middle" dy="5">7</text></g>
      <text class="rotulo__nome" x="22" y="5" text-anchor="start">Hastes metálicas</text>
    </g></g>`
}

// Linhas de construção (eixo de explosão), desenhadas pela rolagem.
function eixo() {
  const [x0, y0] = [BASE[0] - 60, BASE[1] - 6]
  const s1 = 560
  const [x1, y1] = [BASE[0] + N[0] * s1 + 40, BASE[1] + N[1] * s1 + 4]
  return `<path class="eixo" d="M${f(x0)} ${f(y0)}L${f(x1)} ${f(y1)}" pathLength="1"/>`
}

const pecas = ['concha', 'bateria', 'placa', 'falante', 'almofada']
const explodido = `<!-- fone:explodido:inicio -->
<svg class="explode__svg" viewBox="190 44 880 720" role="img" aria-labelledby="explode-titulo-svg" data-base="${BASE.join(' ')}">
  <title id="explode-titulo-svg">Vista explodida de uma concha do Fone P9: concha com botões, bateria, placa Bluetooth com microfone, alto-falante e almofada, alinhados da esquerda para a direita, com o arco acolchoado e as hastes metálicas acima.</title>
  ${eixo()}
  <g class="explode__camera">
    <g class="peca peca--direita" data-peca="direita" data-s0="${S0.direita}" data-extra="${SAI_DIREITA}" transform="translate(${BASE[0]} ${BASE[1]}) ${tr(S0.direita + SAI_DIREITA)}" opacity="0"><use href="#p-concha-fora"/></g>
${pecas.map((p) => `    <g class="peca" data-peca="${p}" data-s0="${S0[p]}" data-extra="${EXTRA[p]}" transform="translate(${BASE[0]} ${BASE[1]}) ${tr(S0[p] + EXTRA[p])}"><use href="#p-${p}"/></g>`).join('\n')}
    <g class="peca peca--arco" data-peca="arco" data-levanta="${LEVANTA}" transform="translate(${BASE[0]} ${BASE[1] - LEVANTA})"><use href="#p-arco"/><use href="#p-hastes"/></g>
    <g class="peca peca--voo" data-peca="voo" aria-hidden="true" opacity="0" data-s="${S0.falante + EXTRA.falante + T.falante}" transform="translate(${BASE[0]} ${BASE[1]}) ${tr(S0.falante + EXTRA.falante + T.falante)}"><use href="#p-falante-face"/></g>
  </g>
  <g class="rotulos">
${rotulos.map(linhaRotulo).join('\n')}
${rotuloArco()}
  </g>
</svg>
<!-- fone:explodido:fim -->`

let html = readFileSync(arquivo, 'utf8')
const troca = (nome, bloco) => {
  const re = new RegExp(`<!-- fone:${nome}:inicio -->[\\s\\S]*?<!-- fone:${nome}:fim -->`)
  if (!re.test(html)) throw new Error(`marcador fone:${nome} não encontrado`)
  html = html.replace(re, bloco)
}
troca('defs', defs)
troca('explodido', explodido)
writeFileSync(arquivo, html)
console.log('desenho atualizado:', arquivo, `(${(html.length / 1024).toFixed(1)} KB)`)
