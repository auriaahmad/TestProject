import { test, expect } from '@playwright/test';

test.describe('Seating Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for venue data to load
    await page.waitForSelector('svg[role="img"]');
  });

  test('renders the venue name and seat count', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Metropolis Arena');
    await expect(page.locator('text=/\\d+ of \\d+ seats available/')).toBeVisible();
  });

  test('renders the stage and section labels', async ({ page }) => {
    await expect(page.locator('text=STAGE')).toBeVisible();
    await expect(page.locator('text=VIP FLOOR')).toBeVisible();
  });

  test('renders seats as SVG circles', async ({ page }) => {
    const seats = page.locator('circle[data-seat-id]');
    const count = await seats.count();
    expect(count).toBeGreaterThan(0);
  });

  test('shows legend with all status types', async ({ page }) => {
    await expect(page.getByText('Available', { exact: true })).toBeVisible();
    await expect(page.getByText('Selected', { exact: true })).toBeVisible();
    await expect(page.getByText('Reserved', { exact: true })).toBeVisible();
    await expect(page.getByText('Sold', { exact: true })).toBeVisible();
    await expect(page.getByText('Held', { exact: true })).toBeVisible();
  });
});

test.describe('Seat Selection', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
    // Clear localStorage to start fresh
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('svg[role="img"]');
  });

  test('can select an available seat by clicking', async ({ page }) => {
    // Find an available seat
    const availableSeat = page.locator('circle.seat--available').first();
    await availableSeat.click();

    // Should now show as selected
    await expect(page.locator('circle.seat--selected')).toHaveCount(1);
  });

  test('shows selection summary when seats are selected', async ({ page }) => {
    await expect(page.locator('text=Click available seats to select them')).toBeVisible();

    // Click an available seat
    const seat = page.locator('circle.seat--available').first();
    await seat.click();

    // Summary should now show a seat and total
    await expect(page.locator('text=Selected Seats (1)')).toBeVisible();
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('can deselect a seat by clicking again', async ({ page }) => {
    const seat = page.locator('circle.seat--available').first();
    await seat.click();
    await expect(page.locator('circle.seat--selected')).toHaveCount(1);

    // Click the same seat (now selected)
    const selected = page.locator('circle.seat--selected').first();
    await selected.click();

    await expect(page.locator('circle.seat--selected')).toHaveCount(0);
  });

  test('enforces 8-seat maximum', async ({ page }) => {
    // Select 8 seats
    const seats = page.locator('circle.seat--available');
    for (let i = 0; i < 8; i++) {
      await seats.nth(i).click();
      // Small delay to let state update
      await page.waitForTimeout(100);
    }

    await expect(page.locator('circle.seat--selected')).toHaveCount(8);
    await expect(page.locator('text=8/8')).toBeVisible();

    // 9th click should show limit notification
    await seats.nth(8).click();
    await expect(page.locator('text=Maximum of 8 seats can be selected')).toBeVisible();
    await expect(page.locator('circle.seat--selected')).toHaveCount(8);
  });

  test('persists selection across page reload', async ({ page }) => {
    const seat = page.locator('circle.seat--available').first();
    await seat.click();
    await expect(page.locator('circle.seat--selected')).toHaveCount(1);

    // Wait for localStorage to be written
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForSelector('svg[role="img"]');
    await page.waitForTimeout(500);

    // Selection should persist
    await expect(page.locator('circle.seat--selected')).toHaveCount(1);
  });
});

test.describe('Tooltip', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
  });

  test('shows tooltip on seat hover', async ({ page }) => {
    const seat = page.locator('circle.seat--available').first();
    await seat.hover();

    await expect(page.locator('[role="tooltip"]')).toBeVisible();
    await expect(page.locator('text=Price Tier')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('hides tooltip when mouse leaves seat', async ({ page }) => {
    const seat = page.locator('circle.seat--available').first();
    await seat.hover();
    await expect(page.locator('[role="tooltip"]')).toBeVisible();

    // Move mouse away
    await page.mouse.move(0, 0);
    await expect(page.locator('[role="tooltip"]')).toBeHidden();
  });
});

test.describe('Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
  });

  test('can navigate seats with Tab and arrow keys', async ({ page }) => {
    // Tab until we reach a seat inside the SVG
    const firstSeat = page.locator('circle[tabindex="0"]').first();
    await firstSeat.focus();

    // First focusable seat should have focus
    await expect(firstSeat).toBeFocused();

    // Arrow right should move focus to a different seat
    await page.keyboard.press('ArrowRight');
    const focused = page.locator('circle:focus');
    await expect(focused).toHaveCount(1);
  });

  test('can select a seat with Enter key', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('svg[role="img"]');

    // Focus the first available seat directly
    const firstSeat = page.locator('circle[tabindex="0"]').first();
    await firstSeat.focus();

    // Press Enter to select
    await page.keyboard.press('Enter');

    await expect(page.locator('circle.seat--selected')).toHaveCount(1);
  });
});

test.describe('Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
  });

  test('toggles dark mode on button click', async ({ page }) => {
    const html = page.locator('html');

    // Should start in light mode
    await expect(html).not.toHaveClass(/dark/);

    // Click dark mode toggle
    const darkToggle = page.locator('button[aria-label*="dark mode"]');
    await darkToggle.click();

    await expect(html).toHaveClass(/dark/);

    // Click again to go back to light
    const lightToggle = page.locator('button[aria-label*="light mode"]');
    await lightToggle.click();

    await expect(html).not.toHaveClass(/dark/);
  });

  test('persists dark mode preference', async ({ page }) => {
    const darkToggle = page.locator('button[aria-label*="dark mode"]');
    await darkToggle.click();

    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload
    await page.reload();
    await page.waitForSelector('svg[role="img"]');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});

test.describe('Heat Map', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
  });

  test('toggles heat map mode', async ({ page }) => {
    const wrapper = page.locator('.seat-map-wrapper, [class*="heatmap"]').first();

    // Click heat map button
    const heatBtn = page.locator('button', { hasText: 'Heat Map' });
    await heatBtn.click();

    // Should show heat map legend
    await expect(page.locator('text=$100')).toBeVisible();
    await expect(page.locator('text=$75')).toBeVisible();
    await expect(page.locator('text=$50')).toBeVisible();

    // The wrapper should have heatmap class
    await expect(page.locator('.heatmap')).toBeVisible();
  });
});

test.describe('Find Adjacent Seats', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('svg[role="img"]');
  });

  test('finds and selects adjacent seats', async ({ page }) => {
    const input = page.locator('input[type="number"]');
    await input.clear();
    await input.fill('3');

    const findBtn = page.locator('button', { hasText: /Find \d+ Seats/ });
    await findBtn.click();

    // Should select 3 seats
    await expect(page.locator('circle.seat--selected')).toHaveCount(3);
    await expect(page.locator('text=Selected Seats (3)')).toBeVisible();
  });

  test('accepts manual number input', async ({ page }) => {
    const input = page.locator('input[type="number"]');
    await input.clear();
    await input.fill('5');

    await expect(input).toHaveValue('5');
  });
});

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');
  });

  test('seats have aria-labels', async ({ page }) => {
    const seat = page.locator('circle[data-seat-id]').first();
    const label = await seat.getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label).toContain('Row');
    expect(label).toContain('Seat');
  });

  test('SVG has accessible role and label', async ({ page }) => {
    const svg = page.locator('svg[role="img"]');
    await expect(svg).toHaveAttribute('aria-label', /Seating map for/);
  });

  test('seats have proper roles', async ({ page }) => {
    const seat = page.locator('circle[data-seat-id]').first();
    await expect(seat).toHaveAttribute('role', 'button');
  });
});

test.describe('Responsive Layout', () => {
  test('stacks layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForSelector('svg[role="img"]');

    // Both map and sidebar should be visible
    await expect(page.locator('svg[role="img"]')).toBeVisible();
    await expect(page.locator('text=Selected Seats')).toBeVisible();
  });
});
