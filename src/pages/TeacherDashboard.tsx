import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen, Users, BarChart2, Plus, Edit2, Trash2, Eye,
  Video, FileText, HelpCircle, Upload, ChevronRight
} from "lucide-react";
import { DEMO_COURSES, DEMO_MODULES } from "../data/mockData";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/layout/Navbar";
import AccessibilityPanel from "../components/AccessibilityPanel";

type Tab = "courses" | "create" | "students" | "subtitles";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("courses");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  const teacherCourses = DEMO_COURSES.filter((c) => c.teacherId === user?.id || c.teacherId === "u2");

  const stats = [
    { icon: <BookOpen className="w-5 h-5" />, label: "Kurslar", value: teacherCourses.length, color: "teal" },
    { icon: <Users className="w-5 h-5" />, label: "O'quvchilar", value: teacherCourses.reduce((s, c) => s + c.enrolledCount, 0), color: "blue" },
    { icon: <BarChart2 className="w-5 h-5" />, label: "O'rtacha reyting", value: "4.7", color: "amber" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl text-slate-900">O'qituvchi paneli</h1>
          <p className="text-slate-500 text-sm mt-1">Kurslaringizni boshqaring va o'quvchilar natijalarini kuzating</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-center gap-2 text-slate-400 mb-2">{s.icon}</div>
              <div className="font-display font-bold text-2xl text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl border border-slate-100 p-1 mb-6 w-fit" role="tablist">
          {([
            { id: "courses", label: "Kurslar" },
            { id: "create", label: "Yangi kurs" },
            { id: "subtitles", label: "Subtitr muharrir" },
            { id: "students", label: "O'quvchilar" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-teal-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "courses" && (
          <div role="tabpanel">
            <div className="space-y-4">
              {teacherCourses.map((course) => {
                const modules = DEMO_MODULES.filter((m) => m.courseId === course.id);
                const isExpanded = expandedCourse === course.id;
                return (
                  <div key={course.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center gap-4 p-5">
                      <img src={course.thumbnail} alt={course.title} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-slate-900 mb-0.5">{course.title}</h3>
                        <p className="text-xs text-slate-400">{course.enrolledCount} o'quvchi · {course.lessonsCount} dars</p>
                        <div className="flex gap-1.5 mt-2">
                          {course.hasSubtitles && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">CC</span>}
                          {course.hasTranscript && <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Transkript</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/courses/${course.id}`}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label="Ko'rish"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          aria-label="Tahrirlash"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                          aria-expanded={isExpanded}
                          aria-label="Modullarni ko'rish"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-slate-100 px-5 pb-4 pt-3">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Modullar</h4>
                        <div className="space-y-2">
                          {modules.map((m) => (
                            <div key={m.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                              <span className="text-sm text-slate-700">{m.title}</span>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span>{m.lessons.filter((l) => l.type === "video").length} video</span>
                                <span>·</span>
                                <span>{m.lessons.filter((l) => l.type === "quiz").length} test</span>
                                <button className="p-1 hover:text-teal-600 transition-colors ml-1" aria-label={`${m.title} ni tahrirlash`}>
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="mt-3 flex items-center gap-1.5 text-teal-600 text-sm font-medium hover:text-teal-700 transition-colors">
                          <Plus className="w-4 h-4" />
                          Modul qo'shish
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "create" && (
          <div role="tabpanel">
            <div className="bg-white rounded-2xl border border-slate-100 p-8 max-w-2xl">
              <h2 className="font-display font-bold text-xl text-slate-900 mb-6">Yangi kurs yaratish</h2>
              <div className="space-y-5">
                <Field label="Kurs nomi" id="ct" placeholder="Kursning to'liq nomi" />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="desc">Tavsif</label>
                  <textarea
                    id="desc"
                    rows={4}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder="Kurs haqida qisqacha ma'lumot..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="cat">Kategoriya</label>
                    <select id="cat" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                      <option>IT</option>
                      <option>Kompyuter savodxonligi</option>
                      <option>Dasturlash</option>
                      <option>Dizayn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="lvl">Daraja</label>
                    <select id="lvl" className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                      <option>boshlangich</option>
                      <option>orta</option>
                      <option>yuqori</option>
                    </select>
                  </div>
                </div>

                {/* Upload area */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Muqova rasmi</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-teal-300 transition-colors cursor-pointer" role="button" tabIndex={0}>
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Rasm yuklash yoki bu yerga tashlang</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP — maksimal 5MB</p>
                  </div>
                </div>

                {/* Accessibility */}
                <div className="p-4 bg-teal-50 rounded-xl border border-teal-100">
                  <h3 className="text-sm font-semibold text-teal-800 mb-3">Accessibility imkoniyatlari</h3>
                  <div className="space-y-2">
                    {["Subtitrlar qo'shish", "Audio tavsif", "Transkript yaratish"].map((item) => (
                      <label key={item} className="flex items-center gap-2 text-sm text-teal-700 cursor-pointer">
                        <input type="checkbox" className="rounded border-teal-300 text-teal-600" defaultChecked />
                        {item}
                      </label>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors">
                  Kursni yaratish
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "subtitles" && <SubtitleEditor />}

        {tab === "students" && (
          <div role="tabpanel">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-display font-semibold text-slate-900">O'quvchilar natijalari</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">O'quvchi</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurs</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Test</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: "Alisher Qodirov", course: "Kompyuter savodxonligi", progress: 72, score: 80 },
                      { name: "Dilnoza Ergasheva", course: "Kompyuter savodxonligi", progress: 95, score: 92 },
                      { name: "Bobur Toshmatov", course: "Python asoslari", progress: 45, score: 70 },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-semibold">
                              {row.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <span className="font-medium text-slate-900">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{row.course}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-200 rounded-full">
                              <div className="h-1.5 bg-teal-500 rounded-full" style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="text-slate-600 text-xs">{row.progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            row.score >= 80 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {row.score}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
      <AccessibilityPanel />
    </div>
  );
}

function Field({ label, id, placeholder }: { label: string; id: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
      />
    </div>
  );
}

function SubtitleEditor() {
  const [segments, setSegments] = useState([
    { id: "1", start: "00:00:01", end: "00:00:05", text: "Assalomu alaykum, bugungi darsimizga xush kelibsiz." },
    { id: "2", start: "00:00:06", end: "00:00:12", text: "Bugun biz kompyuter nima ekanligi haqida gaplashamiz." },
    { id: "3", start: "00:00:13", end: "00:00:20", text: "Kompyuter — ma'lumotlarni qayta ishlash uchun elektron qurilma." },
  ]);

  const updateSegment = (id: string, field: string, value: string) => {
    setSegments((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSegment = () => {
    setSegments((prev) => [...prev, {
      id: String(Date.now()),
      start: "00:00:00",
      end: "00:00:05",
      text: "",
    }]);
  };

  const removeSegment = (id: string) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const exportVTT = () => {
    const vtt = ["WEBVTT", "", ...segments.map((s, i) =>
      `${i + 1}\n${s.start} --> ${s.end}\n${s.text}`
    )].join("\n\n");
    const blob = new Blob([vtt], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "subtitles.vtt";
    a.click();
  };

  return (
    <div role="tabpanel">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video preview */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-display font-semibold text-slate-900 mb-4">Video preview</h3>
          <div className="bg-slate-900 rounded-xl aspect-video flex items-center justify-center text-slate-400 text-sm">
            Video yuklanmagan
          </div>
          <div className="mt-4 flex justify-end">
            <button className="flex items-center gap-2 text-sm text-teal-600 font-medium hover:text-teal-700">
              <Upload className="w-4 h-4" />
              Video yuklash
            </button>
          </div>
        </div>

        {/* Subtitle editor */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-slate-900">Subtitrlar</h3>
            <button
              onClick={exportVTT}
              className="text-xs text-teal-600 font-semibold hover:text-teal-700 border border-teal-200 px-3 py-1.5 rounded-lg hover:bg-teal-50 transition-colors"
            >
              WebVTT export
            </button>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {segments.map((seg) => (
              <div key={seg.id} className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={seg.start}
                    onChange={(e) => updateSegment(seg.id, "start", e.target.value)}
                    className="w-28 px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                    aria-label="Boshlanish vaqti"
                  />
                  <span className="text-slate-400 text-xs">→</span>
                  <input
                    type="text"
                    value={seg.end}
                    onChange={(e) => updateSegment(seg.id, "end", e.target.value)}
                    className="w-28 px-2 py-1.5 text-xs border border-slate-200 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                    aria-label="Tugash vaqti"
                  />
                  <button
                    onClick={() => removeSegment(seg.id)}
                    className="ml-auto p-1 text-slate-300 hover:text-red-500 transition-colors"
                    aria-label="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={seg.text}
                  onChange={(e) => updateSegment(seg.id, "text", e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  aria-label="Subtitr matni"
                />
              </div>
            ))}
          </div>

          <button
            onClick={addSegment}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-teal-300 hover:text-teal-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Subtitr qo'shish
          </button>
        </div>
      </div>
    </div>
  );
}
