import { test, expect } from '@playwright/test';

// ─── Warm up: let Next.js compile on first request ───────────────────────────
test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.close();
});

// ─── Dashboard (/) ──────────────────────────────────────────────────────────

test.describe('Dashboard /', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('renders main page heading', async ({ page }) => {
    await expect(page.getByRole('heading').filter({ hasText: 'Обзор аномалий' })).toBeVisible();
  });

  test('sidebar has all 6 navigation links', async ({ page }) => {
    const nav = page.locator('aside').last();
    for (const label of ['Обзор', 'Тепловая карта', 'Сравнение методов', 'Динамика', 'AI Отчёт', 'Лендинг']) {
      await expect(nav.getByRole('link', { name: label })).toBeVisible();
    }
  });

  test('year selector shows all 5 years (2020–2024)', async ({ page }) => {
    for (const year of ['2020', '2021', '2022', '2023', '2024']) {
      await expect(page.getByRole('button', { name: year })).toBeVisible();
    }
  });

  test('stat cards are rendered after data resolves', async ({ page }) => {
    // Framer-motion staggers cards up to delay=0.3s; use generous timeout
    await expect(page.getByText('Регионов')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Показателей')).toBeVisible({ timeout: 20000 });
    // "Методов детекции" has delay=0.3 in framer-motion — wait for full animation
    await expect(page.getByText('Методов детекции')).toBeVisible({ timeout: 20000 });
  });

  test('3D map container is rendered', async ({ page }) => {
    // Canvas exists in DOM even if overflow-hidden makes it "hidden" to Playwright
    await expect(page.locator('[data-engine="three.js r183"]').first()).toBeAttached({ timeout: 15000 });
  });

  test('3D map legend label is present', async ({ page }) => {
    await expect(page.getByText('ЮФО + СКФО — 3D Карта аномалий')).toBeAttached({ timeout: 10000 });
  });

  test('regions table or skeleton is present', async ({ page }) => {
    await expect(
      page.locator('table, [class*="animate-pulse"]').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('year selector switches active year label', async ({ page }) => {
    await page.getByRole('button', { name: '2022' }).click();
    await expect(page.getByText('за 2022 год')).toBeVisible();
    await page.getByRole('button', { name: '2024' }).click();
    await expect(page.getByText('за 2024 год')).toBeVisible();
  });
});

// ─── Heatmap (/analysis/heatmap) ────────────────────────────────────────────

test.describe('Heatmap /analysis/heatmap', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis/heatmap', { waitUntil: 'domcontentloaded' });
  });

  test('page heading renders', async ({ page }) => {
    await expect(
      page.getByRole('heading').filter({ hasText: /тепловая карта/i })
    ).toBeVisible();
  });

  test('main content area is present', async ({ page }) => {
    // Main has the chart content; sidebar SVGs are aria-hidden
    await expect(page.locator('main, [role="main"]').first()).toBeAttached();
  });

  test('page subtitle with year info is visible', async ({ page }) => {
    // Scoped to content area to avoid matching hidden mobile sidebar links
    await expect(
      page.locator('main p, main span, h2, [class*="subtitle"], [class*="text-slate"]')
        .filter({ hasText: /показател|регион|тепловая|анализ|z.score/i })
        .first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── Comparison (/analysis/comparison) ──────────────────────────────────────

test.describe('Comparison /analysis/comparison', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis/comparison', { waitUntil: 'domcontentloaded' });
  });

  test('page heading renders', async ({ page }) => {
    await expect(
      page.getByRole('heading').filter({ hasText: /сравнение методов/i })
    ).toBeVisible();
  });

  test('page content area mounts', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeAttached();
  });
});

// ─── Timeline (/analysis/timeline) ──────────────────────────────────────────

test.describe('Timeline /analysis/timeline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis/timeline', { waitUntil: 'domcontentloaded' });
  });

  test('page heading renders', async ({ page }) => {
    await expect(
      page.getByRole('heading').filter({ hasText: /динамика|timeline/i })
    ).toBeVisible();
  });

  test('page content area mounts', async ({ page }) => {
    await expect(page.locator('main, [role="main"]').first()).toBeAttached();
  });
});

// ─── Report (/report) ───────────────────────────────────────────────────────

test.describe('AI Report /report', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/report', { waitUntil: 'domcontentloaded' });
  });

  test('page heading renders', async ({ page }) => {
    await expect(
      page.getByRole('heading').filter({ hasText: /отчёт|report/i })
    ).toBeVisible();
  });

  test('generate button is present', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /Генерир|Сформир|Создать|Generate/i }).first()
    ).toBeVisible();
  });

  test('year selector is visible on report page', async ({ page }) => {
    await expect(page.getByRole('button', { name: '2024' })).toBeVisible();
  });
});

// ─── Landing (/landing) ─────────────────────────────────────────────────────

test.describe('Landing /landing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing', { waitUntil: 'domcontentloaded' });
  });

  test('no sidebar rendered on landing page', async ({ page }) => {
    await expect(page.locator('aside')).toHaveCount(0);
  });

  test('hero heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('3D globe Three.js canvas is attached to DOM', async ({ page }) => {
    // R3F canvas renders inside overflow-hidden — check DOM presence not visibility
    await expect(
      page.locator('[data-engine="three.js r183"]').first()
    ).toBeAttached({ timeout: 15000 });
  });

  test('CurtainThemeToggle button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /тема|theme|светлая|тёмная/i }).first()
    ).toBeVisible();
  });

  test('navbar link back to app is present', async ({ page }) => {
    await expect(
      page.getByRole('link', { name: /открыть|app|dashboard|перейти/i }).first()
    ).toBeVisible();
  });
});

// ─── Navigation flow ────────────────────────────────────────────────────────

test.describe('Navigation flow', () => {
  test('sidebar: / → heatmap', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('aside').last().getByRole('link', { name: 'Тепловая карта' }).click();
    await expect(page).toHaveURL(/heatmap/);
    await expect(page.getByRole('heading').filter({ hasText: /тепловая карта/i })).toBeVisible();
  });

  test('sidebar: / → comparison', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('aside').last().getByRole('link', { name: 'Сравнение методов' }).click();
    await expect(page).toHaveURL(/comparison/);
    await expect(page.getByRole('heading').filter({ hasText: /сравнение/i })).toBeVisible();
  });

  test('sidebar: / → timeline', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('aside').last().getByRole('link', { name: 'Динамика' }).click();
    await expect(page).toHaveURL(/timeline/);
    await expect(page.getByRole('heading').filter({ hasText: /динамика/i })).toBeVisible();
  });

  test('sidebar: / → report', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('aside').last().getByRole('link', { name: 'AI Отчёт' }).click();
    await expect(page).toHaveURL(/report/);
    await expect(page.getByRole('heading').filter({ hasText: /отчёт/i })).toBeVisible();
  });

  test('sidebar: / → landing (full-page, no sidebar)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('aside').last().getByRole('link', { name: 'Лендинг' }).click();
    await expect(page).toHaveURL(/landing/);
    await expect(page.locator('aside')).toHaveCount(0);
  });
});
