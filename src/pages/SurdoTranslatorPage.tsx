import { Sparkles } from "lucide-react"
import TextToSurdoTranslator from "../components/surdo/TextToSurdoTranslator"
import Footer from "../components/layout/Footer"
import Navbar from "../components/layout/Navbar"
import { useLanguage } from "../contexts/LanguageContext"

export default function SurdoTranslatorPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#fff9fb] text-slate-900">
      <Navbar />
      <main className="relative overflow-hidden pb-16 sm:pb-20">
        <section className="relative overflow-hidden bg-gradient-to-br from-rose-50 via-[#fff8fc] to-violet-100 px-4 pb-32 pt-12 text-[#4a294f] sm:px-6 sm:pb-36 sm:pt-16 lg:px-8">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-pink-300/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-violet-300/35 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-orange-200/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(126,76,132,0.10)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
          <header className="relative mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/75 px-4 py-2 text-sm font-bold text-rose-600 shadow-lg shadow-rose-200/40 backdrop-blur">
              <Sparkles className="h-4 w-4" /> {t("surdo_page_badge")}
            </span>
            <h1 className="mt-6 font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              {t("surdo_page_title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#765d79] sm:text-base">
              {t("surdo_page_desc")}
            </p>
          </header>
        </section>

        <div className="relative mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <TextToSurdoTranslator
            inputLabel={t("surdo_input_label")}
            inputPlaceholder={t("surdo_input_placeholder")}
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
