import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack,
  SkipForward, ChevronLeft, ChevronRight, FileText, BookOpen,
  Subtitles, Mic, MicOff, Loader2
} from "lucide-react";
import { DEMO_MODULES, DEMO_TRANSCRIPTS, DEMO_COURSES } from "../data/mockData";
import { useAuth } from "../contexts/AuthContext";
import { useEnrollment } from "../hooks/useEnrollment";
import { useAccessibility } from "../contexts/AccessibilityContext";
import Navbar from "../components/layout/Navbar";
import AccessibilityPanel from "../components/AccessibilityPanel";

const SUBTITLES = DEMO_TRANSCRIPTS;

type Tab = "transcript" | "notes" | "materials";

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { completeLesson } = useEnrollment(user?.id);
  const { prefs } = useAccessibility();
  const navigate = useNavigate();

  // Find lesson
  const allLessons = DEMO_MODULES.flatMap((m) => m.lessons);
  const lesson = allLessons.find((l) => l.id === id);
  const module = lesson ? DEMO_MODULES.find((m) => m.id === lesson.moduleId) : undefined;
  const course = module ? DEMO_COURSES.find((c) => c.id === module.courseId) : undefined;

  const allCourseLessons = module ? DEMO_MODULES.filter((m) => m.courseId === module.courseId).flatMap((m) => m.lessons) : [];
  const lessonIndex = allCourseLessons.findIndex((l) => l.id === id);
  const prevLesson = lessonIndex > 0 ? allCourseLessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < allCourseLessons.length - 1 ? allCourseLessons[lessonIndex + 1] : null;

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(prefs.alwaysShowSubtitles);
  const [activeTab, setActiveTab] = useState<Tab>("transcript");
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // TTS
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  // Current subtitle
  const currentSubtitle = SUBTITLES.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  // Active transcript segment
  const activeTranscript = SUBTITLES.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime
  );

  const filteredTranscripts = SUBTITLES.filter((s) =>
    !transcriptSearch || s.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause();
    else v.play();
  }, [playing]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v) setDuration(v.duration);
  };

  const handleVolumeChange = (val: number) => {
    const v = videoRef.current;
    setVolume(val);
    if (v) v.volume = val;
  };

  const handleSeek = (val: number) => {
    const v = videoRef.current;
    if (v) { v.currentTime = val; setCurrentTime(val); }
  };

  const seekToTranscript = (time: number) => {
    const v = videoRef.current;
    if (v) { v.currentTime = time; setCurrentTime(time); if (!playing) v.play(); }
  };

  const handlePlaybackRate = (rate: number) => {
    const v = videoRef.current;
    setPlaybackRate(rate);
    if (v) v.playbackRate = rate;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    if (user && course && lesson) {
      completeLesson(course.id, lesson.id, allCourseLessons.length);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === " " || e.key === "k") { e.preventDefault(); togglePlay(); }
      if (e.key === "m") setMuted((v) => !v);
      if (e.key === "ArrowLeft") handleSeek(Math.max(0, currentTime - 10));
      if (e.key === "ArrowRight") handleSeek(Math.min(duration, currentTime + 10));
      if (e.key === "f") toggleFullscreen();
      if (e.key === "c") setShowSubtitles((v) => !v);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [togglePlay, currentTime, duration]);

  // Voice control
  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setVoiceError("Brauzeringiz ovozli boshqaruvni qo'llab-quvvatlamaydi"); return; }
    const rec = new SpeechRecognition();
    rec.lang = "uz-UZ";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript.toLowerCase().trim();
      if (transcript.includes("boshlash") || transcript.includes("play")) togglePlay();
      else if (transcript.includes("to'xtatish") || transcript.includes("pauza")) togglePlay();
      else if (transcript.includes("keyingi") && nextLesson) navigate(`/lesson/${nextLesson.id}`);
      else if (transcript.includes("oldingi") && prevLesson) navigate(`/lesson/${prevLesson.id}`);
      else if (transcript.includes("subtitr")) setShowSubtitles((v) => !v);
    };
    rec.onerror = () => { setVoiceActive(false); setVoiceError("Ovoz tanib olishda xato"); };
    rec.start();
    recognitionRef.current = rec;
    setVoiceActive(true);
    setVoiceError("");
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setVoiceActive(false);
  };

  // TTS
  const startTTS = (text: string) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = prefs.speechRate;
    utter.lang = "uz-UZ";
    utter.onend = () => setTtsPlaying(false);
    ttsRef.current = utter;
    window.speechSynthesis.speak(utter);
    setTtsPlaying(true);
  };

  const stopTTS = () => {
    window.speechSynthesis.cancel();
    setTtsPlaying(false);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!lesson) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Dars topilmadi</p>
          <Link to="/courses" className="text-teal-600 font-semibold">← Kurslarga qaytish</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 h-14 flex items-center px-4 gap-4 shrink-0">
        <Link
          to={course ? `/courses/${course.id}` : "/courses"}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          aria-label="Kursga qaytish"
        >
          <ChevronLeft className="w-4 h-4" />
          {course?.title}
        </Link>
        <span className="text-slate-600" aria-hidden="true">/</span>
        <span className="text-white text-sm font-medium truncate">{lesson.title}</span>
        <div className="ml-auto flex items-center gap-2">
          {prevLesson && (
            <Link
              to={`/lesson/${prevLesson.id}`}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              aria-label="Oldingi dars"
            >
              <SkipBack className="w-3.5 h-3.5" />
              Oldingi
            </Link>
          )}
          {nextLesson && (
            <Link
              to={nextLesson.type === "quiz" ? `/quiz/${nextLesson.id}` : `/lesson/${nextLesson.id}`}
              className="flex items-center gap-1 text-xs text-white bg-teal-600 hover:bg-teal-500 px-3 py-1.5 rounded-lg transition-colors"
              aria-label="Keyingi dars"
            >
              Keyingi
              <SkipForward className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Video */}
          <div ref={containerRef} className="video-container bg-black relative group">
            <video
              ref={videoRef}
              src={lesson.videoUrl}
              className="w-full max-h-[60vh] object-contain"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              muted={muted}
              aria-label={lesson.title}
              onClick={togglePlay}
              style={{ cursor: "pointer" }}
            />

            {/* Subtitle overlay */}
            {showSubtitles && currentSubtitle && (
              <div
                className="video-subtitle"
                role="status"
                aria-live="polite"
                aria-label="Subtitr"
              >
                {currentSubtitle.text}
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
              {/* Progress */}
              <div className="mb-3">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="w-full cursor-pointer"
                  aria-label="Video davomiyligi"
                  style={{ background: `linear-gradient(to right, #0D9488 ${(currentTime / (duration || 1)) * 100}%, #4B5563 ${(currentTime / (duration || 1)) * 100}%)` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label={playing ? "To'xtatish" : "Boshlash"}
                  >
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setMuted((v) => !v)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    aria-label={muted ? "Ovozni yoqish" : "Ovozni o'chirish"}
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="w-16 cursor-pointer"
                    aria-label="Ovoz balandligi"
                  />

                  <span className="text-xs text-slate-300 font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Playback rate */}
                  <select
                    value={playbackRate}
                    onChange={(e) => handlePlaybackRate(Number(e.target.value))}
                    className="bg-transparent text-xs text-white border border-white/20 rounded px-1.5 py-0.5 cursor-pointer"
                    aria-label="O'ynash tezligi"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <option key={r} value={r} className="bg-slate-800">{r}x</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowSubtitles((v) => !v)}
                    className={`p-1.5 rounded transition-colors ${showSubtitles ? "bg-teal-600" : "hover:bg-white/10"}`}
                    aria-label={showSubtitles ? "Subtitrlarni o'chirish" : "Subtitrlarni yoqish"}
                    aria-pressed={showSubtitles}
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    aria-label={fullscreen ? "Kichraytirish" : "To'liq ekran"}
                  >
                    {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Lesson title + voice control */}
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-lg">{lesson.title}</h1>
              <p className="text-slate-400 text-sm">{module?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={voiceActive ? stopVoice : startVoice}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  voiceActive ? "bg-red-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                aria-label={voiceActive ? "Ovozli boshqaruvni to'xtatish" : "Ovozli boshqaruvni yoqish"}
                aria-pressed={voiceActive}
              >
                {voiceActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{voiceActive ? "Tinglayapti..." : "Ovozli boshqaruv"}</span>
              </button>
            </div>
          </div>
          {voiceError && (
            <div className="bg-red-900/30 text-red-300 px-6 py-2 text-sm" role="alert">{voiceError}</div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="bg-slate-800/50 px-6 py-2 text-xs text-slate-500 flex gap-4 flex-wrap">
            <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">Space</kbd> Play/Pause</span>
            <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">←→</kbd> 10s</span>
            <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">M</kbd> Mute</span>
            <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">C</kbd> Subtitles</span>
            <span><kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">F</kbd> Fullscreen</span>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800 border-t border-slate-700">
            <div className="flex" role="tablist">
              {[
                { id: "transcript" as Tab, icon: <FileText className="w-4 h-4" />, label: "Transkript" },
                { id: "notes" as Tab, icon: <BookOpen className="w-4 h-4" />, label: "Konspekt" },
                { id: "materials" as Tab, icon: <BookOpen className="w-4 h-4" />, label: "Materiallar" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-teal-500 text-teal-400"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-5 max-h-80 overflow-y-auto">
              {activeTab === "transcript" && (
                <div role="tabpanel" aria-label="Transkript">
                  <div className="relative mb-4">
                    <input
                      type="search"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      placeholder="Dars ichidan qidirish..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      aria-label="Transkriptdan qidirish"
                    />
                  </div>
                  <div className="space-y-1" role="list" aria-label="Transkript segmentlari">
                    {filteredTranscripts.map((seg) => {
                      const isActive = seg.id === activeTranscript?.id;
                      return (
                        <button
                          key={seg.id}
                          role="listitem"
                          onClick={() => seekToTranscript(seg.startTime)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex gap-3 ${
                            isActive
                              ? "bg-teal-900/40 border-l-2 border-teal-500 text-teal-200"
                              : "text-slate-300 hover:bg-slate-700"
                          }`}
                          aria-label={`${formatTime(seg.startTime)}: ${seg.text}`}
                        >
                          <span className="text-xs font-mono text-slate-500 shrink-0 mt-0.5 w-10">
                            {formatTime(seg.startTime)}
                          </span>
                          <span>{seg.text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TTS controls */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Matnni ovoz bilan o'qish:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => ttsPlaying ? stopTTS() : startTTS(DEMO_TRANSCRIPTS.map((s) => s.text).join(" "))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          ttsPlaying ? "bg-red-600 text-white" : "bg-teal-600 text-white hover:bg-teal-500"
                        }`}
                        aria-label={ttsPlaying ? "To'xtatish" : "Transkriptni o'qish"}
                      >
                        {ttsPlaying ? (
                          <><Pause className="w-4 h-4" /> To'xtatish</>
                        ) : (
                          <><Play className="w-4 h-4" /> O'qish</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div role="tabpanel" aria-label="Konspekt">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <h3 className="text-white font-semibold mb-3">Dars konspekti</h3>
                    <ul className="space-y-2 text-slate-300 text-sm">
                      <li>🖥️ <strong>Kompyuter</strong> — ma'lumotlarni qayta ishlash va saqlash uchun elektron qurilma</li>
                      <li>⚙️ <strong>Hardware</strong> — fizik qismlar: monitor, klaviatura, sichqoncha</li>
                      <li>💿 <strong>Software</strong> — dasturlar va operatsion tizim</li>
                      <li>🧠 <strong>CPU</strong> — markaziy protsessor, kompyuterning "miyasi"</li>
                      <li>💾 <strong>RAM</strong> — operativ xotira, vaqtinchalik ma'lumot saqlash</li>
                      <li>🗄️ <strong>HDD/SSD</strong> — doimiy xotira, fayllar saqlanadi</li>
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "materials" && (
                <div role="tabpanel" aria-label="Materiallar">
                  <p className="text-slate-400 text-sm mb-4">Dars materiallari</p>
                  <ul className="space-y-2">
                    {[
                      { name: "Kompyuter asoslari.pdf", size: "2.4 MB" },
                      { name: "Hardware va Software.pptx", size: "5.1 MB" },
                      { name: "Amaliy vazifalar.docx", size: "0.8 MB" },
                    ].map((f) => (
                      <li key={f.name}>
                        <button className="flex items-center justify-between w-full px-4 py-3 bg-slate-700 rounded-xl text-sm text-white hover:bg-slate-600 transition-colors">
                          <span className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            {f.name}
                          </span>
                          <span className="text-slate-400 text-xs">{f.size}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <AccessibilityPanel />
    </div>
  );
}
