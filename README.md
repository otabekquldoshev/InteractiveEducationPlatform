# Imkon Ta’lim

Imkon Ta’lim — React/Vite frontend va Express/Prisma backend asosidagi inklyuziv ta'lim platformasi.

## Talablar

- Node.js 22
- pnpm 10
- ngrok (internetga tunnel ochish kerak bo'lsa)

Loyihadagi `.mise.toml` Node.js va pnpm versiyalarini saqlaydi. `mise` ishlatilmasa, pnpm'ni Corepack orqali ishga tushirish mumkin:

```bash
corepack pnpm --version
```

Quyidagi misollarda `pnpm` ishlatilgan. Agar u global buyruq sifatida topilmasa, har bir `pnpm` o'rniga `corepack pnpm` yozing.

## Birinchi marta sozlash

```bash
cd InteractiveEducationPlatform
pnpm install
cp .env.example .env
```

Loyiha hozir SQLite bilan ishlaydi. `.env` ichidagi `DATABASE_URL` qiymatini quyidagicha o'zgartiring:

```env
DATABASE_URL="file:./dev.db"
```

`JWT_SECRET` kamida 32 belgidan iborat maxfiy qiymat bo'lishi kerak. Development uchun yangi qiymat yaratish mumkin:

```bash
openssl rand -hex 32
```

Keyin Prisma client, migratsiyalar va demo ma'lumotlarini tayyorlang:

```bash
pnpm db:generate
pnpm db:deploy
pnpm db:seed
```

## Loyihani ishga tushirish

Frontend va backendni bitta buyruq bilan ishga tushiring:

```bash
pnpm dev:all
```

Servislar quyidagi manzillarda ochiladi:

- Frontend: <http://localhost:8443>
- Backend API: <http://localhost:3001>
- Health check: <http://localhost:8443/api/health>

Frontend va backendni alohida terminallarda ham ishga tushirish mumkin:

```bash
pnpm dev
```

```bash
pnpm dev:api
```

## ngrok tunnel ochish

Avval `pnpm dev:all` ishlayotgan bo'lishi kerak. Yangi terminal ochib quyidagini bajaring:

```bash
ngrok http 8443
```

Terminaldagi `Forwarding` qatorida public HTTPS manzil ko'rinadi, masalan:

```text
https://example.ngrok-free.app
```

Shu manzilni brauzerda oching. Vite `/api` va `/uploads` so'rovlarini backendning `3001` portiga proxy qiladi, shu sababli alohida backend tunneli kerak emas.

Tunnel URL har safar o'zgarishi mumkin. Jarayonni to'xtatish uchun ngrok terminalida `Ctrl+C` bosing.

## Tekshirish

```bash
curl http://localhost:8443/api/health
pnpm build
pnpm build:check
```

## Render'da bir kunlik demo

Repozitoriydagi `render.yaml` frontend, Express API va seed qilingan demo SQLite
bazasini bitta bepul Web Service sifatida ishga tushiradi. Render Dashboard'da
**New + > Blueprint** ni tanlang va GitHub repozitoriyni ulang.

Free servis 15 daqiqa trafik bo'lmasa uxlaydi. Uyg'onganda yoki qayta deploy
bo'lganda SQLite bazadagi yangi o'zgarishlar yo'qolib, seed qilingan demo holati
qaytishi mumkin. Shu sabab bu konfiguratsiya faqat qisqa demo uchun mo'ljallangan.

Deploy tugagach quyidagilarni tekshiring:

```text
https://<render-servis-nomi>.onrender.com/
https://<render-servis-nomi>.onrender.com/api/health
```

## Demo hisoblar

Har ikkala hisob uchun parol: `demo`.

- O'quvchi: `student@demo.uz`
- Administrator: `admin@demo.uz`

## Asosiy buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `pnpm dev:all`  'npm run dev:all' | Frontend va backendni birga ishga tushiradi |
| `pnpm dev` | Faqat Vite frontendni ishga tushiradi |
| `pnpm dev:api` | Faqat Express API'ni watch rejimida ishga tushiradi |
| `pnpm build` | Production frontend build yaratadi |
| `pnpm build:check` | Frontend va backend TypeScript tekshiruvini bajaradi |
| `pnpm db:generate` | Prisma client yaratadi |
| `pnpm db:deploy` | Mavjud migratsiyalarni bazaga qo'llaydi |
| `pnpm db:seed` | Demo ma'lumotlarni bazaga yozadi |
| `pnpm db:studio` | Prisma Studio'ni ochadi |
