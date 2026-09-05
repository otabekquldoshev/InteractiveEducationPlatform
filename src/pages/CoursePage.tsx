import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronDown, ChevronUp, Play, CheckCircle, FileText,
  Clock, Users, Star, BookOpen, ChevronLeft, Lock
} from "lucide-react";
import { DEMO_COURSES, DEMO_MODULES } from "../data/mockData";
import { useAuth } from "../contexts/AuthContext";
import { useEnrollment } from "../hooks/useEnrollment";
import Navbar from "../components/layout/Navbar";
import AccessibilityPanel from "../components/AccessibilityPanel";

export default function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getEnrollment, enroll } = useEnrollment(user?.id);
  const navigate = useNavigate();
  const [openModules, setOpenModules] = useState<Set<string>>(new Set(["m1"]));

  const course = DEMO_COURSES.find((c) => c.id === id);
  const modules = DEMO_MODULES.filter((m) => m.courseId === id);
  const enrollment = id ? getEnrollment(id) : undefined;

  if (!course) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Kurs topilmadi</p>
          <Link to="/courses" className="text-teal-600 font-semibold">← Kurslarga qaytish</Link>
        </div>
      </div>
    );
  }

  const toggleModule = (moduleId: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleEnroll = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    enroll(course.id);
  };

  const handleStartLesson = (lessonId: string, type: string) => {
    if (type === "quiz") {
      navigate(`/quiz/${lessonId}`);
    } else {
      navigate(`/lesson/${lessonId}`);
    }
  };

  const levelMap = { boshlangich: "Boshlang'ich", orta: "O'rta", yuqori: "Yuqori" };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main>
        {/* Hero */}
        <div className="bg-slate-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/courses"
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Barcha fanlar
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs bg-teal-900 text-teal-300 px-2.5 py-1 rounded-full font-medium">
                    {course.category}
                  </span>
                  <span className="text-xs text-slate-400">{levelMap[course.level]}</span>
                </div>
                <h1 className="font-display font-bold text-3xl mb-4">{course.title}</h1>
                <p className="text-slate-300 leading-relaxed mb-6">{course.description}</p>
                <div className="flex items-center gap-5 text-sm text-slate-300 flex-wrap mb-6">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                    {course.modulesCount} modul · {course.lessonsCount} dars
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-teal-400" />
                    {course.duration}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-teal-400" />
                    {course.enrolledCount.toLocaleString()} o'quvchi
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {course.rating}
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  O'qituvchi: <span className="text-white font-medium">{course.teacherName}</span>
                </p>
              </div>
              <div>
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full rounded-2xl object-cover aspect-video shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Module list */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-bold text-xl text-slate-900">Kurs tarkibi</h2>
                {enrollment && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full">
                      <div
                        className="h-1.5 bg-teal-500 rounded-full"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <span>{enrollment.progress}%</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {modules.map((module) => {
                  const isOpen = openModules.has(module.id);
                  const completedCount = module.lessons.filter((l) =>
                    enrollment?.completedLessons.includes(l.id)
                  ).length;
                  return (
                    <div key={module.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                        aria-expanded={isOpen}
                      >
                        <div>
                          <h3 className="font-display font-semibold text-slate-900">{module.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {module.lessons.length} dars · {completedCount}/{module.lessons.length} bajarildi
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {completedCount === module.lessons.length && module.lessons.length > 0 && (
                            <CheckCircle className="w-5 h-5 text-green-500" aria-label="Modul tugatildi" />
                          )}
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {isOpen && (
                        <ul className="border-t border-slate-100">
                          {module.lessons.map((lesson, i) => {
                            const completed = enrollment?.completedLessons.includes(lesson.id);
                            const isLocked = !enrollment && i > 0;
                            const typeIcon = lesson.type === "quiz" ? "📝" : lesson.type === "text" ? "📄" : "▶";
                            return (
                              <li key={lesson.id}>
                                <button
                                  onClick={() => !isLocked && handleStartLesson(lesson.id, lesson.type)}
                                  disabled={isLocked}
                                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-sm transition-colors ${
                                    isLocked
                                      ? "text-slate-300 cursor-not-allowed"
                                      : completed
                                      ? "text-teal-700 hover:bg-teal-50"
                                      : "text-slate-700 hover:bg-slate-50"
                                  }`}
                                  aria-label={`${lesson.title}${completed ? " — tugatildi" : ""}${isLocked ? " — qulflangan" : ""}`}
                                >
                                  <span className="w-6 text-center text-sm" aria-hidden="true">
                                    {completed ? (
                                      <CheckCircle className="w-4 h-4 text-teal-500 inline" />
                                    ) : isLocked ? (
                                      <Lock className="w-4 h-4 text-slate-300 inline" />
                                    ) : (
                                      typeIcon
                                    )}
                                  </span>
                                  <span className="flex-1 text-left">{lesson.title}</span>
                                  {lesson.duration && (
                                    <span className="text-xs text-slate-400">{lesson.duration}</span>
                                  )}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div>
              <div className="bg-white rounded-2xl border border-slate-100 p-6 sticky top-20">
                {enrollment ? (
                  <>
                    <div className="text-center mb-5">
                      <div className="text-3xl font-display font-bold text-teal-600 mb-1">
                        {enrollment.progress}%
                      </div>
                      <p className="text-sm text-slate-500">bajarildi</p>
                      <div className="h-2 bg-slate-100 rounded-full mt-3">
                        <div
                          className="h-2 bg-teal-500 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      to={`/lesson/${enrollment.lastLessonId || modules[0]?.lessons[0]?.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors mb-4"
                    >
                      <Play className="w-4 h-4" />
                      Davom ettirish
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-display font-bold text-slate-900 mb-1 text-center">
                      Bepul kurs
                    </p>
                    <p className="text-sm text-slate-500 text-center mb-5">To'liq kirish uchun yoziling</p>
                    <button
                      onClick={handleEnroll}
                      className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-teal-700 transition-colors mb-4"
                    >
                      Kursga yozilish
                    </button>
                  </>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    {course.lessonsCount} ta dars
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {course.duration} umumiy vaqt
                  </div>
                  {course.hasSubtitles && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="text-slate-400">CC</span>
                      Ko'p tilli subtitrlar
                    </div>
                  )}
                  {course.hasTranscript && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <FileText className="w-4 h-4 text-slate-400" />
                      Interaktiv transkript
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex gap-1.5 flex-wrap">
                    {course.hasSubtitles && (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg">CC Subtitrlar</span>
                    )}
                    {course.hasAudio && (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg">Audio</span>
                    )}
                    {course.hasTranscript && (
                      <span className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded-lg">Transkript</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AccessibilityPanel />
    </div>
  );
}
