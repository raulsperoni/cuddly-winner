import { useEffect } from 'react'
import { buildPageTitle } from '../lib/brand'
import { useLocale } from '../lib/i18n'

export function usePageTitle(pageTitle?: string) {
  const { locale } = useLocale()

  useEffect(() => {
    document.title = buildPageTitle(pageTitle)
  }, [pageTitle, locale])
}
