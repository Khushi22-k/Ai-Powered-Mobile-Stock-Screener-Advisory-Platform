from flask import Flask,request,jsonify
import json
import random
from psycopg2 import connect
import psycopg2
import os
import smtplib
from email.mime.text import MIMEText
from .llm import call_ai_model
import uuid
from tqdm import tqdm
import requests
from flask_cors import cross_origin
from .models import User, ChatRequest, StockData, Watchlist, Notification
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
from .mail import send_confirmation_email

#setting api
auth_bp = Blueprint("auth", __name__,url_prefix='/auth')

MARKET_API_KEY = os.getenv("MARKET_STACK_API_KEY", "your_api_key_here")  # Add fallback for testing
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
    
    # Send verification email
    email_sent = send_confirmation_email(email)
    
    return jsonify({"msg": "User registered successfully", "email_sent": email_sent}), 201



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

#send verification email
def send_email_verification():
    data = request.get_json()
    email = data.get("email")
    sender_email = "freeapiacc97@gmail.com"
    password = "wijy eadx meep fxly"

    msg = MIMEText("Hello! This is a confirmation email that you have successfully created an account in AI-Powered Stock Screener and Advisory platform.")
    msg['Subject'] = "Successful Account Creation"
    msg['From'] = sender_email
    msg['To'] = email
    print("here")

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, password)
        server.sendmail(sender_email, email, msg.as_string())
        server.quit()
        print("Email sent successfully!")
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False


    return jsonify({"message": f"Verification email sent to {email}"}), 200


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
        "username": user.username,
        "email":user.email

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
                'marketCap': stock.value_inr,
                'industry': stock.industry or 'Unknown'
            })
    return jsonify(stock_data)


@auth_bp.route('/favorite-stock', methods=['POST', 'OPTIONS'])
@jwt_required()
def set_favorite_stock():
    if request.method == "OPTIONS":
        return jsonify({"msg": "CORS OK"}), 200
    user_id = get_jwt_identity()
    data = request.get_json()
    symbol = data.get("symbol")
    status = data.get("status")
    print("Received data:", data)  # Debugging line

    if not symbol:
        return jsonify({"error": "Stock symbol is required"}), 400

    # Fetch user from database using user_id
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    email_id = user.email

    # Use a new connection for this operation
    conn_local = psycopg2.connect(
        host="localhost",
        database="postgres",
        user="postgres",

        password="1234",
        port="5432"
    )

    try:
        with conn_local.cursor() as cur:
            if status == "selected":
                # Insert or update to selected
                cur.execute(
                    """
                    INSERT INTO watchlist_selected_item_history (email_id, symbol_name, status, selected_at)
                    VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                   
                    """,
                    (email_id, symbol, status)
                )
            elif status == "unselected":
                # Delete the entry
                cur.execute(
                    """
                    DELETE FROM watchlist_selected_item_history
                    WHERE email_id = %s AND symbol_name = %s
                    """,
                    (email_id, symbol)
                )
            conn_local.commit()
    except Exception as e:
        conn_local.rollback()
        print(f"Database error: {e}")  # Add logging for debugging
        return jsonify({"error": f"Database error occurred: {str(e)}"}), 500
    finally:
        conn_local.close()

    return jsonify({"message": "Favorite stock updated successfully"}), 200



@auth_bp.route("/api/chart", methods=["POST"])
def chart():
    body = request.json
    symbol = body["symbol"]
    limit = body["limit"]
    data_type = body["type"]

    # Check if API key is available - if not, use mock data for testing
    if not MARKET_API_KEY or MARKET_API_KEY == "your_api_key_here":
        print("Using mock data for testing - API key not configured")
        return get_mock_chart_data(symbol, limit, data_type)

    if data_type == "intraday":
        url = f"https://api.marketstack.com/v2/tickers/{symbol}/intraday"
    else:
        url = f"https://api.marketstack.com/v2/tickers/{symbol}/eod"

    params = {
        "access_key": MARKET_API_KEY,
        "limit": limit,
        "sort": "DESC"
    }

    try:
        res = requests.get(url, params=params, timeout=10)

        if res.status_code != 200:
            return jsonify({
                "error": f"MarketStack API error: {res.status_code}",
                "message": res.text
            }), res.status_code

        data = res.json()
        print(f"API Response for {symbol}: {data}")

        # Check if we have valid data
        if "data" not in data or not data["data"]:
            return jsonify({
                "error": "No data available",
                "message": f"No chart data found for symbol {symbol}"
            }), 404

        return jsonify(data)

    except requests.exceptions.RequestException as e:
        return jsonify({
            "error": "API request failed",
            "message": str(e)
        }), 500
    except Exception as e:
        return jsonify({
            "error": "Unexpected error",
            "message": str(e)
        }), 500

def get_mock_chart_data(symbol, limit, data_type):
    """Generate mock chart data for testing purposes"""
    import random
    from datetime import datetime, timedelta

    # Base price for the symbol
    base_prices = {
        "AAPL": 175.0,
        "GOOGL": 140.0,
        "MSFT": 380.0,
        "TSLA": 250.0,
        "NVDA": 880.0
    }

    base_price = base_prices.get(symbol.upper(), 100.0)

    # Generate mock data
    data = []
    current_date = datetime.now()

    for i in range(limit):
        # Generate realistic OHLC data
        volatility = 0.02  # 2% daily volatility
        open_price = base_price + random.uniform(-volatility, volatility) * base_price
        high_price = open_price + abs(random.gauss(0, volatility * base_price))
        low_price = open_price - abs(random.gauss(0, volatility * base_price))
        close_price = random.uniform(low_price, high_price)

        # Update base price for next day
        base_price = close_price

        # Format date
        if data_type == "intraday":
            date_str = (current_date - timedelta(minutes=i*5)).strftime("%Y-%m-%dT%H:%M:%S+0000")
        else:
            date_str = (current_date - timedelta(days=i)).strftime("%Y-%m-%dT00:00:00+0000")

        data.append({
            "date": date_str,
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": random.randint(1000000, 10000000)
        })

    return jsonify({"data": data})

@auth_bp.route('/favorite-stocks', methods=['GET'])
@jwt_required()
def get_favorite_stocks():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    email_id = user.email

    # Rollback any aborted transaction to clear the connection state
    conn.rollback()

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT symbol_name, status FROM watchlist_selected_item_history
            WHERE email_id = %s
            """,
            (email_id,)
        )
        rows = cur.fetchall()

    favorite_stocks = [{"symbol": row[0], "status": row[1]} for row in rows]
    return jsonify(favorite_stocks), 200


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
            StockData(symbol='AAPL', company='Apple Inc.', last_traded_price=175.43, price_change=2.34, percentage_change=1.35, share_volume=45230000, value_inr=2800000000000, industry='Technology'),
            StockData(symbol='GOOGL', company='Alphabet Inc.', last_traded_price=138.21, price_change=-1.23, percentage_change=-0.88, share_volume=25670000, value_inr=1750000000000, industry='Technology'),
            StockData(symbol='MSFT', company='Microsoft Corporation', last_traded_price=378.85, price_change=5.67, percentage_change=1.52, share_volume=19850000, value_inr=2820000000000, industry='Technology'),
            StockData(symbol='AMZN', company='Amazon.com Inc.', last_traded_price=144.05, price_change=-0.89, percentage_change=-0.61, share_volume=38760000, value_inr=1480000000000, industry='E-commerce'),
            StockData(symbol='TSLA', company='Tesla Inc.', last_traded_price=248.42, price_change=12.34, percentage_change=5.23, share_volume=89450000, value_inr=790000000000, industry='Automotive'),
            StockData(symbol='NVDA', company='NVIDIA Corporation', last_traded_price=875.28, price_change=15.67, percentage_change=1.82, share_volume=41230000, value_inr=2150000000000, industry='Technology'),
            StockData(symbol='META', company='Meta Platforms Inc.', last_traded_price=484.10, price_change=-8.92, percentage_change=-1.81, share_volume=15670000, value_inr=1230000000000, industry='Technology'),
            StockData(symbol='NFLX', company='Netflix Inc.', last_traded_price=442.57, price_change=7.89, percentage_change=1.81, share_volume=5234000, value_inr=192000000000, industry='Entertainment'),
        ]
        db.session.add_all(sample_stocks)
        db.session.commit()
        print("Sample stock data populated.")


# Notification endpoints
@auth_bp.route('/api/notifications', methods=['POST','OPTIONS'])
@jwt_required()
def get_notifications():
    if request.method == 'OPTIONS':
        return '', 200
    """Fetch notifications for the current user"""
    try:
        # ✅ Get email from JWT
        user_id = get_jwt_identity()

        # ✅ Read query params (not JSON)
        print(user_id)
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        limit = request.args.get('limit', 20, type=int)

        query = Notification.query.filter_by(user_id=user_id)

        if unread_only:
            query = query.filter_by(is_read=False)

        notifications = (
            query
            .order_by(Notification.created_at.desc())
            .limit(limit)
            .all()
        )

        notifications_data = [
            {
                'user_id': notif.user_id,
                'type': notif.type,
                'title': notif.title,
                'message': notif.message,
                'symbol': notif.symbol,
                'data': notif.data,
                'is_read': notif.is_read,
                'created_at': notif.created_at.isoformat()
            }
            for notif in notifications
        ]
        print(notifications_data)
        return jsonify({
            'success': True,
            'notifications': notifications_data,
            'count': len(notifications_data)
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

        
@auth_bp.route("/notify/one", methods=["GET"])
@jwt_required()
def get_one_notification():
    user_id = get_jwt_identity()

    notification = (
        Notification.query.all()
    )
    print(notification)

    if not notification:
        return jsonify({"message": "No notifications"}), 200
    
    random_n=random.choice(notification)
    notification=random_n
    return jsonify({
        "id": notification.id,
        "message": notification.message,
        "is_read": notification.is_read,
        "created_at": notification.created_at
    }), 200

@auth_bp.route('/notify/read/<int:notification_id>/', methods=['POST'])
@jwt_required()
def mark_notification_as_read(notification_id):
    """Mark a notification as read and delete it"""
    try:
        user_id = get_jwt_identity()
        notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
        
        if not notification:
            return jsonify({
                'success': False,
                'message': 'Notification not found'
            }), 404
        
        # Delete the notification from database
        db.session.delete(notification)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notification marked as read and deleted'
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error marking notification as read: {str(e)}'
        }), 500

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