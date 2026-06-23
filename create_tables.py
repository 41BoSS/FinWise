import sys
sys.path.insert(0, 'backend')

from app import db, create_app

app = create_app()
with app.app_context():
    db.create_all()
    print("✅ Tabelas criadas com sucesso!")
