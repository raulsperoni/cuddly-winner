/**
 * UX audit — paragraph editing experience.
 * Produces named, viewport-quality screenshots for UX review.
 *
 * Requires a Django server with the built frontend:
 *   npm run build           (from frontend/)
 *   python manage.py collectstatic --noinput
 *   DEBUG=False python manage.py runserver 127.0.0.1:9000 --noreload
 *
 * Then run: node scripts/visual_audit.mjs  (from project root)
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'screenshots')

const BASE = 'http://127.0.0.1:9000'
const USERNAME = 'raulsperoni'
const PASSWORD = 'testpass123'
const DOC_ID = 10   // 'memoria' — 16 paragraphs, has a seeded pending suggestion

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

// ── helpers ────────────────────────────────────────────────────────────────

async function px(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log(`  ✓ ${name}`)
}

/** Clip-shot a DOM element identified by CSS selector (nth = 0-based index) */
async function el(page, selector, name, nth = 0) {
  // Wait for element to appear in the DOM first
  await page.waitForSelector(selector, { timeout: 10000 })
  const box = await page.evaluate(({ sel, n }) => {
    const els = document.querySelectorAll(sel)
    const el = els[n]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left, y: r.top, width: r.width, height: r.height }
  }, { sel: selector, n: nth })
  if (!box || box.width === 0) throw new Error(`No box for "${selector}" [${nth}] — ${name}`)
  await page.screenshot({ path: path.join(OUT, `${name}.png`), clip: box, fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function login(page) {
  await page.goto(`${BASE}/accounts/login/`, { waitUntil: 'networkidle' })
  const field = page.locator('input[name="login"]').or(page.locator('input[name="username"]'))
  await field.fill(USERNAME)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 })
}

async function goEditor(page) {
  await page.goto(`${BASE}/documents/${DOC_ID}/edit/`, { waitUntil: 'networkidle' })
  // Wait for React to mount and render the block list
  await page.waitForSelector('header', { timeout: 15000 })
  await page.waitForSelector('.group', { timeout: 15000 }).catch(() => null)
  await page.waitForTimeout(500)
}

/** Scroll an element into view then hover it */
async function hoverNth(page, selector, nth = 0) {
  await page.evaluate(({ sel, n }) => {
    const els = document.querySelectorAll(sel)
    const el = els[n]
    if (el) el.scrollIntoView({ block: 'center' })
  }, { sel: selector, n: nth })
  await page.waitForTimeout(100)
  const box = await page.evaluate(({ sel, n }) => {
    const r = document.querySelectorAll(sel)[n]?.getBoundingClientRect()
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null
  }, { sel: selector, n: nth })
  if (box) await page.mouse.move(box.x, box.y)
}

// ── run ────────────────────────────────────────────────────────────────────

const browser = await chromium.launch({ headless: true })

// ── DESKTOP dark ──────────────────────────────────────────────────────────
{
  console.log('\n── Desktop · dark ──')
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await login(page)
  await goEditor(page)

  // 1 · Full editor viewport — document + nav overview
  await px(page, '01_editor_overview')

  // 2 · Just the two-row navbar in editor context
  await el(page, 'header', '02_navbar_editor')

  // 3 · Block list area (scroll-crop to first ~5 paragraphs)
  await el(page, 'main', '03_block_list')

  // Use block index 1 (second block — no pending suggestion) for clean hover/edit demos
  // 4 · Block hovered — AI action buttons visible (clarify / rephrase / condense / expand / ask AI)
  await hoverNth(page, '.group', 1)
  await page.waitForTimeout(300)
  await el(page, '.group', '04_block_hovered_actions', 1)

  // 5 · Block in edit mode (TipTap focused, surface-2 background, save/cancel)
  await page.locator('.group').nth(1).click()
  await page.waitForTimeout(400)
  await el(page, '.group', '05_block_editing', 1)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // 6 · Custom "Ask AI..." instruction form open on block 1
  await hoverNth(page, '.group', 1)
  await page.waitForTimeout(200)
  const askBtn = page.locator('.group').nth(1).locator('button').filter({ hasText: /ask ai/i })
  if (await askBtn.isVisible().catch(() => false)) {
    await askBtn.click({ force: true })
    await page.waitForTimeout(300)
    await el(page, '.group', '06_block_ask_ai_form', 1)
    // Dismiss the ask AI form (try cancel button, fall back to Escape)
    const cancelBtn = page.locator('.group').nth(1).locator('button').filter({ hasText: /cancel/i })
    if (await cancelBtn.isVisible({ timeout: 500 }).catch(() => false)) {
      await cancelBtn.click({ force: true })
    } else {
      await page.keyboard.press('Escape')
    }
    await page.waitForTimeout(150)
  }

  // 7 · Block with pending suggestion — accent highlight, pending review badge, action row
  //     Block 0 has the seeded suggestion
  await hoverNth(page, '.group', 0)
  await page.waitForTimeout(250)
  // Crop just the block header grid for the "pending state" shot
  const gridBox = await page.evaluate(() => {
    const grp = document.querySelectorAll('.group')[0]
    const grid = grp?.querySelector('.grid')
    if (!grid) return null
    const r = grid.getBoundingClientRect()
    return { x: r.left, y: r.top, width: r.width, height: r.height }
  })
  if (gridBox && gridBox.width > 0) {
    await page.screenshot({ path: path.join(OUT, '07_block_pending_state.png'), clip: gridBox, fullPage: false })
    console.log('  ✓ 07_block_pending_state')
  }

  // 8 · Suggestion panel — full viewport showing current paragraph vs proposed revision
  await px(page, '08_suggestion_panel_viewport')

  // 9 · Suggestion panel detail crop (diff + approve / revise & approve / reject buttons)
  await el(page, '.group', '09_suggestion_panel_full', 0)

  // 10 · Lineage panel open (version history of a block)
  await goEditor(page)
  await page.waitForTimeout(600)
  const lineageToggle = page.locator('button').filter({ hasText: /view history/i }).first()
  if (await lineageToggle.isVisible().catch(() => false)) {
    await lineageToggle.click()
    await page.waitForTimeout(400)
    await el(page, '.group', '10_lineage_panel_open', 0)
  }

  // 11 · Share popover
  await page.goto(`${BASE}/documents/${DOC_ID}/edit/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const shareBtn = page.locator('button').filter({ hasText: /share/i }).first()
  if (await shareBtn.isVisible().catch(() => false)) {
    await shareBtn.click()
    await page.waitForTimeout(400)
    await px(page, '11_share_popover')
  }

  // 12 · Light mode — editor overview
  await page.mouse.click(10, 10) // close share
  await page.waitForTimeout(200)
  const themeBtn = page.locator('button[title*="light"], button[title*="Light"]').first()
  if (await themeBtn.isVisible().catch(() => false)) {
    await themeBtn.click()
    await page.waitForTimeout(400)
    await px(page, '12_editor_light_mode')
    // reset
    const darkBtn = page.locator('button[title*="dark"], button[title*="Dark"]').first()
    if (await darkBtn.isVisible().catch(() => false)) await darkBtn.click()
  }

  await ctx.close()
}

// ── MOBILE dark ───────────────────────────────────────────────────────────
{
  console.log('\n── Mobile · dark (390×844) ──')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await login(page)
  await goEditor(page)

  // 13 · Mobile editor overview
  await px(page, '13_mobile_editor_overview')

  // 14 · Mobile navbar
  await el(page, 'header', '14_mobile_navbar')

  // 15 · Mobile block area
  await el(page, 'main', '15_mobile_block_list')

  // 16 · Mobile block with pending suggestion
  await el(page, '.group', '16_mobile_pending_block', 0)

  // 17 · Mobile suggestion panel viewport
  await px(page, '17_mobile_suggestion_panel')

  await ctx.close()
}

// ── TABLET dark ───────────────────────────────────────────────────────────
{
  console.log('\n── Tablet · dark (768×1024) ──')
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await login(page)
  await goEditor(page)

  // 18 · Tablet editor overview
  await px(page, '18_tablet_editor_overview')

  // 19 · Tablet navbar
  await el(page, 'header', '19_tablet_navbar')

  await ctx.close()
}

await browser.close()
console.log(`\n✓ Done — ${OUT}`)
