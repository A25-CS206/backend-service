# 🎓 Learning Insight API - Backend Service

[![Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://backend-service-tau.vercel.app)
[![Node Version](https://img.shields.io/badge/node-18.x-green?logo=node.js)](https://nodejs.org)
[![Framework](https://img.shields.io/badge/Framework-Hapi.js-orange)](https://hapi.dev)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)](https://www.postgresql.org)

> **Capstone Project A25-CS206 | Asah 2025**  
> Platform pembelajaran adaptif berbasis AI yang menganalisis pola belajar siswa secara real-time menggunakan Machine Learning.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Complete API Routes](#-complete-api-routes)
- [API Documentation](#-api-documentation)
- [ML Integration](#-ml-integration)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Tech Stack](#-tech-stack)
- [Team](#-team)

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

## 🗺️ Complete API Routes

### Base URL
```
https://backend-service-tau.vercel.app
```

### Route Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| **Authentication & Users** |
| `POST` | `/users` | Public | Register new user |
| `GET` | `/users` | Admin | Get all users |
| `GET` | `/users/me` | Authenticated | Get current user profile |
| `PUT` | `/users/{id}` | Authenticated | Update user profile |
| `DELETE` | `/users/{id}` | Admin | Delete user |
| **Authentication** |
| `POST` | `/authentications` | Public | Login & get tokens |
| `PUT` | `/authentications` | Public | Refresh access token |
| `DELETE` | `/authentications` | Authenticated | Logout |
| **Journeys (Courses)** |
| `POST` | `/journeys` | Admin | Create new journey/course |
| `GET` | `/journeys` | Public | Get all journeys |
| `GET` | `/journeys/{id}` | Public | Get journey detail |
| `PUT` | `/journeys/{id}` | Admin | Update journey |
| `DELETE` | `/journeys/{id}` | Admin | Delete journey |
| **Materials** |
| `POST` | `/journeys/{id}/materials` | Admin | Add material to journey |
| `GET` | `/journeys/{id}/materials` | Public | Get all materials in journey |
| `GET` | `/materials/{id}` | Public | Get material detail |
| `PUT` | `/materials/{id}` | Admin | Update material |
| `DELETE` | `/materials/{id}` | Admin | Delete material |
| **Tracking & Analytics** |
| `POST` | `/trackings` | Authenticated | Log learning activity |
| `GET` | `/trackings` | Authenticated | Get user's tracking history |
| `GET` | `/trackings/{id}` | Authenticated | Get specific tracking detail |
| **Dashboard & Insights** |
| `GET` | `/dashboard` | Authenticated | Get complete dashboard data ⭐ |
| `GET` | `/insights/me` | Authenticated | Trigger AI analysis manually |
| **Exams & Quizzes** |
| `POST` | `/exams` | Admin | Create exam/quiz |
| `GET` | `/exams` | Public | Get all exams |
| `GET` | `/exams/{id}` | Public | Get exam detail |
| `POST` | `/exams/{id}/submit` | Authenticated | Submit exam answers |
| `GET` | `/exams/{id}/results` | Authenticated | Get exam results |

---

## 📖 API Documentation

### 🔐 Authentication & User Management

#### 1. Register New User

```http
POST https://backend-service-tau.vercel.app/users
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
    "userId": "user-abc123xyz"
  }
}
```

**Error Responses:**
```json
// 400 Bad Request - Email already exists
{
  "status": "fail",
  "message": "Email sudah terdaftar"
}

// 400 Bad Request - Invalid input
{
  "status": "fail",
  "message": "Validation error",
  "errors": {
    "email": "Email tidak valid",
    "password": "Password minimal 8 karakter"
  }
}
```

---

#### 2. Get All Users (Admin Only)

```http
GET https://backend-service-tau.vercel.app/users
Authorization: Bearer <admin_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": "user-abc123",
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "08123456789",
        "city": "Jakarta",
        "role": "student",
        "created_at": "2024-12-01T10:30:00.000Z"
      },
      {
        "id": "user-def456",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "phone": "08198765432",
        "city": "Bandung",
        "role": "student",
        "created_at": "2024-12-02T14:20:00.000Z"
      }
    ],
    "total": 2
  }
}
```

**Error Response:**
```json
// 403 Forbidden - Not admin
{
  "status": "fail",
  "message": "Akses ditolak. Hanya admin yang dapat mengakses resource ini"
}
```

---

#### 3. Login

```http
POST https://backend-service-tau.vercel.app/authentications
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
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWFiYzEyMyIsImlhdCI6MTczMzU4MDAwMCwiZXhwIjoxNzMzNTgzNjAwfQ.xxx",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLWFiYzEyMyIsImlhdCI6MTczMzU4MDAwMH0.yyy"
  }
}
```

**Error Response:**
```json
// 401 Unauthorized - Wrong credentials
{
  "status": "fail",
  "message": "Email atau password salah"
}
```

---

#### 4. Get Current User Profile

```http
GET https://backend-service-tau.vercel.app/users/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "user-abc123",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "08123456789",
      "city": "Jakarta",
      "role": "student",
      "created_at": "2024-12-01T10:30:00.000Z",
      "learner_type": "Fast Learner",
      "total_materials_completed": 42,
      "total_study_hours": 35.5
    }
  }
}
```

---

#### 5. Refresh Access Token

```http
PUT https://backend-service-tau.vercel.app/authentications
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Access Token berhasil diperbarui",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_token..."
  }
}
```

---

#### 6. Logout

```http
DELETE https://backend-service-tau.vercel.app/authentications
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Refresh token berhasil dihapus"
}
```

---

### 📚 Journey Management

#### 7. Create New Journey (Admin Only)

```http
POST https://backend-service-tau.vercel.app/journeys
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Web Development Fundamentals",
  "description": "Learn HTML, CSS, and JavaScript from scratch",
  "difficulty": "beginner",
  "estimated_hours": 40,
  "category": "web-development"
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Journey berhasil ditambahkan",
  "data": {
    "journeyId": "journey-xyz789"
  }
}
```

---

#### 8. Get All Journeys

```http
GET https://backend-service-tau.vercel.app/journeys
```

**Query Parameters:**
- `category` (optional): Filter by category
- `difficulty` (optional): Filter by difficulty (beginner, intermediate, advanced)
- `limit` (optional): Number of results (default: 20)
- `page` (optional): Page number (default: 1)

**Example:**
```http
GET https://backend-service-tau.vercel.app/journeys?difficulty=beginner&limit=10
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "journeys": [
      {
        "id": "journey-xyz789",
        "title": "Web Development Fundamentals",
        "description": "Learn HTML, CSS, and JavaScript from scratch",
        "difficulty": "beginner",
        "estimated_hours": 40,
        "category": "web-development",
        "total_materials": 25,
        "enrolled_students": 150,
        "created_at": "2024-11-15T08:00:00.000Z"
      },
      {
        "id": "journey-abc456",
        "title": "Python for Data Science",
        "description": "Master Python basics and data analysis libraries",
        "difficulty": "intermediate",
        "estimated_hours": 50,
        "category": "data-science",
        "total_materials": 30,
        "enrolled_students": 200,
        "created_at": "2024-11-20T09:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 2,
      "totalPages": 1
    }
  }
}
```

---

#### 9. Get Journey Detail

```http
GET https://backend-service-tau.vercel.app/journeys/{id}
```

**Example:**
```http
GET https://backend-service-tau.vercel.app/journeys/journey-xyz789
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "journey": {
      "id": "journey-xyz789",
      "title": "Web Development Fundamentals",
      "description": "Learn HTML, CSS, and JavaScript from scratch",
      "difficulty": "beginner",
      "estimated_hours": 40,
      "category": "web-development",
      "total_materials": 25,
      "enrolled_students": 150,
      "created_at": "2024-11-15T08:00:00.000Z",
      "materials": [
        {
          "id": "material-001",
          "title": "Introduction to HTML",
          "type": "video",
          "duration_minutes": 30,
          "order": 1
        },
        {
          "id": "material-002",
          "title": "CSS Basics",
          "type": "article",
          "duration_minutes": 45,
          "order": 2
        }
      ]
    }
  }
}
```

---

### 📊 Tracking & Activity

#### 10. Log Learning Activity

```http
POST https://backend-service-tau.vercel.app/trackings
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "journey_id": "journey-xyz789",
  "material_id": "material-001",
  "duration": 1800,
  "completed": true
}
```

**Field Descriptions:**
- `journey_id`: ID journey yang sedang dipelajari
- `material_id`: ID material yang diakses
- `duration`: Durasi belajar dalam detik (1800 = 30 menit)
- `completed`: true jika material selesai, false jika masih dalam progress

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Tracking berhasil ditambahkan",
  "data": {
    "trackingId": "tracking-def456"
  }
}
```

---

#### 11. Get User's Tracking History

```http
GET https://backend-service-tau.vercel.app/trackings
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `journey_id` (optional): Filter by specific journey
- `start_date` (optional): Filter from date (YYYY-MM-DD)
- `end_date` (optional): Filter until date (YYYY-MM-DD)
- `limit` (optional): Number of results (default: 50)

**Example:**
```http
GET https://backend-service-tau.vercel.app/trackings?journey_id=journey-xyz789&limit=20
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "trackings": [
      {
        "id": "tracking-def456",
        "journey_id": "journey-xyz789",
        "journey_title": "Web Development Fundamentals",
        "material_id": "material-001",
        "material_title": "Introduction to HTML",
        "duration": 1800,
        "completed": true,
        "timestamp": "2024-12-07T14:30:00.000Z"
      },
      {
        "id": "tracking-ghi789",
        "journey_id": "journey-xyz789",
        "journey_title": "Web Development Fundamentals",
        "material_id": "material-002",
        "material_title": "CSS Basics",
        "duration": 2700,
        "completed": false,
        "timestamp": "2024-12-07T16:00:00.000Z"
      }
    ],
    "total": 2
  }
}
```

---

### 📈 Dashboard & Insights (⭐ Main Features)

#### 12. Get Complete Dashboard Data

```http
GET https://backend-service-tau.vercel.app/dashboard
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "learner_profile": {
      "learner_type": "Fast Learner",
      "cluster_id": 0,
      "confidence": 87.5,
      "description": "Wow! Kamu melahap materi dengan sangat cepat dan agresif.",
      "last_analysis": "2024-12-07T10:30:00.000Z"
    },
    "statistics": {
      "total_study_hours": 42.5,
      "completed_modules": 15,
      "average_quiz_score": 85.2,
      "consistency_percentage": 78.6,
      "current_streak_days": 7,
      "longest_streak_days": 14
    },
    "weekly_trend": [
      { "day": "Monday", "materials": 5, "hours": 3.5 },
      { "day": "Tuesday", "materials": 3, "hours": 2.0 },
      { "day": "Wednesday", "materials": 6, "hours": 4.2 },
      { "day": "Thursday", "materials": 4, "hours": 3.0 },
      { "day": "Friday", "materials": 2, "hours": 1.5 },
      { "day": "Saturday", "materials": 0, "hours": 0 },
      { "day": "Sunday", "materials": 1, "hours": 0.8 }
    ],
    "recommendations": [
      {
        "journey_id": "journey-abc456",
        "title": "Advanced JavaScript Patterns",
        "difficulty": "advanced",
        "estimated_hours": 30,
        "reason": "Sesuai dengan pola belajar cepat Anda",
        "match_score": 92
      },
      {
        "journey_id": "journey-def789",
        "title": "React.js Masterclass",
        "difficulty": "intermediate",
        "estimated_hours": 25,
        "reason": "Next step setelah menyelesaikan JavaScript fundamentals",
        "match_score": 88
      }
    ],
    "badges": [
      {
        "name": "Fast Learner",
        "description": "Menyelesaikan materi dengan cepat dan efisien",
        "icon": "⚡",
        "earned": true,
        "earned_at": "2024-12-01T12:00:00.000Z"
      },
      {
        "name": "Consistent Learner",
        "description": "Belajar secara konsisten setiap minggu",
        "icon": "🎯",
        "earned": false,
        "earned_at": null
      },
      {
        "name": "Reflective Learner",
        "description": "Mendalami setiap materi dengan seksama",
        "icon": "🤔",
        "earned": false,
        "earned_at": null
      }
    ],
    "recent_activities": [
      {
        "id": "tracking-xyz123",
        "action": "completed",
        "journey_title": "Web Development Fundamentals",
        "material_title": "JavaScript Arrays",
        "timestamp": "2024-12-07T14:30:00.000Z"
      },
      {
        "id": "tracking-abc456",
        "action": "started",
        "journey_title": "Web Development Fundamentals",
        "material_title": "JavaScript Objects",
        "timestamp": "2024-12-07T16:00:00.000Z"
      }
    ]
  }
}
```

---

#### 13. Trigger AI Analysis Manually

```http
GET https://backend-service-tau.vercel.app/insights/me
Authorization: Bearer <access_token>
```

**Purpose**: Re-analyze user's learning pattern dan update tipe learner

**Response (200 OK):**
```json
{
  "status": "success",
  "message": "Analisis berhasil dilakukan",
  "data": {
    "learner_type": "Fast Learner",
    "cluster_id": 0,
    "confidence": 87.5,
    "changed": false,
    "previous_type": "Fast Learner",
    "statistics": {
      "avg_materials_per_day": 3.5,
      "total_materials": 42,
      "avg_duration_per_material": 450.2,
      "total_weeks_active": 8,
      "avg_logins_per_week": 4.2,
      "login_weekly_variance": 0.8
    },
    "analyzed_at": "2024-12-07T17:00:00.000Z"
  }
}
```

---

### 📝 Exams & Quizzes

#### 14. Create Exam (Admin Only)

```http
POST https://backend-service-tau.vercel.app/exams
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "journey_id": "journey-xyz789",
  "title": "HTML & CSS Basics Quiz",
  "description": "Test your understanding of HTML and CSS fundamentals",
  "duration_minutes": 30,
  "passing_score": 70,
  "questions": [
    {
      "question": "What does HTML stand for?",
      "type": "multiple_choice",
      "options": [
        "Hyper Text Markup Language",
        "High Tech Modern Language",
        "Home Tool Markup Language",
        "Hyperlinks and Text Markup Language"
      ],
      "correct_answer": 0,
      "points": 10
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Exam berhasil ditambahkan",
  "data": {
    "examId": "exam-abc123"
  }
}
```

---

#### 15. Get All Exams

```http
GET https://backend-service-tau.vercel.app/exams
```

**Query Parameters:**
- `journey_id` (optional): Filter by journey

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "exams": [
      {
        "id": "exam-abc123",
        "journey_id": "journey-xyz789",
        "journey_title": "Web Development Fundamentals",
        "title": "HTML & CSS Basics Quiz",
        "duration_minutes": 30,
        "total_questions": 10,
        "passing_score": 70,
        "attempts_allowed": 3
      }
    ],
    "total": 1
  }
}
```

---

#### 16. Submit Exam Answers

```http
POST https://backend-service-tau.vercel.app/exams/{id}/submit
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "answers": [
    {
      "question_id": "q1",
      "answer": 0
    },
    {
      "question_id": "q2",
      "answer": 2
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "status": "success",
  "message": "Exam berhasil di-submit",
  "data": {
    "score": 85,
    "passed": true,
    "correct_answers": 17,
    "total_questions": 20,
    "percentage": 85,
    "time_taken_minutes": 25
  }
}
```

---

## 🤖 ML Integration

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                   Data Flow Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│  1. User Activity  →  Log to Database (trackings table)         │
│  2. Backend API    →  Aggregate 6 Statistical Features          │
│  3. ML Service     →  Scaler → PCA → K-Means Clustering         │
│  4. Prediction     →  Return Cluster ID & Confidence             │
│  5. Backend API    →  Map to Learner Type & Save                │
│  6. Dashboard      →  Display Results & Recommendations          │
└─────────────────────────────────────────────────────────────────┘
```

### Statistical Features Calculated by Backend

Backend menghitung 6 metrik dari raw activity logs:

| Feature | SQL Calculation | Example Value |
|---------|----------------|---------------|
| `avg_materials_per_day` | `COUNT(DISTINCT material_id) / COUNT(DISTINCT DATE(timestamp))` | 3.5 |
| `total_materials` | `COUNT(DISTINCT material_id)` | 42 |
| `avg_duration_per_material` | `AVG(duration) / 60` (convert to minutes) | 15.0 |
| `total_weeks_active` | `CEIL(DATEDIFF(MAX(date), MIN(date)) / 7)` | 8 |
| `avg_logins_per_week` | `COUNT(DISTINCT DATE(timestamp)) / total_weeks` | 4.2 |
| `login_weekly_variance` | `STDDEV(weekly_login_counts)` | 5.0 |

### ML API Call Example

```javascript
// Backend sends aggregated features to ML Service
const response = await axios.post(
  'https://ml-learning-insight.up.railway.app/predict',
  {
    data: [
      {
        avg_materials_per_day: 3.5,
        total_materials: 42,
        avg_duration_per_material: 15.0,
        total_weeks_active: 8,
        avg_logins_per_week: 4.2,
        login_weekly_variance: 5.0
      }
    ]
  }
);

// ML Service returns
const mlResult = response.data;
// {
//   "predictions": [{
//     "cluster_id": 0,
//     "learner_type": "Fast Learner",
//     "confidence": 87.5
//   }]
// }
```

### Cluster Mapping

| Cluster ID | Learner Type | Decision Logic |
|------------|--------------|----------------|
| **0** | ⚡ Fast Learner | `avg_materials_per_day` > 5.0 |
| **1** | 🎯 Consistent Learner | `login_weekly_variance` < 1.0 |
| **2** | 🤔 Reflective Learner | `avg_duration_per_material` > 20.0 |

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

4. **Run Database Migrations**

```bash
npm run migrate
```

5. **Seed Initial Data (Optional)**

```bash
npm run seed
```

6. **Run Development Server**

```bash
npm run start-dev
```

Server will run at `http://localhost:5000`

7. **Run Production Server**

```bash
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
<invoke name="artifacts">
<parameter name="command">update</parameter>
<parameter name="id">backend_readme</parameter>
<parameter name="old_str"># Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require</parameter>
<parameter name="new_str"># Database Configuration (Neon.tech)
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
Server Configuration
HOST=localhost
PORT=5000
NODE_ENV=development
JWT Secrets (⚠️ CHANGE IN PRODUCTION!)
ACCESS_TOKEN_KEY=your-super-secret-access-token-key-minimum-32-characters-long
REFRESH_TOKEN_KEY=your-super-secret-refresh-token-key-minimum-32-characters-long
ACCESS_TOKEN_AGE=3600
REFRESH_TOKEN_AGE=86400
ML Service Configuration
ML_SERVICE_URL=https://ml-learning-insight.up.railway.app/predict
CORS Configuration (Optional)
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.vercel.app
Feature Flags (Optional)
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=false

### Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` to version control
- Use strong, unique secrets in production (min 32 characters)
- Rotate tokens regularly
- Enable SSL/TLS for database connections
- Use environment-specific secrets

### Example Production Environment Variables (Vercel)

Set these in Vercel Dashboard → Settings → Environment Variables:
DATABASE_URL=postgresql://...
ACCESS_TOKEN_KEY=production-secret-key-very-long-and-secure
REFRESH_TOKEN_KEY=production-refresh-key-very-long-and-secure
ML_SERVICE_URL=https://ml-learning-insight.up.railway.app/predict
ALLOWED_ORIGINS=https://your-frontend.vercel.app
NODE_ENV=production

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
  "dependencies": {
    "@hapi/hapi": "^21.3.2",
    "@hapi/jwt": "^3.2.0",
    "@hapi/inert": "^7.1.0",
    "@hapi/vision": "^7.0.3",
    "bcrypt": "^5.1.1",
    "joi": "^17.11.0",
    "pg": "^8.11.3",
    "axios": "^1.6.2",
    "dotenv": "^16.3.1",
    "nanoid": "^3.3.7"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0"
  }
}
```

### Security Features

- ✅ JWT-based authentication
- ✅ Bcrypt password hashing (salt rounds: 10)
- ✅ Joi input validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS protection
- ✅ Rate limiting (via Vercel)
- ✅ Secure headers (Helmet.js)

---

## 📊 Database Schema

### Main Tables
```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  city VARCHAR(50),
  password TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journeys (Courses) table
CREATE TABLE developer_journeys (
  id VARCHAR(50) PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20),
  estimated_hours INTEGER,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE developer_journey_materials (
  id VARCHAR(50) PRIMARY KEY,
  journey_id VARCHAR(50) REFERENCES developer_journeys(id),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type VARCHAR(20),
  duration_minutes INTEGER,
  order_index INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracking table
CREATE TABLE developer_journey_trackings (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  journey_id VARCHAR(50) REFERENCES developer_journeys(id),
  material_id VARCHAR(50) REFERENCES developer_journey_materials(id),
  duration INTEGER,
  completed BOOLEAN DEFAULT false,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Learning Clusters (ML Results)
CREATE TABLE user_learning_clusters (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) REFERENCES users(id),
  cluster_id INTEGER,
  learner_type VARCHAR(50),
  confidence DECIMAL(5,2),
  analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Authentications (Refresh Tokens)
CREATE TABLE authentications (
  token TEXT PRIMARY KEY
);
```

---

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- users.test.js

# Run with coverage
npm run test:coverage
```

### API Testing with cURL
```bash
# Register user
curl -X POST https://backend-service-tau.vercel.app/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "08123456789",
    "city": "Jakarta",
    "password": "testpass123"
  }'

# Login
curl -X POST https://backend-service-tau.vercel.app/authentications \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }'

# Get dashboard (with token)
curl -X GET https://backend-service-tau.vercel.app/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 📝 Error Handling

### Standard Error Response Format
```json
{
  "status": "fail",  // or "error" for 500+
  "message": "Human-readable error message",
  "errors": {  // Optional, for validation errors
    "field": "Error description"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| **200** | OK | Successful GET request |
| **201** | Created | Resource successfully created |
| **400** | Bad Request | Invalid input data |
| **401** | Unauthorized | Missing or invalid token |
| **403** | Forbidden | No permission to access resource |
| **404** | Not Found | Resource doesn't exist |
| **500** | Internal Server Error | Server-side error |

---

## 👥 Team

| Name | Role | Responsibilities |
|------|------|------------------|
| **Muhammad Azizsyah Putra** | Backend Lead | System architecture, database design, API development, ML integration, deployment |
| **Kevin Raydafa Algibran** | Backend Developer | Authentication system, journey management, API endpoints, testing |
| **Muhammad Naufal Razani** | Frontend Developer | Dashboard UI/UX, API integration, user testing |
| **Ajar & Imam** | Machine Learning Engineers | Model training, Python microservice, deployment |

---

## 🔗 Related Repositories

- **Frontend**: [fe-learning-insight](https://github.com/A25-CS206/fe-learning-insight)
- **ML Service**: [ml-learning-insight](https://github.com/A25-CS206/ml-learning-insight)

---

## 📞 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/A25-CS206/backend-service/issues)
- **Documentation**: [API Docs](https://backend-service-tau.vercel.app/documentation)
- **Email**: backend-team@example.com

---

## 📄 License

This project is part of Bangkit Academy 2025 Capstone Project.

---

<div align="center">

**Made with ❤️ by Team A25-CS206**

</div></parameter>
