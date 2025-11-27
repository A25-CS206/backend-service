Tentu, ini adalah versi **README.md** yang lengkap, rapi, dan siap pakai.

Kamu tinggal buat file baru bernama `README.md` di root folder proyekmu (atau timpa yang lama), lalu paste kode di bawah ini.

---

````markdown
# 🚀 AI Learning Insight - Back-End Service

Repository ini berisi **RESTful API** untuk sistem Learning Insight. Dibangun menggunakan **Hapi.js**, database **PostgreSQL (Neon)**, dan di-deploy menggunakan **Vercel**.

---

## 🌐 Base URL (Production)

**`https://backend-service-tau.vercel.app`**

> **Catatan:** Untuk endpoint yang membutuhkan otentikasi, sertakan header:
> `Authorization: Bearer <your_access_token>`

---

## 📝 API Documentation

### 🔐 1. Authentication (User Management)

#### **Register User**

Mendaftarkan akun siswa baru dengan data lengkap.

- **URL:** `/users`
- **Method:** `POST`
- **Auth:** Public
- **Body (JSON):**
  ```json
  {
    "name": "Muhammad Naufal",
    "email": "naufal@student.devacademy.id",
    "password": "password123",
    "phone": "081234567890",
    "city": "Bandung",
    "imagePath": "[https://example.com/avatar.jpg](https://example.com/avatar.jpg)" // (Opsional)
  }
  ```
````

- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "User berhasil ditambahkan",
    "data": { "userId": "user-xxxxxxxx" }
  }
  ```

#### **Login**

Masuk sistem untuk mendapatkan Token Akses.

- **URL:** `/authentications`
- **Method:** `POST`
- **Auth:** Public
- **Body (JSON):**
  ```json
  {
    "email": "naufal@student.devacademy.id",
    "password": "password123"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Authentication berhasil ditambahkan",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI..." // SIMPAN TOKEN INI
    }
  }
  ```

#### **Get User Profile**

Mendapatkan data diri user yang sedang login.

- **URL:** `/users/me`
- **Method:** `GET`
- **Auth:** **Bearer Token**
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "user-xxxxxxxx",
        "name": "Muhammad Naufal",
        "email": "naufal@student.devacademy.id",
        "phone": "081234567890",
        "city": "Bandung",
        "role": "developer"
      }
    }
  }
  ```

---

### 📚 2. Journeys (Manajemen Kelas)

#### **Create Journey** (Admin/Instructor Only)

Membuat kelas baru. **Hanya bisa dilakukan jika `role` user adalah `admin` atau `instructor`.**

- **URL:** `/journeys`
- **Method:** `POST`
- **Auth:** **Bearer Token** (Role: Admin)
- **Body (JSON):**
  ```json
  {
    "name": "Belajar Dasar Machine Learning",
    "summary": "Kelas pengenalan ML untuk pemula",
    "difficulty": "beginner" // Pilihan: beginner, intermediate, advanced
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Kelas berhasil ditambahkan",
    "data": { "journeyId": "journey-xxxxxxxx" }
  }
  ```

#### **Get All Journeys**

Melihat daftar semua kelas yang tersedia.

- **URL:** `/journeys`
- **Method:** `GET`
- **Auth:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "journeys": [
        {
          "id": "journey-xxxxxxxx",
          "name": "Belajar Dasar Machine Learning",
          "difficulty": "beginner",
          "instructor_name": "Nama Admin/Instruktur"
        }
      ]
    }
  }
  ```

#### **Get Journey Detail**

Melihat detail satu kelas spesifik.

- **URL:** `/journeys/{id}`
- **Method:** `GET`
- **Auth:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "journey": {
        "id": "journey-xxxxxxxx",
        "name": "Belajar Dasar Machine Learning",
        "summary": "Kelas pengenalan ML untuk pemula",
        "difficulty": "beginner",
        "instructor_name": "Nama Admin"
      }
    }
  }
  ```

---

### 📊 3. Trackings (Aktivitas Belajar)

#### **Log Activity**

Mencatat saat siswa membuka materi. Data ini digunakan untuk analisis AI.

- **URL:** `/trackings`
- **Method:** `POST`
- **Auth:** **Bearer Token**
- **Body (JSON):**
  ```json
  {
    "journeyId": "journey-xxxxxxxx", // ID Kelas
    "tutorialId": "tutorial-id-dari-database" // ID Materi
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Aktivitas berhasil dicatat",
    "data": { "trackingId": "track-xxxxxxxx" }
  }
  ```

#### **Get My Activity History**

Melihat riwayat belajar siswa sendiri (untuk grafik dashboard).

- **URL:** `/trackings/me`
- **Method:** `GET`
- **Auth:** **Bearer Token**
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "activities": [
        {
          "id": "track-xxxxxxxx",
          "journey_name": "Belajar Dasar Machine Learning",
          "tutorial_title": "Pengenalan Python",
          "status": "in_progress",
          "last_viewed": "2025-11-27T10:00:00.000Z"
        }
      ]
    }
  }
  ```

---

## 🤖 Informasi untuk Tim Machine Learning

Data aktivitas belajar tersimpan secara _real-time_ di Database **Neon (PostgreSQL)**.

- **Tabel Utama:** `developer_journey_trackings`
- **Akses Data:** Gunakan kredensial database yang telah dibagikan untuk menghubungkan script Python/Pandas kalian.

---

## 🛠️ Cara Menjalankan Lokal

1.  Clone repo ini.
2.  `npm install`
3.  Buat file `.env` (sesuaikan dengan config database lokal).
4.  Jalankan migrasi database di TablePlus (folder `/migrations`).
5.  `npm run start-dev`.

---

```

```
