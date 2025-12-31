from flask import Flask,request,jsonify
import json
from psycopg2 import connect
import psycopg2
import os
from .llm import call_ai_model
import uuid
from tqdm import tqdm
import requests
from .models import User, ChatRequest, StockData, Watchlist
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
from .RealTimeFetch import fetch_stock_symbol, fetch_single_stock, fetch_highest_gainer, fetch_highest_loser, nse

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
        "refresh_token": refresh_token,
        "username": user.username

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
    # Fetch stock data from database, ensuring unique symbols
    stocks = StockData.query.all()
    stock_data = []
    seen_symbols = set()
    for stock in stocks:
        if stock.symbol not in seen_symbols:
            seen_symbols.add(stock.symbol)
            stock_data.append({
                'symbol': stock.symbol,
                'name': stock.company,
                'price': stock.last_traded_price,
                'change': stock.price_change,
                'changePercent': stock.percentage_change,
                'volume': stock.share_volume,
                'marketCap': stock.value_inr
            })
    return jsonify(stock_data)

@auth_bp.route('/stock/<symbol>', methods=['GET'])
def get_stock_by_symbol(symbol):
    # First try to fetch from database
    stock = StockData.query.filter(StockData.symbol.ilike(f'%{symbol}%')).first()
    if stock:
        stock_data = {
            'name': stock.company,
            'symbol': stock.symbol,
            'price': stock.last_traded_price,
            'change': stock.price_change,
            'changePercent': stock.percentage_change,
            'volume': stock.share_volume,
            'marketCap': stock.value_inr,
            'industry': stock.industry or 'N/A',
            'series': stock.series or 'N/A',
            'open_price': stock.open_price,
            'high_price': stock.high_price,
            'low_price': stock.low_price,
            'previous_close': stock.previous_close,
            'last_traded_price': stock.last_traded_price,
            'price_change': stock.price_change,
            'percentage_change': stock.percentage_change,
            'day_percentage_change': stock.day_percentage_change,
            'share_volume': stock.share_volume,
            'value_inr': stock.value_inr,
            'week_high': stock.week_high,
            'week_low': stock.week_low,
            'daypercentagechange': stock.daypercentagechange
        }
        return jsonify(stock_data)

    # If not in database, try real-time NSE data
    try:
        stock_quote = nse.get_stock_quote(symbol)
        if not stock_quote:
            return jsonify({'error': 'Stock not found'}), 404
        stock_data = {
            'name': stock_quote.get('companyName', symbol),
            'symbol': symbol,
            'price': stock_quote.get('lastPrice', 0),
            'change': stock_quote.get('change', 0),
            'changePercent': stock_quote.get('pChange', 0),
            'volume': stock_quote.get('totalTradedVolume', 0),
            'marketCap': stock_quote.get('totalTradedValue', 0),
            'industry': stock_quote.get('industry', 'N/A'),
            'series': stock_quote.get('series', 'N/A'),
            'open_price': stock_quote.get('open', 0),
            'high_price': stock_quote.get('dayHigh', 0),
            'low_price': stock_quote.get('dayLow', 0),
            'previous_close': stock_quote.get('previousClose', 0),
            'last_traded_price': stock_quote.get('lastPrice', 0),
            'price_change': stock_quote.get('change', 0),
            'percentage_change': stock_quote.get('pChange', 0),
            'day_percentage_change': stock_quote.get('pChange', 0),
            'share_volume': stock_quote.get('totalTradedVolume', 0),
            'value_inr': stock_quote.get('totalTradedValue', 0),
            'week_high': stock_quote.get('weekHigh', 0),
            'week_low': stock_quote.get('weekLow', 0),
            'daypercentagechange': stock_quote.get('pChange', 0)
        }
        return jsonify(stock_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/stocks/history/<symbol>', methods=['GET'])
def get_stock_history(symbol):
    import random
    # Fetch the stock's current price from database
    stock = StockData.query.filter(StockData.symbol.ilike(f'%{symbol}%')).first()
    if stock:
        base_price = float(stock.last_traded_price)
    else:
        base_price = 100 + random.randint(50, 200)  # Fallback if not found
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

@auth_bp.route('/stock_data/<symbol>', methods=['GET'])
def get_stock_data_of_particular():
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
    if StockData.query.count() == 0:  # Only populate if table is empty
        sample_stocks = [
            StockData(symbol='AAPL', company='Apple Inc.', last_traded_price=175.43, price_change=2.34, percentage_change=1.35, share_volume=45230000, value_inr=2800000000000),
            StockData(symbol='GOOGL', company='Alphabet Inc.', last_traded_price=138.21, price_change=-1.23, percentage_change=-0.88, share_volume=25670000, value_inr=1750000000000),
            StockData(symbol='MSFT', company='Microsoft Corporation', last_traded_price=378.85, price_change=5.67, percentage_change=1.52, share_volume=19850000, value_inr=2820000000000),
            StockData(symbol='AMZN', company='Amazon.com Inc.', last_traded_price=144.05, price_change=-0.89, percentage_change=-0.61, share_volume=38760000, value_inr=1480000000000),
            StockData(symbol='TSLA', company='Tesla Inc.', last_traded_price=248.42, price_change=12.34, percentage_change=5.23, share_volume=89450000, value_inr=790000000000),
            StockData(symbol='NVDA', company='NVIDIA Corporation', last_traded_price=875.28, price_change=15.67, percentage_change=1.82, share_volume=41230000, value_inr=2150000000000),
            StockData(symbol='META', company='Meta Platforms Inc.', last_traded_price=484.10, price_change=-8.92, percentage_change=-1.81, share_volume=15670000, value_inr=1230000000000),
            StockData(symbol='NFLX', company='Netflix Inc.', last_traded_price=442.57, price_change=7.89, percentage_change=1.81, share_volume=5234000, value_inr=192000000000),
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