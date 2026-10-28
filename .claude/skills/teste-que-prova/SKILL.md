---
name: teste-que-prova
description: 'Escreve um teste do Playwright para uma mudança do site e prova que ele serve: roda com o código atual (passa), quebra o código de propósito (tem que falhar), desfaz a quebra (passa de novo) e mostra as três saídas. Use depois de um feat ou de uma correção, quando pedirem /teste-que-prova ou disserem "escreve um teste que confere essa mudança", "faz um teste que falha se isso quebrar", "prova que o teste pega o erro".'
---

# Teste que prova

Um teste só vale se falha quando o que ele confere quebra. Escreva o teste e mostre essa prova.

**O que esta skill pode mudar:** um arquivo em `tests/` e, por alguns minutos, a linha quebrada de propósito,
que volta exatamente como estava. Não instale pacotes (nem `npx playwright install`), não rode git que muda
algo (commit, stash, checkout, reset) e não "melhore" o site de passagem.
Por quê: quem pediu pode ter trabalho sem commit, e desfazer a quebra com git apagaria esse trabalho junto.

## Passo a passo

1. **Entender a mudança.** Leia `CLAUDE.md`, `playwright.config.js` e os testes de `tests/`. Se não disseram
   qual mudança, veja `git diff` e `git log -3` (só leitura) e confirme em uma frase o que vai conferir.
   Por quê: teste da coisa errada passa sempre e não prova nada.
2. **Escrever o teste** no arquivo da seção (`tests/<secao>.spec.js`; crie se não existir), com nome em
   português dizendo o que prova. Confira o que o visitante vê: texto, papel (`getByRole`), posição e tamanho
   medidos na tela, na largura em que o problema aparece. Use as esperas do `expect`, nunca `waitForTimeout`.
   Por quê: espera fixa deixa o teste lento e instável; classe CSS muda sem o visitante perceber.
3. **Rodar em três rodadas**, sempre só o teste novo: `npx playwright test tests/<arquivo> -g "<nome>"`.
   Antes de cada uma, confira se a porta do `webServer` do `playwright.config.js` está livre.
   Por quê: com `reuseExistingServer`, um preview velho faz o teste rodar no build antigo, e a quebra "passa".
   - **Rodada 1, código atual:** tem que passar.
   - **Rodada 2, quebrado de propósito:** desfaça a mudança na menor edição possível (ex.: volte o valor
     antigo) e anote o texto exato de antes. Tem que FALHAR, e pelo motivo certo: leia a mensagem.
     Se passar, o teste não prova nada: reescreva e volte à rodada 1.
   - **Rodada 3, restaurado:** faça a mesma edição ao contrário, letra por letra. Tem que passar.
4. **Conferir que voltou.** `git diff` do arquivo do site igual ao de antes da rodada 2.
5. **Rodar tudo:** `npm test`, para ver que o teste novo não quebrou os outros.

## Formato da resposta

```markdown
## Teste que prova: <a mudança, em uma frase>
Arquivo: tests/<arquivo>:<linha> · Largura: <px>

| Rodada | Código | Resultado | Trecho da saída |
|---|---|---|---|
| 1 | atual | passou | ... |
| 2 | quebrado: `<o que trocou>` | falhou | `<mensagem do expect>` |
| 3 | restaurado | passou | ... |

npm test: <N de N> · git diff --stat: <só o teste novo, além do que já estava>
Sugestão de commit (quem decide é você): test: confere <...>
```

Sem as três saídas, não diga que o teste prova: escreva "não verificado" e o motivo.
