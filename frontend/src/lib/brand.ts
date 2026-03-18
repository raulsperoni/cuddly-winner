export const BRAND_NAME = 'DraftingDocs'
export const BRAND_DOMAIN = 'draftingdocs.org'
export const BRAND_TAGLINE = 'AI-assisted drafting with full traceability'

export function buildPageTitle(pageTitle?: string): string {
  return pageTitle ? `${pageTitle} · ${BRAND_NAME}` : BRAND_NAME
}
