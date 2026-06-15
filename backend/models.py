from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import enum

db = SQLAlchemy()

class TipoCategoria(enum.Enum):
    receita = 'receita'
    despesa = 'despesa'

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    transacoes = db.relationship('Transacao', backref='usuario', lazy=True)
    agendamentos = db.relationship('Agendamento', backref='usuario', lazy=True)

    def set_password(self, senha):
        self.senha = generate_password_hash(senha)

    def check_password(self, senha):
        return check_password_hash(self.senha, senha)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }

class Categoria(db.Model):
    __tablename__ = 'categorias'
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(120), nullable=False)
    tipo = db.Column(db.Enum(TipoCategoria), nullable=True)
    transacoes = db.relationship('Transacao', backref='categoria', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo.value if self.tipo else None
        }

class Transacao(db.Model):
    __tablename__ = 'transacoes'

    id = db.Column(db.Integer, primary_key=True)

    usuario_id = db.Column(
        db.Integer,
        db.ForeignKey('usuarios.id'),
        nullable=False
    )

    categoria_id = db.Column(
        db.Integer,
        db.ForeignKey('categorias.id'),
        nullable=False
    )

    descricao = db.Column(db.String(255), nullable=False)

    valor = db.Column(db.Float, nullable=False)

    tipo = db.Column(db.String(20), nullable=False)

    data = db.Column(db.Date, nullable=False)

    subcategoria = db.Column(db.String(120))

    recorrente = db.Column(
        db.Boolean,
        default=False
    )

    frequencia = db.Column(
        db.String(50)
    )

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'categoria_id': self.categoria_id,
            'descricao': self.descricao,
            'valor': self.valor,
            'tipo': self.tipo,
            'data': self.data.isoformat() if self.data else None,
            'subcategoria': self.subcategoria,
            'recorrente': self.recorrente,
            'frequencia': self.frequencia
        }
    __tablename__ = 'transacoes'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias.id'), nullable=False)
    descricao = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    tipo = db.Column(db.String(20), nullable=False)
    data = db.Column(db.Date, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'usuario_id': self.usuario_id,
            'categoria_id': self.categoria_id,
            'descricao': self.descricao,
            'valor': self.valor,
            'tipo': self.tipo,
            'data': self.data.isoformat() if self.data else None
        }

class Agendamento(db.Model):
    __tablename__ = 'agendamentos'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    tipo = db.Column(db.String(20), nullable=False, default='despesa')
    descricao = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Float, nullable=False)
    categoria = db.Column(db.String(120), nullable=True)
    data_vencimento = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='a_vencer')
    recorrente = db.Column(db.Boolean, default=False)
    frequencia = db.Column(db.String(20), nullable=True)
    data_pagamento = db.Column(db.Date, nullable=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def calcular_status(self):
      from datetime import date
      hoje = date.today()
      if self.status == 'pago':
        return 'pago'
      diff = (self.data_vencimento - hoje).days
      if self.tipo == 'receita':
        if diff < 0:
            return 'recebido_atrasado'
        elif diff == 0:
            return 'receber_hoje'
        elif diff <= 3:
            return 'proximo'
        else:
            return 'a_vencer'
      else:
        if diff < 0:
            return 'vencido'
        elif diff <= 3:
            return 'proximo'
        else:
            return 'a_vencer'

    def to_dict(self):
        status_atual = self.calcular_status()
        return {
            'id': self.id,
            'descricao': self.descricao,
            'tipo': self.tipo,
            'valor': float(self.valor),
            'categoria': self.categoria,
            'data_vencimento': self.data_vencimento.strftime('%Y-%m-%d'),
            'status': status_atual,
            'recorrente': self.recorrente,
            'frequencia': self.frequencia,
            'data_pagamento': self.data_pagamento.strftime('%Y-%m-%d') if self.data_pagamento else None,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None
        }