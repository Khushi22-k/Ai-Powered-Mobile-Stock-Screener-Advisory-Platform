from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .db import db
import openai

def create_app():
    app = Flask(__name__)

    CORS(
        app,
        resources={r"/auth/*": {"origins": "http://localhost:5173"}},
        supports_credentials=True
    )

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "postgresql://postgres:1234@localhost:5432/postgres"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["JWT_SECRET_KEY"] = "1234567890"

    db.init_app(app)
    JWTManager(app)

    from .auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")

    return app
