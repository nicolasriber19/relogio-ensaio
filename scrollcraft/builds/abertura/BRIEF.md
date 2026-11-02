# BRIEF: seção "O relógio por dentro" (#abertura), Calibre Norte

Escopo: uma seção de uma página que já existe, não um site novo. A grammar, a navegação, o topo e o
fechamento da página ficam como estão; esta peça é o **pico** da página. Entrevista feita em 31/10/2026,
com as respostas do usuário; o resto vem do `docs/brief.md` e do `CLAUDE.md` do projeto.

## As decisões, nas palavras do usuário

- Pedido: "uma animação extremamente extravagante usando o mesmo estilo da explode view; precisa ser algo
  grande na tela e marcante."
- Momento a lembrar (escolhido): **as peças voam até a tela.** O relógio fechado ocupa a tela e, com a
  rolagem, explode em profundidade: cristal e mostrador passam pela câmera, o movimento cresce até
  preencher a tela, e as peças voltam a se alinhar na vista explodida.
- Recursos (escolhido): **vídeo gerado no Higgsfield** a partir das fotos que já existem (relógio fechado
  e vista explodida), avançado pela rolagem.
- Duração (escolhido): **até 3 telas de rolagem**, o limite do plano do projeto.
- Texto (escolhido): **os 4 passos sobre a imagem**, um de cada vez, quando a peça dele está em destaque.

## Do brief e das regras do projeto (não negociáveis)

- Público: adultos de 30 a 50 anos que gostam de mecânica. Tom: relojoaria clássica, preciso e calmo.
  A extravagância está na imagem e no movimento; o texto continua sóbrio.
- Mundo: **fotográfico**, o mesmo estúdio das fotos atuais (fundo preto, aço escovado, mostrador verde
  de acabamento radial, luz lateral dura). Nada de diorama, ilustração ou texto dentro da imagem.
- Técnica (CLAUDE.md): GSAP com `gsap.matchMedia()` e "reduzir movimento" respeitado; ScrollTrigger com
  pin e scrub; `svh`; o import do GSAP fica em `abertura.js`. Sem pacote novo.
- Sem JavaScript ou com "reduzir movimento": a composição estática de hoje (vista explodida + passos),
  visível e parada.
- Origem do movimento: "a confirmar". Nenhum dado técnico novo no texto.

## Curva de sentimento (dentro da seção)

1. **Reconhecimento:** o relógio fechado, inteiro, como no topo. Causa: a mesma foto que a pessoa já viu.
2. **Tensão:** o relógio cresce e o cristal se solta. Causa: a câmera avança e a primeira peça se descola.
3. **Pico, assombro:** as peças passam pela câmera e preenchem a tela. Causa: escala, profundidade, velocidade.
4. **Compreensão:** tudo se alinha na vista explodida, legível, e os passos explicam cada peça. Causa: a
   desordem vira ordem.

## O pico

"Rolei a página e o relógio se desmontou na minha cara: as peças passaram pela tela e pararam alinhadas."
Vive no meio da seção (terço do meio da rolagem) e recebe o maior espaço de rolagem dela.

## Frase de contar para alguém

"É o site em que o relógio se desmonta na sua frente enquanto você rola."

## Pedido de vídeo (Higgsfield, imagem para vídeo com quadro inicial e final)

- Quadro inicial: `public/img/hero.webp` (relógio fechado, 1600 x 904).
- Quadro final: `public/img/explodido.webp` (vista explodida, 1600 x 904).
- Formato: 16:9, 5 s (ou o mais longo disponível), sem som, câmera única.
- Prompt (em inglês, que os modelos seguem melhor):
  "Studio product film on pure black, hard side light, brushed steel and green sunburst dial, photographic,
  no text. The closed steel watch slowly pushes toward the camera, then disassembles in depth: the sapphire
  crystal lifts off and flies past the lens, the green dial follows and fills the frame for a moment, the
  automatic movement with its rotor and ruby jewels drifts forward, the case and caseback separate. Every
  part then glides back and settles into a clean horizontal exploded view, left to right: crystal, dial
  with hands, movement, case, caseback. Smooth continuous motion, no cuts, no camera shake, no added
  objects, no reflections of people."

## Silêncio intencional

A primeira fração da rolagem segura o relógio fechado quase parado (reconhecimento): não é rolagem morta.
