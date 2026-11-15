// route-close.spec.ts — end-to-end checks for route-aware overlays and client-side links after
// the router-agnostic RouteProvider change (useRouteClose and NotFoundPage read the pathname and
// Link from RouteProvider; the showcase root layout mounts NextRouteAdapter).
//
// 1-2. Under the lg breakpoint the AppShell sidebar is a drawer with closeOnRouteChange. A
//      client-side pathname change closes it, with no page reload.
// 3.   Changing only the query string is not a pathname change, so an open drawer stays open.
// 4.   NotFoundPage's home link navigates client-side through the provider's Link: no full page
//      load. A marker on window survives a client-side navigation and is lost on a reload.
//
// Runs against the production build like the rest of the suite (playwright.config.ts).

import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 800, height: 900 } });

const drawer = (page: Page) => page.getByRole('dialog');

async function openSidebar(page: Page) {
  await page.getByRole('button', { name: 'Open sidebar' }).click();
  await expect(drawer(page)).toBeVisible();
}

async function markWindow(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __routeCloseMarker?: number }).__routeCloseMarker = 1;
  });
}

async function markerSurvived(page: Page) {
  return page.evaluate(() => (window as unknown as { __routeCloseMarker?: number }).__routeCloseMarker === 1);
}

test('a client-side pathname change closes the open drawer', async ({ page }) => {
  await page.goto('/');
  await openSidebar(page);
  await markWindow(page);

  // The showcase sidebar (AppSidebar without renderLink) renders plain anchors, so clicking one is
  // a full page load and proves nothing about route close. Next's App Router turns
  // history.pushState into a client-side navigation: the pathname changes without a reload.
  await page.evaluate(() => window.history.pushState(null, '', '/button'));

  await expect(page).toHaveURL(/\/button$/);
  await expect(drawer(page)).toBeHidden();
  expect(await markerSurvived(page)).toBe(true);
});

test('changing only the query string leaves an open drawer open', async ({ page }) => {
  await page.goto('/button');
  await openSidebar(page);
  await markWindow(page);

  // Next's App Router treats history.pushState as a client-side navigation: the search params
  // change, the pathname does not.
  await page.evaluate(() => window.history.pushState(null, '', '?layout=variant'));
  await expect(page).toHaveURL(/\/button\?layout=variant$/);

  await expect(drawer(page)).toBeVisible();
  expect(await markerSurvived(page)).toBe(true);
});

test('the NotFoundPage home link navigates without a full page load', async ({ page }) => {
  await page.goto('/theme/common/not-found');
  await markWindow(page);
  const navigationsBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length);

  await page.getByRole('link', { name: 'Ana Sayfa' }).click();

  await expect(page).toHaveURL(/\/$/);
  expect(await markerSurvived(page)).toBe(true);
  expect(await page.evaluate(() => performance.getEntriesByType('navigation').length)).toBe(navigationsBefore);
});
