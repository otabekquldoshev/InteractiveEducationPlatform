import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Eye,
  Ear,
  Hand,
  Layers,
  Settings,
  ChevronRight,
  CheckCircle,
  GraduationCap,
} from "lucide-react"
import { useAuth } from "../contexts/AuthContext"
import { useAccessibility } from "../contexts/AccessibilityContext"
import { useLanguage } from "../contexts/LanguageContext"

const modes = [
  {
    id: "standard",
    icon: <CheckCircle className="w-8 h-8" />,
    titleKey: "accessibility_mode_standard",
    descKey: "accessibility_mode_standard_desc",
    prefs: {},
  },
  {
    id: "visual",
    icon: <Eye className="w-8 h-8" />,
    titleKey: "accessibility_mode_visual",
    descKey: "accessibility_mode_visual_desc",
    prefs: {
      fontSize: 120,
      highContrast: false,
      focusIndicator: true,
      largeButtons: true,
    },
  },
  {
    id: "hearing",
    icon: <Ear className="w-8 h-8" />,
    titleKey: "accessibility_mode_hearing",
    descKey: "accessibility_mode_hearing_desc",
    prefs: { alwaysShowSubtitles: true },
  },
  {
    id: "motor",
    icon: <Hand className="w-8 h-8" />,
    titleKey: "accessibility_mode_motor",
    descKey: "accessibility_mode_motor_desc",
    prefs: {
      largeButtons: true,
      keyboardNavigation: true,
      focusIndicator: true,
    },
  },
  {
    id: "cognitive",
    icon: <Layers className="w-8 h-8" />,
    titleKey: "accessibility_mode_cognitive",
    descKey: "accessibility_mode_cognitive_desc",
    prefs: { dyslexiaFont: true, lineSpacing: 2, reducedMotion: true },
  },
  {
    id: "custom",
    icon: <Settings className="w-8 h-8" />,
    titleKey: "accessibility_mode_custom",
    descKey: "accessibility_mode_custom_desc",
    prefs: {},
  },
]

export default function AccessibilityOnboarding() {
  const { user, updateUser } = useAuth()
  const { setPref } = useAccessibility()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const [selected, setSelected] = useState<string | null>(null)

  const handleContinue = () => {
    if (!selected) return
    const mode = modes.find((m) => m.id === selected)
    if (mode) {
      Object.entries(mode.prefs).forEach(([key, value]) => {
        setPref(key as any, value as any)
      })
    }
    updateUser({ accessibilitySetupDone: true })
    navigate("/dashboard")
  }

  const handleSkip = () => {
    updateUser({ accessibilitySetupDone: true })
    navigate("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
          </div>
          <h1 className="font-display font-bold text-3xl text-slate-900 mb-3">
            {t("welcome_user")}, {user?.firstName}!
          </h1>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
            {t("accessibility_onboarding_desc")}
          </p>
        </div>

        {/* Modes grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8"
          role="radiogroup"
          aria-label={t("accessibility_select_mode_aria")}
        >
          {modes.map((mode) => (
            <button
              key={mode.id}
              role="radio"
              aria-checked={selected === mode.id}
              onClick={() => setSelected(mode.id)}
              className={`text-left p-5 rounded-2xl border-2 transition-all ${
                selected === mode.id
                  ? "border-violet-500 bg-violet-50"
                  : "border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/30"
              }`}
            >
              <div
                className={`mb-3 ${
                  selected === mode.id ? "text-violet-600" : "text-slate-400"
                }`}
              >
                {mode.icon}
              </div>
              <h3 className="font-display font-semibold text-slate-900 mb-1">
                {t(mode.titleKey as any)}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {t(mode.descKey as any)}
              </p>
              {selected === mode.id && (
                <div className="mt-3 flex items-center gap-1.5 text-violet-600 text-xs font-semibold">
                  <CheckCircle className="w-4 h-4" />
                  {t("accessibility_selected")}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 rounded-xl bg-white"
          >
            {t("accessibility_skip")}
          </button>
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {t("accessibility_continue")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          {t("accessibility_settings_hint")}
        </p>
      </div>
    </div>
  )
}
