import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, BookOpen, Clock, Users, Filter } from "lucide-react";
import { DEMO_COURSES } from "../data/mockData";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import AccessibilityPanel from "../components/AccessibilityPanel";

const CATEGORIES = ["Barchasi", "IT", "Kompyuter savodxonligi", "Dasturlash", "Dizayn", "Boshqa"];
const LEVELS = ["Barchasi", "boshlangich", "orta", "yuqori"];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Barchasi");
  const [level, setLevel] = useState("Barchasi");

  const filtered = DEMO_COURSES.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "Barchasi" || c.category === category;
    const matchLevel = level === "Barchasi" || c.level === level;
    return matchSearch && matchCategory && matchLevel;
  });

  return (
    <div className="min-h-screen page-shell flex flex-col mobile-safe">
      <Navbar />
      <main className="flex-1">
        {/* Header */}
        <div className="bg-slate-950 text-white py-9 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="eyebrow text-teal-300 mb-3">Kurslar kutubxonasi</p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl tracking-tight mb-3">O‘zingizga mos<br className="hidden sm:block" /> fanlarni tanlang</h1>
            <p className="text-slate-300 mb-7 max-w-xl">Professional kurslarni o'rganing va yangi ko'nikmalar egallang</p>

            {/* Search */}
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Fanlarni qidirish..."
                className="w-full pl-12 pr-4 py-3.5 border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent bg-white text-slate-900 shadow-lg"
                aria-label="Fanlarni qidirish"
              />
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col gap-5 mb-8 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:p-5 shadow-sm">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Kategoriya</label>
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Kategoriya filtri">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    aria-pressed={category === cat}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      category === cat
                        ? "bg-teal-600 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Daraja</label>
              <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Daraja filtri">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    aria-pressed={level === l}
                    className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                      level === l
                        ? "bg-slate-800 text-white"
                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {l === "Barchasi" ? l : l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          <p className="text-sm text-slate-500 mb-5" aria-live="polite">
            {filtered.length} ta kurs topildi
          </p>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Hech narsa topilmadi</p>
              <button
                onClick={() => { setSearch(""); setCategory("Barchasi"); setLevel("Barchasi"); }}
                className="mt-3 text-teal-600 text-sm font-medium hover:text-teal-700"
              >
                Filtrlarni tozalash
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <AccessibilityPanel />
    </div>
  );
}

function CourseCard({ course }: { course: (typeof DEMO_COURSES)[0] }) {
  const levelMap = { boshlangich: "Boshlang'ich", orta: "O'rta", yuqori: "Yuqori" };
  const levelColors = {
    boshlangich: "bg-green-50 text-green-700",
    orta: "bg-amber-50 text-amber-700",
    yuqori: "bg-red-50 text-red-700",
  };

  return (
    <article className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-900/10 transition-all hover:-translate-y-1 group">
      <div className="relative overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {course.hasSubtitles && (
            <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded font-mono" title="Subtitrlar mavjud">CC</span>
          )}
          {course.hasAudio && (
            <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded" title="Audio mavjud">🔊</span>
          )}
          {course.hasTranscript && (
            <span className="bg-black/70 text-white text-xs px-2 py-0.5 rounded" title="Transkript mavjud">📄</span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColors[course.level]}`}>
            {levelMap[course.level]}
          </span>
        </div>
      </div>
      <div className="p-5">
        <div className="eyebrow text-teal-700 mb-2">{course.category}</div>
        <h3 className="font-display font-semibold text-slate-900 mb-1.5 group-hover:text-teal-600 transition-colors line-clamp-2">
          {course.title}
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">{course.description}</p>
        <p className="text-xs text-slate-500 mb-3">{course.teacherName}</p>
        <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.modulesCount} modul · {course.lessonsCount} dars
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-slate-700">{course.rating}</span>
            <span className="text-xs text-slate-400">({course.enrolledCount.toLocaleString()})</span>
          </div>
          <Link
            to={`/courses/${course.id}`}
            className="inline-flex items-center rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-700 hover:text-white transition-colors"
          >
            Ko'rish →
          </Link>
        </div>
      </div>
    </article>
  );
}
