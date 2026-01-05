from flask import current_app
from .db import db
from .embeddings import get_embedding

def retrieve_context(query, k=5):
    embedding = get_embedding(query)

    # Convert embedding list to string for PostgreSQL vector compatibility
    embedding_str = '[' + ','.join(map(str, embedding)) + ']'

    conn = db.engine.raw_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT content
                FROM chat_messages
                ORDER BY embedding <=> %s
                LIMIT %s;
                """,
                (embedding_str, k)
            )

            rows = cur.fetchall()

        return "\n".join([r[0] for r in rows])
    finally:
        conn.close()
"""Fetch stock data from external source"""
# def fetch_data_from_source(query):
        
