import { useState } from "react";
import {
  Users, BookOpen, BarChart2, FileText, Settings, Shield, LayoutDashboard,
  TrendingUp, UserCheck, Eye, Trash2, ChevronRight, Video, ClipboardList, Plus, Upload, ArrowUpRight, Bell, CircleCheck, MoreHorizontal
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { DEMO_COURSES } from "../data/mockData";
import Navbar from "../components/layout/Navbar";
import AccessibilityPanel from "../components/AccessibilityPanel";
import { useLanguage } from "../contexts/LanguageContext";

type Tab = "overview" | "users" | "courses" | "lessons" | "videos" | "tests" | "reports" | "settings";

const MOCK_USERS = [
  { id: "u1", name: "Alisher Qodirov", email: "student@demo.uz", role: "student", status: "active", joined: "2024-09-01" },
  { id: "u2", name: "Malika Yusupova", email: "malika@demo.uz", role: "student", status: "active", joined: "2024-01-15" },
  { id: "u4", name: "Dilnoza Ergasheva", email: "dilnoza@test.uz", role: "student", status: "active", joined: "2024-10-03" },
  { id: "u5", name: "Bobur Toshmatov", email: "bobur@test.uz", role: "student", status: "inactive", joined: "2024-11-20" },
  { id: "u3", name: "Sardor Nazarov", email: "admin@demo.uz", role: "admin", status: "active", joined: "2023-06-10" },
];

const categoryData = [
  { name: "IT", value: 15 },
  { name: "Komp.savod.", value: 20 },
  { name: "Dasturlash", value: 35 },
  { name: "Dizayn", value: 20 },
  { name: "Boshqa", value: 10 },
];

const COLORS = ["#2563EB", "#60A5FA", "#818CF8", "#38BDF8", "#BFDBFE"];

const monthlyData = [
  { month: "Sen", students: 120 },
  { month: "Okt", students: 280 },
  { month: "Noy", students: 450 },
  { month: "Dek", students: 620 },
  { month: "Yan", students: 800 },
  { month: "Fev", students: 1100 },
];

const roleBadge = {
  student: "bg-blue-50 text-blue-700",
  admin: "bg-purple-50 text-purple-700",
};

const roleLabel = { student: "O'quvchi", admin: "Admin" };

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [userFilter, setUserFilter] = useState("all");
  const { t } = useLanguage();

  const filteredUsers = MOCK_USERS.filter((u) =>
    userFilter === "all" || u.role === userFilter
  );

  const stats = [
    { icon: <Users className="w-5 h-5" />, label: "Jami o‘quvchilar", value: "5,240", change: "+12%", color: "teal" },
    { icon: <UserCheck className="w-5 h-5" />, label: "Faol o‘quvchilar", value: "1,248", change: "+3%", color: "green" },
    { icon: <BookOpen className="w-5 h-5" />, label: "Fanlar", value: DEMO_COURSES.length, change: "+2", color: "amber" },
    { icon: <FileText className="w-5 h-5" />, label: "Darslar", value: "240", change: "+18", color: "blue" },
    { icon: <Video className="w-5 h-5" />, label: "Video darslar", value: "196", change: "+14", color: "purple" },
    { icon: <Shield className="w-5 h-5" />, label: "Faol sessiyalar", value: "312", change: "Live", color: "red" },
  ];

  return (
    <div className="min-h-screen bg-[#f7f9fc] mobile-safe">
      <Navbar />
      <aside className="hidden lg:fixed lg:inset-y-[4.5rem] lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white lg:p-4">
        <div className="mb-5 border-b border-slate-100 px-3 pb-4"><p className="eyebrow text-blue-600">Boshqaruv markazi</p><p className="mt-2 text-xs leading-relaxed text-slate-500">Ta’lim jarayoni va kontentning yagona nazorati.</p></div>
        <AdminNav tab={tab} setTab={setTab} />
        <div className="mt-auto rounded-xl bg-blue-50 p-4"><p className="text-sm font-bold text-slate-900">Tizim holati</p><p className="mt-1 text-xs text-slate-600">Barcha servislar ishlamoqda</p><span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700"><span className="h-2 w-2 rounded-full bg-emerald-500" />Barqaror</span></div>
      </aside>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:ml-64 lg:max-w-none lg:px-8 py-6 sm:py-8">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow mb-2 text-blue-600">{t("admin")} / umumiy ko‘rinish</p><h1 className="font-display font-bold text-3xl tracking-tight text-slate-950 sm:text-4xl">{t("control")}</h1><p className="mt-2 text-sm text-slate-500">Platformaning bugungi holati, kontent va o‘quvchilar faolligi.</p></div>
          <div className="flex items-center gap-2"><button aria-label={t("notifications")} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:text-blue-600"><Bell className="h-4 w-4" /></button><button onClick={() => setTab("courses")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"><Plus className="h-4 w-4" />{t("newSubject")}</button></div>
        </div>

        {/* Tabs */}
        <div className="lg:hidden flex gap-1 overflow-x-auto bg-white rounded-xl border border-slate-200 p-1 mb-6" role="tablist">
          {([
            { id: "overview", label: "Dashboard" }, { id: "courses", label: "Fanlar" }, { id: "lessons", label: "Darslar" }, { id: "videos", label: "Videolar" }, { id: "users", label: "O‘quvchilar" }, { id: "tests", label: "Testlar" }, { id: "reports", label: "Statistika" }, { id: "settings", label: "Sozlamalar" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? "bg-blue-600 text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div role="tabpanel">
            {/* Stats grid */}
            <section className="mb-6 overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-900/10 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="eyebrow text-blue-300">Bugungi nazorat</p><h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Platforma barqaror ishlamoqda</h2><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300">Oxirgi 24 soatda 312 faol o‘quvchi 847 ta dars faoliyatini amalga oshirdi.</p></div><div className="grid grid-cols-2 gap-5 border-t border-white/10 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><div><p className="text-xs text-slate-400">Tugallangan darslar</p><p className="mt-1 font-display text-2xl font-bold">847</p></div><div><p className="text-xs text-slate-400">O‘rtacha faollik</p><p className="mt-1 font-display text-2xl font-bold text-blue-300">+18.4%</p></div></div></div>
            </section>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-7">
              {stats.map((s) => (
                <div key={s.label} className="group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      {s.icon}
                    </div>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {s.change}
                    </span>
                  </div>
                  <div className="font-display font-bold text-2xl text-slate-950">{s.value}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_.85fr] gap-5">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                <div className="mb-5 flex items-start justify-between"><div><p className="eyebrow text-blue-600">O‘sish dinamikasi</p><h3 className="mt-1 font-display font-bold text-slate-900">O‘quvchilar faolligi</h3></div><button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><MoreHorizontal className="h-5 w-5" /></button></div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip
                      contentStyle={{ fontSize: "12px", borderRadius: "8px" }}
                      formatter={(v) => [v, "O'quvchilar"]}
                    />
                    <Bar dataKey="students" fill="#2563EB" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                <div className="mb-4"><p className="eyebrow text-blue-600">Kontent tarkibi</p><h3 className="mt-1 font-display font-bold text-slate-900">Kategoriyalar bo‘yicha</h3></div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <ResponsiveContainer width="60%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v}%`, "Ulush"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {categoryData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i] }} />
                        <span className="text-slate-600">{item.name}</span>
                        <span className="text-slate-400 ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><p className="eyebrow text-blue-600">Jonli oqim</p><h3 className="mt-1 font-display font-bold text-slate-900">Oxirgi faollik</h3></div><button onClick={() => setTab("users")} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800">Barchasi <ArrowUpRight className="h-4 w-4" /></button></div><div className="grid gap-3 md:grid-cols-3">{[{ name: "Dilnoza Ergasheva", text: "Microsoft Word darsini yakunladi", time: "2 daqiqa oldin" }, { name: "Alisher Qodirov", text: "Kompyuter asoslari testini topshirdi", time: "8 daqiqa oldin" }, { name: "Malika Yusupova", text: "Yangi materialni ko‘rishni boshladi", time: "16 daqiqa oldin" }].map((item) => <div key={item.name} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CircleCheck className="h-4 w-4" /></span><div><p className="text-sm font-semibold text-slate-900">{item.name}</p><p className="mt-0.5 text-xs leading-relaxed text-slate-500">{item.text}</p><p className="mt-2 text-[11px] font-medium text-slate-400">{item.time}</p></div></div>)}</div></section>
          </div>
        )}

        {tab === "users" && (
          <div role="tabpanel">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <h2 className="font-display font-semibold text-slate-900">Foydalanuvchilar</h2>
                <div className="flex gap-2" role="group" aria-label="Rol filtri">
                  {["all", "student", "teacher", "admin"].map((r) => (
                    <button
                      key={r}
                      onClick={() => setUserFilter(r)}
                      aria-pressed={userFilter === r}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        userFilter === r ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {r === "all" ? "Barchasi" : roleLabel[r as keyof typeof roleLabel]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Foydalanuvchi</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rol</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Qo'shilgan</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">
                              {u.name.split(" ").map((n) => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${roleBadge[u.role as keyof typeof roleBadge]}`}>
                            {roleLabel[u.role as keyof typeof roleLabel]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`flex items-center gap-1.5 text-xs font-medium ${
                            u.status === "active" ? "text-green-600" : "text-red-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === "active" ? "bg-green-500" : "bg-red-400"}`} />
                            {u.status === "active" ? "Faol" : "Nofaol"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{u.joined}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors" aria-label="Ko'rish">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" aria-label="O'chirish">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "courses" && (
          <div role="tabpanel">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div><h2 className="font-display font-semibold text-slate-900">Fanlar boshqaruvi</h2><p className="mt-1 text-xs text-slate-500">Fanlarni nashr qilish yoki yashirish mumkin</p></div><button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />Fan qo‘shish</button>
              </div>
              <div className="divide-y divide-slate-100">
                {DEMO_COURSES.map((course) => (
                  <div key={course.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                    <img src={course.thumbnail} alt={course.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{course.title}</p>
                      <p className="text-xs text-slate-400">{course.teacherName} · {course.enrolledCount.toLocaleString()} o'quvchi</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium bg-green-50 text-green-700`}>
                        Faol
                      </span>
                      <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2" aria-label="O'chirish">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "reports" && (
          <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: <TrendingUp className="w-5 h-5" />, title: "O'quv hisoboti", desc: "O'quvchilar faolligi va progress" },
              { icon: <BarChart2 className="w-5 h-5" />, title: "Test natijalari", desc: "Barcha testlar natijalari" },
              { icon: <Users className="w-5 h-5" />, title: "Foydalanuvchi hisoboti", desc: "Ro'yxatdan o'tish va faollik" },
              { icon: <Settings className="w-5 h-5" />, title: "Accessibility hisoboti", desc: "Qanday sozlamalar ishlatilmoqda" },
            ].map((r) => (
              <div key={r.title} className="bg-white rounded-2xl border border-slate-100 p-6 flex items-start gap-4 hover:border-teal-200 transition-colors cursor-pointer">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center shrink-0">
                  {r.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-slate-900 mb-1">{r.title}</h3>
                  <p className="text-sm text-slate-500">{r.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            ))}
          </div>
        )}

        {["lessons", "videos", "tests", "settings"].includes(tab) && <ManagementPanel tab={tab as "lessons" | "videos" | "tests" | "settings"} />}
      </main>
      <AccessibilityPanel />
    </div>
  );
}

function AdminNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const { t } = useLanguage();
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: t("overview"), icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "courses", label: t("courses"), icon: <BookOpen className="h-4 w-4" /> },
    { id: "lessons", label: t("lessons"), icon: <FileText className="h-4 w-4" /> },
    { id: "videos", label: t("videos"), icon: <Video className="h-4 w-4" /> },
    { id: "users", label: t("students"), icon: <Users className="h-4 w-4" /> },
    { id: "tests", label: t("tests"), icon: <ClipboardList className="h-4 w-4" /> },
    { id: "reports", label: t("statistics"), icon: <BarChart2 className="h-4 w-4" /> },
    { id: "settings", label: t("settings"), icon: <Settings className="h-4 w-4" /> },
  ];
  return <nav className="space-y-1" aria-label="Admin menyusi">{items.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${tab === item.id ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>{item.icon}{item.label}</button>)}</nav>;
}

function ManagementPanel({ tab }: { tab: "lessons" | "videos" | "tests" | "settings" }) {
  const content = {
    lessons: { title: "Darslar boshqaruvi", desc: "Fan ichidagi darslar, matn va tartib raqamlarini boshqaring.", action: "Dars qo‘shish", icon: <FileText className="h-5 w-5" /> },
    videos: { title: "Video darslar", desc: "MP4 yoki WebM faylni yuklang; subtitr va nashr holatini bir joyda boshqaring.", action: "Video yuklash", icon: <Video className="h-5 w-5" /> },
    tests: { title: "Testlar", desc: "Dars uchun bitta, bir nechta javobli yoki True / False test yarating.", action: "Test yaratish", icon: <ClipboardList className="h-5 w-5" /> },
    settings: { title: "Platforma sozlamalari", desc: "Platforma nomi, bildirishnomalar va accessibility standartlarini boshqaring.", action: "Saqlash", icon: <Settings className="h-5 w-5" /> },
  }[tab];
  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" role="tabpanel"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{content.icon}</span><div><h2 className="font-display text-lg font-bold text-slate-900">{content.title}</h2><p className="mt-1 max-w-xl text-sm text-slate-500">{content.desc}</p></div></div><button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" />{content.action}</button></div>{tab === "videos" ? <div className="m-5 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 p-8 text-center"><Upload className="mx-auto h-8 w-8 text-blue-600" /><p className="mt-3 font-semibold text-slate-900">Videoni shu yerga tashlang</p><p className="mt-1 text-sm text-slate-500">MP4 yoki WebM · maksimal 500 MB</p><button className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Faylni tanlash</button></div> : <div className="p-5"><div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">Bu bo‘limda ma’lumot yaratish va tahrirlash jarayoni shu panel orqali boshqariladi.</div></div>}</section>;
}
