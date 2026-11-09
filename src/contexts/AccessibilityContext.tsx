import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import type { AccessibilityPreferences } from "../types"
import { api } from "../lib/api"

const DEFAULT_PREFS: AccessibilityPreferences = {
  fontSize: 100,
  highContrast: false,
  darkMode: false,
  reducedMotion: false,
  dyslexiaFont: false,
  lineSpacing: 1.6,
  letterSpacing: 0,
  largeButtons: false,
  focusIndicator: false,
  keyboardNavigation: false,
  alwaysShowSubtitles: false,
  textToSpeech: false,
  speechRate: 1,
}

interface AccessibilityContextValue {
  prefs: AccessibilityPreferences
  setPref: <K extends keyof AccessibilityPreferences,>(
    key: K,
    value: AccessibilityPreferences[K],
  ) => void
  resetPrefs: () => void
  panelOpen: boolean
  setPanelOpen: (open: boolean) => void
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null,
)

const STORAGE_KEY = "edu_accessibility"

export function AccessibilityProvider({
  userId,
  children,
}: {
  userId?: string
  children: ReactNode
}) {
  const storageKey = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY
  const [prefs, setPrefs] = useState<AccessibilityPreferences>(DEFAULT_PREFS)
  const [panelOpen, setPanelOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) })
      } catch {}
    }
    if (userId) {
      void api<{ settings: AccessibilityPreferences }>(
        "/learning/accessibility",
      )
        .then(({ settings }) => {
          const next = { ...DEFAULT_PREFS, ...settings }
          setPrefs(next)
          localStorage.setItem(storageKey, JSON.stringify(next))
        })
        .catch(() => undefined)
    }
  }, [storageKey, userId])

  useEffect(() => {
    const root = document.documentElement
    root.style.fontSize = `${prefs.fontSize}%`

    const bodyClasses = document.body.classList
    bodyClasses.toggle("high-contrast", prefs.highContrast)
    bodyClasses.toggle("dark", prefs.darkMode)
    bodyClasses.toggle("reduced-motion", prefs.reducedMotion)
    bodyClasses.toggle("font-dyslexia", prefs.dyslexiaFont)
    bodyClasses.toggle("large-buttons", prefs.largeButtons)
    bodyClasses.toggle("focus-enhanced", prefs.focusIndicator)

    document.body.style.lineHeight = String(prefs.lineSpacing)
    document.body.style.letterSpacing = `${prefs.letterSpacing}px`
  }, [prefs])

  const setPref = useCallback(
    <K extends keyof AccessibilityPreferences,>(
      key: K,
      value: AccessibilityPreferences[K],
    ) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value }
        localStorage.setItem(storageKey, JSON.stringify(next))
        if (userId)
          void api("/learning/accessibility", {
            method: "PUT",
            body: next,
          }).catch(() => undefined)
        return next
      })
    },
    [storageKey, userId],
  )

  const resetPrefs = useCallback(() => {
    setPrefs(DEFAULT_PREFS)
    localStorage.removeItem(storageKey)
    if (userId)
      void api("/learning/accessibility", {
        method: "PUT",
        body: DEFAULT_PREFS,
      }).catch(() => undefined)
  }, [storageKey, userId])

  return (
    <AccessibilityContext.Provider
      value={{ prefs, setPref, resetPrefs, panelOpen, setPanelOpen }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext)
  if (!ctx)
    throw new Error(
      "useAccessibility must be used inside AccessibilityProvider",
    )
  return ctx
}
