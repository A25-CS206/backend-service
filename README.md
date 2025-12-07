# 🎓 Learning Insight API - Backend Service

[![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://backend-service-tau.vercel.app)
[![Node Version](https://img.shields.io/badge/node-18.x-green?logo=node.js)](https://nodejs.org)
[![Framework](https://img.shields.io/badge/Framework-Hapi.js-orange)](https://hapi.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org)

> **Capstone Project A25-CS206 | Bangkit Academy 2025**  
> Platform pembelajaran adaptif berbasis AI yang menganalisis pola belajar siswa secara real-time menggunakan Machine Learning.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [API Endpoints](#-api-endpoints)
- [ML Integration](#-ml-integration)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Tech Stack](#-tech-stack)
- [Team](#-team)
- [Related Repositories](#-related-repositories)

---

## 🌟 Overview

Learning Insight adalah sistem pembelajaran cerdas yang tidak hanya mencatat aktivitas belajar, tetapi **memahami karakteristik setiap siswa**. Menggunakan algoritma clustering K-Means, sistem ini mengelompokkan siswa ke dalam 3 tipe pembelajar:

| Tipe Learner | Karakteristik | Rekomendasi |
|--------------|---------------|-------------|
| ⚡ **Fast Learner** | Volume belajar harian sangat tinggi | Tantangan lebih kompleks |
| 🎯 **Consistent Learner** | Pola login sangat stabil & disiplin | Pertahankan konsistensi |
| 🤔 **Reflective Learner** | Durasi per materi sangat tinggi | Deep understanding exercises |

---

## ✨ Key Features

### 1. 🧠 AI-Powered Student Profiling
- **Automated Clustering**: Klasifikasi otomatis menggunakan K-Means
- **Real-time Analysis**: Analisis dipicu otomatis dari aktivitas terbaru
- **Confidence Score**: Tingkat keyakinan model (0-100%)

### 2. 📊 Smart Dashboard Analytics
- **Learning Trend Visualization**: Grafik aktivitas belajar harian (Senin-Minggu)
- **Consistency Tracking**: Persentase kedisiplinan dalam seminggu
- **Progress Metrics**: 
  - Total jam belajar
  - Jumlah modul diselesaikan
  - Rata-rata nilai kuis

### 3. 🎯 Personalized Recommendations
- **Dynamic Module Suggestion**: Rekomendasi materi berdasarkan tipe learner
- **Adaptive Feedback**: Saran spesifik untuk setiap tipe
- **Difficulty Matching**: Menyesuaikan tingkat kesulitan dengan kemampuan

### 4. 🏆 Gamification System
- **Achievement Badges**: Lencana otomatis berdasarkan tipe learner
- **Progress Tracking**: Monitor pencapaian secara visual
- **Motivational Feedback**: Pesan penyemangat personal

---

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │─────▶│  Backend API     │─────▶│   ML Service    │
│   (React)       │      │   (Hapi.js)      │      │   (Python)      │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   PostgreSQL     │
                         │   (Neon.tech)    │
                         └──────────────────┘
```

### Microservices Components

| Service | Platform | URL | Responsibility |
|---------|----------|-----|----------------|
| **Backend API** | Vercel | `https://backend-service-tau.vercel.app` | API Gateway, Business Logic, Data Aggregation |
| **ML Service** | Railway | `https://ml-learning-insight.up.railway.app` | Model Inference, Clustering Analysis |
| **Database** | Neon.tech | PostgreSQL Cloud | Data Persistence |

---

## 🔌 API Endpoints

### 🟢 Public Routes

```http
POST /users                    # Register new user
POST /authentications          # Login & get JWT token
GET  /journeys                 # Get all available courses
```

### 🔒 Protected Routes (Requires JWT Token)

```http
GET  /users/me                 # Get current user profile
GET  /dashboard                # Get complete dashboard data
GET  /insights/me              # Trigger AI analysis manually
POST /trackings                # Log learning activity
```

### 📖 Detailed Endpoint Documentation

#### 1. Register User

```http
POST /users
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "city": "Jakarta",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "User berhasil ditambahkan",
  "data": {
    "userId": "user-abc123"
  }
}
```

#### 2. Login

```http
POST /authentications
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Authentication berhasil ditambahkan",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. Get Dashboard (⭐ Main Feature)

```http
GET /dashboard
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "learner_type": "Fast Learner",
    "confidence": 87.5,
    "statistics": {
      "total_study_hours": 42.5,
      "completed_modules": 15,
      "average_quiz_score": 85.2,
      "consistency_percentage": 78.6
    },
    "weekly_trend": [
      { "day": "Monday", "materials": 5 },
      { "day": "Tuesday", "materials": 3 },
      ...
    ],
    "recommendations": [
      {
        "module_title": "Advanced JavaScript Patterns",
        "difficulty": "Hard",
        "reason": "Sesuai dengan pola belajar cepat Anda"
      }
    ],
    "badges": [
      { "name": "Fast Learner", "earned": true },
      { "name": "Consistent", "earned": false },
      { "name": "Reflective", "earned": false }
    ]
  }
}
```

#### 4. Log Activity

```http
POST /trackings
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "journey_id": "journey-xyz789",
  "material_id": "material-abc456",
  "duration": 1800
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Tracking berhasil ditambahkan"
}
```

---

## 🤖 ML Integration

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                   Data Flow Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│  1. User Activity  →  Log to Database                           │
│  2. Backend API    →  Aggregate 6 Statistical Features          │
│  3. ML Service     →  Scaler → PCA → K-Means Clustering         │
│  4. Prediction     →  Return Cluster ID & Confidence             │
│  5. Backend API    →  Map to Learner Type & Save                │
│  6. Dashboard      →  Display Results & Recommendations          │
└─────────────────────────────────────────────────────────────────┘
```

### Statistical Features Calculated

Backend menghitung 6 metrik dari raw activity logs:

| Feature | Description | Example Value |
|---------|-------------|---------------|
| `avg_materials_per_day` | Volume belajar harian rata-rata | 3.5 |
| `total_materials` | Total materi yang diselesaikan | 42 |
| `avg_duration_per_material` | Rata-rata waktu per materi (detik) | 450.2 |
| `total_weeks_active` | Berapa minggu user aktif | 8 |
| `avg_logins_per_week` | Rata-rata frekuensi login per minggu | 4.2 |
| `login_weekly_variance` | Stabilitas pola login (semakin rendah = semakin konsisten) | 0.8 |

### ML API Call Example

```javascript
// Backend sends aggregated features to ML Service
const mlResponse = await axios.post(
  'https://ml-learning-insight.up.railway.app/predict',
  {
    data: [
      {
        avg_materials_per_day: 3.5,
        total_materials: 42,
        avg_duration_per_material: 450.2,
        total_weeks_active: 8,
        avg_logins_per_week: 4.2,
        login_weekly_variance: 0.8
      }
    ]
  }
);

// ML Service returns
{
  "cluster_id": 0,
  "confidence": 87.5
}
```

### Cluster Mapping

| Cluster ID | Learner Type | Decision Logic |
|------------|--------------|----------------|
| **0** | ⚡ Fast Learner | `avg_materials_per_day` > threshold |
| **1** | 🎯 Consistent Learner | `login_weekly_variance` < threshold |
| **2** | 🤔 Reflective Learner | `avg_duration_per_material` > threshold |

---

## 🚀 Installation

### Prerequisites

- Node.js v18.x or higher
- npm or yarn
- PostgreSQL database (Neon.tech recommended)

### Steps

1. **Clone Repository**

```bash
git clone https://github.com/A25-CS206/backend-service.git
cd backend-service
```

2. **Install Dependencies**

```bash
npm install
```

3. **Setup Environment Variables**

Create `.env` file (see [Environment Variables](#-environment-variables) section)

4. **Run Development Server**

```bash
npm run start-dev
```

Server will run at `http://localhost:5000`

5. **Run Production Server**

```bash
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Server Configuration
HOST=localhost
PORT=5000

# JWT Secrets (CHANGE IN PRODUCTION!)
ACCESS_TOKEN_KEY=your-super-secret-access-token-key-min-32-chars
REFRESH_TOKEN_KEY=your-super-secret-refresh-token-key-min-32-chars
ACCESS_TOKEN_AGE=3600
REFRESH_TOKEN_AGE=86400

# ML Service
ML_SERVICE_URL=https://ml-learning-insight.up.railway.app/predict

# Optional: CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com
```

### Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` to version control
- Use strong, unique secrets in production
- Rotate tokens regularly
- Enable SSL/TLS for database connections

---

## 💻 Tech Stack

### Core Technologies

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Runtime** | Node.js v18+ | JavaScript runtime |
| **Framework** | Hapi.js | RESTful API framework |
| **Database** | PostgreSQL | Relational database |
| **Cloud DB** | Neon.tech | Serverless PostgreSQL |
| **Deployment** | Vercel | Serverless hosting |

### Key Dependencies

```json
{
  "@hapi/hapi": "^21.3.2",
  "@hapi/jwt": "^3.2.0",
  "bcrypt": "^5.1.1",
  "joi": "^17.11.0",
  "pg": "^8.11.3",
  "axios": "^1.6.2",
  "dotenv": "^16.3.1"
}
```

### Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing
- ✅ Joi input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS protection
- ✅ Rate limiting (via Vercel)

---

## 👥 Team

| Name | Role | Responsibilities |
|------|------|------------------|
| **Muhammad Azizsyah Putra** | Backend Lead | System architecture, database design, API development, ML integration |
| **Kevin Raydafa Algibran** | Backend Developer | Authentication system, journey management, API endpoints |
| **Muhammad Naufal Razani** | Frontend Developer | Dashboard UI/UX, API integration |
| **Ajar & Imam** | Machine Learning Engineers | Model training, Python microservice, deployment |

---

## 🔗 Related Repositories

- **Frontend**: [fe-learning-insight](https://github.com/A25-CS206/fe-learning-insight)
- **ML Service**: [ml-learning-insight](https://github.com/A25-CS206/ml-learning-insight)

---

## 📝 License

This project is part of Bangkit Academy 2025 Capstone Project.

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/A25-CS206/backend-service/issues)
- **Email**: [team-contact@example.com]

---

<div align="center">

**Made with ❤️ by Team A25-CS206**

[![Bangkit Academy](https://img.shields.io/badge/Bangkit-2025-blue)](https://grow.google/intl/id_id/bangkit/)

</div>
