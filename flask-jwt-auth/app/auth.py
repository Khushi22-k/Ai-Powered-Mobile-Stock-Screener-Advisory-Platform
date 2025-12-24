from flask import Flask,request,jsonify
import json
from psycopg2 import connect
import psycopg2
import os
from .llm import call_ai_model
import uuid
from tqdm import tqdm
import requests
from .models import User, ChatRequest, StockData
from .rag import retrieve_context
from sqlalchemy import create_engine
from config import Config
from . import db
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager,create_access_token,jwt_required,get_jwt_identity,create_refresh_token
from werkzeug.security import check_password_hash
from pgvector.sqlalchemy import Vector
from pgvector.psycopg2 import register_vector
from sqlalchemy import Column,Integer

#setting api
auth_bp = Blueprint("auth", __name__,url_prefix='/auth')


# SQLAlchemy engine
engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, future=True)

@auth_bp.route("/register",methods=['POST', 'OPTIONS'])
#validating the user
def register():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200
    username=request.json.get("username",None)
    email=request.json.get("email",None)
    contact_no =request.json.get("contact_no",None)
    password=request.json.get("password",None)
    if not all([username, email, contact_no, password]):
        return jsonify({"msg": "All fields are required"}), 400

    existing = User.query.filter(
        (User.username == username) |
        (User.email == email) |
        (User.contact_no == contact_no)
    ).first()
    if existing:
        return jsonify({"msg": "User already exists"}), 400

    user = User(username=username, email=email, contact_no=contact_no)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "User registered successfully"}), 201



# ---------- Ollama embedding ----------
def get_embedding_ollama(text):
    response = requests.post(
        "http://localhost:11434/api/embeddings",
        json={
            "model": "nomic-embed-text",
            "prompt": text
        },
        timeout=60
    )
    response.raise_for_status()
    return response.json()["embedding"]

# ---------- PostgreSQL connection ----------
conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="postgres",          
    password="1234",        
    port="5432"
)

register_vector(conn)

cur = conn.cursor()

# ---------- Insert data ----------
def store_user_message(message: str):
    # 1️⃣ Get embedding
    embedding = get_embedding_ollama(message)

    # 2️⃣ Insert user message in DB
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO chat_messages (role, content, embedding)
            VALUES ('user', %s, %s)
            """,
            (message, embedding)
        )
        conn.commit()

    # 3️⃣ Retrieve context
    context = retrieve_context(message)

    # 4️⃣ Generate response
    prompt = f"""
    Use the context below to answer the user.

    Context:
    {context}

    User:
    {message}
    """
    response = call_ai_model(prompt)

    # 5️⃣ Store assistant response
    if response is not None:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (role, content)
                VALUES ('assistant', %s)
                """,
                (response,)
            )
            conn.commit()

    # 6️⃣ Return embedding & response if needed
    return embedding, response

#login
@auth_bp.route('/login',methods=['POST'])
def signin():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # 1️⃣ fetch user from database
    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"message": "User not found"}), 401

    # 2️⃣ verify hashed password


    if not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid password"}), 401


    # 3️⃣ generate token
    access_token = create_access_token(identity=str(user.id))
    refresh_token=create_refresh_token(identity=str(user.id))


    return jsonify({
        "message": "Login successful",
        "access_token": access_token,
        "refresh_token": refresh_token

      })
@auth_bp.route('/chat', methods=['POST'])
def chat():
    data=request.get_json()
    user_message=data.get("message")
    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # 1️⃣ Store user message in DB with embedding
    embedding, response = store_user_message(user_message)


    # 2️⃣ Return response to frontend
    return jsonify({
        "response": response
    })

@auth_bp.route('/stocks', methods=['GET'])

def get_stocks():
    # Fetch stock data from database
    stocks = StockData.query.all()
    stock_data = [{
        'symbol': stock.symbol,
        'name': stock.company,
        'price': stock.last_traded_price,
        'change': stock.price_change,
        'changePercent': stock.percentage_change,
        'volume': stock.share_volume,
        'marketCap': stock.value_inr,
        'riskScore': 5.0  # Default risk score since not in stock_data
    } for stock in stocks]
    return jsonify(stock_data)

@auth_bp.route('/stocks/history/<symbol>', methods=['GET'])
@jwt_required()
def get_stock_history(symbol):
    # Mock historical data - in real app, fetch from API
    import random
    base_price = 100 + random.randint(50, 200)
    history = []
    for i in range(30):  # Last 30 days
        price = base_price + random.uniform(-20, 20)
        history.append({
            'date': f'2024-01-{i+1:02d}',
            'price': round(price, 2),
            'volume': random.randint(1000000, 50000000)
        })
    return jsonify(history)

@auth_bp.route('/market/overview', methods=['GET'])
def get_market_overview():
    overview = {
        'marketCap': 42500000000000,
        'volume': 8200000000,
        'sp500': 4567.89,
        'nasdaq': 14234.56,
        'change': 0.5,
        'changePercent': 0.011
    }
    return jsonify(overview)

@auth_bp.route('/stock_data', methods=['GET'])
def get_stock_data():
    from .models import StockData
    stocks = StockData.query.all()
    stock_data = [{
        'company': stock.company,
        'symbol': stock.symbol,
        'industry': stock.industry,
        'series': stock.series,
        'open_price': float(stock.open_price),
        'high_price': float(stock.high_price),
        'low_price': float(stock.low_price),
        'previous_close': float(stock.previous_close),
        'last_traded_price': float(stock.last_traded_price),
        'price_change': float(stock.price_change),
        'percentage_change': float(stock.percentage_change),
        'day_percentage_change': float(stock.day_percentage_change),
        'share_volume': int(stock.share_volume),
        'value_inr': float(stock.value_inr),
        'week_high': float(stock.week_high),
        'week_low': float(stock.week_low),
        'daypercentagechange': float(stock.daypercentagechange) if stock.daypercentagechange else None
    } for stock in stocks]
    return jsonify(stock_data)




# Function to populate sample stock data
def populate_sample_stocks():
    if Stock.query.count() == 0:  # Only populate if table is empty
        sample_stocks = [
            Stock(symbol='AAPL', name='Apple Inc.', price=175.43, change=2.34, changePercent=1.35, volume=45230000, marketCap=2800000000000, riskScore=3.5),
            Stock(symbol='GOOGL', name='Alphabet Inc.', price=138.21, change=-1.23, changePercent=-0.88, volume=25670000, marketCap=1750000000000, riskScore=4.0),
            Stock(symbol='MSFT', name='Microsoft Corporation', price=378.85, change=5.67, changePercent=1.52, volume=19850000, marketCap=2820000000000, riskScore=3.0),
            Stock(symbol='AMZN', name='Amazon.com Inc.', price=144.05, change=-0.89, changePercent=-0.61, volume=38760000, marketCap=1480000000000, riskScore=4.5),
            Stock(symbol='TSLA', name='Tesla Inc.', price=248.42, change=12.34, changePercent=5.23, volume=89450000, marketCap=790000000000, riskScore=8.5),  # High risk
            Stock(symbol='NVDA', name='NVIDIA Corporation', price=875.28, change=15.67, changePercent=1.82, volume=41230000, marketCap=2150000000000, riskScore=7.0),  # High risk
            Stock(symbol='META', name='Meta Platforms Inc.', price=484.10, change=-8.92, changePercent=-1.81, volume=15670000, marketCap=1230000000000, riskScore=5.5),
            Stock(symbol='NFLX', name='Netflix Inc.', price=442.57, change=7.89, changePercent=1.81, volume=5234000, marketCap=192000000000, riskScore=6.0),
        ]
        db.session.add_all(sample_stocks)
        db.session.commit()
        print("Sample stock data populated.")

if __name__=="__main__":  # Create tables
    populate_sample_stocks()  # Populate sample data
    auth_bp.run(debug=True,port=5173,host='0.0.0.0')


"""User question
   ↓
Convert question → embedding
   ↓
Search Vector DB (pgvector) for similar documents
   ↓
Retrieve top-K relevant chunks
   ↓
Send (question + retrieved context) to LLaMA-2
   ↓
LLaMA-2 generates final answer
"""