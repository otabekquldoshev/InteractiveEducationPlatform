# Imkon Ta’lim backend

Backend `server/src` ichida joylashgan Express REST API va SQLite uchun Prisma ORM asosida qurilgan.

## Ishga tushirish

```bash
cp .env.example .env
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev:api
```

Frontend alohida terminalda `pnpm dev` bilan ishlaydi. Vite `/api` va `/uploads` so'rovlarini `http://localhost:3001` ga uzatadi.

Yoki migratsiya va seeddan keyin frontend hamda backendni birga ishga tushiring:

```bash
pnpm dev:all
```

Demo hisoblar (parol: `demo`):

- `student@demo.uz` — o'quvchi
- `admin@demo.uz` — administrator

Productionda `JWT_SECRET`, `DATABASE_URL`, `CLIENT_ORIGIN` va media saqlash strategiyasini alohida sozlash kerak. Hozir media fayllari ham SQLite bazasidagi `MediaAsset` jadvalida saqlanadi.

## API yo'nalishlari

| Yo'nalish | Vazifa | Ruxsat |
|---|---|---|
| `/api/auth/*` | register, login, refresh, logout, profil | public/user |
| `/api/courses/*` | fan, modul va dars CRUD | public + teacher/admin |
| `/api/learning/*` | yozilish, dars progressi, accessibility | student/user |
| `/api/quizzes/*` | test CRUD, topshirish va natijalar | student + teacher/admin |
| `/api/media/*` | video, material va subtitrlar | teacher/admin |
| `/api/admin/*` | statistika, users va progress | admin |

## Xavfsizlik

- Parollar bcrypt bilan 12 roundda hash qilinadi.
- Access token qisqa muddatli JWT; refresh token bazada SHA-256 hash ko'rinishida turadi va har yangilashda rotatsiya qilinadi.
- RBAC barcha yozuvchi endpointlarda server tomonida tekshiriladi.
- Helmet, CORS, body limit, auth rate limit va Zod validatsiyasi yoqilgan.
- Kontentni faqat administrator boshqara oladi.

## Subtitr pipeline

`POST /api/media/videos/:videoId/subtitles/generate` subtitr yozuvini `PROCESSING` holatiga o'tkazib, `SUBTITLE_GENERATION_QUEUED` hodisasini yaratadi. Keyingi production bosqichida shu hodisaga queue worker (BullMQ/SQS), FFmpeg audio extraction va o'zbekcha Speech-to-Text provider ulanadi. Tayyor VTT `PUT /api/media/videos/:videoId/subtitles/:language` orqali saqlanadi.
