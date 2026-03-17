import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { DocumentList } from './pages/DocumentList'
import { DocumentCreate } from './pages/DocumentCreate'
import { DocumentEditor } from './pages/DocumentEditor'
import { DocumentHistory } from './pages/DocumentHistory'

declare global {
  interface Window {
    CSRF_TOKEN: string
    CURRENT_USER: { username: string }
  }
}

const router = createBrowserRouter([
  { path: '/', element: <DocumentList /> },
  { path: '/documents/new', element: <DocumentCreate /> },
  { path: '/documents/new/', element: <DocumentCreate /> },
  { path: '/documents/:id', element: <Navigate to="edit" replace /> },
  { path: '/documents/:id/', element: <Navigate to="edit" replace /> },
  { path: '/documents/:id/edit', element: <DocumentEditor /> },
  { path: '/documents/:id/edit/', element: <DocumentEditor /> },
  { path: '/documents/:id/history', element: <DocumentHistory /> },
  { path: '/documents/:id/history/', element: <DocumentHistory /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
