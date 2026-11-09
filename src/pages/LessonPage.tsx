import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  FileText,
  BookOpen,
  Subtitles,
  Mic,
  MicOff,
  Loader2,
  Download,
  Languages,
  PictureInPicture2,
  CheckCircle,
} from "lucide-react"
import { useCatalog } from "../contexts/CatalogContext"
import type { TranscriptSegment } from "../types"
import { useAuth } from "../contexts/AuthContext"
import { useEnrollment } from "../hooks/useEnrollment"
import { useAccessibility } from "../contexts/AccessibilityContext"
import { useLanguage } from "../contexts/LanguageContext"
import Navbar from "../components/layout/Navbar"
import AccessibilityPanel from "../components/AccessibilityPanel"
import CertificatePreview from "../components/certificate/CertificatePreview"
import EmbeddedVideoQuiz, {
  type EmbeddedQuiz,
} from "../components/learning/EmbeddedVideoQuiz"
import { api } from "../lib/api"
import { getSurdoImageUrl } from "../lib/surdo/images"
import {
  displaySurdoToken,
  SPACE_TOKEN,
  tokenizeSurdoText,
} from "../lib/surdo/tokenizer"

function parseVtt(content?: string): TranscriptSegment[] {
  if (!content) return []
  const toSeconds = (value: string) => {
    const parts = value.replace(",", ".").split(":").map(Number)
    return parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1]
  }
  const lines = content.replace(/\r/g, "").split("\n")
  const timingPattern =
    /^((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[.,]\d{3})/
  const segments: TranscriptSegment[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const timing = lines[index].trim().match(timingPattern)
    if (!timing) continue

    const textLines: string[] = []
    let cursor = index + 1
    while (cursor < lines.length) {
      const line = lines[cursor].trim()
      if (timingPattern.test(line)) break
      if (
        /^\d+$/.test(line) &&
        timingPattern.test(lines[cursor + 1]?.trim() || "")
      )
        break
      if (line && !line.startsWith("NOTE ")) textLines.push(line)
      cursor += 1
    }

    const text = textLines.join(" ").trim()
    if (text) {
      segments.push({
        id: `subtitle-${segments.length}`,
        startTime: toSeconds(timing[1]),
        endTime: toSeconds(timing[2]),
        text,
      })
    }
    index = Math.max(index, cursor - 1)
  }

  return segments
}

function formatFileSize(size?: number) {
  if (!size) return ""
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

const SURDO_SYNC_LEAD_SECONDS = 0
const SURDO_SPEECH_WINDOW_RATIO = 1
const SURDO_BASE_FRAME_SECONDS = 0.22

function getSurdoFrame(
  text: string,
  progress: number,
  speed: number,
  duration: number,
) {
  const words = text
    .trim()
    .split(/\s+|[.,!?;:()[\]{}"“”/\\–—-]+/)
    .map((sourceWord) => {
      const tokens = tokenizeSurdoText(sourceWord).filter(
        (token) => token !== SPACE_TOKEN,
      )
      const word = tokens.map(displaySurdoToken).join("")
      return { tokens, word }
    })
    .filter((item) => item.tokens.length > 0)

  if (!words.length) return null
  // Subtitr oralig'ining oxiri ko'pincha jim turish uchun qoldiriladi. So'zlarni
  // butun cue bo'ylab yoyish tarjimonni audiodan ortda qoldiradi, shuning uchun
  // gap oxiridagi vaqt oxirgi ishorani ushlab turishga ajratiladi.
  const safeProgress = Math.min(
    0.999999,
    Math.max(0, progress / SURDO_SPEECH_WINDOW_RATIO),
  )
  // Tezlik kadrning qancha vaqt ushlab turilishini boshqaradi. Jarayon video
  // vaqtiga bog'liq qoladi, shuning uchun past tezlikda ham matn kesilmaydi va
  // video oxirida tarjima to'liq ketma-ketlikning oxiriga yetadi.
  const frameProgress =
    SURDO_BASE_FRAME_SECONDS /
    Math.max(0.1, speed) /
    Math.max(0.1, duration)
  const displayedProgress = Math.min(
    0.999999,
    Math.floor(safeProgress / frameProgress) * frameProgress,
  )
  const wordPosition = Math.min(
    words.length - 0.000001,
    displayedProgress * words.length,
  )
  const word = words[Math.floor(wordPosition)]
  const letterProgress = wordPosition - Math.floor(wordPosition)
  const token = word.tokens[Math.floor(letterProgress * word.tokens.length)]
  return { token, word: word.word }
}

type Tab = "transcript" | "notes" | "materials"

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { courses, modules } = useCatalog()
  const { completeLesson, getEnrollment } = useEnrollment(user?.id)
  const { prefs } = useAccessibility()
  const { t, language } = useLanguage()
  const navigate = useNavigate()
  const [certificate, setCertificate] = useState<{
    fullName: string
    courseName: string
    completedAt: string
    score: number
    verificationCode?: string
  } | null>(null)
  const [completingLesson, setCompletingLesson] = useState(false)

  // Find lesson
  const allLessons = modules.flatMap((m) => m.lessons)
  const lesson = allLessons.find((l) => l.id === id)
  const module = lesson
    ? modules.find((m) => m.id === lesson.moduleId)
    : undefined
  const course = module
    ? courses.find((c) => c.id === module.courseId)
    : undefined
  const enrollment = course ? getEnrollment(course.id) : undefined
  const testUnlocked = Boolean(
    lesson?.type === "quiz" ||
      (lesson && enrollment?.completedLessons.includes(lesson.id)),
  )

  const allCourseLessons = module
    ? modules
        .filter((m) => m.courseId === module.courseId)
        .flatMap((m) => m.lessons)
    : []
  const lessonIndex = allCourseLessons.findIndex((l) => l.id === id)
  const prevLesson = lessonIndex > 0 ? allCourseLessons[lessonIndex - 1] : null
  const nextLesson =
    lessonIndex < allCourseLessons.length - 1
      ? allCourseLessons[lessonIndex + 1]
      : null
  const videoData = (lesson as typeof lesson & {
    video?: {
      subtitles?: Array<{
        content: string
        enabled: boolean
      }>
    }
  })?.video
  const subtitles = parseVtt(
    videoData?.subtitles?.find((item) => item.enabled)?.content,
  )
  const savedVideoScript = lesson?.content?.trim() || ""
  const videoSurdoText =
    savedVideoScript ||
    subtitles.map((item) => item.text).join(" ") ||
    lesson?.description ||
    lesson?.title ||
    ""

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null)
  const signVideoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [surdoPlaybackRate, setSurdoPlaybackRate] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState("")
  const [showSubtitles, setShowSubtitles] = useState(prefs.alwaysShowSubtitles)
  const [showSignLanguage, setShowSignLanguage] = useState(true)
  const [showSurdoTranslation, setShowSurdoTranslation] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("transcript")
  const [transcriptSearch, setTranscriptSearch] = useState("")
  const [voiceActive, setVoiceActive] = useState(false)
  const [voiceError, setVoiceError] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const [embeddedQuizzes, setEmbeddedQuizzes] = useState<EmbeddedQuiz[]>([])
  const [passedEmbeddedQuizIds, setPassedEmbeddedQuizIds] = useState<Set<string>>(
    new Set(),
  )
  const [activeEmbeddedQuizId, setActiveEmbeddedQuizId] = useState("")
  const [embeddedQuizOpen, setEmbeddedQuizOpen] = useState(false)
  const [embeddedQuizError, setEmbeddedQuizError] = useState("")

  const embeddedQuizSummaries = useMemo(
    () =>
      (lesson?.quizzes || [])
        .filter(
          (quiz) =>
            quiz.status === "published" &&
            typeof quiz.interruptAtSeconds === "number",
        )
        .sort(
          (first, second) =>
            first.interruptAtSeconds! - second.interruptAtSeconds!,
        ),
    [lesson?.quizzes],
  )
  const hasEmbeddedQuizzes =
    user?.role === "student" && embeddedQuizSummaries.length > 0
  const activeEmbeddedQuiz = embeddedQuizzes.find(
    (quiz) => quiz.id === activeEmbeddedQuizId,
  )
  const allEmbeddedQuizzesPassed = embeddedQuizSummaries.every((quiz) =>
    passedEmbeddedQuizIds.has(quiz.id),
  )
  const nextPendingCheckpoint = (targetTime = Number.POSITIVE_INFINITY) =>
    embeddedQuizSummaries.find(
      (quiz) =>
        !passedEmbeddedQuizIds.has(quiz.id) &&
        quiz.interruptAtSeconds! <= targetTime,
    )

  const loadEmbeddedQuizzes = useCallback(async () => {
    if (!hasEmbeddedQuizzes) return
    setEmbeddedQuizError("")
    try {
      const results = await Promise.all(
        embeddedQuizSummaries.map((summary) =>
          api<{ quiz: EmbeddedQuiz }>(`/quizzes/${summary.id}`),
        ),
      )
      const quizzes = results.map(({ quiz }) => ({
        ...quiz,
        questions: quiz.questions.map((question) => ({
          ...question,
          type: question.type
            .toLowerCase()
            .replace("true_false", "truefalse") as typeof question.type,
          correctAnswers: question.correctAnswers || [],
        })),
      }))
      setEmbeddedQuizzes(quizzes)
      setPassedEmbeddedQuizIds(
        new Set(quizzes.filter((quiz) => quiz.alreadyPassed).map((quiz) => quiz.id)),
      )
    } catch (error) {
      setEmbeddedQuizError(
        error instanceof Error ? error.message : "Testni yuklab bo‘lmadi",
      )
    }
  }, [hasEmbeddedQuizzes, embeddedQuizSummaries])

  useEffect(() => {
    setEmbeddedQuizzes([])
    setPassedEmbeddedQuizIds(new Set())
    setActiveEmbeddedQuizId("")
    setEmbeddedQuizOpen(false)
    setEmbeddedQuizError("")
    void loadEmbeddedQuizzes()
  }, [lesson?.id, loadEmbeddedQuizzes])

  useEffect(() => {
    if (
      embeddedQuizOpen &&
      activeEmbeddedQuizId &&
      passedEmbeddedQuizIds.has(activeEmbeddedQuizId)
    ) {
      setEmbeddedQuizOpen(false)
      setActiveEmbeddedQuizId("")
    }
  }, [embeddedQuizOpen, activeEmbeddedQuizId, passedEmbeddedQuizIds])

  // TTS
  const ttsRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [ttsPlaying, setTtsPlaying] = useState(false)

  // Current subtitle
  const currentSubtitle = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime,
  )
  const surdoTime = Math.min(
    duration || Number.POSITIVE_INFINITY,
    currentTime + SURDO_SYNC_LEAD_SECONDS,
  )
  const currentSurdoSubtitle = subtitles.find(
    (s) => surdoTime >= s.startTime && surdoTime <= s.endTime,
  )
  const activeSurdoSegment = savedVideoScript
    ? {
        text: savedVideoScript,
        startTime: 0,
        endTime: duration || 1,
      }
    : currentSurdoSubtitle ||
      (!subtitles.length && videoSurdoText
        ? {
            text: videoSurdoText,
            startTime: 0,
            endTime: duration || 1,
          }
        : null)
  const surdoFrame = activeSurdoSegment
    ? getSurdoFrame(
        activeSurdoSegment.text,
        (surdoTime - activeSurdoSegment.startTime) /
          Math.max(
            0.1,
            activeSurdoSegment.endTime - activeSurdoSegment.startTime,
          ),
        surdoPlaybackRate,
        Math.max(
          0.1,
          activeSurdoSegment.endTime - activeSurdoSegment.startTime,
        ),
      )
    : null
  const surdoImageUrl = getSurdoImageUrl(surdoFrame?.token || null)
  const surdoTransitionMs = Math.max(45, Math.round(260 / surdoPlaybackRate))
  // Active transcript segment
  const activeTranscript = subtitles.find(
    (s) => currentTime >= s.startTime && currentTime <= s.endTime,
  )

  const filteredTranscripts = subtitles.filter(
    (s) =>
      !transcriptSearch ||
      s.text.toLowerCase().includes(transcriptSearch.toLowerCase()),
  )

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (embeddedQuizOpen) return
    if (playing) v.pause()
    else v.play()
  }, [playing, embeddedQuizOpen])

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (v) {
      const checkpoint = hasEmbeddedQuizzes
        ? nextPendingCheckpoint(v.currentTime)
        : undefined
      if (checkpoint) {
        v.currentTime = checkpoint.interruptAtSeconds!
        v.pause()
        signVideoRef.current?.pause()
        setCurrentTime(checkpoint.interruptAtSeconds!)
        setActiveEmbeddedQuizId(checkpoint.id)
        setEmbeddedQuizOpen(true)
        return
      }
      setCurrentTime(v.currentTime)
      const signVideo = signVideoRef.current
      if (
        showSignLanguage &&
        signVideo &&
        Math.abs(signVideo.currentTime - v.currentTime) > 0.5
      )
        signVideo.currentTime = v.currentTime
    }
  }

  useEffect(() => {
    if (!playing) return

    let animationFrame = 0
    let lastUpdate = 0
    const updateClock = (timestamp: number) => {
      const video = videoRef.current
      if (video && timestamp - lastUpdate >= 50) {
        setCurrentTime(video.currentTime)
        lastUpdate = timestamp
      }
      animationFrame = requestAnimationFrame(updateClock)
    }

    animationFrame = requestAnimationFrame(updateClock)
    return () => cancelAnimationFrame(animationFrame)
  }, [playing])

  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (v) setDuration(v.duration)
  }

  const handleVolumeChange = (val: number) => {
    const v = videoRef.current
    setVolume(val)
    if (v) v.volume = val
  }

  const handleSeek = (val: number) => {
    const v = videoRef.current
    if (v) {
      const checkpoint = hasEmbeddedQuizzes
        ? nextPendingCheckpoint(val)
        : undefined
      const nextTime = checkpoint?.interruptAtSeconds ?? val
      v.currentTime = nextTime
      setCurrentTime(nextTime)
      if (signVideoRef.current) signVideoRef.current.currentTime = nextTime
      if (checkpoint) {
        v.pause()
        setActiveEmbeddedQuizId(checkpoint.id)
        setEmbeddedQuizOpen(true)
      }
    }
  }

  const continueAfterEmbeddedQuiz = () => {
    if (!activeEmbeddedQuiz) return
    setPassedEmbeddedQuizIds((current) => {
      const next = new Set(current)
      next.add(activeEmbeddedQuiz.id)
      return next
    })
    setEmbeddedQuizOpen(false)
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(
      video.duration || Number.POSITIVE_INFINITY,
      activeEmbeddedQuiz.interruptAtSeconds + 0.1,
    )
    setActiveEmbeddedQuizId("")
    window.setTimeout(() => video.play().catch(() => undefined), 0)
  }

  const seekToTranscript = (time: number) => {
    const v = videoRef.current
    if (v) {
      v.currentTime = time
      setCurrentTime(time)
      if (!playing) v.play()
    }
  }

  const handlePlaybackRate = (rate: number) => {
    const v = videoRef.current
    setPlaybackRate(rate)
    if (v) v.playbackRate = rate
    if (signVideoRef.current) signVideoRef.current.playbackRate = rate
  }

  const toggleSignLanguage = () => {
    if (showSignLanguage) {
      signVideoRef.current?.pause()
      setShowSignLanguage(false)
      return
    }
    setShowSignLanguage(true)
    const mainVideo = videoRef.current
    const signVideo = signVideoRef.current
    if (mainVideo && signVideo) {
      signVideo.currentTime = mainVideo.currentTime
      signVideo.playbackRate = mainVideo.playbackRate
      if (!mainVideo.paused) signVideo.play().catch(() => undefined)
    }
  }

  const toggleFullscreen = async () => {
    setFullscreenError("")
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined)
      setFullscreen(false)
      return
    }
    if (fullscreen) {
      setFullscreen(false)
      return
    }
    const container = containerRef.current
    const video = videoRef.current as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void
    } | null
    try {
      if (container?.requestFullscreen) {
        await container.requestFullscreen()
      } else if (video?.webkitEnterFullscreen) {
        video.webkitEnterFullscreen()
      } else {
        setFullscreen(true)
      }
    } catch {
      // Embedded previewlar native fullscreenni bloklasa, ekran o‘lchamidagi
      // xavfsiz CSS rejimi ishlatiladi.
      setFullscreen(true)
      setFullscreenError(
        "Brauzer fullscreenni chekladi — keng ekran rejimi yoqildi",
      )
    }
  }

  const markLessonComplete = async () => {
    if (user && course && lesson && !completingLesson) {
      setCompletingLesson(true)
      const completed = await completeLesson(
        course.id,
        lesson.id,
        allCourseLessons.length,
      )
      if (
        completed?.progress === 100 &&
        completed.certificateEligible &&
        completed.certificateScore !== undefined
      ) {
        setCertificate({
          fullName: `${user.firstName} ${user.lastName}`,
          courseName: course.title,
          completedAt: completed.completedAt || completed.lastActivityAt,
          score: completed.certificateScore,
          verificationCode: completed.certificateVerificationCode,
        })
      }
      setCompletingLesson(false)
    }
  }

  const handleEnded = async () => {
    setPlaying(false)
    signVideoRef.current?.pause()
    const pendingCheckpoint = hasEmbeddedQuizzes
      ? nextPendingCheckpoint()
      : undefined
    if (pendingCheckpoint) {
      setActiveEmbeddedQuizId(pendingCheckpoint.id)
      setEmbeddedQuizOpen(true)
      return
    }
    await markLessonComplete()
  }

  // Keyboard shortcuts
  useEffect(() => {
    const syncFullscreen = () =>
      setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", syncFullscreen)
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen)
  }, [])

  useEffect(() => {
    const mainVideo = videoRef.current
    const signVideo = signVideoRef.current
    if (!showSignLanguage || !playing || !mainVideo || !signVideo) return
    signVideo.currentTime = mainVideo.currentTime
    signVideo.playbackRate = mainVideo.playbackRate
    signVideo.play().catch(() => undefined)
  }, [showSignLanguage, playing, videoData?.signLanguageUrl])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === " " || e.key === "k") {
        e.preventDefault()
        togglePlay()
      }
      if (e.key === "m") setMuted((v) => !v)
      if (e.key === "ArrowLeft") handleSeek(Math.max(0, currentTime - 10))
      if (e.key === "ArrowRight")
        handleSeek(Math.min(duration, currentTime + 10))
      if (e.key === "f") toggleFullscreen()
      if (e.key === "Escape" && fullscreen && !document.fullscreenElement)
        setFullscreen(false)
      if (e.key === "c") setShowSubtitles((v) => !v)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [togglePlay, currentTime, duration, fullscreen])

  // Voice control
  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setVoiceError(t("voiceControlNotSupported"))
      return
    }
    const rec = new SpeechRecognition()
    rec.lang =
      language === "en" ? "en-US" : language === "ru" ? "ru-RU" : "uz-UZ"
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript
        .toLowerCase()
        .trim()
      if (transcript.includes(t("voiceCmdPlay")) || transcript.includes("play"))
        togglePlay()
      else if (
        transcript.includes(t("voiceCmdPause")) ||
        transcript.includes("pauza")
      )
        togglePlay()
      else if (transcript.includes(t("voiceCmdNext")) && nextLesson)
        navigate(`/lesson/${nextLesson.id}`)
      else if (transcript.includes(t("voiceCmdPrev")) && prevLesson)
        navigate(`/lesson/${prevLesson.id}`)
      else if (transcript.includes(t("voiceCmdSubtitle")))
        setShowSubtitles((v) => !v)
    }
    rec.onerror = () => {
      setVoiceActive(false)
      setVoiceError(t("voiceRecognitionError"))
    }
    rec.start()
    recognitionRef.current = rec
    setVoiceActive(true)
    setVoiceError("")
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    setVoiceActive(false)
  }

  // TTS
  const startTTS = (text: string) => {
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = prefs.speechRate

    const langMap: Record<string, string> = {
      en: "en-US",
      ru: "ru-RU",
      uz: "uz-UZ",
      ko: "ko-KR",
      zh: "zh-CN",
    }
    utter.lang = langMap[language] || "uz-UZ"

    // Intelligent voice selection
    const voices = window.speechSynthesis.getVoices()
    let voice = voices.find((v) => v.lang.startsWith(utter.lang.split("-")[0]))

    // Fallback for Uzbek: If no Uzbek voice is available, use Turkish (tr-TR).
    // Turkish phonetic rules for Latin script are similar enough to make Uzbek highly intelligible.
    if (!voice && language === "uz") {
      voice = voices.find((v) => v.lang.startsWith("tr"))
    }

    if (voice) {
      utter.voice = voice
    }

    utter.onend = () => setTtsPlaying(false)
    utter.onerror = () => setTtsPlaying(false)
    ttsRef.current = utter
    window.speechSynthesis.speak(utter)
    setTtsPlaying(true)
  }

  const stopTTS = () => {
    window.speechSynthesis.cancel()
    setTtsPlaying(false)
  }

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-[#fff9fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">{t("lessonNotFound")}</p>
          <Link to="/courses" className="text-violet-600 font-semibold">
            {t("backToCourses")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="bg-slate-800 border-b border-slate-700 h-14 flex items-center px-4 gap-4 shrink-0">
        <Link
          to={course ? `/courses/${course.id}` : "/courses"}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          aria-label={t("backToCourse")}
        >
          <ChevronLeft className="w-4 h-4" />
          {course?.title}
        </Link>
        <span className="text-slate-600" aria-hidden="true">
          /
        </span>
        <span className="text-white text-sm font-medium truncate">
          {lesson.title}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {prevLesson && (
            <Link
              to={`/lesson/${prevLesson.id}`}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              aria-label={t("previousLesson")}
            >
              <SkipBack className="w-3.5 h-3.5" />
              {t("previous")}
            </Link>
          )}
          {nextLesson && (
            <Link
              to={
                nextLesson.type === "quiz"
                  ? `/quiz/${nextLesson.id}`
                  : `/lesson/${nextLesson.id}`
              }
              className="flex items-center gap-1 text-xs text-white bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg transition-colors"
              aria-label={t("nextLesson")}
            >
              {t("next")}
              <SkipForward className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main video area */}
        <div className="flex-1 flex flex-col overflow-auto">
          {/* Video */}
          <div
            ref={containerRef}
            className={`video-container bg-black relative group ${
              fullscreen
                ? "fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center"
                : ""
            }`}
          >
            <video
              ref={videoRef}
              src={lesson.videoUrl || undefined}
              poster={lesson.imageUrl || undefined}
              className={`w-full object-contain ${
                fullscreen ? "h-full max-h-none" : "max-h-[60vh]"
              }`}
              onPlay={() => {
                if (embeddedQuizOpen) {
                  videoRef.current?.pause()
                  return
                }
                setPlaying(true)
                const signVideo = signVideoRef.current
                if (showSignLanguage && signVideo) {
                  signVideo.currentTime = videoRef.current?.currentTime || 0
                  signVideo.play().catch(() => undefined)
                }
              }}
              onPause={() => {
                setPlaying(false)
                signVideoRef.current?.pause()
              }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => void handleEnded()}
              muted={muted}
              aria-label={lesson.title}
              onClick={togglePlay}
              style={{ cursor: "pointer" }}
            />

            {embeddedQuizOpen && activeEmbeddedQuiz && (
              <EmbeddedVideoQuiz
                key={activeEmbeddedQuiz.id}
                quiz={activeEmbeddedQuiz}
                onPassed={continueAfterEmbeddedQuiz}
              />
            )}
            {embeddedQuizOpen && !activeEmbeddedQuiz && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-6">
                <div className="max-w-md rounded-2xl bg-white p-6 text-center text-slate-900 shadow-2xl">
                  {embeddedQuizError ? (
                    <>
                      <p className="font-semibold text-red-700">
                        {embeddedQuizError}
                      </p>
                      <button
                        type="button"
                        onClick={() => void loadEmbeddedQuizzes()}
                        className="mt-4 rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white"
                      >
                        Qayta yuklash
                      </button>
                    </>
                  ) : (
                    <p className="font-semibold">Test yuklanmoqda...</p>
                  )}
                </div>
              </div>
            )}

            {showSignLanguage && videoData?.signLanguageUrl && (
              <div className="absolute bottom-24 right-3 z-20 w-32 overflow-hidden rounded-xl border-2 border-white/80 bg-slate-900 shadow-2xl sm:right-5 sm:w-48 lg:w-56">
                <video
                  ref={signVideoRef}
                  src={videoData.signLanguageUrl}
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={t("sign_language_aria")}
                  className="aspect-video w-full object-cover"
                />
                <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">
                  {t("sign_language")}
                </span>
              </div>
            )}

            {showSurdoTranslation && (
              <section
                className="absolute bottom-20 right-3 z-30 w-36 overflow-hidden rounded-xl border-2 border-amber-400/90 bg-slate-800 shadow-2xl sm:bottom-24 sm:right-5 sm:w-48 lg:w-56"
                aria-label={t("surdo_translator")}
              >
                <div className="flex items-center justify-between border-b border-slate-700 px-2.5 py-2">
                  <h2 className="text-[11px] font-bold text-white sm:text-xs">
                    {t("surdo_translator")}
                  </h2>
                  <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                    {surdoPlaybackRate}x
                  </span>
                </div>
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-violet-50 via-white to-violet-100 sm:h-36 lg:h-44">
                  <img
                    src="/surdo/avatar/female-teacher.png"
                    alt={t("surdo_avatar_alt")}
                    draggable={false}
                    className="surdo-avatar pointer-events-none absolute -bottom-2 -left-3 h-[108%] w-[70%] object-contain object-bottom"
                  />
                  {surdoImageUrl ? (
                    <img
                      key={surdoImageUrl}
                      src={surdoImageUrl}
                      alt={`${displaySurdoToken(surdoFrame!.token)} daktil harfi`}
                      draggable={false}
                      className="surdo-sign-hand pointer-events-none absolute -bottom-1 -right-4 h-[72%] w-[76%] object-contain drop-shadow-md"
                      style={{ animationDuration: `${surdoTransitionMs}ms` }}
                    />
                  ) : (
                    <p className="absolute bottom-2 right-2 w-[62%] rounded bg-white/90 px-2 py-1 text-center text-[10px] font-semibold text-slate-500 shadow sm:text-xs">
                      {surdoFrame
                        ? `${displaySurdoToken(surdoFrame.token)} ${t("surdo_image_missing")}`
                        : t("surdo_video_wait")}
                    </p>
                  )}
                </div>
                <div className="px-2 py-2 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-violet-400">
                    {t("surdo_word")}
                  </p>
                  <p
                    className="mt-0.5 truncate text-sm font-black text-white sm:text-base"
                    aria-live="polite"
                  >
                    {surdoFrame?.word || "—"}
                  </p>
                </div>
              </section>
            )}

            {/* Subtitle overlay */}
            {showSubtitles && currentSubtitle && (
              <div
                className="video-subtitle"
                role="status"
                aria-live="polite"
                aria-label={t("subtitleLabel")}
              >
                {currentSubtitle.text}
              </div>
            )}

            {/* Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-2 opacity-100 transition-opacity sm:p-3 md:p-4 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
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
                  aria-label={t("videoDuration")}
                  style={{
                    background: `linear-gradient(to right, #0D9488 ${(currentTime / (duration || 1)) * 100}%, #4B5563 ${(currentTime / (duration || 1)) * 100}%)`,
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    onClick={togglePlay}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    aria-label={playing ? t("pause") : t("play")}
                  >
                    {playing ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>

                  {videoData?.signLanguageUrl && (
                    <button
                      onClick={toggleSignLanguage}
                      className={`p-1.5 rounded transition-colors ${
                        showSignLanguage ? "bg-violet-600" : "hover:bg-white/10"
                      }`}
                      aria-label={
                        showSignLanguage
                          ? "Imo-ishora tarjimasini yashirish"
                          : "Imo-ishora tarjimasini ko‘rsatish"
                      }
                      aria-pressed={showSignLanguage}
                    >
                      <Languages className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    onClick={() => setMuted((v) => !v)}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    aria-label={muted ? t("unmuteBtn") : t("muteBtn")}
                  >
                    {muted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={muted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="hidden w-16 cursor-pointer sm:block"
                    aria-label={t("volume")}
                  />

                  <span className="whitespace-nowrap text-[10px] text-slate-300 sm:text-xs font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="ml-auto flex w-full items-center justify-end gap-1.5 sm:w-auto sm:gap-2">
                  {/* Playback rate */}
                  <select
                    value={playbackRate}
                    onChange={(e) => handlePlaybackRate(Number(e.target.value))}
                    className="bg-transparent text-xs text-white border border-white/20 rounded px-1.5 py-0.5 cursor-pointer"
                    aria-label={t("playbackRate")}
                    title={t("video_speed")}
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                      <option key={r} value={r} className="bg-slate-800">
                        {r}x
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setShowSubtitles((v) => !v)}
                    className={`p-1.5 rounded transition-colors ${
                      showSubtitles ? "bg-violet-600" : "hover:bg-white/10"
                    }`}
                    aria-label={
                      showSubtitles
                        ? t("turnOffSubtitles")
                        : t("turnOnSubtitles")
                    }
                    aria-pressed={showSubtitles}
                  >
                    <Subtitles className="w-4 h-4" />
                  </button>

                  <select
                    value={surdoPlaybackRate}
                    onChange={(event) =>
                      setSurdoPlaybackRate(Number(event.target.value))
                    }
                    className="rounded border border-amber-400/70 bg-slate-900 px-1.5 py-0.5 text-xs font-semibold text-amber-300"
                    aria-label={t("surdo_speed")}
                    title={t("surdo_speed")}
                  >
                    {[0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4].map((rate) => (
                      <option key={rate} value={rate} className="bg-slate-800">
                        S {rate}x
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowSurdoTranslation((value) => !value)}
                    className={`rounded p-1.5 transition-colors ${
                      showSurdoTranslation
                        ? "border border-amber-400 bg-transparent text-amber-300 ring-1 ring-amber-400/40"
                        : "hover:bg-white/10"
                    }`}
                    aria-label={
                      showSurdoTranslation ? t("hide_surdo") : t("show_surdo")
                    }
                    aria-pressed={showSurdoTranslation}
                    title={t("surdo_translator")}
                  >
                    <PictureInPicture2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    aria-label={
                      fullscreen ? t("exitFullscreen") : t("fullscreen")
                    }
                  >
                    {fullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          {fullscreenError && !fullscreen && (
            <p className="bg-amber-900/40 px-6 py-2 text-xs text-amber-200">
              {fullscreenError}
            </p>
          )}

          {/* Lesson title + voice control */}
          <div className="bg-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-lg">{lesson.title}</h1>
              <p className="text-slate-400 text-sm">{module?.title}</p>
            </div>
            <div className="flex items-center gap-2">
              {(!lesson.videoUrl || lesson.type !== "video") && (
                <button
                  type="button"
                  onClick={() => void markLessonComplete()}
                  disabled={completingLesson}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
                >
                  {completingLesson ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Darsni yakunlash
                </button>
              )}
              {lesson.quiz && testUnlocked && (
                <Link
                  to={`/quiz/${lesson.id}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  <BookOpen className="h-4 w-4" />
                  Testni boshlash
                </Link>
              )}
              {lesson.quiz && !testUnlocked && (
                <span className="inline-flex min-h-10 items-center rounded-lg border border-slate-600 px-3 text-xs font-semibold text-slate-400">
                  Test video tugagach ochiladi
                </span>
              )}
              {embeddedQuizSummaries.length > 0 && (
                <span
                  className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-xs font-semibold ${
                    allEmbeddedQuizzesPassed
                      ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                      : "border-amber-500/60 bg-amber-500/10 text-amber-200"
                  }`}
                >
                  {allEmbeddedQuizzesPassed && (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {allEmbeddedQuizzesPassed
                    ? `${embeddedQuizSummaries.length} ta video testi o‘tildi — sertifikatga qo‘shildi`
                    : `Video ichida ${embeddedQuizSummaries.length} ta majburiy test bor`}
                </span>
              )}
              <button
                onClick={voiceActive ? stopVoice : startVoice}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  voiceActive
                    ? "bg-red-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
                aria-label={
                  voiceActive ? t("stopVoiceControl") : t("startVoiceControl")
                }
                aria-pressed={voiceActive}
              >
                {voiceActive ? (
                  <Mic className="w-4 h-4" />
                ) : (
                  <MicOff className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {voiceActive ? t("listening") : t("voiceControl")}
                </span>
              </button>
            </div>
          </div>
          {voiceError && (
            <div
              className="bg-red-900/30 text-red-300 px-6 py-2 text-sm"
              role="alert"
            >
              {voiceError}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="bg-slate-800/50 px-6 py-2 text-xs text-slate-500 flex gap-4 flex-wrap">
            <span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                Space
              </kbd>{" "}
              {t("kbdPlayPause")}
            </span>
            <span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                ←→
              </kbd>{" "}
              {t("kbdTenSeconds")}
            </span>
            <span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                M
              </kbd>{" "}
              {t("kbdMute")}
            </span>
            <span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                C
              </kbd>{" "}
              {t("kbdSubtitles")}
            </span>
            <span>
              <kbd className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">
                F
              </kbd>{" "}
              {t("kbdFullscreen")}
            </span>
          </div>

          {/* Tabs */}
          <div className="bg-slate-800 border-t border-slate-700">
            <div className="flex" role="tablist">
              {[
                {
                  id: "transcript" as Tab,
                  icon: <FileText className="w-4 h-4" />,
                  label: t("transcript"),
                },
                {
                  id: "notes" as Tab,
                  icon: <BookOpen className="w-4 h-4" />,
                  label: t("notes"),
                },
                {
                  id: "materials" as Tab,
                  icon: <BookOpen className="w-4 h-4" />,
                  label: `${t("materials")} (${lesson.attachments?.length || 0})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? "border-violet-500 text-violet-400"
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
                <div role="tabpanel" aria-label={t("transcript")}>
                  <div className="relative mb-4">
                    <input
                      type="search"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      placeholder={t("searchInLesson")}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                      aria-label={t("searchInTranscript")}
                    />
                  </div>
                  <div
                    className="space-y-1"
                    role="list"
                    aria-label={t("transcriptSegments")}
                  >
                    {filteredTranscripts.map((seg) => {
                      const isActive = seg.id === activeTranscript?.id
                      return (
                        <button
                          key={seg.id}
                          role="listitem"
                          onClick={() => seekToTranscript(seg.startTime)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex gap-3 ${
                            isActive
                              ? "bg-violet-900/40 border-l-2 border-violet-500 text-violet-200"
                              : "text-slate-300 hover:bg-slate-700"
                          }`}
                          aria-label={`${formatTime(seg.startTime)}: ${seg.text}`}
                        >
                          <span className="text-xs font-mono text-slate-500 shrink-0 mt-0.5 w-10">
                            {formatTime(seg.startTime)}
                          </span>
                          <span>{seg.text}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* TTS controls */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">
                      {t("readTextLoud")}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          ttsPlaying
                            ? stopTTS()
                            : startTTS(
                                subtitles.map((s) => s.text).join(" ") ||
                                  lesson?.content ||
                                  lesson?.description ||
                                  lesson?.title ||
                                  "",
                              )
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          ttsPlaying
                            ? "bg-red-600 text-white"
                            : "bg-violet-600 text-white hover:bg-violet-500"
                        }`}
                        aria-label={
                          ttsPlaying ? t("pause") : t("readTranscript")
                        }
                      >
                        {ttsPlaying ? (
                          <>
                            <Pause className="w-4 h-4" /> {t("pause")}
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" /> {t("read")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div role="tabpanel" aria-label={t("notes")}>
                  <div className="max-w-none">
                    <h3 className="mb-3 text-base font-semibold text-white">
                      {t("lessonNotes")}
                    </h3>
                    {lesson.content?.trim() || lesson.description?.trim() ? (
                      <div className="whitespace-pre-wrap break-words rounded-xl border border-slate-700 bg-slate-900/40 p-4 text-sm leading-7 text-slate-200">
                        {lesson.content?.trim() || lesson.description?.trim()}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 p-6 text-center text-sm text-slate-400">
                        Bu dars uchun konspekt hali kiritilmagan.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "materials" && (
                <div role="tabpanel" aria-label={t("materials")}>
                  <p className="text-slate-400 text-sm mb-4">
                    {t("lessonMaterials")}
                  </p>
                  {lesson.attachments?.length ? (
                    <ul className="space-y-2">
                      {lesson.attachments.map((file) => (
                        <li key={file.id}>
                          <a
                            href={file.fileUrl}
                            download={file.name}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between w-full px-4 py-3 bg-slate-700 rounded-xl text-sm text-white hover:bg-slate-600 transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span>
                                <span className="block font-medium">
                                  {file.name}
                                </span>
                                {file.mimeType && (
                                  <span className="mt-0.5 block text-xs text-slate-400">
                                    {file.mimeType}
                                  </span>
                                )}
                              </span>
                            </span>
                            <span className="flex items-center gap-2 text-slate-400 text-xs">
                              {formatFileSize(file.size)}
                              <Download className="h-4 w-4 text-violet-400" />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-600 bg-slate-900/30 p-6 text-center text-sm text-slate-400">
                      {t("no_lesson_materials")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {certificate && (
        <CertificatePreview
          fullName={certificate.fullName}
          courseName={certificate.courseName}
          completedAt={certificate.completedAt}
          score={certificate.score}
          verificationCode={certificate.verificationCode}
          onClose={() => setCertificate(null)}
        />
      )}
      <AccessibilityPanel />
    </div>
  )
}
