from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
import secrets

db = SQLAlchemy()
login_manager = LoginManager()

def create_app():
    #standard for all flask applications
    app = Flask(__name__)
    
    #config my database, as seen in codecademy flask course
    app.config["SECRET_KEY"] = secrets.token_hex(16)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'

    #basically begins the app
    db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "main.login"

    from app.models import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    #replace the app
    from app.main import bp
    app.register_blueprint(bp)
    return app