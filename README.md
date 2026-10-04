# CardioVision AI

Deep Learning-Based Detection and Classification of Myocarditis Using Cardiac MRI.

## Tech Stack
- React, TypeScript, Vite, Tailwind CSS
- Python, FastAPI
- PostgreSQL, SQLAlchemy
- PyTorch, ResNet18

## Requirements
- Node.js LTS
- Python 3.11
- PostgreSQL

## Backend Setup
1. Create a PostgreSQL database named cardiovision_db.
2. Open the backend folder: cd backend
3. Create a virtual environment: python -m venv venv
4. Activate it: venv\Scripts\Activate.ps1
5. Install dependencies: pip install -r requirements.txt
6. Copy .env.example to .env and configure DATABASE_URL and JWT_SECRET_KEY.
7. Start the API: uvicorn main:app --reload

## Frontend Setup
1. Open a terminal in the project root.
2. Run npm install.
3. Run npm run dev.

The model checkpoint is stored in backend/models/best_model.pth.

Academic prototype only; not intended for clinical diagnosis.
