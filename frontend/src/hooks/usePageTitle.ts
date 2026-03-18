import { useEffect } from 'react'
import { buildPageTitle } from '../lib/brand'

export function usePageTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = buildPageTitle(pageTitle)
  }, [pageTitle])
}
