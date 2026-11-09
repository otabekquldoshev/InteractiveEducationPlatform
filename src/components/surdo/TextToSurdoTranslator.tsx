import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Image as ImageIcon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react"
import { getSurdoImageUrl } from "../../lib/surdo/images"
import {
  displaySurdoToken,
  SPACE_TOKEN,
  tokenizeSurdoText,
  type SurdoToken,
} from "../../lib/surdo/tokenizer"
import LetterQueue from "./LetterQueue"
import { useLanguage } from "../../contexts/LanguageContext"

type PlaybackState = "idle" | "loading" | "ready" | "playing" | "paused" | "completed" | "error"

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5]

function firstLetterIndex(tokens: SurdoToken[]) {
  return tokens.findIndex((token) => token !== SPACE_TOKEN)
}

function lastLetterIndex(tokens: SurdoToken[]) {
  return tokens.reduce(
    (result, token, index) => (token === SPACE_TOKEN ? result : index),
    -1,
  )
}

function waitForPlayback(
  duration: number,
  signal: AbortSignal,
  pausedRef: React.MutableRefObject<boolean>,
) {
  return new Promise<boolean>((resolve) => {
    let frame = 0
    let elapsed = 0
    let previous = performance.now()
    const finish = (result: boolean) => {
      cancelAnimationFrame(frame)
      signal.removeEventListener("abort", abort)
      resolve(result)
    }
    const abort = () => finish(false)
    const tick = (now: number) => {
      if (signal.aborted) return finish(false)
      if (!pausedRef.current) elapsed += now - previous
      previous = now
      if (elapsed >= duration) return finish(true)
      frame = requestAnimationFrame(tick)
    }
    signal.addEventListener("abort", abort, { once: true })
    frame = requestAnimationFrame(tick)
  })
}

export default function TextToSurdoTranslator({
  initialText = "",
  value,
  onTextChange,
  inputLabel = "O‘zbekcha matn",
  inputPlaceholder = "Masalan: SALOM",
}: {
  initialText?: string
  value?: string
  onTextChange?: (value: string) => void
  inputLabel?: string
  inputPlaceholder?: string
}) {
  const { t } = useLanguage()
  const stateLabels: Record<PlaybackState, string> = {
    idle: t("surdo_state_idle"),
    loading: t("surdo_state_loading"),
    ready: t("surdo_state_ready"),
    playing: t("surdo_state_playing"),
    paused: t("surdo_state_paused"),
    completed: t("surdo_state_completed"),
    error: t("surdo_state_error"),
  }
  const [internalText, setInternalText] = useState(initialText)
  const text = value ?? internalText
  const [realtime, setRealtime] = useState(true)
  const [speed, setSpeed] = useState(1)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [visibleToken, setVisibleToken] = useState<SurdoToken | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const pausedRef = useRef(false)
  const realtimeTimerRef = useRef<number | null>(null)
  const tokens = useMemo(() => tokenizeSurdoText(text), [text])
  const letterCount = tokens.filter((token) => token !== SPACE_TOKEN).length
  const firstIndex = firstLetterIndex(tokens)

  const cancelPlayback = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    pausedRef.current = false
  }, [])

  useEffect(() => {
    if (value !== undefined) return
    setInternalText(initialText)
  }, [initialText, value])

  const updateText = (nextText: string) => {
    if (value === undefined) setInternalText(nextText)
    onTextChange?.(nextText)
  }

  useEffect(() => {
    return () => {
      cancelPlayback()
      if (realtimeTimerRef.current !== null)
        window.clearTimeout(realtimeTimerRef.current)
    }
  }, [cancelPlayback])

  useEffect(() => {
    cancelPlayback()
    if (realtimeTimerRef.current !== null)
      window.clearTimeout(realtimeTimerRef.current)
    const nextIndex = realtime
      ? lastLetterIndex(tokens)
      : firstLetterIndex(tokens)
    setActiveIndex(nextIndex)
    setPlaybackState(tokens.length ? "ready" : "idle")
    if (nextIndex < 0) {
      setVisibleToken(null)
      return
    }
    realtimeTimerRef.current = window.setTimeout(
      () => {
        setVisibleToken(tokens[nextIndex])
      },
      realtime ? 90 : 0,
    )
  }, [tokens, realtime, cancelPlayback])

  const playFrom = useCallback(
    async (startIndex: number) => {
      if (firstIndex < 0) return
      cancelPlayback()
      const controller = new AbortController()
      abortRef.current = controller
      pausedRef.current = false
      setPlaybackState("playing")
      const letterDuration = 900 / speed

      for (
        let index = Math.max(0, startIndex);
        index < tokens.length;
        index += 1
      ) {
        if (controller.signal.aborted) return
        const token = tokens[index]
        setActiveIndex(index)
        setVisibleToken(token === SPACE_TOKEN ? null : token)
        const held = await waitForPlayback(
          letterDuration * (token === SPACE_TOKEN ? 0.58 : 0.76),
          controller.signal,
          pausedRef,
        )
        if (!held) return
        if (token !== SPACE_TOKEN) {
          setVisibleToken(null)
          const transitioned = await waitForPlayback(
            letterDuration * 0.24,
            controller.signal,
            pausedRef,
          )
          if (!transitioned) return
        }
      }

      const finalIndex = lastLetterIndex(tokens)
      if (finalIndex >= 0) {
        setActiveIndex(finalIndex)
        setVisibleToken(tokens[finalIndex])
      }
      abortRef.current = null
      setPlaybackState("completed")
    },
    [cancelPlayback, firstIndex, speed, tokens],
  )

  const togglePause = () => {
    if (playbackState === "playing") {
      pausedRef.current = true
      setPlaybackState("paused")
    } else if (playbackState === "paused") {
      pausedRef.current = false
      setPlaybackState("playing")
    }
  }

  const stop = () => {
    cancelPlayback()
    setActiveIndex(firstIndex)
    setVisibleToken(firstIndex >= 0 ? tokens[firstIndex] : null)
    setPlaybackState(firstIndex >= 0 ? "ready" : "idle")
  }

  const selectLetter = (index: number) => {
    cancelPlayback()
    setActiveIndex(index)
    setVisibleToken(tokens[index])
    setPlaybackState("ready")
  }

  const currentPosition =
    activeIndex >= 0 && tokens[activeIndex] !== SPACE_TOKEN
      ? tokens
          .slice(0, activeIndex + 1)
          .filter((token) => token !== SPACE_TOKEN).length
      : 0
  const progress = letterCount
    ? Math.round((currentPosition / letterCount) * 100)
    : 0
  const imageUrl = getSurdoImageUrl(visibleToken)

  return (
    <div className="rounded-[2rem] border border-rose-100 bg-white/95 p-3 shadow-[0_30px_80px_rgba(127,76,132,0.16)] ring-1 ring-rose-900/5 backdrop-blur sm:p-5 lg:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-rose-100 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-400 to-[#a978b5] text-white shadow-lg shadow-rose-300/40">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
          <p className="text-base font-extrabold text-slate-950">
            {t("surdo_panel_title")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t("surdo_panel_desc")}</p>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-bold shadow-sm ${
            playbackState === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : playbackState === "playing"
                ? "border-orange-200 bg-orange-50 text-orange-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${playbackState === "error" ? "bg-red-500" : playbackState === "playing" ? "animate-pulse bg-orange-400" : "bg-rose-400"}`} />
          {stateLabels[playbackState]}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section
          className="relative overflow-hidden rounded-3xl border border-rose-100 bg-white p-5 shadow-sm sm:p-6"
          aria-labelledby="surdo-text-heading"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-300 via-pink-400 to-violet-300" />
          <div className="flex items-center justify-between gap-3">
            <h4 id="surdo-text-heading" className="font-bold text-slate-900">
              {inputLabel}
            </h4>
            <button
              type="button"
              onClick={() => updateText("")}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-100 bg-rose-50/50 px-3 text-xs font-semibold text-slate-600 outline-none transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-400"
              aria-label={t("surdo_clear")}
            >
              <Trash2 className="h-4 w-4" /> {t("surdo_clear")}
            </button>
          </div>
          <textarea
            value={text}
            rows={6}
            onChange={(event) => updateText(event.target.value)}
            className="mt-4 min-h-44 w-full resize-y rounded-2xl border border-rose-100 bg-[#fffafb] px-4 py-4 text-base leading-7 text-slate-800 shadow-inner outline-none transition placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-4 focus:ring-rose-100"
            placeholder={inputPlaceholder}
            aria-label={inputLabel}
          />
          <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              {letterCount} {t("surdo_character_count")}
            </span>
            <span>{text.length} belgi</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-violet-50 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                {t("surdo_realtime")}
              </p>
              <p className="text-[11px] text-slate-500">
                {t("surdo_realtime_desc")}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={realtime}
              aria-label={t("surdo_realtime")}
              onClick={() => setRealtime((value) => !value)}
              className={`relative h-7 w-12 rounded-full outline-none transition focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 ${
                realtime ? "bg-rose-400 shadow-md shadow-rose-300/40" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  realtime ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <button
            type="button"
            disabled={firstIndex < 0}
            onClick={() => void playFrom(firstIndex)}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 to-[#a978b5] px-4 text-sm font-bold text-white shadow-lg shadow-rose-300/40 outline-none transition hover:-translate-y-0.5 hover:from-rose-500 hover:to-[#9464a2] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            aria-label={t("surdo_translate")}
          >
            <Play className="h-4 w-4" /> {t("surdo_translate")}
          </button>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                {t("surdo_letter_queue")}
              </p>
              <span className="text-xs text-slate-400">
                {letterCount} {t("surdo_character")}
              </span>
            </div>
            <LetterQueue
              tokens={tokens}
              activeIndex={activeIndex}
              completedThrough={
                playbackState === "playing" ||
                playbackState === "paused" ||
                playbackState === "completed"
                  ? activeIndex
                  : -1
              }
              onSelect={selectLetter}
            />
          </div>
        </section>

        <section
          className="rounded-3xl border border-rose-100 bg-gradient-to-br from-[#fffafb] to-[#f8f1fb] p-4 text-slate-900 shadow-xl shadow-rose-200/30 sm:p-5"
          aria-labelledby="surdo-result-heading"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4
                id="surdo-result-heading"
                className="font-bold text-slate-900"
              >
                {t("surdo_letter_image")}
              </h4>
              <p className="mt-1 text-xs text-slate-500">
                {t("surdo_letter_image_desc")}
              </p>
            </div>
            <span className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm">
              {t("surdo_source_images")}
            </span>
          </div>
          <div className="relative flex h-[310px] select-none items-center justify-center overflow-hidden rounded-2xl border border-rose-100 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_48%),linear-gradient(145deg,#fce7f3,#ede9fe_55%,#ffedd5)] sm:h-[380px]">
            {imageUrl ? (
              <img
                key={imageUrl}
                src={imageUrl}
                alt={`${
                  visibleToken ? displaySurdoToken(visibleToken) : ""
                } daktil harfi`}
                draggable={false}
                className="pointer-events-none h-full w-full object-contain p-5 drop-shadow-[0_18px_20px_rgba(127,76,132,0.20)]"
              />
            ) : visibleToken && visibleToken !== SPACE_TOKEN ? (
              <div className="max-w-sm px-6 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-amber-500" />
                <p className="mt-3 font-bold text-slate-800">
                  {displaySurdoToken(visibleToken)} {t("surdo_image_missing")}
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {t("surdo_source_missing")}
                </p>
              </div>
            ) : (
              <div className="px-6 text-center text-slate-400">
                <ImageIcon className="mx-auto h-10 w-10" />
                <p className="mt-3 text-sm font-semibold">
                  {t("surdo_enter_text")}
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-rose-100 bg-white/80 p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("surdo_current_letter")}
              </p>
              <p className="mt-1 text-2xl font-black text-rose-500">
                {visibleToken && visibleToken !== SPACE_TOKEN
                  ? displaySurdoToken(visibleToken)
                  : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-violet-100 bg-white/80 p-3.5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("surdo_position")}
              </p>
              <p className="mt-1 text-2xl font-black text-[#75527d]">
                {currentPosition || "—"} / {letterCount}
              </p>
            </div>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-rose-100"
            aria-label={`Jarayon: ${progress}%`}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-400 to-violet-400 transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                !(["playing", "paused"] as PlaybackState[]).includes(
                  playbackState,
                )
              }
              onClick={togglePause}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-400 px-3 text-xs font-bold text-white outline-none transition hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-200 disabled:opacity-35"
              aria-label={
                playbackState === "paused"
                  ? t("surdo_resume")
                  : t("surdo_pause")
              }
            >
              {playbackState === "paused" ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
              {playbackState === "paused"
                ? t("surdo_resume")
                : t("surdo_pause")}
            </button>
            <button
              type="button"
              disabled={firstIndex < 0}
              onClick={() => void playFrom(firstIndex)}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-35"
              aria-label={t("surdo_restart")}
            >
              <RotateCcw className="h-4 w-4" /> {t("surdo_restart")}
            </button>
            <button
              type="button"
              disabled={firstIndex < 0}
              onClick={stop}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-100 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-300 disabled:opacity-35"
              aria-label={t("surdo_stop")}
            >
              <Square className="h-4 w-4" /> {t("surdo_stop")}
            </button>
            <label className="ml-auto text-xs font-semibold text-slate-600">
              {t("surdo_speed_label")}
              <select
                value={speed}
                onChange={(event) => setSpeed(Number(event.target.value))}
                className="ml-2 min-h-10 rounded-xl border border-violet-100 bg-white px-2 text-slate-700 outline-none focus:ring-2 focus:ring-rose-300"
                aria-label={t("surdo_speed_label")}
              >
                {SPEEDS.map((value) => (
                  <option key={value} value={value}>
                    {value}x
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="sr-only" aria-live="polite">
            {stateLabels[playbackState]}
            {visibleToken && visibleToken !== SPACE_TOKEN
              ? `, ${displaySurdoToken(visibleToken)} harfi`
              : ""}
          </p>
        </section>
      </div>
      <p className="mt-5 rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-violet-50 px-4 py-3 text-xs leading-5 text-[#6f526f]">
        {t("surdo_source_note")}{" "}
        <a
          href="https://www.remu.uz/#app"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline underline-offset-2"
        >
          {t("surdo_source")}
        </a>
        {" · "}
        <a
          href="https://devedu.uz/wp-content/uploads/2024/05/3-Daktilologiya-va-imo-ishora-nutqi.pdf"
          target="_blank"
          rel="noreferrer"
          className="font-bold underline underline-offset-2"
        >
          {t("surdo_open_source")}
        </a>
      </p>
    </div>
  )
}
