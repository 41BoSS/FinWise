from flask import Flask
from flask_cors import CORS
from models import db
from routes import api
from auth import auth_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)

    CORS(
        app,
        origins=[
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:8000",
            "http://127.0.0.1:8000"
        ],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=True
    )

    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/auth')

    return app


if __name__ == '__main__':
    app = create_app()

    with app.app_context():
        db.create_all()
        print("Banco de dados e tabelas criadas com sucesso!")

    app.run(debug=True, host='127.0.0.1', port=5000)