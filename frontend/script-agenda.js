const API_URL = 'http://localhost:5000';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'login.html';

const mesesNomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const diasNomes = ['D','S','T','Q','Q','S','S'];

let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();
let agendamentos = [];

// ───────────────────────────────
// CARREGAR DADOS
// ───────────────────────────────
async function carregarAgenda() {
    try {
        const res = await fetch(`${API_URL}/api/agenda?mes=${mesAtual + 1}&ano=${anoAtual}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.status === 401) { localStorage.removeItem('token'); window.location.href = 'login.html'; return; }
        agendamentos = await res.json();
        renderizarCalendario(agendamentos);
        renderizarListas();
        verificarAlertas();
    } catch (err) {
        console.error('Erro ao carregar agenda:', err);
    }
}

async function verificarAlertas() {
    try {
        const res = await fetch(`${API_URL}/api/agenda/alertas`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        const vencidasDespesa = data.alertas.filter(a => a.status === 'vencido' && a.tipo !== 'receita').length;
        const proximasDespesa = data.alertas.filter(a => a.status === 'proximo' && a.tipo !== 'receita').length;
        const proximasReceita = data.alertas.filter(a => a.status === 'proximo' && a.tipo === 'receita').length;

        const bannerDespesa = document.getElementById('banner-despesa');
        const bannerReceita = document.getElementById('banner-receita');

        if (vencidasDespesa > 0 || proximasDespesa > 0) {
            let msgDespesa = '';
            if (vencidasDespesa > 0) msgDespesa += `${vencidasDespesa} conta(s) vencida(s). `;
            if (proximasDespesa > 0) msgDespesa += `${proximasDespesa} conta(s) vencem nos próximos 3 dias.`;
            document.getElementById('banner-texto-despesa').textContent = msgDespesa;
            bannerDespesa.style.display = 'flex';
        } else {
            bannerDespesa.style.display = 'none';
        }

        if (proximasReceita > 0) {
            document.getElementById('banner-texto-receita').textContent = `${proximasReceita} receita(s) a receber nos próximos 3 dias.`;
            bannerReceita.style.display = 'flex';
        } else {
            bannerReceita.style.display = 'none';
        }

    } catch (err) { console.error(err); }
}

// ───────────────────────────────
// CALENDÁRIO
// ───────────────────────────────
function renderizarCalendario(listaAgendamentos) {
    document.getElementById('titulo-mes').textContent =
        mesesNomes[mesAtual] + ' De ' + anoAtual;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    // Cabeçalho com nomes dos dias
    diasNomes.forEach(d => {
        const el = document.createElement('div');
        el.className = 'calendar-day-name';
        el.textContent = d;
        grid.appendChild(el);
    });

    const primeiroDia = new Date(anoAtual, mesAtual, 1).getDay();
    const totalDias = new Date(anoAtual, mesAtual + 1, 0).getDate();
    const hoje = new Date();

    // Mapeia dias com agendamentos
    const diasComAgendamento = {};
    (listaAgendamentos || agendamentos).forEach(a => {
        const dia = parseInt(a.data_vencimento.split('-')[2], 10);
        if (!diasComAgendamento[dia]) diasComAgendamento[dia] = [];
        diasComAgendamento[dia].push({ status: a.status, tipo: a.tipo });
    });
    // Células vazias antes do dia 1
    for (let i = 0; i < primeiroDia; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day vazio';
        grid.appendChild(el);
    }

    // Dias do mês
    for (let dia = 1; dia <= totalDias; dia++) {
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = dia;

        const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
        if (ehHoje) el.classList.add('today');

        console.log('Dia:', dia, 'diasComAgendamento:', diasComAgendamento[dia]);

    if (diasComAgendamento[dia]) {
    const itens = diasComAgendamento[dia];
    const temReceita = itens.some(i => i.tipo === 'receita');
    const temDespesa = itens.some(i => i.tipo !== 'receita');
    const statusList = itens.map(i => i.status);
    const receitaPaga = itens.some(i => i.tipo === 'receita' && i.status === 'pago');
    const despesaPaga = itens.some(i => i.tipo !== 'receita' && i.status === 'pago');

    if (temDespesa && statusList.includes('vencido')) el.classList.add('vencido');
    else if (temDespesa && (statusList.includes('proximo') || statusList.includes('a_vencer'))) {
        const hoje2 = new Date();
        hoje2.setHours(0,0,0,0);
        const dataCalendario = new Date(anoAtual, mesAtual, dia);
        const diffD = Math.round((dataCalendario - hoje2) / (1000 * 60 * 60 * 24));
        el.classList.add(diffD <= 3 ? 'proximo' : 'proximo-fraco');
    }
    else if (receitaPaga) el.classList.add('pago');
    else if (despesaPaga) el.classList.add('pago');
    else if (temReceita) el.classList.add('receita');
}

        grid.appendChild(el);
    }
}

// ───────────────────────────────
// LISTAS DE CONTAS
// ───────────────────────────────
function renderizarListas() {
    const vencidos = agendamentos.filter(a => a.status === 'vencido' && a.tipo !== 'receita');
    const proximos = agendamentos.filter(a => (a.status === 'proximo' || a.status === 'a_vencer') && a.tipo !== 'receita');
    const aReceita = agendamentos.filter(a => a.tipo === 'receita' && a.status !== 'pago');
    const pagos = agendamentos.filter(a => a.status === 'pago');

    const hoje = new Date();
    const diffMeses = (mesAtual - hoje.getMonth()) + (anoAtual - hoje.getFullYear()) * 12;

    let tituloProximo = 'A Vencer';
    if (diffMeses === 1) tituloProximo = 'Próximo Mês';
    else if (diffMeses === 2) tituloProximo = 'Daqui 2 Meses';
    else if (diffMeses === 3) tituloProximo = 'Daqui 3 Meses';
    else if (diffMeses > 3) tituloProximo = `Daqui ${diffMeses} Meses`;

    document.querySelector('#lista-proximo .lista-titulo').innerHTML = `
        <span class="lista-dot" style="background:#f39c12;"></span> ${tituloProximo}
    `;

    renderizarGrupo('lista-vencido', 'contas-vencido', vencidos, true);
    renderizarGrupo('lista-proximo', 'contas-proximo', proximos, true);
    renderizarGrupo('lista-receita', 'contas-receita', aReceita, true);
    renderizarGrupo('lista-pago', 'contas-pago', pagos, false);

    const total = vencidos.length + proximos.length + aReceita.length + pagos.length;
    document.getElementById('lista-vazia').style.display = total === 0 ? 'block' : 'none';
}

function renderizarGrupo(secaoId, containerId, lista, mostrarBtnPagar) {
    const secao = document.getElementById(secaoId);
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (lista.length === 0) {
        secao.style.display = 'none';
        return;
    }

    secao.style.display = 'block';
    lista.forEach(a => {
        const dataParts = a.data_vencimento.split('-');
        const dataFormatada = `${dataParts[2]}/${dataParts[1]}/${dataParts[0]}`;
        const recorrenteLabel = a.recorrente ? `<i class="fas fa-sync-alt" style="font-size:11px;color:#999;margin-right:4px;" title="Recorrente: ${a.frequencia}"></i>` : '';

        const div = document.createElement('div');
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const venc = new Date(a.data_vencimento + 'T00:00:00');
        const diffDias = Math.round((venc - hoje) / (1000 * 60 * 60 * 24));

        let classeCard = '';
        if (a.status === 'pago') classeCard = a.tipo === 'receita' ? 'pago-receita' : 'pago-despesa';
         else if (a.status === 'vencido') classeCard = 'vencido-card';
         else if (a.tipo === 'receita' && diffDias <= 3) classeCard = 'receita-urgente';
         else if (a.tipo === 'receita') classeCard = 'receita-fraca';
         else if (diffDias <= 3) classeCard = 'proximo-urgente';
         else classeCard = 'proximo-fraco';

div.className = ['conta-card', a.tipo === 'receita' ? 'receita' : '', classeCard].filter(Boolean).join(' ');
        div.innerHTML = `
            <div class="conta-info">
                <i class="fas fa-sync-alt conta-icone"></i>
                <div>
                    <div class="conta-desc">${a.descricao}</div>
                    <div class="conta-meta">${recorrenteLabel}${a.categoria || 'Despesa'} • ${dataFormatada}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="conta-valor ${a.tipo === 'receita' ? 'receita' : ''}">
    ${a.tipo === 'receita' ? '+' : '-'} R$ ${parseFloat(a.valor).toFixed(2).replace('.', ',')}
</span>
                <div class="conta-acoes">
                    ${mostrarBtnPagar ? `<button class="btn-pagar" onclick="marcarPago(${a.id})">${a.tipo === 'receita' ? 'Recebido' : 'Pago'}</button>` : ''}
${a.recorrente ? `<button class="btn-cancelar-rec" onclick="cancelarRecorrencia(${a.id})" title="Cancelar recorrência"><i class="fas fa-ban"></i></button>` : ''}
<button class="btn-deletar" onclick="deletarAgendamento(${a.id})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// ───────────────────────────────
// AÇÕES
// ───────────────────────────────
async function marcarPago(id) {
    try {
        await fetch(`${API_URL}/api/agenda/${id}/pagar`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        carregarAgenda();
    } catch (err) { alert('Erro ao marcar como pago.'); }
}

async function deletarAgendamento(id) {
    if (!confirm('Remover este agendamento?')) return;
    try {
        await fetch(`${API_URL}/api/agenda/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        carregarAgenda();
    } catch (err) { alert('Erro ao remover agendamento.'); }
}

// ───────────────────────────────
// NAVEGAÇÃO ENTRE MESES
// ───────────────────────────────
document.getElementById('btn-mes-anterior').addEventListener('click', () => {
    mesAtual--;
    if (mesAtual < 0) { mesAtual = 11; anoAtual--; }
    carregarAgenda();
});

document.getElementById('btn-mes-proximo').addEventListener('click', () => {
    mesAtual++;
    if (mesAtual > 11) { mesAtual = 0; anoAtual++; }
    carregarAgenda();
});

// Logout
document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
});

// Iniciar
carregarAgenda();

async function cancelarRecorrencia(id) {
    if (!confirm('Cancelar as próximas ocorrências desta recorrência? O histórico será mantido.')) return;
    try {
        await fetch(`${API_URL}/api/agenda/${id}/cancelar-recorrencia`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        carregarAgenda();
    } catch (err) { alert('Erro ao cancelar recorrência.'); }
}