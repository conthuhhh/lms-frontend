# LMS — Frontend (React + Vite)

Giao diện hệ thống Quản lý Học tập (LMS), kết nối API backend qua biến `VITE_API_URL`.

## Đăng nhập thử / Demo login

| Email | Password |
|---|---|
| admin@lms.com | admin123 |
| instructor@lms.com | instructor123 |
| student@lms.com | student123 |

## Chạy local

```bash
npm install
npm run dev
```

Mặc định gọi API tại `http://localhost:5000/api` (hoặc cấu hình trong `.env`: `VITE_API_URL=...`).

## Build production

```bash
npm run build
```
