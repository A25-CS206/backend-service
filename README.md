# Learning Insight API - Tim Capstone A25-CS206

Sistem pembelajaran adaptif berbasis Machine Learning untuk mengidentifikasi tipe pembelajar.

---

## Arsitektur Sistem

Aplikasi ini menggunakan **arsitektur microservices** dengan dua layanan utama:

### 1. Back-End Service (Hapi.js)

- **Platform**: Vercel
- **Fungsi**: Manajemen data, autentikasi, dan agregasi fitur dari log aktivitas
- **Base URL**: `https://backend-service-tau.vercel.app`

### 2. ML Service (Python/Docker)

- **Platform**: Render/Railway
- **Fungsi**: Pipeline ML (Scaler → PCA → KMeans) untuk prediksi tipe pembelajar
- **Base URL**: `https://ml-learning-insight-kamu.onrender.com`

---

## API Endpoints

### Authentication & User Management

#### Register

```http
POST /users
```

**Access**: Public  
**Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "08123456789",
  "city": "Jakarta",
  "password": "securepassword"
}
```

#### Login

```http
POST /authentications
```

**Access**: Public  
**Response**: JWT Access Token  
**Body**:

```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

#### Get Profile

```http
GET /users/me
```

**Access**: Requires Token  
**Headers**: `Authorization: Bearer <token>`

---

### Journey Management

#### Create Journey (Admin Only)

```http
POST /journeys
```

**Access**: Requires Admin Token  
**Body**:

```json
{
  "title": "Web Development Fundamentals",
  "description": "Learn HTML, CSS, and JavaScript"
}
```

#### Get All Journeys

```http
GET /journeys
```

**Access**: Public  
**Response**: List of all available learning journeys

---

### Activity Tracking

#### Log Activity

```http
POST /trackings
```

**Access**: Requires Token  
**Purpose**: Record when a student accesses learning material  
**Body**:

```json
{
  "journey_id": "uuid",
  "material_id": "uuid",
  "duration": 300
}
```

#### Get Learning Insight

```http
GET /insights/me
```

**Access**: Requires Token  
**Purpose**: Trigger ML analysis and get learner type prediction  
**Response**:

```json
{
  "learner_type": "Fast Learner",
  "cluster_id": 0,
  "statistics": {
    "avg_materials_per_day": 3.5,
    "total_materials": 42,
    "avg_duration_per_material": 450.2,
    "total_weeks_active": 8,
    "avg_logins_per_week": 4.2,
    "login_weekly_variance": 0.8
  }
}
```

---

## Machine Learning Integration

### Prediction Endpoint

```http
POST https://ml-learning-insight-kamu.onrender.com/predict
```

**Content-Type**: `application/json`

### Input Schema

Data yang harus dihitung oleh Back-End dan dikirim ke ML Service:

| Feature                     | Type  | Description                        |
| --------------------------- | ----- | ---------------------------------- |
| `avg_materials_per_day`     | Float | Volume belajar harian user         |
| `total_materials`           | Float | Total materi yang diselesaikan     |
| `avg_duration_per_material` | Float | Rata-rata waktu per materi (detik) |
| `total_weeks_active`        | Float | Jangka waktu user aktif            |
| `avg_logins_per_week`       | Float | Rata-rata login per minggu         |
| `login_weekly_variance`     | Float | Stabilitas pola login              |

**Example Request**:

```json
{
  "data": [
    {
      "avg_materials_per_day": 3.5,
      "total_materials": 42,
      "avg_duration_per_material": 450.2,
      "total_weeks_active": 8,
      "avg_logins_per_week": 4.2,
      "login_weekly_variance": 0.8
    }
  ]
}
```

### Output Mapping

| Cluster ID | Learner Type           | Characteristics                                |
| ---------- | ---------------------- | ---------------------------------------------- |
| **0**      | **Fast Learner**       | Volume belajar harian sangat tinggi            |
| **1**      | **Consistent Learner** | Variansi login mingguan sangat rendah (stabil) |
| **2**      | **Reflective Learner** | Durasi per materi sangat tinggi                |

---

## Database Access

- **Platform**: Neon.tech (PostgreSQL Cloud)
- **Purpose**: Model re-training dan evaluasi performa
- **Main Tables**:
  - `developer_journey_trackings` - Activity logs
  - `users` - User reference data

---

## Team Responsibilities

| Name                        | Role             | Main Tasks                                                 |
| --------------------------- | ---------------- | ---------------------------------------------------------- |
| **Muhammad Azizsyah Putra** | Back-End         | Server stability, API orchestration, data aggregation      |
| **Kevin Raydafa Algibran**  | Back-End         | ML integration, API development                            |
| **Muhammad Naufal Razani**  | Front-End        | Dashboard UI/UX, API integration                           |
| **Ajar & Imam**             | Machine Learning | Model training, performance evaluation, Python API service |

---

## Tech Stack

**Back-End**

- Hapi.js
- PostgreSQL (Neon.tech)
- JWT Authentication
- Vercel (Deployment)

**Machine Learning**

- Python
- Scikit-learn (Scaler, PCA, KMeans)
- Flask/APIFlask
- Docker
- Render/Railway (Deployment)

**Front-End**

- (To be specified)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- PostgreSQL database
- Docker (for ML service)

### Installation

**Back-End Service**

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Run development server
npm run dev
```

**ML Service**

```bash
# Navigate to ML directory
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Run service
python app.py
```

---

## Environment Variables

**Back-End (.env)**

```
DATABASE_URL=postgresql://...
JWT_SECRET=your_jwt_secret
ML_SERVICE_URL=https://ml-learning-insight-kamu.onrender.com
```

**ML Service (.env)**

```
MODEL_PATH=./models/kmeans_model.pkl
SCALER_PATH=./models/scaler.pkl
PCA_PATH=./models/pca.pkl
```

---

## API Documentation

Full API documentation available at:

- Postman: [Collection Link]
- Swagger: `https://backend-service-tau.vercel.app/documentation`

---

## License

MIT License - Tim Capstone A25-CS206

---

## Contact

For questions or issues, please contact the development team.
