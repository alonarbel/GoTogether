import { test, expect } from '@playwright/test'

test.describe('Home / Explore page', () => {
  test('page loads with correct title', async ({ page }) => {
    await page.goto('/en')
    await expect(page).toHaveTitle(/GoTogether/)
  })

  test('filter bar is visible with type buttons', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('All').first()).toBeVisible()
    await expect(page.getByText('Trips')).toBeVisible()
    await expect(page.getByText('Sports')).toBeVisible()
    await expect(page.getByText('Food')).toBeVisible()
  })

  test('clicking a type filter keeps you on home page', async ({ page }) => {
    await page.goto('/en')
    await page.getByText('Trips').click()
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/en')
  })

  test('"Almost Full" filter is clickable', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('Almost Full')).toBeVisible()
    await page.getByText('Almost Full').click()
    await page.waitForTimeout(300)
    expect(page.url()).toContain('/en')
  })

  test('date range "From" filter is visible', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('From').first()).toBeVisible()
  })

  test('shows event cards or empty state', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1500) // wait for data fetch

    const hasCards = (await page.locator('a[href*="/cards/"]').count()) > 0
    const hasEmpty = await page.getByText('No cards found').isVisible().catch(() => false)
    expect(hasCards || hasEmpty).toBeTruthy()
  })

  test('card links navigate to card detail page', async ({ page }) => {
    await page.goto('/en')
    await page.waitForTimeout(1500)

    const firstCard = page.locator('a[href*="/cards/"]').first()
    const cardExists = await firstCard.isVisible().catch(() => false)
    if (!cardExists) return // no cards in DB — skip

    await firstCard.click()
    await expect(page).toHaveURL(/\/en\/cards\//)
  })

  test('navbar shows Sign In when logged out', async ({ page }) => {
    await page.goto('/en')
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('navbar logo links to home', async ({ page }) => {
    await page.goto('/en')
    await page.getByText('GoTogether').first().click()
    await expect(page).toHaveURL(/\/en($|\/)/)
  })
})
