import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

print("Variáveis carregadas:")
print(f"DB_TYPE: {os.getenv('DB_TYPE')}")
print(f"DB_USER: {os.getenv('DB_USER')}")
print(f"DB_PASSWORD: {os.getenv('DB_PASSWORD')}")
print(f"DB_HOST: {os.getenv('DB_HOST')}")
print(f"DB_PORT: {os.getenv('DB_PORT')}")
print(f"DB_NAME: {os.getenv('DB_NAME')}")

# Tenta conectar
import pymysql

try:
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        database=os.getenv('DB_NAME')
    )
    print("\n✅ Conectado ao MySQL com sucesso!")
    conn.close()
except Exception as e:
    print(f"\n❌ Erro: {e}")
