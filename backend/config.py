import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://root:{os.getenv('DB_PASSWORD')}@localhost:3306/finwise"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('SECRET_KEY', 'chave_local_desenvolvimento_12345')