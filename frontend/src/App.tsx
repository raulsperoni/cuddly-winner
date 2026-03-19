import { Suspense, lazy, type ComponentType } from 'react'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom'
import { LoadingScreen } from './components/shared/LoadingScreen'
import { NotFoundPage } from './pages/NotFoundPage'
import { RouteErrorPage } from './pages/RouteErrorPage'

declare global {
  interface Window {
    CSRF_TOKEN: string
    CURRENT_USER: { username: string }
  }
}

function lazyPage<T extends Record<string, unknown>>(
  importer: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(async () => {
    const mod = await importer()
    return { default: mod[exportName] as ComponentType }
  })
}

function AppOutlet() {
  return <Outlet />
}

function withSuspense(Component: ComponentType) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component />
    </Suspense>
  )
}

const DocumentListPage = lazyPage(
  () => import('./pages/DocumentList'),
  'DocumentList',
)
const DocumentCreatePage = lazyPage(
  () => import('./pages/DocumentCreate'),
  'DocumentCreate',
)
const DocumentEditorPage = lazyPage(
  () => import('./pages/DocumentEditor'),
  'DocumentEditor',
)
const DocumentHistoryPage = lazyPage(
  () => import('./pages/DocumentHistory'),
  'DocumentHistory',
)
const PublicDocumentPage = lazyPage(
  () => import('./pages/PublicDocument'),
  'PublicDocument',
)
const AboutPage = lazyPage(
  () => import('./pages/AboutPage'),
  'AboutPage',
)

const router = createBrowserRouter([
  {
    path: '/',
    Component: AppOutlet,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: withSuspense(DocumentListPage),
      },
      {
        path: 'about',
        element: withSuspense(AboutPage),
      },
      {
        path: 'about/',
        element: withSuspense(AboutPage),
      },
      {
        path: 'documents/new',
        element: withSuspense(DocumentCreatePage),
      },
      {
        path: 'documents/new/',
        element: withSuspense(DocumentCreatePage),
      },
      { path: 'documents/:id', element: <Navigate to="edit" replace /> },
      { path: 'documents/:id/', element: <Navigate to="edit" replace /> },
      {
        path: 'documents/:id/edit',
        element: withSuspense(DocumentEditorPage),
      },
      {
        path: 'documents/:id/edit/',
        element: withSuspense(DocumentEditorPage),
      },
      {
        path: 'documents/:id/history',
        element: withSuspense(DocumentHistoryPage),
      },
      {
        path: 'documents/:id/history/',
        element: withSuspense(DocumentHistoryPage),
      },
      {
        path: 'p/:token',
        element: withSuspense(PublicDocumentPage),
      },
      {
        path: 'p/:token/',
        element: withSuspense(PublicDocumentPage),
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
