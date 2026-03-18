/**
 * Visual audit script — screenshots every screen at desktop + mobile.
 * Run: node scripts/visual_audit.mjs
 *
 * Requires Django on :8000 and Vite on :5173 (both running).
 * Screenshots saved to scripts/screenshots/.
 */

import { chromium } from 'playwright'
import { mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, 'screenshots')

// Everything through Vite so session cookies share the same origin
const BASE = 'http://localhost:5173'
const USERNAME = 'raulsperoni'
const PASSWORD = 'testpass123'

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 390,  height: 844 },   // iPhone 14
]

async function shot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`  ✓ ${name}.png`)
}

async function shotHeader(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`)
  const header = page.locator('header').first()
  await header.screenshot({ path: file })
  console.log(`  ✓ ${name}.png`)
}

async function login(page) {
  await page.goto(`${BASE}/accounts/login/`, { waitUntil: 'networkidle' })
  // django-allauth uses "login" field name; fallback to "username"
  const field = page.locator('input[name="login"]').or(page.locator('input[name="username"]'))
  await field.fill(USERNAME)
  await page.fill('input[name="password"]', PASSWORD)
  await page.click('button[type="submit"]')
  // Wait for redirect away from login page
  await page.waitForURL((url) => !url.pathname.includes('login'), { timeout: 10000 })
}

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })

let firstDocId = null

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()
  // Surface any console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`  [console.error] ${msg.text()}`)
  })

  console.log(`\n── ${vp.name} (${vp.width}×${vp.height}) ──`)

  // ── 01 Login screen ────────────────────────────────────────────────────────
  await page.goto(`${BASE}/accounts/login/`, { waitUntil: 'networkidle' })
  await shot(page, `${vp.name}_01_login`)

  await login(page)

  // ── 02 Document list — served at / ────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await shot(page, `${vp.name}_02_document_list`)
  await shotHeader(page, `${vp.name}_02_nav`)

  // Grab first doc ID via API
  if (!firstDocId) {
    try {
      const data = await page.evaluate(async () => {
        const r = await fetch('/api/v1/documents/', { credentials: 'include' })
        return r.json()
      })
      const docs = data.results ?? data
      if (Array.isArray(docs) && docs.length > 0) firstDocId = docs[0].id
    } catch (e) {
      console.log(`  ⚠ Could not fetch docs: ${e.message}`)
    }
  }

  // ── 03 Create document form ────────────────────────────────────────────────
  await page.goto(`${BASE}/documents/new/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  await shot(page, `${vp.name}_03_document_create`)

  if (firstDocId) {
    // ── 04 Document editor ───────────────────────────────────────────────────
    await page.goto(`${BASE}/documents/${firstDocId}/edit/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    await shot(page, `${vp.name}_04_document_editor`)
    await shotHeader(page, `${vp.name}_04_nav`)

    // ── 05 Share popover ─────────────────────────────────────────────────────
    const shareBtn = page.locator('header button', { hasText: 'Share' })
    if (await shareBtn.isVisible()) {
      await shareBtn.click()
      await page.waitForTimeout(400)
      // Viewport-only shot so the popover is clearly visible
      await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}_05_share_popover.png`), fullPage: false })
      console.log(`  ✓ ${vp.name}_05_share_popover.png`)
      await page.mouse.click(10, 10)
      await page.waitForTimeout(200)
    } else {
      console.log('  ⚠ Share button not visible')
    }

    // ── 06 Snapshot panel ────────────────────────────────────────────────────
    // "Snapshots" toggle button in the NavBar actions area
    const snapshotBtn = page.locator('header button', { hasText: /^snapshots$/i })
    if (await snapshotBtn.isVisible()) {
      await snapshotBtn.click()
      await page.waitForTimeout(500)
      await shot(page, `${vp.name}_06_snapshot_panel`)
      await snapshotBtn.click()
    }

    // ── 07 Document history ──────────────────────────────────────────────────
    await page.goto(`${BASE}/documents/${firstDocId}/history/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await shot(page, `${vp.name}_07_document_history`)
  } else {
    console.log('  ⚠ No document ID — skipping editor/history screens')
  }

  // ── 08 Light mode ─────────────────────────────────────────────────────────
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const themeBtn = page.locator('header button[title*="light"], header button[title*="Light"]')
  if (await themeBtn.isVisible()) {
    await themeBtn.click()
    await page.waitForTimeout(300)
    await shot(page, `${vp.name}_08_document_list_light`)
    const darkBtn = page.locator('header button[title*="dark"], header button[title*="Dark"]')
    if (await darkBtn.isVisible()) await darkBtn.click()
  }

  await ctx.close()
}

await browser.close()
console.log(`\n✓ Done — screenshots in ${OUT_DIR}`)
