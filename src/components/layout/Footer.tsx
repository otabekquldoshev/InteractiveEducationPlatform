import { Link } from "react-router-dom";
import { GraduationCap, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl font-display mb-3">
              <GraduationCap className="w-6 h-6 text-teal-400" />
              EduAccess
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Imkoniyati cheklangan o'quvchilar uchun professional ta'lim platformasi.
              Har kim uchun sifatli ta'lim.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Platforma</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="hover:text-teal-400 transition-colors">Fanlar</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition-colors">Ro'yxatdan o'tish</Link></li>
              <li><Link to="/login" className="hover:text-teal-400 transition-colors">Kirish</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3 text-sm">Bog'lanish</h3>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-400">info@eduaccess.uz</li>
              <li className="text-slate-400">+998 71 000 00 00</li>
              <li className="text-slate-400">Toshkent, O'zbekiston</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 EduAccess. Barcha huquqlar himoyalangan.</p>
          <p className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400" aria-hidden="true" />
            Inklyuziv ta'lim uchun yaratildi
          </p>
        </div>
      </div>
    </footer>
  );
}
