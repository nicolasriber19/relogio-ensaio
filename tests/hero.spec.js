import { test, expect } from '@playwright/test'

// Topo (#hero): no desktop o texto fica numa faixa escura de 34% à esquerda, ao lado da foto.

test('o botão do topo leva até o formulário da lista de espera', async ({ page }) => {
  await page.goto('./')
  await page.locator('#hero').getByRole('link', { name: 'Entrar na lista de espera' }).click()
  await expect(page.getByRole('textbox', { name: 'E-mail' })).toBeInViewport()
})

test.describe('no desktop estreito (1024 px)', () => {
  test.use({ viewport: { width: 1024, height: 768 } })

  test('o título do topo termina dentro da faixa escura, sem passar para a foto', async ({ page }) => {
    await page.goto('./')
    const titulo = page.getByRole('heading', { level: 1, name: 'Calibre Norte' })
    await expect(titulo).toBeVisible()

    // Mede onde as letras terminam (não a caixa do h1, que sempre tem a largura da coluna)
    const medidas = await titulo.evaluate((h1) => {
      const trecho = document.createRange()
      trecho.selectNodeContents(h1)
      const fimDoTexto = Math.max(...[...trecho.getClientRects()].map((r) => r.right))
      const faixa = h1.closest('.hero__texto').getBoundingClientRect()
      return { fimDoTexto, fimDaFaixa: faixa.right }
    })
    expect(medidas.fimDoTexto).toBeLessThanOrEqual(medidas.fimDaFaixa)
  })
})
