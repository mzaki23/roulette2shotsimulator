# Roulette2Shot Simulator 📸

Simulator interaktif untuk proses "2Shot" (foto bersama) JKT48 Theater. Aplikasi ini mereplikasikan ketegangan dan keseruan proses pemanggilan bingo/roulette dan pemilihan member untuk sesi 2Shot, lengkap dengan efek visual dan atmosfer panggung yang premium.

## 🌟 Fitur Utama

- **Sistem Fase Terstruktur**: Mengikuti alur seru proses 2Shot.
  - **Setup**: Memilih setlist dan preferensi member.
  - **Fase 1 (Ambil Nomor)**: Pemilihan nomor antrean yang interaktif.
  - **Fase 2 (Roulette Pemanggilan)**: Simulasi panggilan nomor bergaya roulette dengan animasi yang menegangkan.
  - **Fase 3 (Wheel of Name)**: Putaran roda untuk menentukan urutan/member.
  - **Sesi Foto & Hasil**: Layar simulasi sesi foto 2-shot dan hasilnya.
- **Desain UI/UX Premium**: Menggunakan palet warna yang memukau dengan implementasi efek *Glassmorphism*, *Neon Glow*, dan pencahayaan panggung (*Stage Lighting*).
- **Animasi Mulus**: Didukung oleh CSS keyframes untuk interaksi yang terasa hidup (shimmer, pulse, flicker).
- **Responsif Penuh**: Mendukung perangkat mobile maupun desktop dengan optimalisasi layout yang rapi.

## 🎨 Teknologi & Sistem Desain

Proyek ini dibangun sepenuhnya menggunakan **Vanilla Web Technologies** (HTML, CSS, JS) tanpa *framework*, menghasilkan aplikasi yang ringan dan sangat dapat disesuaikan.

- **Struktur**: HTML5.
- **Styling**: Vanilla CSS murni dengan arsitektur variabel yang mendalam. Merujuk penuh pada [Design System](./design-system.md) (terinspirasi dari Material Design 3).
- **Logika**: Vanilla JavaScript yang terstruktur ke dalam beberapa modul spesifik (`data.js`, `components.js`, logika per-fase).
- **Tipografi**: *Space Grotesk* untuk *heading* yang tegas & *Be Vietnam Pro* untuk teks utama yang mudah dibaca.
- **Ikonografi**: Google Material Symbols Outlined.

## 🚀 Cara Menjalankan

Menjalankan aplikasi ini sangat mudah karena tidak memerlukan *build tool* (bundler) yang kompleks:

1. *Clone* repositori ini:
   ```bash
   git clone https://github.com/mzaki23/roulette2shotsimulator.git
   ```
2. Buka folder proyek:
   ```bash
   cd roulette2shotsimulator
   ```
3. Jalankan menggunakan *Local Web Server*. Menjalankan langsung file `index.html` mungkin akan memicu *security policy* (CORS) pada browser untuk operasi tertentu seperti pengambilan *canvas* atau ES Modules. Disarankan menggunakan:
   - **VS Code**: Install dan gunakan ekstensi "Live Server".
   - **Python**: Jalankan perintah `python -m http.server 8000` di terminal.
   - **Node.js**: Jalankan perintah `npx http-server` atau `npx vite`.
4. Buka URL lokal (misalnya `http://localhost:8000`) di browser Anda.

## 📁 Struktur Direktori Proyek

```text
/roulette2shotsimulator
├── /css                # Berkas styling (style.css)
├── /js                 # Logika modular aplikasi (app.js, phase1.js, dll)
├── /members            # Aset foto/gambar para member
├── /backdrops          # Background/vignette untuk sesi foto
├── /logos              # Logo setlist & aplikasi
├── /scrape             # Script/alat untuk mengambil data (opsional)
├── index.html          # Titik masuk aplikasi utama (Shell SPA)
├── design-system.md    # Dokumentasi standar UI dan token desain
└── README.md           # Berkas ini
```

## 🛠️ Modifikasi dan Kontribusi

Aplikasi ini menggunakan pendekatan CSS berbasis variabel dan utilitas kustom. Jika Anda ingin melakukan perubahan atau modifikasi desain, pastikan untuk memeriksa terlebih dahulu file `design-system.md` untuk memahami skala spasi, tipografi, warna, dan struktur animasi yang sudah ditetapkan, sehingga konsistensi desain tetap terjaga.

---
*Dibuat untuk komunitas JKT48.*
