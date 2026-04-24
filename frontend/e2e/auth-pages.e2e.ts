import { expect, test } from '@playwright/test';

test.describe('Auth pages', () => {
  test('should render login page', async ({ page }): Promise<void> => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('should render register page', async ({ page }): Promise<void> => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  });
});
