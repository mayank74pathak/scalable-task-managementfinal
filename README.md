# Scalable Task Management System

A production-ready full-stack task management application built using FastAPI, React, PostgreSQL, Redis, and Docker.

## Live Demo

* Frontend: [https://scalable-task-managementfinal.vercel.app](https://scalable-task-managementfinal.vercel.app)
* Backend API Docs: [https://scalable-task-managementfinal.onrender.com/docs](https://scalable-task-managementfinal.onrender.com/docs)

---

# Features

## Authentication

* JWT-based authentication
* User signup and login
* Protected API routes
* Session handling

## Task Management

* Create tasks
* Update tasks
* Delete tasks
* Task status management
* Pagination support
* User-specific task isolation

## CSV Import

* Upload CSV files
* Bulk task creation from CSV
* CSV validation and parsing
* Error handling for invalid rows

## Redis Caching

* Task caching using Redis
* Cache invalidation support
* Graceful Redis fallback handling

## Production Features

* Dockerized backend
* PostgreSQL database integration
* Redis caching layer
* Environment variable configuration
* CORS configuration for production deployment

---

# Tech Stack

## Frontend

* React
* TypeScript
* Vite

## Backend

* FastAPI
* SQLAlchemy
* Pydantic
* JWT Authentication

## Database & Cache

* PostgreSQL (Neon)
* Redis (Upstash)

## Deployment

* Frontend: Vercel
* Backend: Render
* Database: Neon PostgreSQL
* Cache: Upstash Redis
* Containerization: Docker

---

# Project Structure

```bash
scalable-task-managementfinal/
│
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── Backend/
│   ├── app/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── utils/
│   │   └── main.py
│   │
│   ├── Dockerfile
│   ├── requirements.txt
│   └── docker-compose.yml
│
└── README.md
```

---

# Environment Variables

## Backend (.env)

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REDIS_URL=your_redis_connection_string
```

## Frontend (.env)

```env
VITE_API_URL=https://scalable-task-managementfinal.onrender.com
```

---

# Local Setup

## Clone Repository

```bash
git clone https://github.com/mayank74pathak/scalable-task-managementfinal.git
cd scalable-task-managementfinal
```

---

# Backend Setup

```bash
cd Backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run Backend:

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```bash
http://localhost:8000
```

---

# Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Docker Setup

## Run Using Docker Compose

```bash
docker compose up --build
```

Services:

* FastAPI Backend
* PostgreSQL
* Redis

---

# API Endpoints

## Authentication

| Method | Endpoint            | Description   |
| ------ | ------------------- | ------------- |
| POST   | /api/v1/auth/signup | Register user |
| POST   | /api/v1/auth/login  | Login user    |

## Tasks

| Method | Endpoint           | Description     |
| ------ | ------------------ | --------------- |
| GET    | /api/v1/tasks      | Get all tasks   |
| GET    | /api/v1/tasks/{id} | Get single task |
| POST   | /api/v1/tasks      | Create task     |
| PUT    | /api/v1/tasks/{id} | Update task     |
| DELETE | /api/v1/tasks/{id} | Delete task     |

## File Upload

| Method | Endpoint                   | Description      |
| ------ | -------------------------- | ---------------- |
| POST   | /api/v1/files/import-tasks | Import CSV tasks |

---

# Sample CSV Format

```csv
title,description,status
Learn FastAPI,Study backend concepts,pending
Build Project,Complete full-stack app,in_progress
Deploy Application,Deploy on Render and Vercel,done
```

---

# Deployment Architecture

```text
Frontend (Vercel)
        ↓
FastAPI Backend (Render)
        ↓
PostgreSQL (Neon)
        ↓
Redis Cache (Upstash)
```

---

# Key Learning Outcomes

* Full-stack application development
* REST API design
* JWT authentication
* Docker containerization
* PostgreSQL integration
* Redis caching strategies
* Production deployment
* Environment variable management
* CSV file processing
* Cache invalidation
* CORS handling

---

# Future Improvements

* Role-based access control
* WebSocket real-time updates
* Background task queues
* Email notifications
* Task deadlines and reminders
* Drag-and-drop Kanban board
* CI/CD pipeline
* Kubernetes deployment

---

# Author

Mayank Pathak

GitHub: [https://github.com/mayank74pathak](https://github.com/mayank74pathak)

---

# License

This project is developed for learning and portfolio purposes.
