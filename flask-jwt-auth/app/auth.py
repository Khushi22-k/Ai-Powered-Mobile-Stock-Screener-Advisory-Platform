from flask import Flask,request,jsonify
import json
from psycopg2 import connect
import psycopg2
import os
from .llm import call_ai_model
import uuid
from tqdm import tqdm
import requests
from .models import User, ChatRequest
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
    access_token = create_access_token(identity=user.id)
    refresh_token=create_refresh_token(identity=user.id)


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




if __name__=="__main__":
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