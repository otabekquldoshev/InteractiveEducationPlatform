import type { RefObject } from "react"
import {
  Accessibility,
  Eye,
  GraduationCap,
  Hand,
} from "lucide-react"

export interface EduAccessCertificateProps {
  fullName: string
  courseName: string
  completedAt: string | Date
  score: number
  verificationCode?: string
  certificateRef?: RefObject<HTMLDivElement | null>
}

export default function EduAccessCertificate({
  fullName,
  courseName,
  completedAt,
  score,
  verificationCode,
  certificateRef,
}: EduAccessCertificateProps) {
  const date = new Date(completedAt)
  const formattedDate = new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
  const nameClass = fullName.length > 28 ? " is-long" : ""
  const courseClass = courseName.length > 38 ? " is-long" : ""

  return (
    <div className="certificate-wrapper">
      <div className="certificate" ref={certificateRef}>
        <div className="outer-border" />
        <div className="inner-border" />

        <div className="corner top-left">◆</div>
        <div className="corner top-right">◆</div>
        <div className="corner bottom-left">◆</div>
        <div className="corner bottom-right">◆</div>

        <div className="watermark">IMKON TA’LIM</div>

        <header className="header">
          <div className="logo">
            <img
              className="logo-mark"
              src="/brand/eduaccess-mark.png"
              alt=""
              aria-hidden="true"
            />
            <div>
              <div className="brand">
                <span>Imkon </span>
                <span className="access">Ta’lim</span>
              </div>
              <div className="tagline">BARCHA UCHUN TA’LIM</div>
            </div>
          </div>
        </header>

        <main className="content">
          <div className="title-row">
            <span className="gold-line" />
            <span className="diamond">◆</span>
            <h1>SERTIFIKAT</h1>
            <span className="diamond">◆</span>
            <span className="gold-line" />
          </div>
          <p className="subtitle">Kursni muvaffaqiyatli tamomlagani uchun</p>
          <div className="ornament">◇ ◆ ◇</div>
          <p className="intro">Ushbu sertifikat</p>
          <h2 className={`student-name${nameClass}`}>{fullName}</h2>
          <div className="name-divider">
            <span />
            <b>◆</b>
            <span />
          </div>
          <p className="description">
            ga <strong>Imkon Ta’lim</strong> platformasidagi
          </p>
          <h3 className={`course-name${courseClass}`}>“{courseName}”</h3>
          <p className="completion-text">
            kursini muvaffaqiyatli yakunlagani uchun taqdim etiladi.
          </p>
          <p className="certificate-score">YAKUNIY NATIJA: {score}%</p>
          {verificationCode && (
            <p className="certificate-code">
              SERTIFIKAT ID: {verificationCode.toUpperCase()}
            </p>
          )}
        </main>

        <div className="left-decoration">
          <div className="side-icon side-icon-primary">
            <GraduationCap aria-hidden="true" strokeWidth={2.4} />
          </div>
          <p className="side-copy left-copy">
            <span>HAR BIR INSON UCHUN</span>
            <span>TENGLASHGAN</span>
            <span>IMKONIYATLAR</span>
          </p>
          <div className="side-icon small">
            <Accessibility aria-hidden="true" strokeWidth={2.4} />
          </div>
        </div>

        <div className="right-decoration">
          <div className="accessibility-icons">
            <span>
              <Accessibility aria-hidden="true" strokeWidth={2.4} />
            </span>
            <span>
              <Eye aria-hidden="true" strokeWidth={2.4} />
            </span>
            <span>
              <Hand aria-hidden="true" strokeWidth={2.4} />
            </span>
          </div>
          <p className="side-copy right-copy">
            <span>TO‘SIQLARSIZ BILIM</span>
            <span>BARCHA UCHUN</span>
          </p>
        </div>

        <div className="seal">
          <div className="seal-inner">
            <div className="seal-star">★</div>
            <div className="seal-book">⌄</div>
            <div className="seal-name">Imkon Ta’lim</div>
            <div className="seal-stars">★ ★ ★</div>
          </div>
        </div>

        <footer className="footer">
          <div className="date">
            <span className="calendar">▣</span>
            <div>
              <small>Kurs yakunlangan vaqt</small>
              <strong>{formattedDate}</strong>
            </div>
          </div>
          <div className="certificate-leader">
            <strong className="leader-name">Munisxon G‘afforova</strong>
            <small>Imkon Ta’lim rahbari</small>
          </div>
        </footer>
      </div>
    </div>
  )
}
