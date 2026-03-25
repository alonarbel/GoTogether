import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('auth page loads with Sign In form', async ({ page }) => {
    await page.goto('/en/auth')
    await expect(page.getByText('Sign In').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('can switch to Register tab', async ({ page }) => {
    await page.goto('/en/auth')
    await page.getByText('Register').click()
    await expect(page.getByPlaceholder('John Doe')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('register form has full name, phone, email and password fields', async ({ page }) => {
    await page.goto('/en/auth')
    await page.getByText('Register').click()
    await expect(page.getByPlaceholder('John Doe')).toBeVisible()
    await expect(page.getByPlaceholder('000-000-0000')).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/en/auth')
    await page.locator('input[type="email"]').fill('qa-invalid@example.com')
    await page.locator('input[type="password"]').first().fill('wrongpassword123')
    await page.getByRole('button', { name: 'Sign In' }).click()
    // Supabase returns an error — wait for it
    const errorVisible = await page.locator('text=Invalid').or(page.locator('text=Error')).or(page.locator('text=credentials')).first().isVisible({ timeout: 8000 }).catch(() => false)
    expect(errorVisible).toBeTruthy()
  })

  test('Forgot password? navigates to reset form', async ({ page }) => {
    await page.goto('/en/auth')
    await page.getByText('Forgot password?').click()
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
  })

  test('Back to Login returns from reset form', async ({ page }) => {
    await page.goto('/en/auth')
    await page.getByText('Forgot password?').click()
    await page.getByText('Back to Login').click()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]').first()).toBeVisible()
  })

  test('reset form submits email and shows confirmation', async ({ page }) => {
    await page.goto('/en/auth')
    await page.getByText('Forgot password?').click()
    await page.locator('input[type="email"]').fill('qa-test@example.com')
    await page.getByRole('button', { name: 'Send Reset Link' }).click()
    await expect(page.getByText(/check your email/i)).toBeVisible({ timeout: 8000 })
  })

  test('unauthenticated user visiting /create is redirected or sees login prompt', async ({ page }) => {
    await page.goto('/en/create')
    await page.waitForTimeout(1000)
    const isOnAuth = page.url().includes('/auth')
    const hasLoginPrompt = await page.getByText(/login required/i).isVisible().catch(() => false)
    expect(isOnAuth || hasLoginPrompt).toBeTruthy()
  })
})
