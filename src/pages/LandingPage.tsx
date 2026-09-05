import { Link } from "react-router-dom";
import {
  ArrowRight, Play, Subtitles, Keyboard, Volume2, BookOpen,
  Users, Award, BarChart3, CheckCircle, Star, ChevronRight,
  Accessibility, FileText, Mic
} from "lucide-react";
import { DEMO_COURSES } from "../data/mockData";
import Footer from "../components/layout/Footer";

const stats = [
  { value: "5,000+", label: "Faol o'quvchilar" },
  { value: "120+", label: "Kurslar" },
  { value: "98%", label: "Mamnunlik darajasi" },
  { value: "24/7", label: "Qo'llab-quvvatlash" },
];

const accessibilityFeatures = [
  { icon: <Subtitles className="w-6 h-6" />, title: "Subtitrlar & Transkript", desc: "Har bir video uchun ko'p tilli subtitrlar va interaktiv transkript" },
  { icon: <Volume2 className="w-6 h-6" />, title: "Matn ovozlash", desc: "Barcha matnli kontent ovoz bilan o'qilishi mumkin" },
  { icon: <Keyboard className="w-6 h-6" />, title: "Klaviatura navigatsiyasi", desc: "Platforma to'liq klaviatura orqali boshqarilishi mumkin" },
  { icon: <Mic className="w-6 h-6" />, title: "Ovozli boshqaruv", desc: "Video va darslarga ovozli buyruqlar bilan boshqarish" },
  { icon: <BookOpen className="w-6 h-6" />, title: "Moslashuvchan interfeys", desc: "Shrift, kontrast, rang sxemasi individual sozlanadi" },
  { icon: <FileText className="w-6 h-6" />, title: "WCAG muvofiqlik", desc: "AA darajasida accessibility standartlariga mos interfeys" },
];

const howItWorks = [
  { step: "1", title: "Ro'yxatdan o'ting", desc: "Bepul ro'yxatdan o'ting va o'z accessibility sozlamalaringizni kiriting" },
  { step: "2", title: "Kurs tanlang", desc: "100+ kurs ichidan sizga mos bo'lganini tanlang" },
  { step: "3", title: "O'rganing", desc: "Video darslar, testlar va interaktiv materiallar bilan o'rganish" },
  { step: "4", title: "Sertifikat oling", desc: "Kursni tugatgach rasmiy sertifikat oling" },
];

export default function LandingPage() {
  const featuredCourses = DEMO_COURSES.slice(0, 3);

  return (
    <div className="min-h-screen page-shell mobile-safe">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#f6f7f4]">
        <div className="absolute inset-y-0 right-0 hidden w-[43%] bg-[#dff1e6] lg:block" aria-hidden="true" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative py-10 sm:py-16 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr] lg:gap-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white text-teal-800 px-3 py-1.5 rounded-full text-xs font-semibold mb-6 border border-teal-100 shadow-sm">
              <Accessibility className="w-4 h-4" aria-hidden="true" />
              INKLYUZIV TA’LIM PLATFORMASI
            </div>
            <h1 className="font-display font-bold text-[2.85rem] sm:text-6xl lg:text-7xl text-slate-900 leading-[.98] mb-6">
              Ta'lim{" "}
              <span className="text-teal-700">hamma uchun</span>{" "}
              ochiq
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-xl">
              Professional fanlarni o'rganish uchun zamonaviy, interaktiv va inklyuziv ta'lim platformasi.
              Har qanday imkoniyat darajasida sifatli ta'lim.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex justify-center items-center gap-2 bg-teal-700 text-white px-6 py-3.5 rounded-xl font-semibold text-base hover:bg-teal-800 transition-colors shadow-lg shadow-teal-700/15"
              >
                O'rganishni boshlash
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </Link>
              <Link
                to="/courses"
                className="inline-flex justify-center items-center gap-2 bg-white text-slate-800 px-6 py-3.5 rounded-xl font-semibold text-base hover:bg-slate-50 transition-colors border border-slate-300 shadow-sm"
              >
                <Play className="w-5 h-5 text-teal-600" aria-hidden="true" />
                Fanlarni ko'rish
              </Link>
            </div>
            <div className="mt-9 flex items-center gap-3 text-sm text-slate-600"><div className="flex -space-x-2"><span className="h-7 w-7 rounded-full border-2 border-[#f6f7f4] bg-amber-300" /><span className="h-7 w-7 rounded-full border-2 border-[#f6f7f4] bg-teal-500" /><span className="h-7 w-7 rounded-full border-2 border-[#f6f7f4] bg-slate-700" /></div><span><b className="text-slate-900">5 000+</b> o‘quvchi biz bilan o‘rganmoqda</span></div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="surface-card overflow-hidden rounded-[1.4rem] p-3 sm:p-4">
              <div className="rounded-[.9rem] bg-slate-950 p-4 sm:p-5 text-white">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><p className="eyebrow text-teal-300">Bugungi dars</p><p className="mt-1 font-display text-base font-semibold">Kompyuter asoslari</p></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-xs">03 / 12</span></div>
                <div className="mt-5 grid gap-4 sm:grid-cols-[1.2fr_.8fr]"><div className="relative overflow-hidden rounded-xl"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=700&h=440&fit=crop&auto=format" alt="Talabalar birgalikda o‘rganmoqda" className="h-48 w-full object-cover opacity-75 sm:h-full" /><span className="absolute bottom-3 left-3 rounded bg-black/75 px-2 py-1 text-xs">CC O‘zbekcha subtitr</span></div><div className="rounded-xl bg-white/10 p-4"><p className="text-xs text-slate-300">Sizning taraqqiyotingiz</p><p className="mt-2 font-display text-4xl font-bold">68%</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[68%] rounded-full bg-teal-300" /></div><p className="mt-5 text-xs leading-relaxed text-slate-300">Matnni tinglash, subtitr va transkript siz uchun doim bir joyda.</p></div></div>
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 rounded-xl border border-slate-200 bg-white p-3 shadow-lg sm:-left-7"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><Volume2 className="w-4 h-4" /></span><div><p className="text-xs font-bold text-slate-900">Matn ovozlanmoqda</p><p className="text-[11px] text-slate-500">1.0× tezlik</p></div></div></div>
          </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 sm:py-10 border-b border-slate-200 bg-white" aria-label="Statistika">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-200 gap-y-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center px-2">
                <div className="font-display font-bold text-2xl sm:text-3xl text-teal-700 mb-1">{s.value}</div>
                <div className="text-xs sm:text-sm text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="py-20 bg-slate-50" id="courses" aria-label="Mashhur kurslar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">Mashhur kurslar</h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Eng ko'p o'rganilayotgan kurslarni ko'ring va bugundan o'rganishni boshlang
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <article key={course.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-shadow group">
                <div className="relative overflow-hidden">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    {course.hasSubtitles && (
                      <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">CC</span>
                    )}
                    {course.hasTranscript && (
                      <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono">📄</span>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-medium">
                      {course.category}
                    </span>
                    <span className="text-xs text-slate-400">{course.level}</span>
                  </div>
                  <h3 className="font-display font-semibold text-slate-900 mb-1 group-hover:text-teal-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                    <span>{course.modulesCount} modul · {course.lessonsCount} dars</span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      {course.rating}
                    </span>
                  </div>
                  <Link
                    to={`/courses/${course.id}`}
                    className="flex items-center justify-between text-sm font-semibold text-teal-600 hover:text-teal-700"
                  >
                    Kursni ko'rish
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 text-teal-600 font-semibold hover:text-teal-700 transition-colors"
            >
              Barcha kurslarni ko'rish
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Accessibility features */}
      <section className="py-20 bg-white" id="features" aria-label="Accessibility imkoniyatlari">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl text-slate-900 mb-3">
              Accessibility imkoniyatlari
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Platformamiz barcha foydalanuvchilar uchun qulay bo'lishi uchun maxsus accessibility funksiyalari bilan jihozlangan
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibilityFeatures.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all">
                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-display font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-slate-900 text-white" id="about" aria-label="Qanday ishlaydi">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display font-bold text-3xl mb-3">Qanday ishlaydi?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              To'rtta oddiy qadam bilan sifatli ta'lim oling
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-1/2 w-full h-px bg-teal-800" aria-hidden="true" />
                )}
                <div className="relative z-10 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center font-display font-bold text-xl mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-teal-600 text-white" aria-label="Ro'yxatdan o'tish">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-4xl mb-4">Bugundan boshlang</h2>
          <p className="text-teal-100 text-lg mb-8">
            Bepul ro'yxatdan o'ting va birinchi darsingizni boshlang
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-teal-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-teal-50 transition-colors shadow-lg"
          >
            Bepul ro'yxatdan o'ting
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
