import { useEffect, useRef } from "react";
import {
  X, Type, Eye, Moon, Zap, BookOpen, AlignLeft, Space,
  Square, Crosshair, Keyboard, Subtitles, Volume2, RotateCcw
} from "lucide-react";
import { useAccessibility } from "../contexts/AccessibilityContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function AccessibilityPanel() {
  const { prefs, setPref, resetPrefs, panelOpen, setPanelOpen } = useAccessibility();
  const { t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [panelOpen, setPanelOpen]);

  useEffect(() => {
    if (panelOpen) panelRef.current?.focus();
  }, [panelOpen]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setPanelOpen(!panelOpen)}
        aria-label={t("accessibility")}
        aria-expanded={panelOpen}
        className="fixed bottom-24 md:bottom-6 right-5 md:right-6 z-50 w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-colors flex items-center justify-center text-2xl border border-blue-500"
        title={t("accessibility")}
      >
        ♿
      </button>

      {/* Backdrop */}
      {panelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={t("accessibility")}
        aria-modal="true"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">{t("accessibility")}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{t("accessibilityDesc")}</p>
          </div>
          <button
            onClick={() => setPanelOpen(false)}
            aria-label={t("close")}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Font size */}
          <Section icon={<Type className="w-4 h-4" />} title={t("textSize")}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPref("fontSize", Math.max(80, prefs.fontSize - 10))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 font-bold"
                aria-label={t("decreaseText")}
              >A-</button>
              <div className="flex-1 text-center text-sm font-medium text-slate-700">
                {prefs.fontSize}%
              </div>
              <button
                onClick={() => setPref("fontSize", Math.min(150, prefs.fontSize + 10))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 font-bold"
                aria-label={t("increaseText")}
              >A+</button>
            </div>
          </Section>

          {/* Toggles */}
          <Section icon={<Eye className="w-4 h-4" />} title={t("appearance")}>
            <Toggle
              label={t("contrast")}
              checked={prefs.highContrast}
              onChange={(v) => setPref("highContrast", v)}
            />
            <Toggle
              label={t("darkMode")}
              checked={prefs.darkMode}
              onChange={(v) => setPref("darkMode", v)}
            />
          </Section>

          <Section icon={<Zap className="w-4 h-4" />} title={t("motion")}>
            <Toggle
              label={t("reduceMotion")}
              checked={prefs.reducedMotion}
              onChange={(v) => setPref("reducedMotion", v)}
            />
          </Section>

          <Section icon={<BookOpen className="w-4 h-4" />} title={t("reading")}>
            <Toggle
              label={t("dyslexia")}
              checked={prefs.dyslexiaFont}
              onChange={(v) => setPref("dyslexiaFont", v)}
            />
          </Section>

          <Section icon={<AlignLeft className="w-4 h-4" />} title={t("lineSpacing")}>
            <input
              type="range"
              min={1}
              max={2.5}
              step={0.1}
              value={prefs.lineSpacing}
              onChange={(e) => setPref("lineSpacing", Number(e.target.value))}
              className="w-full"
              aria-label={t("lineSpacing")}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{t("narrow")}</span>
              <span>{prefs.lineSpacing.toFixed(1)}</span>
              <span>{t("wide")}</span>
            </div>
          </Section>

          <Section icon={<Space className="w-4 h-4" />} title={t("letterSpacing")}>
            <input
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={prefs.letterSpacing}
              onChange={(e) => setPref("letterSpacing", Number(e.target.value))}
              className="w-full"
              aria-label={t("letterSpacing")}
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>{t("standard")}</span>
              <span>{prefs.letterSpacing}px</span>
              <span>{t("wide")}</span>
            </div>
          </Section>

          <Section icon={<Square className="w-4 h-4" />} title={t("buttons")}>
            <Toggle
              label={t("largeButtons")}
              checked={prefs.largeButtons}
              onChange={(v) => setPref("largeButtons", v)}
            />
          </Section>

          <Section icon={<Crosshair className="w-4 h-4" />} title={t("navigation")}>
            <Toggle
              label={t("focus")}
              checked={prefs.focusIndicator}
              onChange={(v) => setPref("focusIndicator", v)}
            />
            <Toggle
              label={t("keyboard")}
              checked={prefs.keyboardNavigation}
              onChange={(v) => setPref("keyboardNavigation", v)}
            />
          </Section>

          <Section icon={<Subtitles className="w-4 h-4" />} title={t("subtitles")}>
            <Toggle
              label={t("subtitlesAlways")}
              checked={prefs.alwaysShowSubtitles}
              onChange={(v) => setPref("alwaysShowSubtitles", v)}
            />
          </Section>

          <Section icon={<Volume2 className="w-4 h-4" />} title={t("tts")}>
            <Toggle
              label={t("readAloud")}
              checked={prefs.textToSpeech}
              onChange={(v) => setPref("textToSpeech", v)}
            />
            {prefs.textToSpeech && (
              <div className="mt-2">
                <label className="text-xs text-slate-500 mb-1 block">{t("voiceSpeed")}</label>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.25}
                  value={prefs.speechRate}
                  onChange={(e) => setPref("speechRate", Number(e.target.value))}
                  className="w-full"
                  aria-label={t("voiceSpeed")}
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{t("slow")}</span>
                  <span>{prefs.speechRate}x</span>
                  <span>{t("fast")}</span>
                </div>
              </div>
            )}
          </Section>

          {/* Reset */}
          <button
            onClick={resetPrefs}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t("reset")}
          </button>
        </div>
      </div>
    </>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
        <span className="text-teal-600">{icon}</span>
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
          checked ? "bg-teal-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
