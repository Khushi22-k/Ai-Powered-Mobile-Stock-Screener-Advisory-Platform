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

class StockData(db.Model):
    __tablename__ = 'stock_data'

    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(30), nullable=False)
    symbol = db.Column(db.String(30), nullable=False)
    industry = db.Column(db.String(30), nullable=False)
    series = db.Column(db.String(10), nullable=False)
    open_price = db.Column(db.Numeric(10, 2), nullable=False)
    high_price = db.Column(db.Numeric(10, 2), nullable=False)
    low_price = db.Column(db.Numeric(10, 2), nullable=False)
    previous_close = db.Column(db.Numeric(10, 2), nullable=False)
    last_traded_price = db.Column(db.Numeric(10, 2), nullable=False)
    price_change = db.Column(db.Numeric(10, 2), nullable=False)
    percentage_change = db.Column(db.Numeric(6, 2), nullable=False)
    day_percentage_change = db.Column(db.Numeric(6, 2), nullable=False)
    share_volume = db.Column(db.BigInteger, nullable=False)
    value_inr = db.Column(db.Numeric(18, 2), nullable=False)
    week_high = db.Column(db.Numeric(10, 2), nullable=False)
    week_low = db.Column(db.Numeric(10, 2), nullable=False)
    daypercentagechange = db.Column(db.Numeric(6, 2), nullable=True)

class Watchlist(db.Model):
    __tablename__ = 'watchlist_selected_item_history'

    id = db.Column(db.Integer, primary_key=True)
    email_id = db.Column(db.String(200), db.ForeignKey('users_info.email'), nullable=False)
    symbol_name = db.Column(db.String(30), nullable=False)
    status = db.Column(db.String(10), nullable=False)
    selected_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users_info.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'price_alert', 'ai_signal', 'risk_alert'
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    symbol = db.Column(db.String(30))  # Stock symbol if applicable
    data = db.Column(db.JSON)  # Additional data like price, confidence, etc.
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('notifications', lazy=True))

class NotificationPreference(db.Model):
    __tablename__ = 'notification_preferences'

    user_id = db.Column(db.Integer, db.ForeignKey('users_info.id'), primary_key=True, nullable=False)
    price_alerts_enabled = db.Column(db.Boolean, default=True)
    ai_signal_alerts_enabled = db.Column(db.Boolean, default=True)
    risk_alerts_enabled = db.Column(db.Boolean, default=True)
    price_upper_threshold = db.Column(db.Numeric(6, 2), default=5.0)  # Percentage
    price_lower_threshold = db.Column(db.Numeric(6, 2), default=-5.0)  # Percentage
    ai_confidence_threshold = db.Column(db.Numeric(3, 2), default=0.7)  # 0.0 to 1.0
    cooldown_minutes = db.Column(db.Integer, default=60)  # Minutes between similar notifications

    user = db.relationship('User', backref=db.backref('notification_preferences', lazy=True))

