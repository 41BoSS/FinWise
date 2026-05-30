from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import jwt
from models import db, Usuario

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/registro', methods=['POST'])
def registro():
    data = request.get_json()
    email = data.get('email')
    nome = data.get('nome')
    senha = data.get('senha')

    if not email or not nome or not senha:
        return jsonify({'message': 'Email, nome e senha são obrigatórios'}), 400

    usuario_existente = Usuario.query.filter_by(email=email).first()
    if usuario_existente:
        return jsonify({'message': 'Email já cadastrado'}), 400

    novo_usuario = Usuario(email=email, nome=nome)
    novo_usuario.set_password(senha)
    db.session.add(novo_usuario)
    db.session.commit()

    return jsonify({'message': 'Usuário criado com sucesso'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    senha = data.get('senha')

    if not email or not senha:
        return jsonify({'message': 'Email e senha são obrigatórios'}), 400

    usuario = Usuario.query.filter_by(email=email).first()
    if not usuario or not usuario.check_password(senha):
        return jsonify({'message': 'Credenciais inválidas'}), 401

    payload = {
        'usuario_id': usuario.id,
        'exp': datetime.utcnow() + timedelta(hours=1)
    }
    token = jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({'token': token}), 200