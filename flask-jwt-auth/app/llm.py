import os
import psycopg2
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
import requests

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"
load_dotenv()

# -----------------------------
# OpenAI Client (GPT-5)
# -----------------------------
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# -----------------------------
# PostgreSQL Configuration
# -----------------------------
DB_CONFIG = {
    "dbname": "postgres",
    "user": "postgres",
    "password": 1234,
    "host": "localhost",
    "port": 5432
}

# -----------------------------
# Utility: Connect DB
# -----------------------------
def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

# -----------------------------
# Create Embedding

def get_embedding(text: str):
    res = requests.post(
        OLLAMA_URL,
        json={
            "model": EMBED_MODEL,
            "prompt": text
        }
    )
    return res.json()["embedding"] 
# -----------------------------



# -----------------------------
# Retrieve Relevant Documents
# -----------------------------
def retrieve_context(query: str, top_k: int = 5):
    query_embedding = get_embedding(query)

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT content
        FROM stock_documents
        ORDER BY embedding <-> %s::vector
        LIMIT %s;
        """,
        (query_embedding, top_k)
    )

    results = cur.fetchall()
    cur.close()
    conn.close()

    return "\n".join([row[0] for row in results])


# -----------------------------
# GPT-5 RAG Response
# -----------------------------
def call_ai_model(user_query: str):
    context = retrieve_context(user_query)

    prompt = f"""
You are a professional stock market advisor.

Use ONLY the context below to answer the question.
If the context is insufficient, say you don't have enough data.

Context:
{context}

Question:
{user_query}

Answer:
"""

    response = client.chat.completions.create(
        model="gpt-5",
        messages=[
            {"role": "system", "content": "You are a financial stock advisory assistant."},
            {"role": "user", "content": prompt}
        ],
    )

    return response.choices[0].message.content.strip()

# cd flask-jwt-auth && .\venv\Scripts\activate && python run.py