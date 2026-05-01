# Sistem Pemesanan Tiket Event — UTS PPLOS

## Identitas

- Nama: Putri Calista Devianof
- NIM: 2410511141
- Kelas: B
- Mata Kuliah: Pemrograman Platform dan Layanan Online (PPLOS)

---

## Arsitektur

Sistem ini terdiri dari 3 microservice independen yang berkomunikasi melalui REST API, ditambah 1 API Gateway sebagai single entry point.

- **API Gateway** (Node.js Express) — port 8000, handle routing, rate limiting 60 req/menit/IP, dan validasi JWT
- **Auth Service** (Node.js Express) — port 8001, handle register, login, JWT, dan OAuth GitHub
- **Event Service** (PHP CodeIgniter 4) — port 8002, handle daftar event dan kategori tiket
- **Ticket Service** (Node.js Express) — port 8003, handle pemesanan tiket, QR code, dan validasi

Setiap service punya database MySQL sendiri:
- auth_db → users, oauth_accounts, refresh_tokens, token_blacklist
- event_db → organizers, events, ticket_categories, event_categories
- ticket_db → orders, order_items, tickets, ticket_validations

Kenapa microservice dan bukan monolitik? Dengan microservice, setiap service bisa di-deploy, di-scale, dan dikembangkan secara independen. Kalau satu service error, service lain tetap jalan. Selain itu, tiap service bebas pakai teknologi yang paling sesuai.

---

## Cara Menjalankan

### Prasyarat
- Docker Desktop sudah terinstall dan berjalan
- Git sudah terinstall

### Langkah-langkah

1. Clone repository

git clone https://github.com/USERNAMEMU/uts-pplos-d-2410511141.git
cd uts-pplos-d-2410511141

2. Buat file .env dari template
copy .env.example .env

3. Buka file .env dan isi nilai berikut:
JWT_SECRET=isi_string_random_panjang
GITHUB_CLIENT_ID=isi_dari_github_settings
GITHUB_CLIENT_SECRET=isi_dari_github_settings
GITHUB_CALLBACK_URL=http://localhost:8000/api/auth/oauth/github/callback
AUTH_DB_PASS=authpw141
EVENT_DB_PASS=eventpw141
TICKET_DB_PASS=tiketpw141
GitHub OAuth credentials bisa didapat di https://github.com/settings/developers → OAuth Apps → New OAuth App

4. Jalankan semua service
docker-compose up --build

5. Tunggu sampai semua container berstatus Up, biasanya 5-10 menit pertama kali

6. Cek status container
docker ps

7. Test gateway berjalan
curl http://localhost:8000/health

### Akun default untuk testing
- Admin: email `admin@tiket.com`, password `password`
- User biasa: daftar sendiri lewat endpoint register

## Peta Routing Gateway

Semua request masuk lewat port 8000, lalu diteruskan ke service yang sesuai:

- `/api/auth/*` → auth-service (port 8001)
- `/api/users/*` → auth-service (port 8001)
- `/api/events/*` → event-service (port 8002)
- `/api/tickets/*` → ticket-service (port 8003)

---

## Daftar Endpoint

### Auth Service

- `POST /api/auth/register` — daftar akun baru, tidak perlu token
- `POST /api/auth/login` — login email + password, tidak perlu token
- `POST /api/auth/refresh` — perbarui access token pakai refresh token, tidak perlu token
- `POST /api/auth/logout` — logout dan blacklist token, perlu token
- `GET /api/auth/oauth/github` — redirect ke halaman login GitHub, tidak perlu token
- `GET /api/auth/oauth/github/callback` — callback setelah login GitHub, tidak perlu token
- `GET /api/users/profile` — lihat profil sendiri, perlu token

### Event Service

- `GET /api/events` — daftar semua event, support paging dan filter, perlu token
- `GET /api/events/:id` — detail satu event beserta kategori tiketnya, perlu token
- `POST /api/events` — buat event baru, perlu token admin
- `PUT /api/events/:id` — update event, perlu token admin
- `DELETE /api/events/:id` — hapus event, perlu token admin
- `GET /api/events/:id/categories` — lihat kategori tiket suatu event, perlu token

Filter yang bisa dipakai di GET /api/events:
- `?page=1&per_page=10` — paging
- `?status=published` — filter by status
- `?search=konser` — filter by kata kunci judul
- `?lokasi=jakarta` — filter by lokasi
- `?kategori=Konser` — filter by kategori event

### Ticket Service

- `POST /api/tickets/order` — pesan tiket, perlu token
- `GET /api/tickets/my` — lihat semua order milik saya, perlu token
- `GET /api/tickets/order/:id` — detail satu order beserta tiket di dalamnya, perlu token
- `GET /api/tickets/:id/eticket` — ambil e-ticket dan QR code, perlu token
- `POST /api/tickets/validate` — validasi tiket di pintu masuk, perlu token admin

---

## Struktur Folder
uts-pplos-d-2410511141/
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── gateway/
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── middleware/
│       ├── authMiddleware.js
│       └── rateLimiter.js
├── services/
│   ├── auth-service/
│   ├── event-service/
│   └── ticket-service/
├── docs/
│   ├── laporan-uts.pdf
│   └── arsitektur.png
├── poster/
└── postman/
└── collection.json

## Link Demo
https://youtu.be/GXnhSRPSAAg 