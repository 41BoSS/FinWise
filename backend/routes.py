from flask import Blueprint, request, jsonify, current_app
from models import db, Transacao, Categoria, Usuario, Agendamento
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
    'id': t.id,
    'descricao': t.descricao,
    'valor': float(t.valor),
    'tipo': t.tipo,
    'categoria': t.categoria.nome if t.categoria else None,
    'subcategoria': t.subcategoria,
    'recorrente': t.recorrente,
    'frequencia': t.frequencia,
    'data': t.data.strftime('%Y-%m-%d')
})
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
    recorrente = dados.get('recorrente', False)
    frequencia = dados.get('frequencia', None)
    data_vencimento_str = dados.get('data_vencimento')

    subcategoria = dados.get('subcategoria')
    recorrente = dados.get('recorrente', False)
    frequencia = dados.get('frequencia')

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
    if not data_vencimento_str:
        data_vencimento = data_transacao
    else:
        data_vencimento = datetime.strptime(
            data_vencimento_str,
            '%Y-%m-%d'
        ).date()

    transacao = Transacao(
        descricao=descricao,
        valor=float(valor),
        tipo=tipo,
        categoria_id=categoria.id,
        usuario_id=request.usuario_id,
        data=data_transacao,
        subcategoria=subcategoria,
        recorrente=recorrente,
        frequencia=frequencia
    )
    db.session.add(transacao)
    db.session.commit()

    if recorrente and frequencia:
        frequencia_lower = frequencia.lower()
        if frequencia_lower == 'semanal':
            total_ocorrencias = 12
        elif frequencia_lower == 'mensal':
            total_ocorrencias = 12
        elif frequencia_lower == 'anual':
            total_ocorrencias = 3
        else:
            total_ocorrencias = 12

        data_atual = data_vencimento
        for i in range(total_ocorrencias):
            ag = Agendamento(
                usuario_id=request.usuario_id,
                descricao=descricao,
                valor=float(valor),
                categoria=categoria_nome,
                tipo=tipo,
                data_vencimento=data_atual,
                recorrente=True,
                frequencia=frequencia_lower,
                status='a_vencer'
            )
            db.session.add(ag)
            data_atual = calcular_proxima_data(data_atual, frequencia_lower)
        db.session.commit()
    elif data_vencimento_str:
        agendamento = Agendamento(
            usuario_id=request.usuario_id,
            descricao=descricao,
            valor=float(valor),
            categoria=categoria_nome,
            tipo=tipo,
            data_vencimento=data_vencimento,
            recorrente=False,
            frequencia=None,
            status='a_vencer'
        )
        db.session.add(agendamento)
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
        'subcategoria': t.subcategoria,
        'data': t.data.strftime('%Y-%m-%d')
})

    agendamentos_alerta = Agendamento.query.filter(
        Agendamento.usuario_id == request.usuario_id,
        Agendamento.status != 'pago',
        Agendamento.data_vencimento <= hoje + timedelta(days=3)
    ).all()

    alertas = []
    for a in agendamentos_alerta:
        status_atual = a.calcular_status()
        if status_atual in ('vencido', 'proximo'):
            alertas.append({
                'id': a.id,
                'descricao': a.descricao,
                'valor': float(a.valor),
                'data_vencimento': a.data_vencimento.strftime('%Y-%m-%d'),
                'status': status_atual
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
        'ultimas_transacoes': ultimas,
        'alertas_agenda': alertas
    })

@api.route('/transacoes/<int:id>', methods=['GET'])
@verificar_token
def obter_transacao(id):
    transacao = Transacao.query.filter_by(
        id=id,
        usuario_id=request.usuario_id
    ).first()

    if not transacao:
        return jsonify({'erro': 'Transacao nao encontrada'}), 404

    return jsonify({
        'id': transacao.id,
        'descricao': transacao.descricao,
        'valor': float(transacao.valor),
        'tipo': transacao.tipo,
        'categoria': transacao.categoria.nome if transacao.categoria else None,
        'data': transacao.data.strftime('%Y-%m-%d')
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

    return jsonify({
        'labels': labels,
        'receitas': receitas_lista,
        'gastos': gastos_lista,
        'investimentos': investimentos_lista,
        'apostas': apostas_lista
    })

# ─────────────────────────────────────────────
# AGENDA
# ─────────────────────────────────────────────

@api.route('/agenda', methods=['GET'])
@verificar_token
def listar_agenda():
    mes = request.args.get('mes', type=int)
    ano = request.args.get('ano', type=int)

    query = Agendamento.query.filter_by(usuario_id=request.usuario_id)

    if mes and ano:
        from sqlalchemy import extract
        query = query.filter(
            extract('month', Agendamento.data_vencimento) == mes,
            extract('year', Agendamento.data_vencimento) == ano
        )

    agendamentos = query.order_by(Agendamento.data_vencimento.asc()).all()
    return jsonify([a.to_dict() for a in agendamentos])

@api.route('/agenda/<int:id>/pagar', methods=['PUT'])
@verificar_token
def marcar_pago(id):
    agendamento = Agendamento.query.filter_by(id=id, usuario_id=request.usuario_id).first()
    if not agendamento:
        return jsonify({'erro': 'Agendamento nao encontrado'}), 404

    agendamento.status = 'pago'
    agendamento.data_pagamento = date.today()
    db.session.commit()

    if agendamento.recorrente and agendamento.frequencia:
     proxima_data = calcular_proxima_data(agendamento.data_vencimento, agendamento.frequencia)

    ja_existe = Agendamento.query.filter_by(
        usuario_id=agendamento.usuario_id,
        descricao=agendamento.descricao,
        valor=agendamento.valor,
        frequencia=agendamento.frequencia,
        data_vencimento=proxima_data,
        status='a_vencer'
    ).first()

    if not ja_existe:
        novo = Agendamento(
            usuario_id=agendamento.usuario_id,
            descricao=agendamento.descricao,
            valor=agendamento.valor,
            categoria=agendamento.categoria,
            data_vencimento=proxima_data,
            recorrente=True,
            frequencia=agendamento.frequencia,
            status='a_vencer'
        )
        db.session.add(novo)
        db.session.commit()

    return jsonify({'mensagem': 'Agendamento marcado como pago', 'agendamento': agendamento.to_dict()})

@api.route('/agenda/<int:id>', methods=['DELETE'])
@verificar_token
def deletar_agendamento(id):
    agendamento = Agendamento.query.filter_by(id=id, usuario_id=request.usuario_id).first()
    if not agendamento:
        return jsonify({'erro': 'Agendamento nao encontrado'}), 404
    db.session.delete(agendamento)
    db.session.commit()
    return jsonify({'mensagem': 'Agendamento deletado'})

@api.route('/agenda/alertas', methods=['GET'])
@verificar_token
def alertas_agenda():
    hoje = date.today()
    agendamentos = Agendamento.query.filter(
        Agendamento.usuario_id == request.usuario_id,
        Agendamento.status != 'pago',
        Agendamento.data_vencimento <= hoje + timedelta(days=3)
    ).order_by(Agendamento.data_vencimento.asc()).all()

    resultado = []
    for a in agendamentos:
        d = a.to_dict()
        if d['status'] in ('vencido', 'proximo'):
            resultado.append(d)

    return jsonify({
        'total': len(resultado),
        'alertas': resultado
    })

@api.route('/alertas/gastos-excessivos', methods=['GET'])
@verificar_token
def gastos_excessivos():
    """Detecta categorias com gasto acima da média dos últimos 3 meses."""
    from sqlalchemy import extract
    hoje = date.today()

    resultado = []
    mes_atual = {}
    transacoes_mes = Transacao.query.filter(
        Transacao.usuario_id == request.usuario_id,
        Transacao.tipo == 'despesa',
        extract('month', Transacao.data) == hoje.month,
        extract('year', Transacao.data) == hoje.year
    ).all()
    for t in transacoes_mes:
        cat = t.categoria.nome if t.categoria else 'Sem categoria'
        mes_atual[cat] = mes_atual.get(cat, 0) + t.valor

    for cat_nome, total_atual in mes_atual.items():
        historico = []
        for i in range(1, 4):
            m = hoje.month - i
            a = hoje.year
            while m <= 0:
                m += 12
                a -= 1
            soma = db.session.query(db.func.sum(Transacao.valor)).join(
                Categoria, Transacao.categoria_id == Categoria.id
            ).filter(
                Transacao.usuario_id == request.usuario_id,
                Transacao.tipo == 'despesa',
                Categoria.nome == cat_nome,
                extract('month', Transacao.data) == m,
                extract('year', Transacao.data) == a
            ).scalar() or 0
            historico.append(float(soma))

        meses_com_gasto = [v for v in historico if v > 0]
        if not meses_com_gasto:
            continue

        media = sum(meses_com_gasto) / len(meses_com_gasto)
        if media > 0 and total_atual > media * 1.2:
            resultado.append({
                'categoria': cat_nome,
                'total_atual': round(float(total_atual), 2),
                'media': round(media, 2),
                'percentual_acima': round(((total_atual / media) - 1) * 100, 1),
                'data': hoje.strftime('%Y-%m-%d')
            })

    return jsonify(resultado)

@api.route('/relatorio', methods=['GET'])
@verificar_token
def relatorio():
    from sqlalchemy import extract
    import calendar

    periodo = request.args.get('periodo', 'mensal')  # mensal ou anual
    mes     = request.args.get('mes',  type=int, default=date.today().month)
    ano     = request.args.get('ano',  type=int, default=date.today().year)

    usuario = Usuario.query.get(request.usuario_id)

    # ── Definir intervalo ──────────────────────────────────────
    if periodo == 'anual':
        transacoes_periodo = Transacao.query.filter(
            Transacao.usuario_id == request.usuario_id,
            extract('year', Transacao.data) == ano
        ).all()
    else:
        transacoes_periodo = Transacao.query.filter(
            Transacao.usuario_id == request.usuario_id,
            extract('month', Transacao.data) == mes,
            extract('year',  Transacao.data) == ano
        ).all()

    receitas  = sum(t.valor for t in transacoes_periodo if t.tipo == 'receita')
    despesas  = sum(t.valor for t in transacoes_periodo if t.tipo == 'despesa')
    saldo     = receitas - despesas

    # ── Saúde financeira do período ───────────────────────────
    def calc_saude(rec, desp):
        if rec == 0 and desp > 0: return 0
        if rec == 0 and desp == 0: return 100
        ratio = desp / rec
        if ratio <= 0.5:  return 100
        if ratio <= 1.0:  return int(100 - ((ratio - 0.5) / 0.5) * 50)
        if ratio <= 2.0:  return int(50  - ((ratio - 1.0) / 1.0) * 50)
        return 0

    saude = calc_saude(receitas, despesas)

    # ── Saúde dos últimos 6 meses (gráfico de linha) ──────────
    historico_saude = []
    meses_nomes = {1:'Jan',2:'Fev',3:'Mar',4:'Abr',5:'Mai',6:'Jun',
                   7:'Jul',8:'Ago',9:'Set',10:'Out',11:'Nov',12:'Dez'}
    for i in range(5, -1, -1):
        m = mes - i
        a = ano
        while m <= 0:
            m += 12
            a -= 1
        r = db.session.query(db.func.sum(Transacao.valor)).filter(
            Transacao.usuario_id == request.usuario_id,
            Transacao.tipo == 'receita',
            extract('month', Transacao.data) == m,
            extract('year',  Transacao.data) == a
        ).scalar() or 0
        d = db.session.query(db.func.sum(Transacao.valor)).filter(
            Transacao.usuario_id == request.usuario_id,
            Transacao.tipo == 'despesa',
            extract('month', Transacao.data) == m,
            extract('year',  Transacao.data) == a
        ).scalar() or 0
        historico_saude.append({
            'label': f"{meses_nomes[m]}'{str(a)[-2:]}",
            'saude': calc_saude(float(r), float(d)),
            'receitas': float(r),
            'despesas': float(d)
        })

    # ── Gastos por categoria no período ───────────────────────
    categorias_periodo = {}
    for t in transacoes_periodo:
        if t.tipo == 'despesa':
            cat = t.categoria.nome if t.categoria else 'Sem categoria'
            categorias_periodo[cat] = categorias_periodo.get(cat, 0) + t.valor

    # ── Média histórica por categoria (3 meses anteriores) ────
    medias_categoria = {}
    for cat_nome in categorias_periodo:
        vals = []
        for i in range(1, 4):
            m2 = mes - i
            a2 = ano
            while m2 <= 0:
                m2 += 12
                a2 -= 1
            soma = db.session.query(db.func.sum(Transacao.valor)).join(
                Categoria, Transacao.categoria_id == Categoria.id
            ).filter(
                Transacao.usuario_id == request.usuario_id,
                Transacao.tipo == 'despesa',
                Categoria.nome == cat_nome,
                extract('month', Transacao.data) == m2,
                extract('year',  Transacao.data) == a2
            ).scalar() or 0
            vals.append(float(soma))
        com_gasto = [v for v in vals if v > 0]
        medias_categoria[cat_nome] = round(sum(com_gasto) / len(com_gasto), 2) if com_gasto else 0

    analise_categorias = []
    for cat, total in categorias_periodo.items():
        media = medias_categoria.get(cat, 0)
        desvio = round(((total / media) - 1) * 100, 1) if media > 0 else None
        status = 'normal'
        if desvio is not None:
            if desvio > 20:  status = 'acima'
            elif desvio < -20: status = 'abaixo'
        analise_categorias.append({
            'categoria': cat,
            'total': round(float(total), 2),
            'media': media,
            'desvio': desvio,
            'status': status
        })
    analise_categorias.sort(key=lambda x: x['total'], reverse=True)

    # ── Gastos por categoria mês a mês (barras empilhadas) ────
    todas_cats = list(set(
        t.categoria.nome if t.categoria else 'Sem categoria'
        for t in Transacao.query.filter_by(usuario_id=request.usuario_id).all()
        if t.tipo == 'despesa'
    ))
    labels_meses = []
    datasets_cats = {c: [] for c in todas_cats}
    for i in range(5, -1, -1):
        m = mes - i
        a = ano
        while m <= 0:
            m += 12
            a -= 1
        labels_meses.append(f"{meses_nomes[m]}'{str(a)[-2:]}")
        for cat_nome in todas_cats:
            soma = db.session.query(db.func.sum(Transacao.valor)).join(
                Categoria, Transacao.categoria_id == Categoria.id
            ).filter(
                Transacao.usuario_id == request.usuario_id,
                Transacao.tipo == 'despesa',
                Categoria.nome == cat_nome,
                extract('month', Transacao.data) == m,
                extract('year',  Transacao.data) == a
            ).scalar() or 0
            datasets_cats[cat_nome].append(float(soma))

    # ── Eventos relevantes ────────────────────────────────────
    eventos = []
    todas_transacoes = sorted(transacoes_periodo, key=lambda t: t.valor, reverse=True)

    # Top 3 maiores gastos
    maiores = [t for t in todas_transacoes if t.tipo == 'despesa'][:3]
    for t in maiores:
        eventos.append({
            'tipo': 'gasto_alto',
            'descricao': t.descricao,
            'valor': float(t.valor),
            'categoria': t.categoria.nome if t.categoria else 'Sem categoria',
            'data': t.data.strftime('%d/%m/%Y'),
            'impacto': 'negativo'
        })

    # Categorias acima da média
    for item in analise_categorias:
        if item['status'] == 'acima':
            eventos.append({
                'tipo': 'acima_media',
                'descricao': f"Gastos em {item['categoria']} acima da média",
                'valor': item['total'],
                'categoria': item['categoria'],
                'data': f"{meses_nomes[mes]}/{ano}",
                'desvio': item['desvio'],
                'impacto': 'negativo'
            })

    # Maior receita
    maior_receita = max((t for t in transacoes_periodo if t.tipo == 'receita'), key=lambda t: t.valor, default=None)
    if maior_receita:
        eventos.append({
            'tipo': 'receita',
            'descricao': maior_receita.descricao,
            'valor': float(maior_receita.valor),
            'categoria': maior_receita.categoria.nome if maior_receita.categoria else 'Receita',
            'data': maior_receita.data.strftime('%d/%m/%Y'),
            'impacto': 'positivo'
        })

    # ── Parágrafo automático ──────────────────────────────────
    saude_anterior = historico_saude[-2]['saude'] if len(historico_saude) >= 2 else saude
    diff_saude = saude - saude_anterior
    nome_mes = meses_nomes[mes]

    if saude >= 70:
        status_texto = "sua saúde financeira está ótima"
    elif saude >= 40:
        status_texto = "sua saúde financeira está em atenção"
    else:
        status_texto = "sua saúde financeira está em estado crítico"

    if diff_saude > 0:
        tendencia = f"uma melhora de {diff_saude} pontos em relação ao mês anterior"
    elif diff_saude < 0:
        tendencia = f"uma queda de {abs(diff_saude)} pontos em relação ao mês anterior"
    else:
        tendencia = "estabilidade em relação ao mês anterior"

    cats_acima = [c for c in analise_categorias if c['status'] == 'acima']
    if cats_acima:
        alerta_cats = f"As categorias que mais pesaram foram: {', '.join(c['categoria'] for c in cats_acima[:2])}."
    else:
        alerta_cats = "Nenhuma categoria ficou acima da média histórica."

    paragrafo = (
        f"Em {nome_mes}/{ano}, {status_texto} com um score de {saude}/100, representando {tendencia}. "
        f"Você teve R$ {receitas:.2f} em receitas e R$ {despesas:.2f} em despesas, "
        f"resultando em um saldo de R$ {saldo:.2f}. {alerta_cats}"
    )

    return jsonify({
        'periodo': periodo,
        'mes': mes,
        'ano': ano,
        'nome_usuario': usuario.nome,
        'totais': {
            'receitas': float(receitas),
            'despesas': float(despesas),
            'saldo': float(saldo)
        },
        'saude': saude,
        'saude_anterior': saude_anterior,
        'paragrafo': paragrafo,
        'historico_saude': historico_saude,
        'analise_categorias': analise_categorias,
        'categorias_empilhadas': {
            'labels': labels_meses,
            'datasets': datasets_cats
        },
        'eventos': eventos
    })
# ─────────────────────────────────────────────
# UTILITÁRIOS
# ─────────────────────────────────────────────
@api.route('/agenda/<int:id>/cancelar-recorrencia', methods=['DELETE'])
@verificar_token
def cancelar_recorrencia(id):
    """Cancela todas as ocorrências futuras de uma recorrência."""
    agendamento = Agendamento.query.filter_by(id=id, usuario_id=request.usuario_id).first()
    if not agendamento:
        return jsonify({'erro': 'Agendamento nao encontrado'}), 404

    # Remove todas as ocorrências futuras com mesma descrição, valor e frequência
    hoje = date.today()
    Agendamento.query.filter(
    Agendamento.usuario_id == request.usuario_id,
    Agendamento.descricao == agendamento.descricao,
    Agendamento.valor == agendamento.valor,
    Agendamento.frequencia == agendamento.frequencia,
    Agendamento.tipo == agendamento.tipo,
    Agendamento.data_vencimento > agendamento.data_vencimento,
    Agendamento.status == 'a_vencer'
).delete()
    db.session.commit()

    return jsonify({'mensagem': 'Recorrencia cancelada. Historico mantido.'})

def calcular_proxima_data(data_atual, frequencia):
    frequencia = frequencia.lower()
    if frequencia == 'semanal':
        return data_atual + timedelta(weeks=1)
    elif frequencia == 'quinzenal':
        return data_atual + timedelta(weeks=2)
    elif frequencia == 'mensal':
        mes = data_atual.month + 1
        ano = data_atual.year
        if mes > 12:
            mes = 1
            ano += 1
        import calendar
        ultimo_dia = calendar.monthrange(ano, mes)[1]
        dia = min(data_atual.day, ultimo_dia)
        return date(ano, mes, dia)
    elif frequencia == 'anual':
        return date(data_atual.year + 1, data_atual.month, data_atual.day)
    else:
        return data_atual + timedelta(days=30)