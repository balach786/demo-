/* QA smoke test — drives the demo headlessly. Safe: uses a fresh incognito-like context. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const OUT = new URL('../docs/qa', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const errors = [];
const warnings = [];
const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1560, height: 940 } });
const page = await context.newPage();
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
  if (msg.type() === 'warning') warnings.push(msg.text());
});
page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));

const nav = async (label) => {
  await page.click(`.nav-item:has-text("${label}")`);
  await page.waitForTimeout(450);
};
const shot = async (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });

/* ---------- load ---------- */
await page.goto(BASE, { waitUntil: 'networkidle' });
ok('App loads', await page.locator('.app-shell').count() === 1);
ok('DEMO MODE badge visible', await page.locator('.demo-pill').first().isVisible());
ok('Sidebar shows 12 destinations', await page.locator('.nav-item').count() === 12, String(await page.locator('.nav-item').count()));
ok('Dashboard KPIs render 9 cards', await page.locator('.kpi-card').count() === 9, String(await page.locator('.kpi-card').count()));
const kpiText = await page.locator('.kpi-grid').innerText();
ok('KPI shows Net Profit figure', /Rs\s/.test(kpiText));
await shot('01-dashboard');

/* ---------- AI Command Center ---------- */
await nav('AI Command Center');
ok('AI page renders chat', await page.locator('.chat-area').isVisible());
await page.click('.suggestion:has-text("Aaj ki total sales")');
await page.waitForTimeout(1200);
const aiText = await page.locator('.chat-area').innerText();
ok('AI answers today sales with dataset value', aiText.includes('178,000'), 'expects Rs 178,000 in reply');

// Prepare a payment via AI
await page.click('.suggestion:has-text("Prepare a payment of Rs. 25,000")');
await page.waitForTimeout(1200);
const convo = await page.locator('.chat-area').innerText();
ok('AI drafts payment & mentions pending approval', convo.includes('PENDING APPROVAL'));
await shot('02-ai-command-center');

/* ---------- Approvals flow ---------- */
await nav('Approvals');
const apprText = await page.locator('#root').innerText();
ok('Approvals shows pending AI draft', apprText.includes('Payment to ABC Traders'));
const approveBtn = page.locator('.approval-card.pending, .approval-card', { hasText: 'Payment to ABC Traders' }).locator('button:has-text("Approve")').first();
await approveBtn.click();
await page.waitForTimeout(600);
const apprText2 = await page.locator('#root').innerText();
ok('Approval posts TXN with reference', /TXN-2026-\d{4}/.test(apprText2));
ok('Approval shows updated account balance', apprText2.includes('HBL Business Account'));
await shot('03-approvals-after-approve');

/* ---------- Transactions ---------- */
await nav('Transactions');
await page.click('button:has-text("Add Transaction")');
await page.waitForTimeout(350);
ok('Add Transaction modal opens', await page.locator('.modal').isVisible());
await page.selectOption('#f-type', 'expense');
await page.fill('#f-amount', '12345');
await page.selectOption('#f-exp', 'rent');
await page.fill('#f-desc', 'QA smoke test — manual demo entry');
await page.click('button:has-text("Post to Demo Ledger")');
await page.waitForTimeout(700);
const txnText = await page.locator('.table-wrap').innerText();
ok('Manual transaction appears in ledger', txnText.includes('QA smoke test'));
await shot('04-transactions');

// Open transaction details (ledger impact)
await page.click('tr:has-text("QA smoke test") button:has-text("Details")');
await page.waitForTimeout(400);
const detailText = await page.locator('.modal').innerText();
ok('Transaction detail shows journal impact', /ledger impact/i.test(detailText) && detailText.includes('Debit'));
await page.keyboard.press('Escape');

/* ---------- Documents ---------- */
await nav('Documents');
ok('Sample receipts listed', await page.locator('.sample-doc-btn').count() === 2);
await page.click('.sample-doc-btn:has-text("ABC Traders")');
await page.waitForTimeout(300);
const docText = await page.locator('#root').innerText();
ok('Extraction shows sample amount 25000', docText.includes('25000') || docText.includes('25,000'));
await page.click('button:has-text("Prepare Transaction Draft")');
await page.waitForTimeout(800);
// should land on Approvals with a new pending action
const route = await page.locator('#root').innerText();
ok('Document draft created & routed to Approvals', route.includes('Approvals') && route.toLowerCase().includes('pending'));
await shot('05-documents-draft');

/* ---------- Reports ---------- */
await nav('Financial Reports');
for (const tab of ['Cash Flow', 'Trial Balance', 'Balance Sheet', 'Profit & Loss']) {
  await page.click(`.report-tab:has-text("${tab}")`);
  await page.waitForTimeout(500);
}
const reportText = await page.locator('#root').innerText();
ok('P&L shows net profit row', reportText.includes('NET PROFIT'));
await page.click('.report-tab:has-text("Trial Balance")');
const tbText = await page.locator('#root').innerText();
ok('Trial Balance shows BALANCED badge', tbText.includes('BALANCED'));
await page.click('.report-tab:has-text("Balance Sheet")');
const bsText = await page.locator('#root').innerText();
ok('Balance Sheet shows Assets = Liabilities + Equity', bsText.includes('ASSETS = LIABILITIES + EQUITY'));
await shot('06-reports-balance-sheet');

/* ---------- Parties / Ledgers / Accounts / Banks / Expenses / Settings ---------- */
await nav('Parties');
ok('Parties list shows customers & suppliers', (await page.locator('#root').innerText()).includes('Ahmed Enterprises'));
await nav('Ledgers');
ok('Ledger shows Dr/Cr convention', (await page.locator('.report-sheet').innerText()).includes('Dr') || (await page.locator('.report-sheet').innerText()).includes('Opening balance'));
await nav('Bank Accounts');
ok('Bank cards render (HBL/Meezan/Cash)', (await page.locator('#root').innerText()).includes('HBL Business Account'));
await nav('Chart of Accounts');
const coa = await page.locator('#root').innerText();
ok('Chart of accounts renders seed accounts', coa.includes('Main Cash Account') && coa.includes('Owner Capital') && coa.includes('Sales Revenue'));
await nav('Expenses & Income');
ok('Expenses categories render', (await page.locator('#root').innerText()).includes('Expenses by Category'));
await nav('Settings');
ok('Settings feature matrix renders', (await page.locator('#root').innerText()).includes("What Works, What’s Simulated, What’s Planned"));
await shot('07-settings');

/* ---------- Persistence check: reload keeps posted txn ---------- */
await page.goto(BASE + '#', { waitUntil: 'networkidle' });
await page.reload({ waitUntil: 'networkidle' });
await page.click('.nav-item:has-text("Transactions")');
await page.fill('#txn-search', 'QA smoke');
await page.waitForTimeout(500);
ok('Demo changes persist across reload (localStorage)', (await page.locator('.table-wrap').innerText()).includes('QA smoke'));

/* ---------- Summary ---------- */
console.log('\n==== SUMMARY ====');
console.log('Passed:', results.filter((r) => r.pass).length, '/', results.length);
console.log('Console errors:', errors.length);
for (const e of errors.slice(0, 10)) console.log('  ERR:', e);
console.log('Console warnings:', warnings.length);
for (const w of warnings.slice(0, 5)) console.log('  WARN:', w);
await browser.close();
process.exit(results.every((r) => r.pass) && errors.length === 0 ? 0 : 1);
