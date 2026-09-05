Zamonaviy, responsive va accessibility talablariga mos interaktiv elektron ta’lim platformasi yarat.

LOYIHA MAQSADI:
Platforma imkoniyati cheklangan o‘quvchilar uchun professional ta’lim fanlarini qulay va interaktiv tarzda o‘rganishga mo‘ljallansin.

Platformada faqat 2 ta rol bo‘lsin:

1. Administrator
2. O‘quvchi


====================================
1. AUTENTIFIKATSIYA
====================================

Login sahifasi yarat.

Foydalanuvchi:
- email yoki login
- parol

orqali tizimga kiradi.

Role-based access control ishlat.

Agar role = ADMIN bo‘lsa:
→ /admin

Agar role = STUDENT bo‘lsa:
→ /dashboard

sahifasiga yo‘naltir.

O‘quvchi administrator sahifalariga kira olmasin.


====================================
2. ADMINISTRATOR PANELI
====================================

Administrator uchun alohida dashboard yarat.

Sidebar:

- Dashboard
- Fanlar
- Darslar
- Video darslar
- O‘quvchilar
- Testlar
- Statistika
- Sozlamalar

Dashboardda quyidagilar ko‘rsatilsin:

- jami o‘quvchilar
- jami fanlar
- jami darslar
- jami video darslar
- o‘tilgan darslar soni
- oxirgi faollik


====================================
3. FANLARNI BOSHQARISH
====================================

Administrator yangi fan yarata olsin.

Maydonlar:

- fan nomi
- qisqa tavsif
- batafsil tavsif
- fan rasmi
- kategoriya
- holati: Draft / Published

Administrator:

- fan qo‘shish
- tahrirlash
- o‘chirish
- nashr qilish
- yashirish

imkoniyatiga ega bo‘lsin.


====================================
4. DARSLARNI BOSHQARISH
====================================

Har bir fan ichida bir nechta dars bo‘lishi mumkin.

Masalan:

Kompyuter savodxonligi
  ├── 1-dars: Kompyuter bilan tanishish
  ├── 2-dars: Operatsion tizimlar
  ├── 3-dars: Microsoft Word
  └── 4-dars: Internet asoslari

Administrator dars yaratganda:

- dars nomi
- tavsifi
- dars matni
- video
- rasm
- qo‘shimcha material
- dars tartib raqami

kiritishi mumkin bo‘lsin.


====================================
5. VIDEO YUKLASH
====================================

Administrator video dars yuklay olsin.

Video yuklash interfeysida:

- Drag & Drop
- Fayl tanlash
- Upload progress
- video preview
- video nomi
- tavsifi

bo‘lsin.

Qo‘llab-quvvatlanadigan formatlar:

MP4
WebM

Video yuklangandan keyin administrator uni:

- ko‘rish
- tahrirlash
- almashtirish
- o‘chirish
- nashr qilish

imkoniyatiga ega bo‘lsin.


====================================
6. SUBTITR TIZIMI
====================================

Video darslar uchun o‘zbekcha subtitr tizimini yarat.

Video yuklangandan so‘ng:

Video
↓
Audio
↓
Speech-to-Text
↓
O‘zbekcha transkripsiya
↓
VTT subtitle
↓
Video player

jarayoni ishlashi uchun arxitektura tayyorla.

Administrator subtitrni:

- avtomatik generatsiya qilish
- ko‘rish
- qo‘lda tahrirlash
- vaqt kodlarini tahrirlash
- qayta generatsiya qilish
- yoqish/o‘chirish

imkoniyatiga ega bo‘lsin.

Video playerda:

CC — Subtitles

tugmasi bo‘lsin.


====================================
7. MATNNI OVOZLI O‘QISH
====================================

Har bir darsning matnli versiyasi bo‘lsin.

O‘quvchi:

🔊 Tinglash

tugmasini bosganda dars matni o‘zbek tilida ovoz chiqarib o‘qilsin.

Text-to-Speech funksiyasini alohida reusable component sifatida yarat.

Boshqaruvlar:

▶ O‘qish
⏸ Pauza
⏹ To‘xtatish

Tezlik:

0.5x
0.75x
1x
1.25x
1.5x

Matn o‘zbek tilida o‘qilsin.

Brauzer TTS ishlatiladigan bo‘lsa uz-UZ voice mavjudligini tekshir va fallback mexanizmi yarat.


====================================
8. O‘QUVCHI PANELI
====================================

O‘quvchi tizimga kirganda zamonaviy dashboard ko‘rsin.

Dashboard:

"Xush kelibsiz, [Ism]"

Pastida:

- Mening fanlarim
- Davom ettirish
- Oxirgi darslar
- O‘zlashtirish darajasi
- Tugallangan darslar

ko‘rsatilsin.


====================================
9. FANLAR
====================================

Fanlar zamonaviy card ko‘rinishida chiqarilsin.

Har bir card:

[Fan rasmi]

Kompyuter savodxonligi

12 ta dars

████████░░ 80%

[Davom ettirish]

O‘quvchi fan ustiga bosganda fan ichidagi darslarni ko‘rsin.


====================================
10. DARS SAHIFASI
====================================

Dars sahifasida:

Dars nomi

Video player

[CC Subtitr]

Dars matni

[🔊 Tinglash]

Qo‘shimcha materiallar

Test

[Keyingi dars]

bo‘lsin.

Video player katta va foydalanishga qulay bo‘lsin.

Subtitrlar katta va o‘qilishi oson bo‘lsin.


====================================
11. TEST TIZIMI
====================================

Administrator har bir dars uchun test yaratishi mumkin.

Savol turlari:

- bitta javob
- bir nechta javob
- True / False

O‘quvchi darsni tugatgandan keyin test ishlaydi.

Natija:

8 / 10
80%

To‘g‘ri javoblar: 8
Noto‘g‘ri javoblar: 2

Natijani bazaga saqla.


====================================
12. O‘QUVCHI PROGRESSI
====================================

Har bir o‘quvchining progressini saqla.

Masalan:

Kompyuter savodxonligi
████████░░ 80%

Internet asoslari
██████░░░░ 60%

Dasturlash
███░░░░░░░ 30%

Administrator o‘quvchilarning progressini ko‘ra olsin.


====================================
13. ACCESSIBILITY
====================================

Bu loyiha uchun accessibility eng muhim qismlardan biri.

Headerda:

♿ Maxsus imkoniyatlar

tugmasi bo‘lsin.

Bosilganda accessibility panel ochilsin.

Funksiyalar:

🔊 Matnni ovozli o‘qish

A+ Matnni kattalashtirish
A- Matnni kichraytirish

◐ Yuqori kontrast rejimi

🌙 Dark mode

🦻 Subtitrni doim yoqish

⏸ Animatsiyalarni kamaytirish

⌨️ Klaviatura orqali navigatsiya

Accessibility sozlamalarini foydalanuvchi uchun saqlab qol.


====================================
14. RESPONSIVE DESIGN
====================================

Platforma:

Desktop
Tablet
Mobile

qurilmalarda to‘liq ishlasin.

Accessibility sababli juda kichik buttonlardan foydalanma.

Touch targetlar yetarlicha katta bo‘lsin.


====================================
15. UI/UX
====================================

Dizayn professional zamonaviy EdTech platformaga o‘xshasin.

Minimalistik va accessibility-first dizayn ishlat.

Asosiy rang:
#2563EB

Fon:
#F8FAFC

Cardlar:
oq rang

Border radius:
12-16px

Yengil shadowlardan foydalan.

Interfeys ortiqcha elementlar bilan to‘ldirilmasin.

O‘zbek tilidagi interfeys yarat.


====================================
16. TEXNOLOGIYALAR
====================================

Frontend:
Next.js
React
TypeScript
Tailwind CSS
ShadCN UI

Backend:
Next.js API yoki alohida Node.js backend

Database:
PostgreSQL

ORM:
Prisma

Authentication:
secure session/JWT asosida

Video va fayllar database ichida saqlanmasin.
Database faqat ularning URL va metadata ma’lumotlarini saqlasin.

Arxitekturani production-ready va keyinchalik kengaytirish mumkin bo‘lgan shaklda yarat.


====================================
17. DATABASE
====================================

Quyidagi asosiy entitylarni yarat:

User
- id
- name
- email
- passwordHash
- role
- createdAt

Subject
- id
- title
- description
- imageUrl
- status

Lesson
- id
- subjectId
- title
- description
- content
- order

Video
- id
- lessonId
- videoUrl
- duration
- subtitleUrl

Subtitle
- id
- videoId
- language
- content
- status

Quiz
Question
Answer
QuizResult

StudentProgress
AccessibilitySettings


====================================
18. MUHIM
====================================

Faqat UI mockup yaratib qo‘yma.

Real ishlaydigan CRUD, authentication, database va role-based access control yarat.

Administrator yuklagan va Published holatiga o‘tkazgan dars o‘quvchi panelida avtomatik paydo bo‘lsin.

Barcha loading, empty, success va error state'larni yarat.

Kod reusable componentlar va toza arxitektura asosida yozilsin.