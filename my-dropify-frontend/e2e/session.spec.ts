import { test, expect } from '@playwright/test'
import path from 'path'

test('create session and exchange text drops in real time', async ({ browser }) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()

  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  await page1.goto('/')
  await page1.click('text=Create Session')
  await page1.waitForURL(/session/)

  const sessionUrl = page1.url()

  await page2.goto(sessionUrl)
  await page2.waitForTimeout(1000)

  await page1.fill('input[placeholder="Type a drop..."]', 'hello world')
  await page1.click('text=Send')

  await expect(page2.locator('text=hello world')).toBeVisible({ timeout: 10000 })

  await context1.close()
  await context2.close()
})


test('file upload syncs between two users', async ({ browser }) => {
  const context1 = await browser.newContext()
  const context2 = await browser.newContext()

  const page1 = await context1.newPage()
  const page2 = await context2.newPage()

  await page1.goto('/')
  await page1.click('text=Create Session')
  await page1.waitForURL(/session/)

  const sessionUrl = page1.url()
  await page2.goto(sessionUrl)
  await page2.waitForTimeout(1000)

  const filePath = path.resolve(__dirname, 'test-file.txt')

  const fileInput = page1.getByTestId('file-input')
  await fileInput.setInputFiles(filePath)

  await expect(page2.locator('text=Download File')).toBeVisible({ timeout: 10000 })

  await context1.close()
  await context2.close()
})


test('QR code renders correctly', async ({ page }) => {
  await page.goto('/')

  await Promise.all([
    page.waitForURL(/session/),
    page.click('text=Create Session'),
  ])

  const qrImage = page.locator('img[alt="QR Code"]')
  await expect(qrImage).toBeVisible()

  const src = await qrImage.getAttribute('src')
  expect(src).toContain('/qrcode')
})



test('session expires correctly (backend validation)', async ({ page, request }) => {
  await page.goto('/')
  await page.click('text=Create Session')
  await page.waitForURL(/session/)

  const url = page.url()
  const code = url.split('/').pop()

  // Expire via backend
  await request.delete(`http://localhost:8000/sessions/${code}/expire`)

  // Verify backend now returns 404
  const response = await request.get(`http://localhost:8000/sessions/${code}`)
  expect(response.status()).toBe(404)
})
