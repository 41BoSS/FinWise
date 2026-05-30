# run.py - Arquivo principal para executar a aplicação
from app import create_app

# Cria a aplicação usando a factory
app = create_app()

# Registra o blueprint de autenticação

# Executa o servidor de desenvolvimento
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)