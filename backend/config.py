import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///finwise.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "finwise_secret_key"