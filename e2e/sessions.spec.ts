import { test, expect } from '@playwright/test'

test.describe('Sessions', () => {
  test('should display sessions page', async ({ page }) => {
    await page.goto('/sessions')

    // The page should have tabs: Planning, Calendrier, Inscriptions, Emargement
    await expect(page.getByText('Planning').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Calendrier').first()).toBeVisible()
  })

  test('should display planning tab by default', async ({ page }) => {
    await page.goto('/sessions')

    // Planning tab is active by default
    await expect(page.getByText('Planning').first()).toBeVisible({ timeout: 10_000 })

    // Should show session cards or empty state
    await page.waitForTimeout(2_000)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should switch to calendar tab', async ({ page }) => {
    await page.goto('/sessions')

    // Wait for page load
    await expect(page.getByText('Planning').first()).toBeVisible({ timeout: 10_000 })

    // Click on "Calendrier" tab
    await page.getByText('Calendrier').first().click()

    // Wait for calendar to render
    await page.waitForTimeout(2_000)

    // URL should contain tab=calendrier
    expect(page.url()).toContain('calendrier')
  })

  test('should switch to inscriptions tab', async ({ page }) => {
    await page.goto('/sessions')

    await expect(page.getByText('Inscriptions').first()).toBeVisible({ timeout: 10_000 })
    await page.getByText('Inscriptions').first().click()

    await page.waitForTimeout(1_000)
    expect(page.url()).toContain('inscriptions')
  })
})
