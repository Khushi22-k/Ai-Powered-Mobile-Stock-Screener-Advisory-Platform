# 📈 AI-Powered Stock Screener & Advisory Platform #

An intelligent, data-driven platform that screens stocks, analyzes market trends, and provides actionable investment insights using machine learning, technical indicators, and real-time financial data.

# 🚀 Project Overview #

The AI-Powered Stock Screener and Advisory Platform helps investors identify high-potential stocks by combining financial metrics, technical indicators, and predictive models. The system enables users to screen stocks based on custom filters, analyze performance trends, and receive AI-based advisory insights to support smarter investment decisions.

🎯 Key Features

🔍 Advanced Stock Screening

Filter stocks based on price, volume, market cap, P/E ratio, and growth metrics

🤖 AI-Driven Analysis

Machine learning models for trend prediction and pattern recognition

🧠 Advisory Insights

Buy/Sell/Hold recommendations based on data-driven signals

📈 Portfolio Tracking

Track holdings, profit/loss, and real-time stock performance

🔐 Secure Authentication

User login with JWT-based authentication

📉 Interactive Dashboard

Visual analytics for trends, indicators, and predictions

# 🏗️ System Architecture #

Frontend (React / UI)
        |
Backend API (Flask / Node.js)
        |
RAG Application Model
        |
Financial Data APIs & Database

🛠️ Tech Stack
Frontend

React.js

Chart.js / Recharts

Tailwind CSS / Bootstrap

Backend

Flask / Node.js

RESTful APIs

JWT Authentication

Python

Database

PostgreSQL / MySQL

APIs

Yahoo Finance / Alpha Vantage (or similar market data APIs)

# 📂 Project Structure
ai-stock-screener/
│
├── backend/
│   ├── __init__.py
│   ├── auth.py (main file of backend)
│   ├── run.py
│   └── app.py
|-.env
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── README.md
└── requirements.txt

# ⚙️ Installation & Setup
1️⃣ Clone the Repository
git clone https://github.com/Khushi22-k/Ai-Powered-Mobile-Stock-Screener-Advisory-Platform.git
cd ai-stock-screener

2️⃣ Backend Setup
pip install -r requirements.txt
python app.py

3️⃣ Frontend Setup
cd frontend
npm install
npm start
