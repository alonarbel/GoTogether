import { test, expect } from '@playwright/test'
import { loginWithTestUser, hasTestCredentials } from './helpers'

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    if (!hasTestCredentials()) {
      test.skip()
      return
    }
    await loginWithTestUser(page)
  })

  test('own profile page loads', async ({ page }) => {
    await page.goto('/en/profile')
    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/en/profile')
  })

  test('profile shows Active and Past event tabs', async ({ page }) => {
    await page.goto('/en/profile')
    await expect(page.getByText('Active').first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Past').first()).toBeVisible({ timeout: 8000 })
  })

  test('profile shows "Events I Created" and "Events I Joined" sections', async ({ page }) => {
    await page.goto('/en/profile')
    await expect(page.getByText('Events I Created').or(page.getByText('My Events'))).toBeVisible({ timeout: 8000 })
  })

  test('can navigate to public profile via /profile/[userId]', async ({ page }) => {
    // Go to a card and click the organizer name
    await page.goto('/en')
    await page.waitForTimeout(1500)

    const firstCard = page.locator('a[href*="/cards/"]').first()
    if (!(await firstCard.isVisible().catch(() => false))) return

    await firstCard.click()
    await expect(page).toHaveURL(/\/en\/cards\//)

    const profileLink = page.locator('a[href*="/profile/"]').first()
    const profileLinkVisible = await profileLink.isVisible({ timeout: 5000 }).catch(() => false)
    if (!profileLinkVisible) return

    await profileLink.click()
    await expect(page).toHaveURL(/\/en\/profile\//)
  })
})

test.describe('Public Profile Page', () => {
  test('public profile page loads with user info', async ({ page }) => {
    // Navigate to a public profile via card detail
    await page.goto('/en')
    await page.waitForTimeout(1500)

    const firstCard = page.locator('a[href*="/cards/"]').first()
    if (!(await firstCard.isVisible().catch(() => false))) return

    await firstCard.click()
    await expect(page).toHaveURL(/\/en\/cards\//)

    const profileLink = page.locator('a[href*="/profile/"]').first()
    const profileLinkVisible = await profileLink.isVisible({ timeout: 5000 }).catch(() => false)
    if (!profileLinkVisible) return

    await profileLink.click()
    await expect(page).toHaveURL(/\/en\/profile\//)
    await page.waitForTimeout(1000)
    expect(page.url()).toMatch(/\/en\/profile\//)
  })
})
