import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Locale = 'en' | 'es'

const STORAGE_KEY = 'cw-lang'
const COOKIE_KEY = 'cw_lang'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

type TranslationParams = Record<string, string | number>
type TranslationValue = string | ((params: TranslationParams) => string)

const translations = {
  en: {
    loading: 'Loading…',
    documents: 'Documents',
    documentActivity: 'Document activity',
    editor: 'Editor',
    activity: 'Activity',
    sharedDraft: 'Shared draft',
    notFound: 'Not found',
    routingError: 'Routing error',
    pageNotFound: 'Page not found',
    pageDoesNotExist: 'This page does not exist.',
    notFoundDetail: 'The document or route you requested could not be found.',
    routeNotFoundDetail: 'The page or document route you requested could not be found.',
    requestFailed: 'The application could not complete this request.',
    unexpectedError: 'An unexpected application error occurred.',
    somethingWentWrong: 'Something went wrong',
    goToDocuments: 'Go to documents',
    reloadPage: 'Reload page',
    newDocument: 'New document',
    createDocument: 'Create document',
    createYourFirstDocument: 'Create your first document →',
    noDocumentsYet: 'No documents yet.',
    documentListIntro:
      'Draft and review documents with clear provenance, paragraph-level history, and exportable records.',
    owner: 'owner',
    shared: 'shared',
    collaborator: 'collaborator',
    sharedBy: ({ owner_username = '' }) => `shared by ${owner_username}`,
    paragraphsCount: ({ count = 0 }) =>
      `${count} paragraph${Number(count) === 1 ? '' : 's'}`,
    statusDraft: 'draft',
    statusPublished: 'published',
    failedToLoadDocument: ({ error = '' }) => `Failed to load document: ${error}`,
    joinJoined: 'You can now review and edit this document.',
    joinAlreadyHasAccess: 'You already have editing access to this document.',
    dismiss: 'dismiss',
    awaitingReview: ({ count = 0 }) => `${count} awaiting review`,
    revisionsLoading: 'Loading revisions…',
    signIn: 'Sign in',
    signOut: 'Sign out',
    share: 'Share',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    readingLink: 'Reading link',
    readingLinkNote:
      'Use this for review, circulation, or public access to the current draft.',
    editingInvite: 'Editing invite',
    editingInviteNote:
      'Signed-in recipients can join the drafting team and propose revisions.',
    collaborators: 'Collaborators',
    remove: 'Remove',
    copy: 'Copy',
    copied: 'Copied',
    title: 'Title *',
    titlePlaceholder: 'Policy document title',
    description: 'Description',
    descriptionPlaceholder: 'Brief description (optional)',
    initialContent: 'Initial content',
    initialContentHelp:
      'Paste existing text. Blank lines between paragraphs create separate paragraphs.',
    initialContentPlaceholder: 'Paste your document text here…',
    creating: 'Creating…',
    cancel: 'Cancel',
    saveSnapshot: '+ Save snapshot',
    snapshots: 'Snapshots',
    publishedRevisions: 'Published revisions',
    noSnapshotsYet: 'No snapshots yet.',
    exportToGitHub: 'export to GitHub',
    exportedToGitHub: ({ repo = '', sha = '' }) => `exported → ${repo} (${sha})`,
    export: 'Export',
    ownerRepoPlaceholder: 'owner/repo',
    githubTokenPlaceholder: 'GitHub token (optional if GITHUB_TOKEN set)',
    currentParagraph: 'Current paragraph',
    proposedRevision: 'Proposed revision',
    reviseBeforeApproval: 'Revise before approval',
    empty: 'empty',
    approve: 'Approve',
    reviseAndApprove: 'Revise & approve',
    reject: 'Reject',
    approveRevision: 'Approve revision',
    reviewDraft: ({ label = '' }) => `Review draft — ${label}`,
    viewHistory: 'View history',
    noRevisionsYet: 'No revisions yet',
    revision: ({ count = 0 }) => `revision ${count}`,
    aiApprovedDraft: 'AI-approved draft',
    humanDraft: 'Human draft',
    current: 'current',
    justNow: 'just now',
    minutesAgo: ({ count = 0 }) => `${count}m ago`,
    hoursAgo: ({ count = 0 }) => `${count}h ago`,
    daysAgo: ({ count = 0 }) => `${count}d ago`,
    approvedBy: ({ name = '' }) => `Approved by ${name}`,
    afterRevision: 'after revision',
    pendingReview: ({ count = 0 }) => `${count} pending review`,
    clarify: 'Clarify',
    rephrase: 'Rephrase',
    condense: 'Condense',
    expand: 'Expand',
    askAi: 'Ask AI…',
    ask: 'Ask',
    customInstructionPlaceholder: 'e.g. this is too broad, tighten the scope',
    preparingReviewDraft: 'Preparing review draft…',
    loadingHistory: 'Loading history…',
    loadingReviewDraft: 'Loading review draft…',
    emptyParagraphClick: 'Empty paragraph. Click to begin writing.',
    saving: 'Saving…',
    saveRevision: 'Save revision',
    keepCurrentText: 'Keep current text',
    editorShortcuts: '⌘↵ save revision · Esc cancel',
    emptyParagraph: 'Empty paragraph',
    sharedDocument: 'Shared document',
    publicDocumentIntro:
      'This link is for reading and circulation. Sign in to join the drafting team when you have an editing invite.',
    failedToLoadPublicDocument: ({ error = '' }) =>
      `Failed to load public document: ${error}`,
    noParagraphsYet: 'No paragraphs yet.',
    eventDocumentCreated: 'Document created',
    eventBlockCreated: 'Paragraph added',
    eventBlockEdited: 'Paragraph revised',
    eventSuggestionCreated: 'AI draft requested',
    eventSuggestionAccepted: 'AI draft approved',
    eventSuggestionRejected: 'AI draft rejected',
    eventSnapshotCreated: 'Snapshot created',
    eventSnapshotExported: 'Snapshot exported to GitHub',
    requestedAiDraft: 'Requested an AI draft.',
    requestedAiDraftType: ({ type = '' }) => `Requested an AI ${type} draft.`,
    approvedAiDraftAfterRevision: 'Approved an AI draft after revising the wording.',
    approvedAiWording: 'Approved the AI-proposed wording.',
    rejectedAiWording: 'Rejected the AI-proposed wording.',
    savedSnapshot: 'Saved a snapshot.',
    savedSnapshotVersion: ({ version = '' }) => `Saved snapshot v${version}.`,
    exportedSnapshot: 'Exported a snapshot to GitHub.',
    exportedSnapshotRepo: ({ repo = '' }) => `Exported a snapshot to ${repo}.`,
    savedParagraphRevision: 'Saved a revision to this paragraph.',
    addedNewParagraph: 'Added a new paragraph.',
    openedNewDocument: 'Opened a new drafting document.',
    noActivityYet: 'No activity yet.',
    paragraphNumber: ({ id = '' }) => `paragraph #${id}`,
    rawEventData: 'Raw event data',
    languageEnglish: 'English',
    languageSpanish: 'Español',
    languageToggleLabel: 'Language',
  },
  es: {
    loading: 'Cargando…',
    documents: 'Documentos',
    documentActivity: 'Actividad del documento',
    editor: 'Editor',
    activity: 'Actividad',
    sharedDraft: 'Borrador compartido',
    notFound: 'No encontrado',
    routingError: 'Error de ruta',
    pageNotFound: 'Página no encontrada',
    pageDoesNotExist: 'Esta página no existe.',
    notFoundDetail: 'No se encontró el documento o la ruta solicitada.',
    routeNotFoundDetail: 'No se encontró la página o la ruta del documento solicitada.',
    requestFailed: 'La aplicación no pudo completar esta solicitud.',
    unexpectedError: 'Se produjo un error inesperado en la aplicación.',
    somethingWentWrong: 'Algo salió mal',
    goToDocuments: 'Ir a documentos',
    reloadPage: 'Recargar página',
    newDocument: 'Nuevo documento',
    createDocument: 'Crear documento',
    createYourFirstDocument: 'Crear tu primer documento →',
    noDocumentsYet: 'Todavía no hay documentos.',
    documentListIntro:
      'Redacta y revisa documentos con procedencia clara, historial por párrafo y registros exportables.',
    owner: 'propietario',
    shared: 'compartido',
    collaborator: 'colaborador',
    sharedBy: ({ owner_username = '' }) => `compartido por ${owner_username}`,
    paragraphsCount: ({ count = 0 }) =>
      `${count} párrafo${Number(count) === 1 ? '' : 's'}`,
    statusDraft: 'borrador',
    statusPublished: 'publicado',
    failedToLoadDocument: ({ error = '' }) => `No se pudo cargar el documento: ${error}`,
    joinJoined: 'Ahora puedes revisar y editar este documento.',
    joinAlreadyHasAccess: 'Ya tienes acceso de edición a este documento.',
    dismiss: 'cerrar',
    awaitingReview: ({ count = 0 }) => `${count} pendientes de revisión`,
    revisionsLoading: 'Cargando revisiones…',
    signIn: 'Iniciar sesión',
    signOut: 'Cerrar sesión',
    share: 'Compartir',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    readingLink: 'Enlace de lectura',
    readingLinkNote:
      'Úsalo para revisión, circulación o acceso público al borrador actual.',
    editingInvite: 'Invitación de edición',
    editingInviteNote:
      'Los destinatarios con sesión iniciada pueden unirse al equipo de redacción y proponer revisiones.',
    collaborators: 'Colaboradores',
    remove: 'Quitar',
    copy: 'Copiar',
    copied: 'Copiado',
    title: 'Título *',
    titlePlaceholder: 'Título del documento de política',
    description: 'Descripción',
    descriptionPlaceholder: 'Descripción breve (opcional)',
    initialContent: 'Contenido inicial',
    initialContentHelp:
      'Pega el texto existente. Las líneas en blanco entre párrafos crean párrafos separados.',
    initialContentPlaceholder: 'Pega aquí el texto de tu documento…',
    creating: 'Creando…',
    cancel: 'Cancelar',
    saveSnapshot: '+ Guardar snapshot',
    snapshots: 'Snapshots',
    publishedRevisions: 'Revisiones publicadas',
    noSnapshotsYet: 'Todavía no hay snapshots.',
    exportToGitHub: 'exportar a GitHub',
    exportedToGitHub: ({ repo = '', sha = '' }) => `exportado → ${repo} (${sha})`,
    export: 'Exportar',
    ownerRepoPlaceholder: 'owner/repo',
    githubTokenPlaceholder: 'Token de GitHub (opcional si GITHUB_TOKEN está configurado)',
    currentParagraph: 'Párrafo actual',
    proposedRevision: 'Revisión propuesta',
    reviseBeforeApproval: 'Revisar antes de aprobar',
    empty: 'vacío',
    approve: 'Aprobar',
    reviseAndApprove: 'Revisar y aprobar',
    reject: 'Rechazar',
    approveRevision: 'Aprobar revisión',
    reviewDraft: ({ label = '' }) => `Revisar borrador — ${label}`,
    viewHistory: 'Ver historial',
    noRevisionsYet: 'Todavía no hay revisiones',
    revision: ({ count = 0 }) => `revisión ${count}`,
    aiApprovedDraft: 'Borrador de IA aprobado',
    humanDraft: 'Borrador humano',
    current: 'actual',
    justNow: 'justo ahora',
    minutesAgo: ({ count = 0 }) => `hace ${count} min`,
    hoursAgo: ({ count = 0 }) => `hace ${count} h`,
    daysAgo: ({ count = 0 }) => `hace ${count} d`,
    approvedBy: ({ name = '' }) => `Aprobado por ${name}`,
    afterRevision: 'tras revisión',
    pendingReview: ({ count = 0 }) => `${count} pendientes de revisión`,
    clarify: 'Aclarar',
    rephrase: 'Reformular',
    condense: 'Condensar',
    expand: 'Ampliar',
    askAi: 'Pedir a IA…',
    ask: 'Pedir',
    customInstructionPlaceholder: 'p. ej. esto es demasiado amplio, acota el alcance',
    preparingReviewDraft: 'Preparando borrador para revisión…',
    loadingHistory: 'Cargando historial…',
    loadingReviewDraft: 'Cargando borrador para revisión…',
    emptyParagraphClick: 'Párrafo vacío. Haz clic para empezar a escribir.',
    saving: 'Guardando…',
    saveRevision: 'Guardar revisión',
    keepCurrentText: 'Mantener texto actual',
    editorShortcuts: '⌘↵ guardar revisión · Esc cancelar',
    emptyParagraph: 'Párrafo vacío',
    sharedDocument: 'Documento compartido',
    publicDocumentIntro:
      'Este enlace es para lectura y circulación. Inicia sesión para unirte al equipo de redacción cuando tengas una invitación de edición.',
    failedToLoadPublicDocument: ({ error = '' }) =>
      `No se pudo cargar el documento público: ${error}`,
    noParagraphsYet: 'Todavía no hay párrafos.',
    eventDocumentCreated: 'Documento creado',
    eventBlockCreated: 'Párrafo agregado',
    eventBlockEdited: 'Párrafo revisado',
    eventSuggestionCreated: 'Borrador de IA solicitado',
    eventSuggestionAccepted: 'Borrador de IA aprobado',
    eventSuggestionRejected: 'Borrador de IA rechazado',
    eventSnapshotCreated: 'Snapshot creado',
    eventSnapshotExported: 'Snapshot exportado a GitHub',
    requestedAiDraft: 'Se solicitó un borrador de IA.',
    requestedAiDraftType: ({ type = '' }) => `Se solicitó un borrador de IA de tipo ${type}.`,
    approvedAiDraftAfterRevision:
      'Se aprobó un borrador de IA después de revisar la redacción.',
    approvedAiWording: 'Se aprobó la redacción propuesta por la IA.',
    rejectedAiWording: 'Se rechazó la redacción propuesta por la IA.',
    savedSnapshot: 'Se guardó un snapshot.',
    savedSnapshotVersion: ({ version = '' }) => `Se guardó el snapshot v${version}.`,
    exportedSnapshot: 'Se exportó un snapshot a GitHub.',
    exportedSnapshotRepo: ({ repo = '' }) => `Se exportó un snapshot a ${repo}.`,
    savedParagraphRevision: 'Se guardó una revisión de este párrafo.',
    addedNewParagraph: 'Se agregó un nuevo párrafo.',
    openedNewDocument: 'Se abrió un nuevo documento de redacción.',
    noActivityYet: 'Todavía no hay actividad.',
    paragraphNumber: ({ id = '' }) => `párrafo #${id}`,
    rawEventData: 'Datos brutos del evento',
    languageEnglish: 'English',
    languageSpanish: 'Español',
    languageToggleLabel: 'Idioma',
  },
} satisfies Record<Locale, Record<string, TranslationValue>>

type TranslationKey = keyof typeof translations.en

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
  formatDate: (value: string, options?: Intl.DateTimeFormatOptions) => string
  formatRelativeTime: (value: string) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized.startsWith('es')) return 'es'
  if (normalized.startsWith('en')) return 'en'
  return null
}

function getCookie(name: string): string | null {
  const prefix = `${name}=`
  const match = document.cookie
    .split('; ')
    .find((part) => part.startsWith(prefix))
  return match ? decodeURIComponent(match.slice(prefix.length)) : null
}

function persistLocale(locale: Locale) {
  window.localStorage.setItem(STORAGE_KEY, locale)
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(locale)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
  document.documentElement.lang = locale
}

function getInitialLocale(): Locale {
  return (
    normalizeLocale(getCookie(COOKIE_KEY)) ??
    normalizeLocale(window.localStorage.getItem(STORAGE_KEY)) ??
    normalizeLocale(window.navigator.language) ??
    'en'
  )
}

function interpolate(value: TranslationValue, params: TranslationParams = {}): string {
  if (typeof value === 'function') {
    return value(params)
  }
  return value
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialLocale())

  useEffect(() => {
    persistLocale(locale)
  }, [locale])

  const contextValue = useMemo<LocaleContextValue>(() => {
    const dictionary = translations[locale]

    return {
      locale,
      setLocale: (next) => setLocaleState(next),
      t: (key, params) => interpolate(dictionary[key], params),
      formatDate: (value, options) =>
        new Intl.DateTimeFormat(locale, options).format(new Date(value)),
      formatRelativeTime: (value) => {
        const date = new Date(value)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)
        if (diffMins < 1) return interpolate(dictionary.justNow)
        if (diffMins < 60) return interpolate(dictionary.minutesAgo, { count: diffMins })
        if (diffHours < 24) return interpolate(dictionary.hoursAgo, { count: diffHours })
        if (diffDays < 30) return interpolate(dictionary.daysAgo, { count: diffDays })
        return new Intl.DateTimeFormat(locale).format(date)
      },
    }
  }, [locale])

  return (
    <LocaleContext.Provider value={contextValue}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return context
}
