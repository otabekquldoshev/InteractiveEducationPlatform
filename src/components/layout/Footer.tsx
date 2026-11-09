import { Link } from "react-router-dom"
import { Heart } from "lucide-react"
import { useLanguage } from "../../contexts/LanguageContext"

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link
              to="/"
              className="group mb-4 inline-flex items-center gap-3 text-white font-bold text-xl font-display"
              aria-label={`Imkon Ta’lim — ${t("home")}`}
            >
              <span className="flex h-12 w-14 items-center justify-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/20 transition-transform duration-300 group-hover:-translate-y-0.5">
                <img
                  src="/brand/eduaccess-mark.png"
                  alt=""
                  className="h-11 w-12 object-contain"
                  aria-hidden="true"
                />
              </span>
              <span>
                Imkon <span className="text-rose-400">Ta’lim</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {t("footer_description")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">
              {t("footer_platform")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/courses"
                  className="hover:text-violet-400 transition-colors"
                >
                  {t("footer_subjects")}
                </Link>
              </li>
              <li>
                <Link
                  to="/register"
                  className="hover:text-violet-400 transition-colors"
                >
                  {t("footer_register")}
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="hover:text-violet-400 transition-colors"
                >
                  {t("footer_login")}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">
              {t("footer_contact")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:gafforovamunisxon67@gmail.com"
                  className="text-slate-400 transition-colors hover:text-violet-400"
                >
                  gafforovamunisxon67@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+998932487467"
                  className="text-slate-400 transition-colors hover:text-violet-400"
                >
                  +998 93 248 74 67
                </a>
              </li>
              <li className="text-slate-400">{t("footer_address")}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>{t("footer_copyright")}</p>
          <p className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400" aria-hidden="true" />
            {t("footer_made_with_heart")}
          </p>
        </div>
      </div>
    </footer>
  )
}
