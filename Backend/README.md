# Scalable Task Management Backend

## 📌 Problem Statement
Build a scalable backend service to manage tasks efficiently, supporting future extensions like authentication, databases, and task prioritization.

## 🚀 Features
- Health check endpoint
- Clean and scalable project structure
- FastAPI-based REST backend
- Ready for CI/CD and containerization

## 🛠 Tech Stack
- Python
- FastAPI
- Uvicorn

## 📂 Project Structure
See `/app` folder for modular design:
- api → routes
- models → database models
- schemas → request/response schemas
- services → business logic

## ▶️ How to Run
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
