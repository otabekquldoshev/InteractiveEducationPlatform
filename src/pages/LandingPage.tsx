import { Link } from "react-router-dom"
import {
  ArrowRight,
  Play,
  Subtitles,
  Keyboard,
  Volume2,
  BookOpen,
  Users,
  Award,
  BarChart3,
  CheckCircle,
  Star,
  ChevronRight,
  Accessibility,
  FileText,
  Mic,
} from "lucide-react"
import { useCatalog } from "../contexts/CatalogContext"
import { useLanguage } from "../contexts/LanguageContext"
import Footer from "../components/layout/Footer"
import Navbar from "../components/layout/Navbar"

export default function LandingPage() {
  const { courses } = useCatalog()
  const { t } = useLanguage()
  const featuredCourses = courses.slice(0, 3)

  const stats = [
    { value: "5,000+", label: t("stat_active_students") },
    { value: "120+", label: t("stat_courses") },
    { value: "98%", label: t("stat_satisfaction") },
    { value: "24/7", label: t("stat_support") },
  ]

  const accessibilityFeatures = [
    {
      icon: <Subtitles className="w-6 h-6" />,
      title: t("feat_subtitles_title"),
      desc: t("feat_subtitles_desc"),
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: t("feat_tts_title"),
      desc: t("feat_tts_desc"),
    },
    {
      icon: <Keyboard className="w-6 h-6" />,
      title: t("feat_keyboard_title"),
      desc: t("feat_keyboard_desc"),
    },
    {
      icon: <Mic className="w-6 h-6" />,
      title: t("feat_voice_title"),
      desc: t("feat_voice_desc"),
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: t("feat_interface_title"),
      desc: t("feat_interface_desc"),
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: t("feat_wcag_title"),
      desc: t("feat_wcag_desc"),
    },
  ]

  const howItWorks = [
    { step: "1", title: t("how_step1_title"), desc: t("how_step1_desc") },
    { step: "2", title: t("how_step2_title"), desc: t("how_step2_desc") },
    { step: "3", title: t("how_step3_title"), desc: t("how_step3_desc") },
    { step: "4", title: t("how_step4_title"), desc: t("how_step4_desc") },
  ]

  return (
    <div className="min-h-screen page-shell mobile-safe">
      <Navbar />
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#fff9fb]">
        <div
          className="absolute inset-y-0 right-0 hidden w-[43%] bg-[#f8f1fb] lg:block"
          aria-hidden="true"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-10 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white text-violet-800 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border border-violet-100 shadow-sm">
                <Accessibility className="w-4 h-4" aria-hidden="true" />
                {t("hero_badge")}
              </div>
              <h1 className="font-display font-bold text-[2.85rem] sm:text-6xl lg:text-7xl text-slate-900 leading-[.98] mb-6">
                {t("hero_title_part1")}{" "}
                <span className="text-violet-700">{t("hero_title_part2")}</span>{" "}
                {t("hero_title_part3")}
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-xl">
                {t("hero_desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex justify-center items-center gap-2 bg-violet-700 text-white px-6 py-3.5 rounded-xl font-semibold text-base hover:bg-violet-800 transition-colors shadow-lg shadow-violet-700/15"
                >
                  {t("hero_btn_login")}
                  <ArrowRight className="w-5 h-5" aria-hidden="true" />
                </Link>
                <Link
                  to="/courses"
                  className="inline-flex justify-center items-center gap-2 bg-white text-slate-800 px-6 py-3.5 rounded-xl font-semibold text-base hover:bg-[#fff9fb] transition-colors border border-slate-300 shadow-sm"
                >
                  <Play className="w-5 h-5 text-violet-600" aria-hidden="true" />
                  {t("hero_btn_courses")}
                </Link>
              </div>
              <div className="mt-9 flex items-center gap-3 text-sm text-slate-600">
                <div className="flex -space-x-2">
                  <span className="h-7 w-7 rounded-full border-2 border-[#fff9fb] bg-amber-300" />
                  <span className="h-7 w-7 rounded-full border-2 border-[#fff9fb] bg-violet-500" />
                  <span className="h-7 w-7 rounded-full border-2 border-[#fff9fb] bg-slate-700" />
                </div>
                <span>
                  <b className="text-slate-900">5 000+</b>
                  {t("hero_students_count")}
                </span>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="surface-card overflow-hidden rounded-[1.4rem] p-3 sm:p-4">
                <div className="rounded-[.9rem] bg-slate-950 p-4 sm:p-5 text-white">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/20">
                        <img
                          src="/brand/eduaccess-mark.png"
                          alt="Imkon Ta’lim"
                          className="h-11 w-12 object-contain"
                        />
                      </span>
                      <div>
                        <p className="eyebrow text-violet-300">
                          {t("today_lesson")}
                        </p>
                        <p className="mt-1 font-display text-base font-semibold">
                          {t("computer_basics")}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">
                      03 / 12
                    </span>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-[1.2fr_.8fr]">
                    <div className="relative overflow-hidden rounded-xl">
                      <img
                        src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&h=440&fit=crop&auto=format"
                        alt={t("alt_students_learning")}
                        className="h-48 w-full object-cover opacity-75 sm:h-full"
                      />
                      <span className="absolute bottom-3 left-3 rounded bg-black/75 px-2 py-1 text-xs">
                        {t("cc_uzbek_subtitle")}
                      </span>
                    </div>
                    <div className="rounded-xl bg-white/10 p-4">
                      <p className="text-xs text-slate-300">
                        {t("your_progress")}
                      </p>
                      <p className="mt-2 font-display text-4xl font-bold">
                        68%
                      </p>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                        <div className="h-full w-[68%] rounded-full bg-violet-300" />
                      </div>
                      <p className="mt-5 text-xs leading-relaxed text-slate-300">
                        {t("progress_desc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:-left-7">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                    <Volume2 className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {t("text_voicing")}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {t("speed_1x")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="py-8 sm:py-10 border-b border-slate-200 bg-white"
        aria-label={t("aria_stats")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200 gap-y-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center px-2">
                <div className="font-display font-bold text-2xl sm:text-3xl text-violet-700 mb-1">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-500">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section
        className="py-20 bg-[#fff9fb]"
        id="courses"
        aria-label={t("aria_popular_courses")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">
              {t("popular_courses_title")}
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              {t("popular_courses_desc")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <article
                key={course.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {course.hasSubtitles && (
                      <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                        CC
                      </span>
                    )}
                    {course.hasTranscript && (
                      <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">
                        📄
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full font-medium">
                      {course.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {course.level}
                    </span>
                  </div>
                  <h3 className="font-display font-semibold text-slate-900 mb-1 group-hover:text-violet-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>
                      {course.modulesCount} {t("course_modules")} ·{" "}
                      {course.lessonsCount} {t("course_lessons")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      {course.rating}
                    </span>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex items-center justify-between text-sm font-semibold text-violet-600 hover:text-violet-700"
                  >
                    {t("view_course")}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-violet-600 font-semibold hover:text-violet-700 transition-colors"
            >
              {t("view_all_courses")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Accessibility features */}
      <section
        className="scroll-mt-20 py-20 bg-white"
        id="features"
        aria-label={t("aria_accessibility")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">
              {t("accessibility_title")}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              {t("accessibility_desc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibilityFeatures.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all"
              >
                <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-slate-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        className="scroll-mt-20 py-20 bg-slate-900 text-white"
        id="about"
        aria-label={t("aria_how_it_works")}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl mb-3">
              {t("how_it_works_title")}
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              {t("how_it_works_desc")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-6 left-1/2 w-full h-px bg-violet-800"
                    aria-hidden="true"
                  />
                )}
                <div className="relative z-10 w-12 h-12 bg-violet-600 rounded-full flex items-center justify-center font-display font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 bg-violet-600 text-white"
        aria-label={t("aria_register")}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-4xl mb-4">
            {t("start_today_title")}
          </h2>
          <p className="text-violet-100 text-lg mb-8">{t("start_today_desc")}</p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-violet-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-violet-50 transition-colors shadow-lg"
          >
            {t("enter_platform")}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
