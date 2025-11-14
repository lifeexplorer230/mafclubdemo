import { test, expect } from '@playwright/test';

/**
 * CRITICAL E2E TEST: Player Page
 * Phase 0.2: Критические E2E тесты
 *
 * Тестирует страницу статистики игрока
 */

const BASE_URL = process.env.BASE_URL || 'https://mafclubscore.vercel.app';

test.describe('Player Page @critical', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу игрока с ID=1 (должен существовать в любой базе с данными)
    await page.goto(`${BASE_URL}/player.html?id=1`);
  });

  test('should load player page with player ID', async ({ page }) => {
    // Проверяем что страница загрузилась
    await page.waitForSelector('.container', { timeout: 10000 });

    // Проверяем наличие контента
    const content = page.locator('#content');
    await expect(content).toBeVisible();
  });

  test('should display player name', async ({ page }) => {
    // Ждём загрузки имени игрока
    await page.waitForSelector('.player-name', { timeout: 10000 });

    // Проверяем что имя не пустое
    const playerName = await page.textContent('.player-name');
    expect(playerName).toBeTruthy();
    expect(playerName.trim().length).toBeGreaterThan(0);
  });

  test('should display statistics cards', async ({ page }) => {
    // Ждём загрузки статистики
    await page.waitForSelector('.stat-card', { timeout: 10000 });

    // Проверяем что есть несколько stat-карточек (минимум 3)
    const statCards = page.locator('.stat-card');
    const count = await statCards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should display stat values in cards', async ({ page }) => {
    // Ждём загрузки
    await page.waitForSelector('.stat-value', { timeout: 10000 });

    // Проверяем что есть хотя бы одна карточка со значением
    const statValues = page.locator('.stat-value');
    const firstValue = await statValues.first().textContent();
    expect(firstValue).toBeTruthy();
  });

  test('should have navigation link to rating', async ({ page }) => {
    // Проверяем наличие ссылки на главную (рейтинг)
    const ratingLink = page.locator('a[href="rating.html"]');
    await expect(ratingLink).toBeVisible();

    // Проверяем текст ссылки
    const linkText = await ratingLink.textContent();
    expect(linkText).toContain('Главная');
  });

  test('should display recent games section', async ({ page }) => {
    // Ждём загрузки секции последних игр
    await page.waitForSelector('.section-title', { timeout: 10000 });

    // Проверяем что есть заголовок секции
    const sectionTitle = await page.locator('.section-title').first().textContent();
    expect(sectionTitle).toBeTruthy();
  });

  test('should display recent games table', async ({ page }) => {
    // Ждём загрузки таблицы
    await page.waitForSelector('.recent-games-table', { timeout: 10000 });

    // Проверяем что таблица видна
    const table = page.locator('.recent-games-table');
    await expect(table).toBeVisible();
  });

  test('should have table headers in recent games', async ({ page }) => {
    // Ждём загрузки таблицы
    await page.waitForSelector('.recent-games-table th', { timeout: 10000 });

    // Проверяем что есть хотя бы один заголовок
    const headers = page.locator('.recent-games-table th');
    const count = await headers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should handle missing player ID gracefully', async ({ page }) => {
    // Переходим на страницу БЕЗ параметра ID
    await page.goto(`${BASE_URL}/player.html`);

    // Страница должна либо показать ошибку, либо редиректнуть
    // Проверяем что контейнер загрузился (страница не сломалась)
    const container = page.locator('.container');
    await expect(container).toBeVisible({ timeout: 5000 });
  });

  test('should display loading state initially', async ({ page }) => {
    // При первой загрузке может быть состояние загрузки
    // Проверяем что страница имеет контейнер для контента
    const content = page.locator('#content');
    await expect(content).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Player Page - Navigation @critical', () => {
  test('should navigate from rating to player page', async ({ page }) => {
    // Переходим на рейтинг
    await page.goto(`${BASE_URL}/rating.html`);

    // Ждём загрузки таблицы
    await page.waitForSelector('.rating-table', { timeout: 10000 });

    // Кликаем на первого игрока
    const firstPlayerLink = page.locator('.rating-table tbody tr:first-child .player-name a');

    // Проверяем что ссылка существует
    if (await firstPlayerLink.count() > 0) {
      await firstPlayerLink.click();

      // Проверяем что попали на player.html
      await page.waitForURL('**/player.html?id=*', { timeout: 5000 });
      expect(page.url()).toContain('player.html');
      expect(page.url()).toContain('id=');
    }
  });

  test('should have clickable game links in recent games', async ({ page }) => {
    // Переходим на страницу игрока
    await page.goto(`${BASE_URL}/player.html?id=1`);

    // Ждём загрузки таблицы игр
    await page.waitForSelector('.recent-games-table', { timeout: 10000 });

    // Проверяем что есть ссылки на игры (могут быть)
    const gameLinks = page.locator('.recent-games-table a.clickable-link');

    if (await gameLinks.count() > 0) {
      // Проверяем что у первой ссылки есть href
      const firstHref = await gameLinks.first().getAttribute('href');
      expect(firstHref).toBeTruthy();
    }
  });
});
