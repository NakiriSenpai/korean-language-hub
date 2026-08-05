# Korean Language Hub

MASTER PROMPT — SPRINT 0.1



PROJECT FOUNDATION



PERAN



Kamu adalah Senior Full Stack Software Engineer, Senior Frontend Engineer, Senior UI Engineer, Senior Database Architect, Senior DevOps Engineer, dan Senior Software Architect.



Kamu sedang membangun aplikasi production-grade.



Jangan membuat demo.



Jangan membuat prototype.



Jangan membuat mock project.



Bangun project yang siap dikembangkan hingga production.



---



MISSION



Tujuan Sprint 0.1 adalah membangun FOUNDATION PROJECT.



Sprint ini TIDAK BOLEH membuat fitur bisnis.



Sprint ini hanya membangun pondasi teknis.



Output Sprint harus menjadi dasar yang stabil untuk seluruh Sprint berikutnya.



---



PROJECT OVERVIEW



Project ini adalah platform SaaS Multi-Tenant untuk LPK Bahasa Korea.



Karakteristik utama:



- Mobile First.

- Responsive.

- PWA.

- Siap dibungkus menjadi Android App.

- Multi Tenant.

- Menggunakan Supabase External.

- Menggunakan Cloudinary.

- Menggunakan GitHub.

- Menggunakan React + TypeScript + Vite.



Seluruh arsitektur telah dikunci.



Jangan mengubah arsitektur.



---



TECH STACK



Framework



- React

- TypeScript

- Vite



Styling



- Tailwind CSS

- shadcn/ui



Backend



- Supabase External



Media



- Cloudinary



State



- Gunakan arsitektur state yang modular dan mudah dikembangkan.



Package Manager



- Gunakan package manager yang sudah digunakan project.



---



IMPLEMENTATION RULES



WAJIB:



- TypeScript Strict.

- Tidak boleh menggunakan any tanpa alasan kuat.

- Tidak boleh duplicate code.

- Tidak boleh hardcode warna.

- Semua warna berasal dari Design Token.

- Gunakan struktur modular.

- Semua import menggunakan alias project.



DILARANG:



- Mengubah arsitektur.

- Menambah library tanpa kebutuhan jelas.

- Membuat fitur di luar Sprint.

- Membuat dummy business logic.

- Membuat mock authentication.

- Membuat database.

- Membuat CRUD.



---



TARGET SPRINT



Implementasikan seluruh Foundation berikut.



1. Folder Architecture



Buat struktur folder yang bersih berdasarkan domain.



Minimal mencakup:



- app

- shared

- platform

- identity

- academic

- learning

- knowledge

- assessment

- analytics

- media



Sertakan folder untuk:



- components

- hooks

- services

- types

- utils

- config

- assets



Struktur harus mudah dikembangkan pada Sprint berikutnya.



---



2. TypeScript



Aktifkan konfigurasi strict.



Pastikan:



- strict mode aktif

- path alias siap digunakan

- konfigurasi konsisten



---



3. ESLint & Formatting



Konfigurasikan linting agar konsisten.



Project tidak boleh memiliki error lint.



---



4. Environment



Siapkan konfigurasi environment.



Belum menghubungkan database.



Hanya siapkan struktur konfigurasi yang aman.



Contoh kebutuhan:



- Supabase URL

- Supabase Key

- Cloudinary Cloud Name

- Cloudinary Upload Preset



Jangan hardcode.



---



5. Shared Configuration



Siapkan folder konfigurasi untuk:



- App Config

- Environment

- Constants

- Logger

- Error Handler



Belum implementasi logika bisnis.



---



6. Project Constants



Siapkan konstanta global.



Contoh:



- App Name

- App Version

- Default Language

- Theme Default



Semua diletakkan pada shared constants.



---



7. Alias Import



Seluruh project menggunakan alias.



Hindari relative import yang panjang.



---



8. Error Boundary Foundation



Siapkan Error Boundary global.



Belum perlu desain final.



Yang penting fondasi sudah ada.



---



9. Loading Foundation



Siapkan Loading Component global.



Belum perlu animasi kompleks.



---



10. Git Readiness



Pastikan project bersih.



Tidak ada:



- file sementara

- konfigurasi tidak terpakai

- dependency tidak digunakan



---



OUT OF SCOPE



Jangan membuat:



- Login

- Dashboard

- Exam

- Lesson

- CMS

- Analytics

- Database

- Migration

- RLS

- API

- CRUD

- Leaderboard

- Bookmark

- Progress

- Notification

- Achievement



Semua itu akan dibuat pada Sprint berikutnya.



---



ACCEPTANCE TEST



Sprint dinyatakan selesai apabila:



✓ Project berhasil dijalankan.



✓ Build berhasil.



✓ Tidak ada TypeScript Error.



✓ Tidak ada ESLint Error.



✓ Struktur folder sesuai.



✓ Alias import bekerja.



✓ Environment siap.



✓ Error Boundary tersedia.



✓ Loading Foundation tersedia.



✓ Shared Config tersedia.



✓ Tidak ada fitur bisnis yang dibuat.



---



DEFINITION OF DONE



Sebelum selesai:



1. Lakukan self review.

2. Pastikan seluruh Acceptance Test lulus.

3. Pastikan tidak ada file yang tidak digunakan.

4. Pastikan struktur mengikuti arsitektur.

5. Jangan melakukan improvisasi di luar scope.



Jika ada konflik terhadap instruksi, hentikan implementasi dan laporkan. Jangan mengambil keputusan sendiri.



---



GIT



Setelah seluruh Acceptance Test PASS:



Commit:



feat(core): initialize project foundation



Push ke branch:



development



---



SPRINT REPORT



Di akhir implementasi wajib melaporkan:



- Ringkasan pekerjaan.

- File yang dibuat.

- File yang diubah.

- Dependency yang ditambahkan.

- Acceptance Test.

- Known Issues.

- Commit Message.

- Rekomendasi sebelum Sprint 0.2 dimulai.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4cd67de2-2d1e-4497-b557-c8ef96f64f9f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
