// spec: specs/p1-plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { requireEnv } from '../utils/env';

// 로그인 화면: 호스트와 상관없이 경로가 루트(/)인 URL (쿼리·해시 없음)
const LOGIN_PAGE_URL = /^https?:\/\/[^/]+\/$/;

test.describe('로그인', () => {
  test('[TC-LOGIN-001] 유효한 계정으로 로그인하면 상품 목록으로 이동', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. 로그인 화면 접속
    await loginPage.goto();
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.loginButton).toBeVisible();

    // 2. 유효한 계정으로 로그인
    await loginPage.login(requireEnv('SAUCE_USERNAME'), requireEnv('SAUCE_PASSWORD'));
    await expect(page).toHaveURL(/\/inventory\.html$/);
    await expect(page.getByTestId('inventory-item')).toHaveCount(6);
    await expect(loginPage.errorMessage).not.toBeVisible();
  });

  test('[TC-LOGIN-004] 잘못된 비밀번호로 로그인하면 에러 메시지 표시', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. 로그인 화면 접속
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();

    // 2. 잘못된 비밀번호로 로그인
    await loginPage.login(requireEnv('SAUCE_USERNAME'), 'wrong_password');
    await expect(loginPage.errorMessage).toHaveText(
      'Epic sadface: Username and password do not match any user in this service',
    );
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });

  test('[TC-LOGIN-011] 잠긴 계정(locked_out_user)으로 로그인하면 잠금 안내 표시', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. 로그인 화면 접속
    await loginPage.goto();
    await expect(loginPage.loginButton).toBeVisible();

    // 2. 잠긴 계정으로 로그인
    await loginPage.login('locked_out_user', requireEnv('SAUCE_PASSWORD'));
    await expect(loginPage.errorMessage).toHaveText('Epic sadface: Sorry, this user has been locked out.');
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
  });

  test('[TC-LOGIN-013] 비로그인 상태에서 /inventory.html 직접 접근 시 로그인 화면으로 차단', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // 1. 새 컨텍스트에서 시작 (로그인 화면을 거치지 않음)
    // 2. /inventory.html 직접 접속
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(LOGIN_PAGE_URL);
    await expect(page.getByTestId('inventory-item')).toHaveCount(0);
    await expect(loginPage.errorMessage).toHaveText(
      "Epic sadface: You can only access '/inventory.html' when you are logged in.",
    );
  });
});
