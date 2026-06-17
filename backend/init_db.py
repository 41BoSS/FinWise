from flask import Flask
from config import Config
from models import db, Usuario, Categoria, Transacao
from datetime import date

# Cria a aplicação Flask
app = Flask(__name__)
app.config.from_object(Config)

# Inicializa o banco de dados
db.init_app(app)

with app.app_context():
    # Cria todas as tabelas
    db.create_all()
    print("Tabelas criadas com sucesso!")

    # Cria o usuário padrão
    usuario = Usuario(nome='Henri', email='henri@finwise.com')
    usuario.set_password('123456')
    db.session.add(usuario)
    db.session.flush()  # Para obter o id do usuário
    print("Usuário padrão criado.")

    # Cria as categorias
    categorias_nomes = ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros']
    for nome in categorias_nomes:
        cat = Categoria(nome=nome)
        db.session.add(cat)
    db.session.flush()
    print("Categorias criadas.")

    # Cria 3 transações de exemplo para o usuário 1
    transacoes = [
        Transacao(descricao='Compra no supermercado', valor=150.00, tipo='despesa', data=date.today(), usuario_id=usuario.id, categoria_id=1),
        Transacao(descricao='Passagem de ônibus', valor=4.40, tipo='despesa', data=date.today(), usuario_id=usuario.id, categoria_id=2),
        Transacao(descricao='Aluguel do mês', valor=1200.00, tipo='despesa', data=date.today(), usuario_id=usuario.id, categoria_id=3)
    ]
    for t in transacoes:
        db.session.add(t)
    print("Transações de exemplo criadas.")

    # Commit final
    db.session.commit()
    print("Dados iniciais populados com sucesso!")