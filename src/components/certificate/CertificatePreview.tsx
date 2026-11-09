import { useEffect, useRef, useState } from "react"
import { Download, Loader2, X } from "lucide-react"
import EduAccessCertificate from "./EduAccessCertificate"
import "./certificate.css"
import { useLanguage } from "../../contexts/LanguageContext"

type CertificatePreviewProps = {
  fullName: string
  courseName: string
  completedAt: string | Date
  score: number
  verificationCode?: string
  onClose: () => void
}

function safeFilename(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9а-яёқғҳў]+/gi, "-")
    .replace(/(^-|-$)/g, "")
}

export default function CertificatePreview({
  fullName,
  courseName,
  completedAt,
  score,
  verificationCode,
  onClose,
}: CertificatePreviewProps) {
  const { t } = useLanguage()
  const certificateRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const downloadPdf = async () => {
    if (!certificateRef.current || downloading) return
    setDownloading(true)
    setError("")
    try {
      await document.fonts.ready
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])
      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      })
      const width = pdf.internal.pageSize.getWidth()
      const height = pdf.internal.pageSize.getHeight()
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height)
      pdf.save(`imkon-talim-${safeFilename(courseName) || "sertifikat"}.pdf`)
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : t("cert_pdf_error"),
      )
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t("cert_preview")}
    >
      <div className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 text-white sm:px-6">
        <div>
          <p className="font-display font-bold">{t("cert_ready")}</p>
          <p className="text-xs text-slate-300">{courseName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void downloadPdf()}
            disabled={downloading}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {downloading ? t("cert_pdf_preparing") : t("cert_pdf_download")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20"
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      {error && (
        <p className="mx-auto mt-3 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-6">
        <EduAccessCertificate
          fullName={fullName}
          courseName={courseName}
          completedAt={completedAt}
          score={score}
          verificationCode={verificationCode}
          certificateRef={certificateRef}
        />
      </div>
    </div>
  )
}
