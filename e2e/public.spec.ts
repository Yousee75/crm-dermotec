import { test, expect } from '@playwright/test'

// Public pages — no auth required
test.describe('Public pages', () => {
  test('login page should display form', async ({ page }) => {
    await page.goto('/login')

    // Should see login form
    await expect(page.locator('form')).toBeVisible()
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/mot de passe/i).first()).toBeVisible()
    await expect(
      page.getByRole('button', { name: /connexion|se connecter/i })
    ).toBeVisible()
  })

  test('formations catalogue should be visible', async ({ page }) => {
    await page.goto('/formations')

    // Should show formation catalogue content
    await expect(page.locator('body')).toBeVisible()

    // Look for formation-related content
    const formationText = page.getByText(/formation/i).first()
    await expect(formationText).toBeVisible({ timeout: 10_000 })
  })

  test('pricing page should display plans', async ({ page }) => {
    await page.goto('/pricing')

    // Should show pricing plans
    await expect(page.getByText(/d[eé]couverte/i).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(page.getByText(/pro/i).first()).toBeVisible()

    // Should have CTA buttons
    const ctaButtons = page.getByRole('link', { name: /commencer|essayer|choisir/i })
    expect(await ctaButtons.count()).toBeGreaterThanOrEqual(1)
  })
})
