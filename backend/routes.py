from flask import Blueprint, request, jsonify, current_app
from models import db, Transacao, Categoria, Usuario
from functools import wraps
import jwt
from datetime import date, datetime, timedelta

api = Blueprint('api', __name__, url_prefix='/api')

def verificar_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            parts = request.headers['Authorization'].split()
            if parts[0] == 'Bearer':
                token = parts[1]
        if not token:
            return jsonify({'erro': 'Token ausente'}), 401
        try:
            payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            request.usuario_id = payload['usuario_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token invalido'}), 401
        return f(*args, **kwargs)
    return decorated

@api.route('/transacoes', methods=['GET'])
@verificar_token
def listar_transacoes():
    transacoes = Transacao.query.filter_by(usuario_id=request.usuario_id).order_by(Transacao.id.desc()).all()
    resultado = []
    for t in transacoes:
        resultado.append({
<<<<<<< HEAD
            'id': t.id,
            'descricao': t.descricao,
            'valor': float(t.valor),
            'categoria': t.categoria.nome if t.categoria else None,
            'data': t.data.strftime('%Y-%m-%d')
        })
=======
    'id': t.id,
    'descricao': t.descricao,
    'valor': float(t.valor),
    'tipo': t.tipo,
    'categoria': t.categoria.nome if t.categoria else None,
    'data': t.data.strftime('%Y-%m-%d')
})
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
    return jsonify(resultado)

@api.route('/transacoes', methods=['POST'])
@verificar_token
def criar_transacao():
    dados = request.get_json()
    descricao = dados.get('descricao')
    valor = dados.get('valor')
    categoria_nome = dados.get('categoria')
    tipo = dados.get('tipo')
    data_str = dados.get('data')

    if not all([descricao, valor, categoria_nome, tipo]):
        return jsonify({'erro': 'Campos obrigatorios ausentes'}), 400

    categoria = Categoria.query.filter_by(nome=categoria_nome).first()
    if not categoria:
        categoria = Categoria(nome=categoria_nome)
        db.session.add(categoria)
        db.session.commit()

    if data_str:
        data_transacao = datetime.strptime(data_str, '%Y-%m-%d').date()
    else:
        data_transacao = date.today()

    transacao = Transacao(
        descricao=descricao,
        valor=float(valor),
        tipo=tipo,
        categoria_id=categoria.id,
        usuario_id=request.usuario_id,
        data=data_transacao
    )
    db.session.add(transacao)
    db.session.commit()
    return jsonify({'id': transacao.id, 'mensagem': 'Transacao criada'}), 201

@api.route('/transacoes/<int:id>', methods=['DELETE'])
@verificar_token
def deletar_transacao(id):
    transacao = Transacao.query.filter_by(id=id, usuario_id=request.usuario_id).first()
    if not transacao:
        return jsonify({'erro': 'Transacao nao encontrada'}), 404
    db.session.delete(transacao)
    db.session.commit()
    return jsonify({'mensagem': 'Transacao deletada'})

@api.route('/usuario', methods=['GET'])
@verificar_token
def obter_usuario():
    usuario = Usuario.query.get(request.usuario_id)
    return jsonify(usuario.to_dict())

@api.route('/dashboard', methods=['GET'])
@verificar_token
def dashboard():
    usuario = Usuario.query.get(request.usuario_id)
    transacoes = Transacao.query.filter_by(usuario_id=request.usuario_id).all()
    receitas = sum(t.valor for t in transacoes if t.tipo == 'receita')
    despesas = sum(t.valor for t in transacoes if t.tipo == 'despesa')
    saldo = receitas - despesas

    # --- NOVA FÓRMULA DE SAÚDE FINANCEIRA (regra 50/30/20) ---
    if receitas == 0 and despesas > 0:
        saude = 0
    elif receitas == 0 and despesas == 0:
        saude = 100
    else:
        ratio = despesas / receitas
        if ratio <= 0.5:
            saude = 100
        elif ratio <= 1.0:
            saude = int(100 - ((ratio - 0.5) / 0.5) * 50)
        elif ratio <= 2.0:
            saude = int(50 - ((ratio - 1.0) / 1.0) * 50)
        else:
            saude = 0
    # ---------------------------------------------------------

    hoje = date.today()
    dias_semana = {0: 'Segunda-feira', 1: 'Terca-feira', 2: 'Quarta-feira', 3: 'Quinta-feira', 4: 'Sexta-feira', 5: 'Sabado', 6: 'Domingo'}
    meses = {1: 'Janeiro', 2: 'Fevereiro', 3: 'Marco', 4: 'Abril', 5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto', 9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'}
    data_formatada = f"{dias_semana[hoje.weekday()]}, {hoje.day} de {meses[hoje.month]} de {hoje.year}"
    ultimas_transacoes = Transacao.query.filter_by(usuario_id=request.usuario_id).order_by(Transacao.id.desc()).limit(5).all()
    ultimas = []
    for t in ultimas_transacoes:
        ultimas.append({
            'id': t.id,
            'descricao': t.descricao,
            'valor': float(t.valor),
            'tipo': t.tipo,
            'categoria': t.categoria.nome if t.categoria else None,
            'data': t.data.strftime('%Y-%m-%d')
        })
    return jsonify({
        'nome': usuario.nome,
        'avatar': usuario.nome[0].upper() if usuario.nome else '',
        'totais': {
            'receitas': float(receitas),
            'despesas': float(despesas),
            'saldo': float(saldo)
        },
        'saude_financeira': saude,
        'data_formatada': data_formatada,
        'ultimas_transacoes': ultimas
    })

@api.route('/transacoes/<int:id>', methods=['PUT'])
@verificar_token
def atualizar_transacao(id):
    transacao = Transacao.query.filter_by(id=id, usuario_id=request.usuario_id).first_or_404()
    dados = request.get_json()
    if 'descricao' in dados:
        transacao.descricao = dados['descricao']
    if 'valor' in dados:
        transacao.valor = dados['valor']
    if 'categoria' in dados:
        cat_nome = dados['categoria']
        categoria = Categoria.query.filter_by(nome=cat_nome).first()
        if not categoria:
            categoria = Categoria(nome=cat_nome)
            db.session.add(categoria)
            db.session.commit()
        transacao.categoria_id = categoria.id
    if 'data' in dados:
        transacao.data = datetime.strptime(dados['data'], '%Y-%m-%d').date()
    db.session.commit()
    return jsonify({
        'id': transacao.id,
        'descricao': transacao.descricao,
        'valor': float(transacao.valor),
        'tipo': transacao.tipo,
        'categoria': transacao.categoria.nome if transacao.categoria else None,
        'data': transacao.data.strftime('%Y-%m-%d')
    })

@api.route('/graficos/donut', methods=['GET'])
@verificar_token
def grafico_donut():
    from sqlalchemy import extract

    transacoes = Transacao.query.filter(
        Transacao.usuario_id == request.usuario_id,
        Transacao.tipo == 'despesa'
    ).all()

    gastos = {}
    total = 0
    for t in transacoes:
        cat_nome = t.categoria.nome if t.categoria else 'Sem categoria'
        gastos[cat_nome] = gastos.get(cat_nome, 0) + t.valor
        total += t.valor

    labels = list(gastos.keys())
    data = [float(v) for v in gastos.values()]
    percentuais = [round((v/total)*100, 2) if total > 0 else 0 for v in data]
    return jsonify({'labels': labels, 'data': data, 'percentuais': percentuais})

@api.route('/graficos/barras', methods=['GET'])
@verificar_token
def grafico_barras():
    from sqlalchemy import extract

    ultima_transacao = Transacao.query.filter_by(
        usuario_id=request.usuario_id
    ).order_by(Transacao.data.desc()).first()

    hoje = date.today()
    if ultima_transacao and ultima_transacao.data > hoje:
        hoje = ultima_transacao.data

    meses_nomes = {1:'Jan',2:'Fev',3:'Mar',4:'Abr',5:'Mai',6:'Jun',
                   7:'Jul',8:'Ago',9:'Set',10:'Out',11:'Nov',12:'Dez'}

    labels = []
    receitas_lista = []
    gastos_lista = []
    investimentos_lista = []
    apostas_lista = []

    for i in range(5, -1, -1):
        mes = hoje.month - i
        ano = hoje.year
        while mes <= 0:
            mes += 12
            ano -= 1

        labels.append(f"{meses_nomes[mes]}'{str(ano)[-2:]}")

        receitas = db.session.query(db.func.sum(Transacao.valor)).filter(
            Transacao.usuario_id == request.usuario_id,
            Transacao.tipo == 'receita',
            extract('month', Transacao.data) == mes,
            extract('year', Transacao.data) == ano
        ).scalar() or 0

        despesas = db.session.query(db.func.sum(Transacao.valor)).filter(
            Transacao.usuario_id == request.usuario_id,
            Transacao.tipo == 'despesa',
            extract('month', Transacao.data) == mes,
            extract('year', Transacao.data) == ano
        ).scalar() or 0

<<<<<<< HEAD
        investimentos = db.session.query(db.func.sum(Transacao.valor)).filter(
            Transacao.usuario_id == request.usuario_id,
            Transacao.tipo == 'despesa',
            Transacao.categoria_id == Categoria.id,
            Categoria.nome == 'Investimentos/Reservas',
            extract('month', Transacao.data) == mes,
            extract('year', Transacao.data) == ano
        ).scalar() or 0

        apostas = db.session.query(db.func.sum(Transacao.valor)).filter(
            Transacao.usuario_id == request.usuario_id,
            Transacao.tipo == 'despesa',
            Transacao.categoria_id == Categoria.id,
            Categoria.nome == 'Apostas',
            extract('month', Transacao.data) == mes,
            extract('year', Transacao.data) == ano
        ).scalar() or 0

        receitas_lista.append(float(receitas))
        gastos_lista.append(float(despesas))
        investimentos_lista.append(float(investimentos))
        apostas_lista.append(float(apostas))
=======
        investimentos = db.session.query(db.func.sum(Transacao.valor))\
    .join(Categoria, Transacao.categoria_id == Categoria.id)\
    .filter(
        Transacao.usuario_id == request.usuario_id,
        Transacao.tipo == 'despesa',
        Categoria.nome == 'Investimentos/Reservas',
        extract('month', Transacao.data) == mes,
        extract('year', Transacao.data) == ano
    ).scalar() or 0

    apostas = db.session.query(db.func.sum(Transacao.valor))\
    .join(Categoria, Transacao.categoria_id == Categoria.id)\
    .filter(
        Transacao.usuario_id == request.usuario_id,
        Transacao.tipo == 'despesa',
        Categoria.nome == 'Apostas',
        extract('month', Transacao.data) == mes,
        extract('year', Transacao.data) == ano
    ).scalar() or 0

    receitas_lista.append(float(receitas))
    gastos_lista.append(float(despesas))
    investimentos_lista.append(float(investimentos))
    apostas_lista.append(float(apostas))
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)

    return jsonify({
        'labels': labels,
        'receitas': receitas_lista,
        'gastos': gastos_lista,
        'investimentos': investimentos_lista,
        'apostas': apostas_lista
    })