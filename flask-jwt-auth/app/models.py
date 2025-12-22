from . import db
from pgvector.sqlalchemy import Vector
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
class User(db.Model):
    __tablename__ = 'users_info'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True)
    email = db.Column(db.String(200), unique=True)
    contact_no = db.Column(db.String(15), unique=True)
    password_hash = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    # Method to check password
    def check_password(self, password):
        return check_password_hash(self.password, password)

class ChatRequest(db.Model):
    __tablename__ = 'chat_messages'
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(50))
    content = db.Column(db.Text)
    embedding = db.Column(Vector(768))
