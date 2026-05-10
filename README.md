# Scalable Task Management — Deployment Guide

This guide explains how to deploy the full stack using:

- **Frontend:** Vercel
- **Backend (Docker):** Render.com
- **Redis:** Upstash
- **PostgreSQL:** Neon

---

## 1) Architecture

- The **Frontend** (React + Vite) is deployed on Vercel.
- The **Backend** (FastAPI, Dockerized) is deployed as a Render Web Service.
- **PostgreSQL** is provided by Neon.
- **Redis** is provided by Upstash.

Frontend calls backend at:

```txt
${VITE_API_URL}/api/v1
```

---

## 2) Prerequisites

Have accounts ready:

- https://vercel.com
- https://render.com
- https://upstash.com
- https://neon.tech

Also ensure your repository contains:

- `Frontend/` (Vite app)
- `Backend/` (FastAPI app + Dockerfile)

---

## 3) Deploy PostgreSQL on Neon

1. Create a Neon project.
2. Create a database (default is fine).
3. Copy the **connection string** (pooled or direct).
4. Save it for Render as `DATABASE_URL`.

Example format:

```txt
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

---

## 4) Deploy Redis on Upstash

1. Create an Upstash Redis database.
2. Copy:
   - **UPSTASH_REDIS_REST_URL**
   - **UPSTASH_REDIS_REST_TOKEN**
3. Save these for Render environment variables.

---

## 5) Deploy Backend on Render (Docker)

1. In Render, click **New +** → **Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Root Directory:** `Backend`
   - **Runtime:** Docker
   - Render should detect `Backend/Dockerfile`.
4. Set required environment variables in Render:

```txt
DATABASE_URL=<your_neon_postgres_url>
UPSTASH_REDIS_REST_URL=<your_upstash_rest_url>
UPSTASH_REDIS_REST_TOKEN=<your_upstash_rest_token>
SECRET_KEY=<strong_random_secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. Deploy and wait until service is healthy.
6. Copy backend public URL, for example:

```txt
https://scalable-task-managementfinal.onrender.com
```

> Make sure backend CORS allows your Vercel domain.

---

## 6) Deploy Frontend on Vercel

1. In Vercel, click **Add New...** → **Project**.
2. Import your repository.
3. Configure build settings:
   - **Framework Preset:** Vite
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:

```txt
VITE_API_URL=https://scalable-task-managementfinal.onrender.com
```

5. Deploy.

Optional local file example (`Frontend/.env`):

```txt
VITE_API_URL=https://scalable-task-managementfinal.onrender.com
```

---

## 7) Post-Deploy Checklist

- Open frontend Vercel URL.
- Test signup/login.
- Create/update/delete tasks.
- Verify backend logs in Render for API errors.
- Confirm Neon connection works (no DB connection errors).
- Confirm Upstash connection works (no Redis errors).

---

## 8) Common Issues

### CORS errors
- Add your Vercel domain to backend allowed origins.

### 401/invalid token
- Verify `SECRET_KEY` and JWT settings on backend.

### Database connection failures
- Recheck Neon `DATABASE_URL` and SSL params.

### Redis errors
- Verify Upstash URL/token are correct and active.

### Frontend cannot reach backend
- Confirm `VITE_API_URL` is set in Vercel Production env and redeploy.

---

## 9) Useful Commands

Frontend build:

```bash
cd Frontend
npm install
npm run build
```

Backend local Docker build (optional verification):

```bash
cd Backend
docker build -t task-backend .
```
