import { test, expect } from '@playwright/test'
import { loginWithTestUser, hasTestCredentials } from './helpers'

test.describe('Create Card', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasTestCredentials()) {
      test.skip()
      return
    }
    await loginWithTestUser(page)
  })

  test('create page loads for authenticated user', async ({ page }) => {
    await page.goto('/en/create')
    await expect(page.getByText('Create a New Card')).toBeVisible()
  })

  test('step 1: all fields are present', async ({ page }) => {
    await page.goto('/en/create')
    await expect(page.getByPlaceholder('e.g. Sunrise hike to Masada')).toBeVisible()
    await expect(page.getByPlaceholder('Tell us about the activity, what\'s included, what to expect...')).toBeVisible()
    await expect(page.getByText('Activity Type')).toBeVisible()
    await expect(page.getByText('Trips')).toBeVisible()
  })

  test('step 1 → step 2: Next button advances the form', async ({ page }) => {
    await page.goto('/en/create')
    await page.getByPlaceholder('e.g. Sunrise hike to Masada').fill('QA Test Event')
    await page.getByPlaceholder('Tell us about the activity, what\'s included, what to expect...').fill('QA automated test. Please ignore.')
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText('Location')).toBeVisible({ timeout: 5000 })
  })

  test('can complete full card creation (end-to-end)', async ({ page }) => {
    const uniqueTitle = `QA Test Event ${Date.now()}`
    const nextWeek = new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0]
    const nextMonth = new Date(Date.now() + 14 * 86_400_000).toISOString().split('T')[0]

    await page.goto('/en/create')

    // Step 1 — Details
    await page.getByPlaceholder('e.g. Sunrise hike to Masada').fill(uniqueTitle)
    await page.getByPlaceholder('Tell us about the activity, what\'s included, what to expect...').fill('Automated QA test event. Please ignore.')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 2 — Location
    await expect(page.getByText('Location')).toBeVisible({ timeout: 5000 })
    await page.getByPlaceholder('Enter address or place name').fill('Dizengoff Square')
    const inputs = page.locator('input[type="text"]')
    await inputs.nth(1).fill('Tel Aviv')
    await inputs.nth(2).fill('Israel')
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 3 — Participants & Dates
    await expect(page.getByText('Participants')).toBeVisible({ timeout: 5000 })
    await page.locator('input[type="date"]').first().fill(nextWeek)
    await page.locator('input[type="date"]').last().fill(nextMonth)
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 4 — Contact
    await expect(page.getByText('Contact')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Next' }).click()

    // Step 5 — Photos (skip, just publish)
    await expect(page.getByRole('button', { name: 'Publish' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: 'Publish' }).click()

    // Expect redirect to the new card page or home
    await page.waitForURL(/\/en\/cards\/|\/en($|\/)/, { timeout: 15_000 })
    expect(page.url()).toMatch(/\/en/)
  })
})
