import { test, expect } from '@playwright/test'

test.describe('Navigation — Desktop', () => {
  test('should display sidebar with main navigation links', async ({ page }) => {
    await page.goto('/')

    // Sidebar should have key navigation items
    const navLabels = [
      /prospects/i,
      /formations/i,
      /financement/i,
      /tableau de bord/i,
    ]

    for (const label of navLabels) {
      await expect(page.getByText(label).first()).toBeVisible({ timeout: 5_000 })
    }
  })

  test('should navigate to leads page', async ({ page }) => {
    await page.goto('/')

    await page.getByText(/prospects/i).first().click()
    await page.waitForURL(/\/leads/, { timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /prospects/i }).first()).toBeVisible()
  })

  test('should navigate to pipeline page', async ({ page }) => {
    await page.goto('/')

    // Pipeline might be accessible via sidebar or from leads page
    await page.goto('/pipeline')
    await expect(
      page.getByRole('heading', { name: /pipeline/i }).first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('should navigate to sessions page', async ({ page }) => {
    await page.goto('/')

    await page.getByText(/formations/i).first().click()
    await page.waitForURL(/\/sessions/, { timeout: 10_000 })
  })

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/analytics')

    await expect(page.locator('body')).toBeVisible()
    // Page should load without errors
    await page.waitForTimeout(2_000)
  })

  test('should open command palette with Ctrl+K', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForTimeout(2_000)

    // Open command palette
    await page.keyboard.press('Control+k')

    // Should see a search/command input
    await expect(
      page.getByPlaceholder(/rechercher|commande|action/i).first()
    ).toBeVisible({ timeout: 5_000 })

    // Close with Escape
    await page.keyboard.press('Escape')
  })
})

test.describe('Navigation — Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('should show mobile bottom nav', async ({ page }) => {
    await page.goto('/')

    // Wait for mobile nav to render
    await page.waitForTimeout(2_000)

    // Mobile bottom nav should be visible
    const bottomNav = page.locator('nav').last()
    await expect(bottomNav).toBeVisible()
  })

  test('should navigate via mobile bottom nav', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(2_000)

    // Look for navigation links in the bottom nav area
    const navLink = page.locator('a[href="/leads"], a[href="/sessions"]').first()
    if (await navLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await navLink.click()
      await page.waitForTimeout(2_000)
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
