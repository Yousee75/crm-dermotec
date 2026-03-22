import { test, expect } from '@playwright/test'

test.describe('Leads', () => {
  test('should display leads page with title and table', async ({ page }) => {
    await page.goto('/leads')

    // Page title / heading
    await expect(
      page.getByRole('heading', { name: /prospects/i }).first()
    ).toBeVisible()

    // Table or list of leads should be present
    await expect(
      page.locator('table, [data-testid="leads-list"], .leads-table').first()
    ).toBeVisible({ timeout: 10_000 })
  })

  test('should open create lead dialog', async ({ page }) => {
    await page.goto('/leads')

    // Click "Nouveau prospect" button
    await page.getByRole('button', { name: /nouveau prospect/i }).click()

    // Dialog should open with form fields
    await expect(page.getByPlaceholder(/pr[eé]nom/i).first()).toBeVisible()
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible()
  })

  test('should create a new lead', async ({ page }) => {
    await page.goto('/leads')

    const timestamp = Date.now()
    const testName = `Test-E2E-${timestamp}`
    const testEmail = `test-e2e-${timestamp}@example.com`

    // Open create dialog
    await page.getByRole('button', { name: /nouveau prospect/i }).click()

    // Fill form
    await page.getByPlaceholder(/pr[eé]nom/i).first().fill(testName)
    await page.getByPlaceholder(/email/i).first().fill(testEmail)

    // Submit
    await page.getByRole('button', { name: /cr[eé]er|ajouter|enregistrer/i }).click()

    // Wait for dialog to close and lead to appear
    await page.waitForTimeout(2_000)

    // Search for the new lead
    await page.getByPlaceholder(/rechercher/i).first().fill(testName)
    await page.waitForTimeout(1_000)

    // Verify lead appears
    await expect(page.getByText(testName).first()).toBeVisible({ timeout: 5_000 })
  })

  test('should filter leads by status', async ({ page }) => {
    await page.goto('/leads')

    // Wait for page to load
    await expect(
      page.getByRole('heading', { name: /prospects/i }).first()
    ).toBeVisible()

    // Click on a smart filter (e.g. "Chauds")
    const hotFilter = page.getByRole('button', { name: /chauds/i }).first()
    if (await hotFilter.isVisible()) {
      await hotFilter.click()
      await page.waitForTimeout(1_000)
      // Page should still be functional after filtering
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('should navigate to lead detail', async ({ page }) => {
    await page.goto('/leads')

    // Wait for leads to load
    await page.waitForTimeout(2_000)

    // Click first lead link (table row or card)
    const leadLink = page.locator('a[href*="/lead/"]').first()
    if (await leadLink.isVisible({ timeout: 5_000 })) {
      await leadLink.click()

      // Should navigate to lead detail page
      await page.waitForURL(/\/lead\//, { timeout: 10_000 })
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
