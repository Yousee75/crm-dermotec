import { test as setup, expect } from '@playwright/test'

const authFile = 'e2e/.auth/user.json'

setup('authenticate', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD

  if (!email || !password) {
    throw new Error(
      'Missing PLAYWRIGHT_TEST_EMAIL or PLAYWRIGHT_TEST_PASSWORD env vars. ' +
      'Set them in .env.local or pass them before running tests.'
    )
  }

  // Go to login page
  await page.goto('/login')
  await expect(page.locator('form')).toBeVisible()

  // Fill credentials
  await page.getByPlaceholder(/email/i).fill(email)
  await page.getByPlaceholder(/mot de passe/i).fill(password)

  // Submit
  await page.getByRole('button', { name: /connexion|se connecter/i }).click()

  // Wait for redirect to dashboard (URL no longer contains /login)
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  })

  // Save auth state
  await page.context().storageState({ path: authFile })
})
