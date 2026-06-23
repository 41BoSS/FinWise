import os
from dotenv import load_dotenv
import pymysql

load_dotenv()

try:
    # Conecta sem especificar o banco de dados
    conn = pymysql.connect(
        host=os.getenv('DB_HOST'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD')
    )
    
    cursor = conn.cursor()
    
    # Cria o banco de dados
    db_name = os.getenv('DB_NAME')
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
    
    print(f"✅ Banco de dados '{db_name}' criado com sucesso!")
    
    conn.commit()
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Erro: {e}")
