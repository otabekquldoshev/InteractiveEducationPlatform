import { useEffect, useState } from "react"
import { Award, CalendarDays, Download, Loader2, ShieldCheck } from "lucide-react"
import Navbar from "../components/layout/Navbar"
import Footer from "../components/layout/Footer"
import AccessibilityPanel from "../components/AccessibilityPanel"
import CertificatePreview from "../components/certificate/CertificatePreview"
import { api } from "../lib/api"
import type { Certificate } from "../types"
import { useLanguage } from "../contexts/LanguageContext"

const certificateLocales = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
} as const

export default function MyCertificatesPage() {
  const { t, language } = useLanguage()
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [selected, setSelected] = useState<Certificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    api<{ certificates: Certificate[] }>("/learning/certificates")
      .then((result) => {
        if (active) setCertificates(result.certificates)
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : t("cert_load_error"),
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [t])

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(certificateLocales[language], {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value))

  return (
    <div className="min-h-screen bg-[#fff9fb] text-slate-900">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-slate-950 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
          <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200">
              <ShieldCheck className="h-4 w-4" /> {t("cert_verified_achievements")}
            </span>
            <h1 className="mt-5 font-display text-3xl font-black sm:text-5xl">
              {t("cert_my")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {t("cert_page_desc")}
            </p>
            <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 backdrop-blur">
              <Award className="h-6 w-6 text-amber-300" />
              <div>
                <p className="text-2xl font-black">{certificates.length}</p>
                <p className="text-xs text-slate-400">{t("cert_total")}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
              <div className="text-center text-slate-500">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
                <p className="mt-3 text-sm">{t("cert_loading")}</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {error}
            </div>
          ) : certificates.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {certificates.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-violet-600" />
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-100" />
                  <div className="relative">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20">
                        <Award className="h-6 w-6" />
                      </span>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                        {item.score}%
                      </span>
                    </div>
                    <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
                      {t("cert_label")}
                    </p>
                    <h2 className="mt-2 min-h-14 font-display text-lg font-bold leading-7 text-slate-950">
                      {item.courseName}
                    </h2>
                    <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-violet-500" />
                        {formatDate(item.issuedAt)}
                      </p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-wide text-slate-400">
                        ID: {item.verificationCode}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-violet-700"
                    >
                      <Download className="h-4 w-4" /> {t("cert_view_download")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <Award className="mx-auto h-14 w-14 text-slate-300" />
              <h2 className="mt-4 font-display text-xl font-bold text-slate-800">
                {t("cert_empty")}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                {t("cert_empty_desc")}
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
      {selected && (
        <CertificatePreview
          fullName={selected.recipientName}
          courseName={selected.courseName}
          completedAt={selected.issuedAt}
          score={selected.score}
          verificationCode={selected.verificationCode}
          onClose={() => setSelected(null)}
        />
      )}
      <AccessibilityPanel />
    </div>
  )
}
