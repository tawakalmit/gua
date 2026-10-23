# 🚀 gua.my.id - Modern URL Shortener & Analytics

Website pendekin URL modern, aman, dan berkecepatan tinggi khusus untuk domain **gua.my.id** dengan integrasi database **Supabase**, analitik geolokasi, dan QR Code generator interaktif.

---

## ✨ Fitur yang Tersedia

### 1. Fitur Dasar (MVP)
- **Input URL & Validasi Ketat:** Memastikan format URL valid (`http://` atau `https://`), normalisasi otomatis, dan proteksi URL salah.
- **Auto-Generator Unik:** Membuat kode acak 6-karakter unik menggunakan algoritma Base62 (misal: `gua.my.id/xY7z9`).
- **1-Click Copy to Clipboard:** Tombol salin sekali klik dengan animasi feedback visual instan.
- **Sistem Redirect Server-Side (HTTP 302):** Mekanisme routing berkecepatan tinggi di level server edge melalui `app/[code]/route.ts`.

### 2. Kustomisasi & Akun (Dashboard)
- **Custom Alias:** Pengguna bisa membuat akhir tautan sesuai keinginan (misal: `gua.my.id/promo-desember`).
- **Autentikasi Supabase:** Dukungan Login & Registrasi dengan Email & Password, Google OAuth, serta Mode Demo Cepat.
- **Manajemen Link:** Dashboard interaktif untuk:
  - Melihat daftar semua link
  - Mengedit URL tujuan tanpa merubah kode pendek
  - Menghapus link & data analitiknya
  - Mengaktifkan / menonaktifkan status link (toggle pause)
- **QR Code Generator:** Otomatis menghasilkan QR Code dengan kustomisasi warna (Klasik B/W, Indigo, Cyan) serta tombol unduh format PNG & SVG.

### 3. Fitur Analitik Real-Time
- **Click Counter:** Menampilkan total klik dan pengunjung unik secara real-time.
- **Geolokasi:** Melacak negara dan kota asal pengunjung (termasuk deteksi header Cloudflare / Vercel).
- **Referrer Tracking:** Mengkategorikan asal traffic (Direct, WhatsApp, Telegram, Google, Instagram, Twitter/X, TikTok, Facebook, dll).
- **Data Perangkat, OS & Browser:** Informasi apakah pengunjung menggunakan HP (Mobile), Desktop, atau Tablet, serta jenis browser (Chrome, Safari, Firefox, Edge).
- **Grafik Tren Visual:** Visual bar chart untuk memantau performa klik harian selama 7 hari terakhir.

---

## 🛠️ Panduan Integrasi Supabase

### Langkah 1: Jalankan Database Schema
1. Buka project Anda di [Supabase Dashboard](https://supabase.com/dashboard).
2. Masuk ke menu **SQL Editor** -> klik **New Query**.
3. Buka file `supabase/schema.sql` pada proyek ini, salin seluruh kodenya, lalu tempel di Supabase SQL Editor dan klik **Run**.
4. Script ini akan membuat:
   - Tabel `public.links` (dengan indeks `short_code` dan `user_id`)
   - Tabel `public.clicks` (untuk tracking analitik mendalam)
   - Function `public.record_click(...)` untuk pencatatan atomik
   - Row Level Security (RLS) policies untuk keamanan data

### Langkah 2: Konfigurasi File `.env.local`
Buka file `.env.local` di folder proyek ini dan isi dengan URL serta API Key dari project Supabase Anda (bisa didapatkan di **Project Settings -> API**):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh......
SUPABASE_SERVICE_ROLE_KEY=eyJh......

# Domain Utama
NEXT_PUBLIC_SITE_URL=https://gua.my.id
```

> **Catatan:** Jika belum memasukkan key Supabase, aplikasi secara otomatis berjalan dalam **Mode Demo / Lokal** menggunakan `localStorage`, sehingga Anda tetap dapat langsung mencoba seluruh fitur (shorten, QR code, dashboard, analitik visual).

---

## 🌐 Menghubungkan Domain `gua.my.id`

Jika Anda men-deploy website ini (misal di **Vercel**):
1. Masukkan domain `gua.my.id` di **Vercel Settings -> Domains**.
2. Pada DNS Management domain Anda (misal di Cloudflare / Niagahoster / Rumahweb):
   - Tambahkan CNAME record:
     - **Name:** `@` (atau subdomain yang diinginkan)
     - **Target:** `cname.vercel-dns.com`
3. Setelah DNS aktif, seluruh link `gua.my.id/alias` akan langsung dialihkan ke URL tujuan.

---

## 💻 Menjalankan Secara Lokal

```bash
# Install dependensi (sudah terpasang)
npm install

# Jalankan server pengembangan
npm run dev

# Buka di browser
# http://localhost:3000
```
