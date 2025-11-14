import { test, expect } from '@playwright/test';

/**
 * CRITICAL E2E TEST: Game Input Page
 * Phase 0.2: Критические E2E тесты
 *
 * Тестирует функциональность ввода игр (требует авторизации)
 */

const BASE_URL = process.env.BASE_URL || 'https://mafclubscore.vercel.app';

test.describe('Game Input Page @critical', () => {
  // Эмулируем авторизацию через localStorage
  test.beforeEach(async ({ page }) => {
    // Устанавливаем флаги авторизации
    await page.addInitScript(() => {
      localStorage.setItem('maf_is_logged_in', 'true');
      localStorage.setItem('maf_username', 'test_operator');
      localStorage.setItem('maf_login_time', new Date().toISOString());
    });

    await page.goto(`${BASE_URL}/game-input.html`);
  });

  test('should load game input page for authorized user', async ({ page }) => {
    // Проверяем что страница загрузилась
    await page.waitForSelector('.container', { timeout: 5000 });

    // Проверяем наличие заголовка
    const heading = page.locator('.header h1');
    await expect(heading).toBeVisible();

    // Проверяем что показано имя оператора
    const headingText = await heading.textContent();
    expect(headingText).toContain('test_operator');

    // Проверяем наличие кнопки выхода
    const logoutBtn = page.locator('a:has-text("Выйти")');
    await expect(logoutBtn).toBeVisible();
  });

  test('should have date input with default today date', async ({ page }) => {
    // Проверяем наличие поля даты
    const dateInput = page.locator('#gameDate');
    await expect(dateInput).toBeVisible();

    // Проверяем что установлена дата
    const dateValue = await dateInput.inputValue();
    expect(dateValue).toBeTruthy();
    expect(dateValue.length).toBe(10); // YYYY-MM-DD format
  });

  test('should have start game button', async ({ page }) => {
    // Проверяем наличие кнопки "Начать ввод игры"
    const startBtn = page.locator('button:has-text("Начать ввод игры")');
    await expect(startBtn).toBeVisible();
  });

  test('should have delete game section', async ({ page }) => {
    // Проверяем наличие секции удаления игр
    await expect(page.locator('#deleteSection')).toBeVisible();

    // Проверяем наличие селектора игр
    await expect(page.locator('#gameToDelete')).toBeVisible();

    // Проверяем наличие кнопки удаления
    const deleteBtn = page.locator('button:has-text("Удалить выбранную игру")');
    await expect(deleteBtn).toBeVisible();
  });

  test('should show game form when start button clicked', async ({ page }) => {
    // Проверяем что форма игры скрыта изначально
    const step2 = page.locator('#step2');
    await expect(step2).toHaveClass(/hidden/);

    // Кликаем "Начать ввод игры"
    await page.click('button:has-text("Начать ввод игры")');

    // Проверяем что форма игры стала видимой
    await expect(step2).not.toHaveClass(/hidden/);

    // Проверяем что появился контейнер с игрой
    await expect(page.locator('#gamesContainer')).toBeVisible();
  });

  test('should generate 10 player input fields', async ({ page }) => {
    // Запускаем ввод игры
    await page.click('button:has-text("Начать ввод игры")');

    // Ждём загрузки формы
    await page.waitForSelector('#gamesContainer', { timeout: 3000 });

    // Проверяем что есть 10 карточек игроков
    const playerCards = page.locator('.player-card');
    await expect(playerCards).toHaveCount(10);

    // Проверяем что у каждого игрока есть поля
    for (let p = 1; p <= 10; p++) {
      await expect(page.locator(`#g1_p${p}_name`)).toBeVisible();
      await expect(page.locator(`#g1_p${p}_role`)).toBeVisible();
      await expect(page.locator(`#g1_p${p}_death`)).toBeVisible();
    }
  });

  test('should have role options for each player', async ({ page }) => {
    // Запускаем ввод игры
    await page.click('button:has-text("Начать ввод игры")');
    await page.waitForSelector('#gamesContainer');

    // Проверяем что в селекторе роли есть все роли
    const roleSelect = page.locator('#g1_p1_role');
    const options = await roleSelect.locator('option').allTextContents();

    expect(options).toContain('Мирный');
    expect(options).toContain('Шериф');
    expect(options).toContain('Мафия');
    expect(options).toContain('Дон');
  });

  test('should have death time options', async ({ page }) => {
    // Запускаем ввод игры
    await page.click('button:has-text("Начать ввод игры")');
    await page.waitForSelector('#gamesContainer');

    // Проверяем опции "когда убит"
    const deathSelect = page.locator('#g1_p1_death');
    const firstOption = await deathSelect.locator('option').first().textContent();

    expect(firstOption).toContain('0'); // Первая опция = жив
  });

  test('should have sheriff checks input field', async ({ page }) => {
    // Запускаем ввод игры
    await page.click('button:has-text("Начать ввод игры")');
    await page.waitForSelector('#gamesContainer');

    // Проверяем наличие поля для проверок шерифа
    const sheriffChecks = page.locator('#g1_sheriff_checks');
    await expect(sheriffChecks).toBeVisible();

    // Проверяем плейсхолдер
    const placeholder = await sheriffChecks.getAttribute('placeholder');
    expect(placeholder).toBe('1,3,5');
  });

  test('should have save and reset buttons', async ({ page }) => {
    // Запускаем ввод игры
    await page.click('button:has-text("Начать ввод игры")');
    await page.waitForSelector('#gamesContainer');

    // Проверяем наличие кнопки сохранения
    const saveBtn = page.locator('button:has-text("Сохранить игру")');
    await expect(saveBtn).toBeVisible();

    // Проверяем наличие кнопки сброса
    const resetBtn = page.locator('button:has-text("Начать заново")');
    await expect(resetBtn).toBeVisible();
  });

  test('should have back link to main page', async ({ page }) => {
    // Проверяем наличие ссылки "Главная"
    const backLink = page.locator('a.back-link[href="index.html"]');
    await expect(backLink).toBeVisible();
    expect(await backLink.textContent()).toContain('Главная');
  });

  test('should have logout button', async ({ page }) => {
    // Находим кнопку выхода
    const logoutBtn = page.locator('a:has-text("Выйти")');
    await expect(logoutBtn).toBeVisible();

    // Проверяем что это ссылка с обработчиком
    const href = await logoutBtn.getAttribute('href');
    expect(href).toBe('#');
  });
});

test.describe('Game Input Page - Unauthorized @critical', () => {
  test('should redirect to login if not authorized', async ({ page }) => {
    // Переходим на страницу БЕЗ установки авторизации
    await page.goto(`${BASE_URL}/game-input.html`);

    // Проверяем что произошёл редирект на login.html
    await page.waitForURL('**/login.html', { timeout: 5000 });
    expect(page.url()).toContain('login.html');
  });
});
