import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "uz" | "ru" | "en";

const dictionary = {
  uz: {
    home: "Bosh sahifa", courses: "Fanlar", features: "Imkoniyatlar", about: "Biz haqimizda", dashboard: "Kabinet", menu: "Menyu", settings: "Sozlama", adminMode: "Admin rejimi", studentMode: "O‘quvchi rejimi",
    studentArea: "O‘quvchi kabineti", welcome: "Xush kelibsiz", daily: "Bugungi maqsad: 20 daqiqa", continue: "Davom ettirish", myCourses: "Mening kurslarim", lessons: "Darslar", completed: "tugatildi", studying: "o‘rganilmoqda", averageScore: "O‘rtacha ball", certificates: "Sertifikatlar",
    admin: "Administrator", control: "Boshqaruv paneli", newSubject: "Yangi fan", notifications: "Bildirishnomalar", overview: "Dashboard", students: "O‘quvchilar", videos: "Video darslar", tests: "Testlar", statistics: "Statistika", subjectManagement: "Fanlar boshqaruvi",
    accessibility: "Maxsus imkoniyatlar", accessibilityDesc: "Interfeys sizning ehtiyojingizga moslashadi", close: "Panelni yopish", textSize: "Matn hajmi", decreaseText: "Matnni kichraytirish", increaseText: "Matnni kattalashtirish", appearance: "Ko‘rinish", contrast: "Yuqori kontrast", darkMode: "Tungi rejim", motion: "Harakat", reduceMotion: "Animatsiyalarni kamaytirish", reading: "O‘qish qulayligi", dyslexia: "Disleksiya uchun shrift", lineSpacing: "Qator oralig‘i", narrow: "Tor", wide: "Keng", letterSpacing: "Harf oralig‘i", standard: "Standart", buttons: "Tugmalar", largeButtons: "Katta tugmalar", navigation: "Navigatsiya", focus: "Kuchaytirilgan fokus ko‘rsatgich", keyboard: "Klaviatura navigatsiyasi", subtitles: "Subtitrlar", subtitlesAlways: "Subtitrlarni doim ko‘rsatish", tts: "Matn ovozlash (TTS)", readAloud: "Matnni ovoz bilan o‘qish", voiceSpeed: "Ovoz tezligi", slow: "Sekin", fast: "Tez", reset: "Standart holatga qaytarish",
  },
  ru: {
    home: "Главная", courses: "Предметы", features: "Возможности", about: "О нас", dashboard: "Кабинет", menu: "Меню", settings: "Настройки", adminMode: "Режим администратора", studentMode: "Режим ученика",
    studentArea: "Кабинет ученика", welcome: "Добро пожаловать", daily: "Цель на сегодня: 20 минут", continue: "Продолжить", myCourses: "Мои предметы", lessons: "Уроки", completed: "завершено", studying: "изучается", averageScore: "Средний балл", certificates: "Сертификаты",
    admin: "Администратор", control: "Панель управления", newSubject: "Новый предмет", notifications: "Уведомления", overview: "Панель", students: "Ученики", videos: "Видеоуроки", tests: "Тесты", statistics: "Статистика", subjectManagement: "Управление предметами",
    accessibility: "Специальные возможности", accessibilityDesc: "Интерфейс адаптируется к вашим потребностям", close: "Закрыть панель", textSize: "Размер текста", decreaseText: "Уменьшить текст", increaseText: "Увеличить текст", appearance: "Внешний вид", contrast: "Высокая контрастность", darkMode: "Тёмный режим", motion: "Анимация", reduceMotion: "Уменьшить анимацию", reading: "Удобство чтения", dyslexia: "Шрифт для дислексии", lineSpacing: "Межстрочный интервал", narrow: "Узкий", wide: "Широкий", letterSpacing: "Межбуквенный интервал", standard: "Стандартный", buttons: "Кнопки", largeButtons: "Крупные кнопки", navigation: "Навигация", focus: "Усиленный индикатор фокуса", keyboard: "Навигация с клавиатуры", subtitles: "Субтитры", subtitlesAlways: "Всегда показывать субтитры", tts: "Озвучивание текста (TTS)", readAloud: "Читать текст вслух", voiceSpeed: "Скорость голоса", slow: "Медленно", fast: "Быстро", reset: "Вернуть настройки по умолчанию",
  },
  en: {
    home: "Home", courses: "Subjects", features: "Features", about: "About us", dashboard: "Workspace", menu: "Menu", settings: "Settings", adminMode: "Admin mode", studentMode: "Student mode",
    studentArea: "Student workspace", welcome: "Welcome", daily: "Today’s goal: 20 minutes", continue: "Continue", myCourses: "My subjects", lessons: "Lessons", completed: "completed", studying: "in progress", averageScore: "Average score", certificates: "Certificates",
    admin: "Administrator", control: "Control center", newSubject: "New subject", notifications: "Notifications", overview: "Dashboard", students: "Students", videos: "Video lessons", tests: "Tests", statistics: "Analytics", subjectManagement: "Subject management",
    accessibility: "Accessibility", accessibilityDesc: "The interface adapts to your needs", close: "Close panel", textSize: "Text size", decreaseText: "Decrease text", increaseText: "Increase text", appearance: "Appearance", contrast: "High contrast", darkMode: "Dark mode", motion: "Motion", reduceMotion: "Reduce animations", reading: "Reading comfort", dyslexia: "Dyslexia-friendly font", lineSpacing: "Line spacing", narrow: "Narrow", wide: "Wide", letterSpacing: "Letter spacing", standard: "Default", buttons: "Buttons", largeButtons: "Large buttons", navigation: "Navigation", focus: "Enhanced focus indicator", keyboard: "Keyboard navigation", subtitles: "Subtitles", subtitlesAlways: "Always show subtitles", tts: "Text-to-speech (TTS)", readAloud: "Read text aloud", voiceSpeed: "Voice speed", slow: "Slow", fast: "Fast", reset: "Reset to defaults",
  },
} as const;

type TranslationKey = keyof typeof dictionary.uz;
interface LanguageContextValue { language: Language; setLanguage: (language: Language) => void; t: (key: TranslationKey) => string; }
const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "edu_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem(STORAGE_KEY) as Language) || "uz");
  useEffect(() => { localStorage.setItem(STORAGE_KEY, language); document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => dictionary[language][key] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() { const context = useContext(LanguageContext); if (!context) throw new Error("useLanguage must be used inside LanguageProvider"); return context; }
