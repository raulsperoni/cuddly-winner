/**
 * UX audit — paragraph editing experience.
 * Produces named, viewport-quality screenshots for UX review.
 * Run: node scripts/visual_audit.mjs  (from project root)
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'screenshots')

const BASE = 'http://localhost:5173'
const USERNAME = 'raulsperoni'
const PASSWORD = 'testpass123'
const DOC_ID = 10   // 'memoria' — 16 paragraphs, has a seeded pending suggestion

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true })

// ── helpers ────────────────────────────────────────────────────────────────

async function px(page, name) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
  console.log(`  ✓ ${name}`)
}

async function el(page, locator, name) {
  // Use evaluate to get bounding box directly, bypassing actionability checks
  const handle = await locator.elementHandle({ timeout: 5000 }).catch(() => null)
  let box = handle
    ? await handle.boundingBox()
    : null
  if (!box) {
    // Fallback: evaluate in page context
    box = await page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }
    }, locator._selector ?? 'header')
  }
  if (!box) throw new Error(`No bounding box for ${name}`)
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
  await page.waitForTimeout(2000)
  // Confirm React rendered blocks — if not, give it more time
  const loaded = await page.locator('.group').first().isVisible().catch(() => false)
  if (!loaded) await page.waitForTimeout(2000)
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
  await el(page, page.locator('header').first(), '02_navbar_editor')

  // 3 · Block list area (scroll-crop to first ~5 paragraphs)
  const main = page.locator('main').first()
  await el(page, main, '03_block_list')

  // Use block index 1 (second block — no pending suggestion) for clean hover/edit demos
  const blocks = page.locator('.group')
  const demoBlock = blocks.nth(1)

  // 4 · Block hovered — AI action buttons visible (clarify / rephrase / condense / expand / ask AI)
  await demoBlock.hover()
  await page.waitForTimeout(250)
  await el(page, demoBlock, '04_block_hovered_actions')

  // 5 · Block in edit mode (TipTap focused, surface-2 background, save/cancel)
  await demoBlock.click()
  await page.waitForTimeout(350)
  await el(page, demoBlock, '05_block_editing')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  // 6 · Custom "Ask AI..." instruction form open on block 1
  await demoBlock.hover()
  await page.waitForTimeout(150)
  const askBtn = demoBlock.locator('button').filter({ hasText: /ask ai/i })
  if (await askBtn.isVisible()) {
    await askBtn.click()
    await page.waitForTimeout(250)
    await el(page, demoBlock, '06_block_ask_ai_form')
    // close form
    await demoBlock.locator('button').filter({ hasText: /cancel/i }).click()
    await page.waitForTimeout(150)
  }

  // 7 · Block with pending suggestion — accent highlight, pending review badge, action row
  //     Block 0 has the seeded suggestion
  const pendingBlock = blocks.first()
  await pendingBlock.scrollIntoViewIfNeeded()
  await pendingBlock.hover()
  await page.waitForTimeout(200)
  // Crop just the block header (above the suggestion panel) for the "pending state" shot
  const blockHeader = pendingBlock.locator('.grid').first()
  await el(page, blockHeader, '07_block_pending_state')

  // 8 · Suggestion panel — full viewport showing current paragraph vs proposed revision
  await px(page, '08_suggestion_panel_viewport')

  // 9 · Suggestion panel detail crop (diff + approve / revise & approve / reject buttons)
  await el(page, pendingBlock, '09_suggestion_panel_full')

  // 10 · Lineage panel open (version history of a block)
  await goEditor(page)
  await page.waitForTimeout(600)
  const lineageToggle = page.locator('button').filter({ hasText: /view history/i }).first()
  if (await lineageToggle.isVisible()) {
    await lineageToggle.click()
    await page.waitForTimeout(400)
    const lineageBlock = page.locator('.group').first()
    await el(page, lineageBlock, '10_lineage_panel_open')
  }

  // 11 · Share popover
  await page.goto(`${BASE}/documents/${DOC_ID}/edit/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const shareBtn = page.locator('button').filter({ hasText: /share/i }).first()
  if (await shareBtn.isVisible()) {
    await shareBtn.click()
    await page.waitForTimeout(350)
    await px(page, '11_share_popover')
  }

  // 12 · Light mode — editor overview
  await page.mouse.click(10, 10) // close share
  await page.waitForTimeout(200)
  const themeBtn = page.locator('button[title*="light"], button[title*="Light"]').first()
  if (await themeBtn.isVisible()) {
    await themeBtn.click()
    await page.waitForTimeout(300)
    await px(page, '12_editor_light_mode')
    // reset
    const darkBtn = page.locator('button[title*="dark"], button[title*="Dark"]').first()
    if (await darkBtn.isVisible()) await darkBtn.click()
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

  // 14 · Mobile navbar (two rows)
  await el(page, page.locator('header').first(), '14_mobile_navbar')

  // 15 · Mobile block area
  await el(page, page.locator('main').first(), '15_mobile_block_list')

  // 16 · Mobile block with pending suggestion
  const pendingBlock = page.locator('.group').first()
  await el(page, pendingBlock, '16_mobile_pending_block')

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
  await el(page, page.locator('header').first(), '19_tablet_navbar')

  await ctx.close()
}

await browser.close()
console.log(`\n✓ Done — ${OUT}`)
