import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertCircle,
  RotateCcw, Trophy, BookOpen
} from "lucide-react";
import { DEMO_QUIZZES, DEMO_MODULES, DEMO_COURSES } from "../data/mockData";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/layout/Navbar";
import AccessibilityPanel from "../components/AccessibilityPanel";

type Phase = "quiz" | "result";

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const allLessons = DEMO_MODULES.flatMap((m) => m.lessons);
  const lesson = allLessons.find((l) => l.id === id);
  const module = lesson ? DEMO_MODULES.find((m) => m.id === lesson.moduleId) : undefined;
  const course = module ? DEMO_COURSES.find((c) => c.id === module.courseId) : undefined;

  // Find quiz for this lesson
  const quiz = DEMO_QUIZZES.find((q) => q.lessonId === id) || DEMO_QUIZZES[0];

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [phase, setPhase] = useState<Phase>("quiz");
  const [showExplanation, setShowExplanation] = useState(false);

  if (!quiz) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Test topilmadi</p>
          <Link to="/courses" className="text-teal-600 font-semibold">Kurslarga qaytish</Link>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQ];
  const totalQ = quiz.questions.length;
  const currentAnswers = answers[question.id] || [];

  const selectAnswer = (optionId: string) => {
    if (phase === "result") return;
    if (question.type === "single" || question.type === "truefalse") {
      setAnswers((a) => ({ ...a, [question.id]: [optionId] }));
    } else {
      const current = answers[question.id] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setAnswers((a) => ({ ...a, [question.id]: next }));
    }
  };

  const isCorrect = (qId: string) => {
    const q = quiz.questions.find((q) => q.id === qId);
    if (!q) return false;
    const ans = answers[qId] || [];
    return (
      ans.length === q.correctAnswers.length &&
      ans.every((a) => q.correctAnswers.includes(a))
    );
  };

  const score = quiz.questions.filter((q) => isCorrect(q.id)).length;
  const percent = Math.round((score / totalQ) * 100);

  const handleNext = () => {
    setShowExplanation(false);
    if (currentQ < totalQ - 1) setCurrentQ((q) => q + 1);
    else setPhase("result");
  };

  const handlePrev = () => {
    setShowExplanation(false);
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  };

  const reset = () => {
    setAnswers({});
    setCurrentQ(0);
    setPhase("quiz");
    setShowExplanation(false);
  };

  const getOptionState = (optId: string) => {
    const isSelected = currentAnswers.includes(optId);
    const isCorrectOpt = question.correctAnswers.includes(optId);
    if (showExplanation) {
      if (isCorrectOpt) return "correct";
      if (isSelected && !isCorrectOpt) return "wrong";
    }
    return isSelected ? "selected" : "default";
  };

  const optionStyles = {
    default: "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/30 text-slate-700",
    selected: "border-teal-500 bg-teal-50 text-teal-800",
    correct: "border-green-500 bg-green-50 text-green-800",
    wrong: "border-red-400 bg-red-50 text-red-700",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          to={course ? `/courses/${course.id}` : "/courses"}
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-600 text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {quiz.title}
        </Link>

        {phase === "quiz" ? (
          <div>
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-slate-500 mb-2">
                <span>Savol {currentQ + 1} / {totalQ}</span>
                <span>{Math.round(((currentQ) / totalQ) * 100)}% bajarildi</span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full">
                <div
                  className="h-2 bg-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentQ) / totalQ) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={currentQ + 1}
                  aria-valuemin={1}
                  aria-valuemax={totalQ}
                />
              </div>
            </div>

            {/* Question card */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-medium">
                  {question.type === "multiple" ? "Bir nechta to'g'ri javob" :
                   question.type === "truefalse" ? "To'g'ri/Noto'g'ri" : "Bir javob"}
                </span>
              </div>
              <h2 className="font-display font-semibold text-xl text-slate-900 leading-relaxed mb-6">
                {question.text}
              </h2>

              <fieldset>
                <legend className="sr-only">Javob variantlarini tanlang</legend>
                <div className="space-y-3" role="group">
                  {question.options.map((opt) => {
                    const state = getOptionState(opt.id);
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${optionStyles[state]}`}
                        aria-checked={currentAnswers.includes(opt.id)}
                      >
                        <input
                          type={question.type === "multiple" ? "checkbox" : "radio"}
                          name={`q-${question.id}`}
                          value={opt.id}
                          checked={currentAnswers.includes(opt.id)}
                          onChange={() => selectAnswer(opt.id)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          currentAnswers.includes(opt.id)
                            ? state === "wrong" ? "border-red-500 bg-red-500" : "border-teal-500 bg-teal-500"
                            : "border-slate-300"
                        }`}>
                          {state === "correct" && <CheckCircle className="w-3 h-3 text-white" />}
                          {state === "wrong" && <XCircle className="w-3 h-3 text-white" />}
                          {state === "selected" && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-sm font-medium">{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Explanation */}
              {showExplanation && question.explanation && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  {question.explanation}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handlePrev}
                disabled={currentQ === 0}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Oldingi
              </button>

              <div className="flex gap-2">
                {currentAnswers.length > 0 && !showExplanation && question.explanation && (
                  <button
                    onClick={() => setShowExplanation(true)}
                    className="px-4 py-2.5 border border-amber-200 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors"
                  >
                    Izoh
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={currentAnswers.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {currentQ === totalQ - 1 ? "Tugatish" : "Keyingi"}
                  {currentQ < totalQ - 1 && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Result screen */
          <div className="text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
              percent >= 70 ? "bg-green-50" : "bg-red-50"
            }`}>
              {percent >= 70 ? (
                <Trophy className="w-12 h-12 text-yellow-500" aria-hidden="true" />
              ) : (
                <XCircle className="w-12 h-12 text-red-400" aria-hidden="true" />
              )}
            </div>

            <h2 className="font-display font-bold text-3xl text-slate-900 mb-2">
              {percent >= 70 ? "Tabriklaymiz!" : "Qayta urinib ko'ring"}
            </h2>
            <p className="text-slate-500 mb-6">
              {score} / {totalQ} to'g'ri javob
            </p>

            <div className="relative w-32 h-32 mx-auto mb-8">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
                <circle cx="64" cy="64" r="54" fill="none" stroke="#E2E8F0" strokeWidth="12" />
                <circle
                  cx="64" cy="64" r="54" fill="none"
                  stroke={percent >= 70 ? "#0D9488" : "#F87171"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - percent / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-3xl text-slate-900">{percent}%</span>
              </div>
            </div>

            {/* Answer summary */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs mx-auto">
              <div className="bg-green-50 rounded-2xl p-4 text-center">
                <div className="font-display font-bold text-2xl text-green-600">{score}</div>
                <div className="text-xs text-green-700 mt-1">To'g'ri javoblar</div>
              </div>
              <div className="bg-red-50 rounded-2xl p-4 text-center">
                <div className="font-display font-bold text-2xl text-red-500">{totalQ - score}</div>
                <div className="text-xs text-red-600 mt-1">Xato javoblar</div>
              </div>
            </div>

            {/* Detailed answers */}
            <div className="text-left bg-white rounded-2xl border border-slate-100 divide-y divide-slate-100 mb-8">
              {quiz.questions.map((q, i) => {
                const correct = isCorrect(q.id);
                return (
                  <div key={q.id} className="p-4 flex items-start gap-3">
                    {correct ? (
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" aria-label="To'g'ri" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-label="Xato" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-1">{i + 1}. {q.text}</p>
                      {!correct && (
                        <p className="text-xs text-slate-500">
                          To'g'ri javob: {q.correctAnswers.map((a) => q.options.find((o) => o.id === a)?.text).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Qayta topshirish
              </button>
              <Link
                to={course ? `/courses/${course.id}` : "/dashboard"}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Kursga qaytish
              </Link>
            </div>
          </div>
        )}
      </main>
      <AccessibilityPanel />
    </div>
  );
}
