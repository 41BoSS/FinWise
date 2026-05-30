import os  # Biblioteca para interagir com o sistema operacional, usada para acessar variáveis de ambiente
from dotenv import load_dotenv  # Função para carregar variáveis do arquivo .env

# Carrega as variáveis de ambiente do arquivo .env (deve estar na raiz do projeto)
load_dotenv()

class Config:
    """
    Classe de configuração para o aplicativo Flask.
    As configurações do banco de dados são definidas aqui.
    """
    # Configuração do URI do banco de dados MySQL usando PyMySQL
    # Formato: 'mysql+pymysql://usuario:senha@host:porta/nome_do_banco'
    # A senha é obtida da variável de ambiente 'DB_PASSWORD'
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://root:{os.getenv('DB_PASSWORD')}@localhost:3306/finwise"
    
    # Desabilita o rastreamento de modificações do SQLAlchemy para evitar overhead
    SQLALCHEMY_TRACK_MODIFICATIONS = False