import requests

OLLAMA_URL = "http://localhost:11434/api/embeddings"
EMBED_MODEL = "nomic-embed-text"

def get_embedding(text: str):
    res = requests.post(
        OLLAMA_URL,
        json={
            "model": EMBED_MODEL,
            "prompt": text
        }
    )
    return res.json()["embedding"]  # 768-dim list
