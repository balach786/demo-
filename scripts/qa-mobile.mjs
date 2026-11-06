import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
// sidebar hidden off-canvas; hamburger visible?
const burgerVisible = await page.locator('.sidebar-toggle').isVisible();
console.log('sidebar toggle visible at 420px:', burgerVisible);
// horizontal overflow check
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('horizontal overflow:', overflow);
// open sidebar
await page.locator('.sidebar-toggle').click();
await page.waitForTimeout(300);
console.log('sidebar open:', await page.locator('.sidebar.open').count());
// navigate to AI on mobile
await page.locator('.sidebar.open .nav-item:has-text("AI Command Center")').click();
await page.waitForTimeout(400);
const aiVisible = await page.locator('.chat-area').isVisible();
console.log('AI chat visible on mobile:', aiVisible);
const overflowAfter = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log('horizontal overflow after nav:', overflowAfter);
await page.screenshot({ path: 'docs/qa/11-mobile.png', fullPage: true });
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
process.exit(errors.length ? 1 : 0);
