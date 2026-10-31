---
name: antes-de-publicar
description: Checklist de publicação de um site Vite antes do git push, da PR ou do merge - roda o build e os testes, confere a base do vite.config.js contra o nome do repositório, o peso das imagens, links internos, segredos no código e o git status - e responde PRONTO ou NÃO PRONTO com a prova de cada item. Só confere; não corrige nada sem OK. Use quando pedirem /antes-de-publicar ou "posso publicar?", "tá pronto pro push?", "confere antes do deploy", "checa antes de subir o site".
---

# Antes de publicar

Confira o site como o GitHub Pages vai recebê-lo e dê um veredito com prova. Quem decide publicar é a pessoa.

**Só conferência.** Não edite arquivos, não instale pacotes, não faça commit nem push. Os comandos permitidos
são os de leitura e checagem listados abaixo.
Por quê: um checklist que "conserta de passagem" esconde o problema de quem precisa aprender com ele.

**Um comando por vez.** Sem `;`, `&&`, `|` ou `$()`. No app, cada comando composto pede um clique de aprovação
a mais, e no modo Plan ele pode ser negado.

## Os itens

**1. O que vai subir.** `git status` e `git log --oneline -3`.
Arquivo modificado sem commit não vai para o ar: avise. Arquivo que não deveria subir (`.env`, `node_modules`,
`dist`, `review-landing/`): FALHA.

**2. Build.** `npm run build`. Erro: FALHA, com as 5 primeiras linhas do erro.
Por quê: o build é exatamente o que o Pages publica.

**3. Testes.** Se o `package.json` tiver o script `test`, rode `npm test`. Teste falhando: FALHA. Sem testes:
ATENÇÃO ("nada automático confere o site").

**4. Endereço base.** Leia o `base` do `vite.config.js` e o remoto (`git remote get-url origin`). No GitHub
Pages, a base precisa ser `/<nome-do-repositório>/`. Diferente: FALHA.
Por quê: com a base errada, o site abre sem CSS, sem imagens e sem animação.

**5. Peso.** Liste os arquivos de `dist/` acima de 500 KB e o total da pasta. Imagem acima de 500 KB:
ATENÇÃO, com a sugestão (WebP, largura máxima em que aparece). Total acima de 5 MB: ATENÇÃO.
Por quê: cada MB é tempo de espera no 4G.

**6. Caminhos.** Depois do build, procure em `dist/index.html` e em `dist/assets/` caminhos que começam com `/` sem a
base (ex.: `src="/img/` quando a base é `/meu-site/`): FALHA, porque ignoram a base e dão 404 no Pages. No
`index.html` e nos `.css` de `src/`, caminho começando com `/` (`/img/`, `/fonts/`) é normal: o Vite acrescenta a base
no build. Já um texto dentro de `.js` em `src/` (ex.: `'/img/foto.webp'`) o Vite não mexe: FALHA (use
`import.meta.env.BASE_URL`). Procure também links `href="#..."` e confira se o `id` existe no `index.html`.

**7. Segredos.** Procure `api_key`, `apikey`, `secret`, `token`, `password` e `sk-` em `src/`, `index.html` e
`dist/`. Confira se `.env` está no `.gitignore`. **Não abra o `.env`.** Achou chave de verdade: FALHA.
Por quê: tudo o que vai para o navegador é público, e chave publicada é chave vazada.

**8. Console.** Se um teste do item 3 já abre o site no navegador e confere o console, ele é a prova (cite o nome
do teste). Senão, se der para subir o preview (`npm run preview`, em segundo plano) e houver navegador
disponível, abra o site e anote erros de console. Se não der, escreva "não verificado" (não é FALHA).
Desligue o preview no fim.

## Formato da resposta

```markdown
## Antes de publicar: <projeto> (<data>)

| # | Item | Situação | Prova | Como resolver |
|---|---|---|---|---|
| 1 | O que vai subir | OK / ATENÇÃO / FALHA | `git status`: ... | ... |
| 2 | Build | | | |
| 3 | Testes | | | |
| 4 | Endereço base | | | |
| 5 | Peso | | | |
| 6 | Caminhos | | | |
| 7 | Segredos | | | |
| 8 | Console | | | |

**Veredito: PRONTO** (nenhuma FALHA) ou **NÃO PRONTO** (lista das FALHAS).
Não verificado: <o que ficou de fora e por quê>.

Quer que eu corrija alguma FALHA? Diga qual.
```

Toda linha precisa de prova: o comando que você rodou e o trecho da saída. Sem prova, a situação é
"não verificado", nunca OK.
