import { test as base } from '@playwright/test';

export { expect, type Page, type Locator } from '@playwright/test';

/** Standard-Test: Startanimation gilt als gesehen, damit die Profile sofort erscheinen. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => sessionStorage.setItem('ente-intro', '1'));
    await use(page);
  },
});
