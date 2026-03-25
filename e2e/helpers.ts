import { Page } from '@playwright/test'

export async function loginWithTestUser(page: Page) {
  const email = process.env.QA_TEST_EMAIL
  const password = process.env.QA_TEST_PASSWORD
  if (!email || !password) throw new Error('QA_TEST_EMAIL and QA_TEST_PASSWORD must be set in .env.local')

  await page.goto('/en/auth')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL(/\/en($|\/)/, { timeout: 12000 })
}

export function hasTestCredentials(): boolean {
  return !!(process.env.QA_TEST_EMAIL && process.env.QA_TEST_PASSWORD)
}
