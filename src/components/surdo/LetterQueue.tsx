import {
  displaySurdoToken,
  SPACE_TOKEN,
  type SurdoToken,
} from "../../lib/surdo/tokenizer"
import { useLanguage } from "../../contexts/LanguageContext"

export default function LetterQueue({
  tokens,
  activeIndex,
  completedThrough,
  onSelect,
}: {
  tokens: SurdoToken[]
  activeIndex: number
  completedThrough: number
  onSelect: (index: number) => void
}) {
  const { t } = useLanguage()

  if (!tokens.length) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
        {t("surdo_queue_empty")}
      </p>
    )
  }

  return (
    <div
      className="flex max-h-32 flex-wrap gap-2 overflow-y-auto"
      aria-label={t("surdo_queue_aria")}
    >
      {tokens.map((token, index) =>
        token === SPACE_TOKEN ? (
          <span
            key={`space-${index}`}
            className="flex h-10 w-5 items-center justify-center text-slate-300"
            aria-label={t("surdo_space_aria")}
          >
            ·
          </span>
        ) : (
          <button
            key={`${token}-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            aria-label={`${displaySurdoToken(token)} harfini ko‘rsatish`}
            aria-current={activeIndex === index ? "step" : undefined}
            className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 ${
              activeIndex === index
                ? "border-rose-400 bg-rose-400 text-white shadow-sm shadow-rose-200"
                : index < completedThrough
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-rose-100 bg-white text-slate-700 hover:border-rose-300 hover:bg-rose-50"
            }`}
          >
            {displaySurdoToken(token)}
          </button>
        ),
      )}
    </div>
  )
}
