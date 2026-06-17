document.addEventListener('DOMContentLoaded', function () {
    console.log('SCRIPT DASHBOARD CARREGADO');

    // =========================================================
    // 1. VERIFICAÇÃO DE TOKEN
    // =========================================================
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }

    // =========================================================
    // 2. VARIÁVEIS GLOBAIS
    // =========================================================
    let donutChartInstance   = null;
    let barChartInstance     = null;
    let tipoSelecionado      = 'receita';
    let categoriaSelecionada = '';

    // =========================================================
    // 3. SISTEMA DE CATEGORIAS E SUBCATEGORIAS
    // (único — remove os dois sistemas antigos conflitantes)
    // =========================================================
const CATEGORIAS = {

    receita: {

        'Salário': [
            'Salário Mensal',
            '13° Salário',
            'Bônus'
        ],

        'Freelancer / Extra': [
            'Freelance',
            'Consultoria',
            'Projeto'
        ],

        'Vendas': [],

        'Investimentos': [
            'Dividendos',
            'Juros',
            'Rendimentos'
        ],

        'Outros': []
    },

    despesa: {

        'Despesas Fixas': [
            'Aluguel/Condomínio',
            'Água',
            'Luz',
            'Internet',
            'Telefone',
            'Plano de Saúde',
            'Streaming'
        ],

        'Despesas Variáveis': [
            'Restaurante/Delivery',
            'Supermercado',
            'Vestuário',
            'Viagens',
            'Lazer',
            'Saúde/Farmácia'
        ],

        'Transporte': [
            'Combustível',
            'Uber/Táxi',
            'Transporte Público',
            'Manutenção'
        ],

        'Investimentos/Reserva': [
            'CDB',
            'Tesouro Direto',
            'LCI/LCA',
            'Ações/FIIs',
            'Previdência',
            'Criptomoedas',
            'Reserva de Emergência'
        ],

        'Apostas': [],

        'Outros': []
    }
};

    function renderizarCategorias(tipo) {
        const grid              = document.getElementById('grid-categoria');
        const selectSubcat      = document.getElementById('select-subcategoria');
        const grupoSubcat =
    document.getElementById(
        'grupo-subcategoria'
    );
        const inputSubcatCustom = document.getElementById('input-subcategoria-personalizada');

        const categorias = Object.keys(CATEGORIAS[tipo]);
        grid.innerHTML = categorias.map(c =>
            `<button class="categoria-btn" data-categoria="${c}">${c}</button>`
        ).join('');

        categoriaSelecionada    = '';
        selectSubcat.innerHTML  = '<option value="">Selecione...</option>';
        if (inputSubcatCustom) inputSubcatCustom.value = '';

        grid.querySelectorAll('.categoria-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                grid.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                categoriaSelecionada = this.dataset.categoria;

                const subcategorias = CATEGORIAS[tipo][categoriaSelecionada] || [];
                selectSubcat.innerHTML = '<option value="">Selecione...</option>';
                grupoSubcat.style.display =
    'none';
    if (subcategorias.length > 0) {

    grupoSubcat.style.display =
        'block';

}
                subcategorias.forEach(sub => {
                    selectSubcat.innerHTML += `<option value="${sub}">${sub}</option>`;
                });
            });
        });
    }

    // =========================================================
    // 4. CARREGAR DASHBOARD
    // =========================================================
    async function carregarDashboard() {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard', {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/frontend/login.html';
                return;
            }

            const data = await res.json();

            // Cabeçalho
            document.getElementById('user-name').textContent        = data.nome;
            document.getElementById('current-date').textContent     = data.data_formatada;
            document.querySelector('.avatar').textContent           = data.avatar;

            // Cards
            document.querySelector('.card.receitas .value').textContent =
                'R$ ' + data.totais.receitas.toFixed(2).replace('.', ',');
            document.querySelector('.card.despesas .value').textContent =
                'R$ ' + data.totais.despesas.toFixed(2).replace('.', ',');
            document.querySelector('.card.saldo .value').textContent =
                'R$ ' + data.totais.saldo.toFixed(2).replace('.', ',');

        // Saúde financeira nova

           atualizarBarraSaude(
           data.totais.receitas,
           data.totais.despesas
           );

            // Tabela de transações recentes (5 últimas)
            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';
            if (!data.ultimas_transacoes || data.ultimas_transacoes.length === 0) {
                tbody.innerHTML =
                    '<tr class="empty-row"><td colspan="5">Nenhuma transação encontrada</td></tr>';
            } else {
                data.ultimas_transacoes.forEach(t => {
                    const row          = document.createElement('tr');
                    const valorNum     = parseFloat(t.valor);
                    const valorFmt     = 'R$ ' + valorNum.toFixed(2).replace('.', ',');
                    const isReceita    = t.tipo === 'receita';
                    const statusClass  = isReceita ? 'status-receita' : 'status-despesa';
                    const statusLabel  = isReceita ? 'Receita' : 'Despesa';
                    const sinalValor   = isReceita ? '+' : '-';
                    const corValor     = isReceita ? '#279975' : '#e74c3c';
                    const dataFmt      = t.data ? t.data.split('-').reverse().join('/') : '';

                    row.innerHTML = `
                        <td>${dataFmt}</td>
                        <td>

<div class="categoria-com-icone">

    <div class="categoria-icone ${isReceita ? 'receita' : 'despesa'}">

        <i class="fas ${obterIcone(t.categoria)}"></i>

    </div>

    <span>${t.categoria || '-'}</span>

</div>

</td>
                        <td>${
                            t.descricao &&
                            t.descricao !== 'Sem descrição'
                            ? t.descricao
                            : (t.subcategoria || '-')
}</td>
                        <td style="color:${corValor}; font-weight:600;">
                            ${sinalValor} ${valorFmt}
                        </td>
                        <td><span class="${statusClass}">${statusLabel}</span></td>
                    `;
                    tbody.appendChild(row);
                });
            }

            // Recarrega gráficos e histórico
            await carregarGraficos();
            await carregarHistorico();
            await carregarNotificacoes();

        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        }
    }


    // =========================================================
    // 5. CARREGAR GRÁFICOS
    // =========================================================
    async function carregarGraficos() {
        try {
            // Destrói instâncias anteriores (evita "Canvas already in use")
            if (donutChartInstance) { donutChartInstance.destroy(); donutChartInstance = null; }
            if (barChartInstance)   { barChartInstance.destroy();   barChartInstance   = null; }

            // --- Gráfico donut ---
            const donutRes  = await fetch('http://localhost:5000/api/graficos/donut',
                { headers: { 'Authorization': 'Bearer ' + token } });
            const donutData = await donutRes.json();

            if (donutData.labels && donutData.labels.length > 0) {
                donutChartInstance = new Chart(document.getElementById('donutChart'), {
                    type: 'doughnut',
                    data: {
                        labels: donutData.labels,
                        datasets: [{
                            data: donutData.data,
                            backgroundColor: ['#3498db','#9b59b6','#f39c12','#1abc9c','#34495e','#e67e22','#7f8c8d','#16a085']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

            // --- Gráfico de barras ---
            const barRes  = await fetch('http://localhost:5000/api/graficos/barras',
                { headers: { 'Authorization': 'Bearer ' + token } });
            const barData = await barRes.json();

            if (barData.labels && barData.labels.length > 0) {
                barChartInstance = new Chart(document.getElementById('barChart'), {
                    type: 'bar',
                    data: {
                        labels: barData.labels,
                        datasets: [
                            { label: 'Receitas',       data: barData.receitas,       backgroundColor: '#279975' },
                            { label: 'Gastos',         data: barData.gastos,         backgroundColor: '#e74c3c' },
                            { label: 'Investimentos',  data: barData.investimentos,  backgroundColor: '#7F77DD' },
                            { label: 'Apostas',        data: barData.apostas,        backgroundColor: '#EF4444' }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        scales: { y: { beginAtZero: true } },
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

        } catch (err) {
            console.error('Erro ao carregar gráficos:', err);
        }
    }

    // =========================================================
    // 6. CARREGAR HISTÓRICO
    // =========================================================
function obterIcone(categoria) {

    const icones = {

        'Despesas Fixas': '🏠',
        'Despesas Variáveis': '🛍️',
        'Transporte': '🚗',
        'Investimentos/Reservas': '💲',
        'Apostas': '🎲',
        'Outros': '😊',

        'Salário': '💲',
        'Freelance/Bico': '💲',
        'Rendimentos de Investimentos': '💲',
        'Vendas': '💲'

    };

    return icones[categoria] || '💲';
}
    async function carregarHistorico() {
        try {
            const res        = await fetch('http://localhost:5000/api/transacoes',
                { headers: { 'Authorization': 'Bearer ' + token } });
            const transacoes = await res.json();
            const dataInicio =
    document.getElementById('filtro-data-inicio')?.value;

const dataFim =
    document.getElementById('filtro-data-fim')?.value;

const transacoesFiltradas =
    transacoes.filter(t => {

        if (dataInicio && t.data < dataInicio)
            return false;

        if (dataFim && t.data > dataFim)
            return false;

        return true;
    });
            const lista      = document.getElementById('historico-lista');
            lista.innerHTML  = '';

            if (!transacoesFiltradas || !transacoesFiltradas.length) {
                lista.innerHTML = '<p style="color:#888; padding:20px;">Nenhuma transação encontrada.</p>';
                return;
            }

            // Agrupa por data (mais recente primeiro)
            const agrupado = {};
            transacoesFiltradas.forEach(t => {
                const d = t.data || 'Sem data';
                if (!agrupado[d]) agrupado[d] = [];
                agrupado[d].push(t);
            });

            const datasOrdenadas = Object.keys(agrupado).sort((a, b) => b.localeCompare(a));

            datasOrdenadas.forEach(data => {
                const dataObj = new Date(data + 'T00:00:00');

            const dataPorExtenso =
            dataObj.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
            });
const grupo = document.createElement('div');

grupo.className = 'historico-bloco';

const tituloData = document.createElement('div');

tituloData.className = 'historico-data';

tituloData.textContent = dataPorExtenso;

const card = document.createElement('div');

card.className = 'historico-card';

grupo.appendChild(tituloData);

grupo.appendChild(card);
agrupado[data].sort((a, b) => {

    if (a.tipo === 'receita' && b.tipo !== 'receita')
        return 1;

    if (a.tipo !== 'receita' && b.tipo === 'receita')
        return -1;

    return 0;
});
                agrupado[data].forEach(t => {

                    console.log(t);
                    console.log('TRANSAÇÃO:', t);
                    console.log('TIPO:', t.tipo);

                 const isReceita =
                     String(t.tipo).toLowerCase() === 'receita';
                    const valorFmt  = 'R$ ' + Math.abs(parseFloat(t.valor)).toFixed(2).replace('.', ',');
                    const sinal     = isReceita ? '+' : '-';

                    const item = document.createElement('div');
                    item.className = 'historico-item';
                    item.dataset.categoria = t.categoria || '';
const titulo =
    t.descricao &&
    t.descricao !== 'Sem descrição'
        ? t.descricao
        : (t.subcategoria || t.categoria || 'Sem descrição');

item.innerHTML = `

<div class="historico-icon ${isReceita ? 'receita' : 'despesa'}">
    <i class="fas ${obterIcone(t.categoria)}"></i>
</div>

<div class="historico-info">

    <div class="historico-titulo">
        ${titulo}
    </div>

    <div class="historico-categoria">
        ${t.categoria || ''}
        ${t.subcategoria ? ' • ' + t.subcategoria : ''}
    </div>

</div>

<div class="historico-direita">

    <span class="historico-valor ${isReceita ? 'receita' : 'despesa'}">
        ${sinal} ${valorFmt}
    </span>

    <div class="historico-botoes">

        <button class="btn-editar-tx"
                data-id="${t.id}">
            ✏️
        </button>

        <button class="btn-excluir-tx"
                data-id="${t.id}">
            🗑️
        </button>

    </div>

</div>
`;
                    card.appendChild(item);
                });

                lista.appendChild(grupo);
            });

            // Eventos de editar e excluir
            lista.querySelectorAll('.btn-excluir-tx').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.dataset.id;
                    abrirModalConfirmacao(
                        'Excluir transação',
                        'Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.',
                        async () => {
                            await excluirTransacao(id);
                        }
                    );
                });
            });

            lista.querySelectorAll('.btn-editar-tx').forEach(btn => {
                btn.addEventListener('click', async function () {
                    const id = this.dataset.id;
                    await abrirModalEdicao(id);
                });
            });

        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        }
    }

    // =========================================================
    // 7. CARREGAR PERFIL
    // =========================================================
    async function carregarPerfil() {
        try {
            const res     = await fetch('http://localhost:5000/api/usuario',
                { headers: { 'Authorization': 'Bearer ' + token } });
            const usuario = await res.json();

            const avatarEl = document.querySelector('.perfil-avatar');
            const nomeEl   = document.querySelector('.perfil-nome');
            const campos   = document.querySelectorAll('.perfil-campo p');

            if (avatarEl)  avatarEl.textContent  = (usuario.nome  || '?')[0].toUpperCase();
            if (nomeEl)    nomeEl.textContent     = usuario.nome   || '';
            if (campos[0]) campos[0].textContent  = usuario.email  || '';
            if (campos[1]) campos[1].textContent  = usuario.telefone || 'Não informado';

        } catch (err) {
            console.error('Erro ao carregar perfil:', err);
        }
    }

    async function carregarRelatorio() {
    const hoje = new Date();
    const selMes = document.getElementById('rel-mes');
    const inpAno = document.getElementById('rel-ano');
    if (selMes && !selMes.dataset.preenchido) { selMes.value = hoje.getMonth() + 1; selMes.dataset.preenchido = '1'; }
    if (inpAno && !inpAno.dataset.preenchido) { inpAno.value = hoje.getFullYear(); inpAno.dataset.preenchido = '1'; }
    const conteudo = document.getElementById('relatorio-conteudo');
    if (!conteudo) return;
    conteudo.innerHTML = '<div style="color:#aaa;padding:40px;text-align:center;">Carregando relatório...</div>';

    const periodo = document.getElementById('rel-periodo').value;
    const mes     = document.getElementById('rel-mes').value;
    const ano     = document.getElementById('rel-ano').value;

    try {
        const res  = await fetch(`http://localhost:5000/api/relatorio?periodo=${periodo}&mes=${mes}&ano=${ano}`,
            { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();

        const fmtVal = v => 'R$ ' + parseFloat(v).toFixed(2).replace('.', ',');

        // Cor da saúde
        const corSaude = data.saude >= 70 ? '#279975' : data.saude >= 40 ? '#f57f17' : '#c62828';
        const textoSaude = data.saude >= 70 ? 'SAUDÁVEL' : data.saude >= 40 ? 'ATENÇÃO' : 'CRÍTICO';

        // Cores para gráfico empilhado
        const paleta = ['#279975','#f57f17','#c62828','#1565c0','#6a1b9a','#2e7d32','#ad1457','#00838f','#e65100','#4e342e'];

        conteudo.innerHTML = `

          <!-- RESUMO EXECUTIVO -->
          <div style="background:#fff;border-radius:16px;padding:28px;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:24px;">
            <h3 style="font-size:16px;font-weight:700;color:#333;margin-bottom:20px;">
              <i class="fas fa-chart-pie" style="color:#279975;margin-right:8px;"></i>Resumo Executivo
            </h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:20px;">
              <div style="background:#f0faf4;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:#555;margin-bottom:6px;">Saúde Financeira</div>
                <div style="font-size:28px;font-weight:800;color:${corSaude};">${data.saude}</div>
                <div style="font-size:11px;font-weight:700;color:${corSaude};">${textoSaude}</div>
              </div>
              <div style="background:#e8f5e9;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:#555;margin-bottom:6px;">Receitas</div>
                <div style="font-size:20px;font-weight:700;color:#2e7d32;">${fmtVal(data.totais.receitas)}</div>
              </div>
              <div style="background:#ffebee;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:#555;margin-bottom:6px;">Despesas</div>
                <div style="font-size:20px;font-weight:700;color:#c62828;">${fmtVal(data.totais.despesas)}</div>
              </div>
              <div style="background:#f3f4f6;border-radius:12px;padding:16px;text-align:center;">
                <div style="font-size:12px;color:#555;margin-bottom:6px;">Saldo</div>
                <div style="font-size:20px;font-weight:700;color:${data.totais.saldo >= 0 ? '#2e7d32' : '#c62828'};">${fmtVal(data.totais.saldo)}</div>
              </div>
            </div>
            <div style="background:#f9f9f9;border-radius:10px;padding:16px;font-size:14px;color:#444;line-height:1.7;">
              <i class="fas fa-robot" style="color:#279975;margin-right:6px;"></i>
              ${data.paragrafo}
            </div>
          </div>

          <!-- GRÁFICOS LINHA E DONUT -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px;">
            <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
              <h3 style="font-size:15px;font-weight:700;color:#333;margin-bottom:16px;">
                <i class="fas fa-heart-pulse" style="color:#279975;margin-right:8px;"></i>Evolução da Saúde
              </h3>
              <canvas id="grafico-linha-saude" height="200"></canvas>
            </div>
            <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
              <h3 style="font-size:15px;font-weight:700;color:#333;margin-bottom:16px;">
                <i class="fas fa-circle-nodes" style="color:#279975;margin-right:8px;"></i>Gastos por Categoria
              </h3>
              <canvas id="grafico-donut-rel" height="200"></canvas>
            </div>
          </div>

          <!-- GRÁFICO BARRAS EMPILHADAS -->
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:24px;">
            <h3 style="font-size:15px;font-weight:700;color:#333;margin-bottom:16px;">
              <i class="fas fa-chart-bar" style="color:#279975;margin-right:8px;"></i>Categorias Mês a Mês
            </h3>
            <canvas id="grafico-empilhado" height="120"></canvas>
          </div>

          <!-- ANÁLISE POR CATEGORIA -->
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:24px;">
            <h3 style="font-size:15px;font-weight:700;color:#333;margin-bottom:20px;">
              <i class="fas fa-magnifying-glass-chart" style="color:#279975;margin-right:8px;"></i>Análise por Categoria
            </h3>
            <div id="rel-categorias"></div>
          </div>

          <!-- EVENTOS RELEVANTES -->
          <div style="background:#fff;border-radius:16px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,0.07);margin-bottom:24px;">
            <h3 style="font-size:15px;font-weight:700;color:#333;margin-bottom:20px;">
              <i class="fas fa-timeline" style="color:#279975;margin-right:8px;"></i>Eventos Relevantes
            </h3>
            <div id="rel-eventos"></div>
          </div>
        `;

        // ── Gráfico linha saúde ──────────────────────────────
        const ctxLinha = document.getElementById('grafico-linha-saude').getContext('2d');
        new Chart(ctxLinha, {
            type: 'line',
            data: {
                labels: data.historico_saude.map(h => h.label),
                datasets: [{
                    label: 'Saúde Financeira',
                    data: data.historico_saude.map(h => h.saude),
                    borderColor: '#279975',
                    backgroundColor: 'rgba(39,153,117,0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#279975',
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // ── Gráfico donut categorias ──────────────────────────
        const cats    = data.analise_categorias.map(c => c.categoria);
        const totais  = data.analise_categorias.map(c => c.total);
        const ctxDonut = document.getElementById('grafico-donut-rel').getContext('2d');
        new Chart(ctxDonut, {
            type: 'doughnut',
            data: {
                labels: cats,
                datasets: [{ data: totais, backgroundColor: paleta.slice(0, cats.length), borderWidth: 2 }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
            }
        });

        // ── Gráfico barras empilhadas ─────────────────────────
        const empilhado = data.categorias_empilhadas;
        const dsEmpilhado = Object.entries(empilhado.datasets).map(([nome, valores], i) => ({
            label: nome,
            data: valores,
            backgroundColor: paleta[i % paleta.length]
        }));
        const ctxEmp = document.getElementById('grafico-empilhado').getContext('2d');
        new Chart(ctxEmp, {
            type: 'bar',
            data: { labels: empilhado.labels, datasets: dsEmpilhado },
            options: {
                responsive: true,
                scales: {
                    x: { stacked: true },
                    y: { stacked: true, ticks: { callback: v => 'R$' + v } }
                },
                plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } }
            }
        });

        // ── Análise por categoria ─────────────────────────────
        const divCats = document.getElementById('rel-categorias');
        if (data.analise_categorias.length === 0) {
            divCats.innerHTML = '<div style="color:#aaa;font-size:14px;">Nenhuma despesa no período.</div>';
        } else {
            data.analise_categorias.forEach(c => {
                const cor   = c.status === 'acima' ? '#c62828' : c.status === 'abaixo' ? '#2e7d32' : '#555';
                const bg    = c.status === 'acima' ? '#ffebee' : c.status === 'abaixo' ? '#e8f5e9' : '#f9f9f9';
                const icone = c.status === 'acima' ? 'fa-arrow-trend-up' : c.status === 'abaixo' ? 'fa-arrow-trend-down' : 'fa-minus';
                const desvioTexto = c.desvio !== null
                    ? (c.desvio > 0 ? `+${c.desvio}% acima da média` : `${c.desvio}% abaixo da média`)
                    : 'Sem histórico para comparar';
                const frase = c.status === 'acima'
                    ? `Você gastou ${c.desvio}% a mais que o habitual em ${c.categoria}. Média histórica: ${fmtVal(c.media)}.`
                    : c.status === 'abaixo'
                    ? `Ótimo! Você economizou em ${c.categoria} ficando ${Math.abs(c.desvio)}% abaixo da média de ${fmtVal(c.media)}.`
                    : `Gasto dentro do padrão habitual.`;

                divCats.innerHTML += `
                  <div style="background:${bg};border-radius:12px;padding:16px 20px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
                    <div style="display:flex;align-items:center;gap:12px;">
                      <i class="fas ${icone}" style="color:${cor};font-size:18px;"></i>
                      <div>
                        <div style="font-size:14px;font-weight:700;color:#333;">${c.categoria}</div>
                        <div style="font-size:12px;color:#666;margin-top:3px;">${frase}</div>
                      </div>
                    </div>
                    <div style="text-align:right;flex-shrink:0;">
                      <div style="font-size:16px;font-weight:700;color:${cor};">${fmtVal(c.total)}</div>
                      <div style="font-size:11px;color:#888;margin-top:2px;">${desvioTexto}</div>
                    </div>
                  </div>
                `;
            });
        }

        // ── Eventos relevantes ────────────────────────────────
        const divEventos = document.getElementById('rel-eventos');
        if (data.eventos.length === 0) {
            divEventos.innerHTML = '<div style="color:#aaa;font-size:14px;">Nenhum evento relevante no período.</div>';
        } else {
            data.eventos.forEach(e => {
                const cor   = e.impacto === 'positivo' ? '#2e7d32' : '#c62828';
                const bg    = e.impacto === 'positivo' ? '#e8f5e9'  : '#ffebee';
                const icone = e.tipo === 'receita' ? 'fa-circle-arrow-up'
                            : e.tipo === 'acima_media' ? 'fa-triangle-exclamation'
                            : 'fa-circle-arrow-down';
                const desvioTag = e.desvio ? `<span style="background:${cor};color:#fff;font-size:10px;padding:2px 7px;border-radius:20px;margin-left:8px;">+${e.desvio}%</span>` : '';

                divEventos.innerHTML += `
                  <div style="background:${bg};border-radius:12px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;gap:14px;">
                    <i class="fas ${icone}" style="color:${cor};font-size:20px;flex-shrink:0;"></i>
                    <div style="flex:1;">
                      <div style="font-size:14px;font-weight:600;color:#333;">${e.descricao}${desvioTag}</div>
                      <div style="font-size:12px;color:#777;margin-top:3px;">${e.categoria} • ${e.data}</div>
                    </div>
                    <div style="font-size:15px;font-weight:700;color:${cor};flex-shrink:0;">${fmtVal(e.valor)}</div>
                  </div>
                `;
            });
        }

        // ── Exportar PDF ──────────────────────────────────────
        document.getElementById('btn-exportar-pdf').onclick = () => exportarRelatorioPDF(data, periodo, mes, ano);

    } catch (err) {
        console.error('Erro ao carregar relatório:', err);
        conteudo.innerHTML = '<div style="color:#e74c3c;padding:40px;text-align:center;">Erro ao carregar relatório.</div>';
    }
}

function exportarRelatorioPDF(data, periodo, mes, ano) {
    const mesesNomes = {1:'Janeiro',2:'Fevereiro',3:'Março',4:'Abril',5:'Maio',6:'Junho',
                        7:'Julho',8:'Agosto',9:'Setembro',10:'Outubro',11:'Novembro',12:'Dezembro'};
    const fmtVal = v => 'R$ ' + parseFloat(v).toFixed(2).replace('.', ',');
    const corSaude = data.saude >= 70 ? '#279975' : data.saude >= 40 ? '#f57f17' : '#c62828';
    const textoSaude = data.saude >= 70 ? 'SAUDÁVEL' : data.saude >= 40 ? 'ATENÇÃO' : 'CRÍTICO';
    const titulo = periodo === 'anual' ? `Relatório Anual — ${ano}` : `Relatório de ${mesesNomes[mes]} de ${ano}`;

    const catsHTML = data.analise_categorias.map(c => {
        const cor = c.status === 'acima' ? '#c62828' : c.status === 'abaixo' ? '#2e7d32' : '#555';
        const desvio = c.desvio !== null ? (c.desvio > 0 ? `+${c.desvio}%` : `${c.desvio}%`) : '—';
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${c.categoria}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${fmtVal(c.total)}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">${c.media > 0 ? fmtVal(c.media) : '—'}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:${cor};font-weight:600;">${desvio}</td>
          </tr>`;
    }).join('');

    const eventosHTML = data.eventos.map(e => {
        const cor = e.impacto === 'positivo' ? '#2e7d32' : '#c62828';
        return `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${e.descricao}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${e.categoria}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;">${e.data}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;color:${cor};font-weight:600;">${fmtVal(e.valor)}</td>
          </tr>`;
    }).join('');

    const htmlPDF = `
      <!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="UTF-8">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Segoe UI',sans-serif; color:#333; padding:40px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; border-bottom:3px solid #279975; padding-bottom:20px; }
        .logo { font-size:28px; font-weight:800; color:#279975; }
        .logo span { display:block; font-size:12px; color:#999; font-weight:400; }
        .titulo { font-size:20px; font-weight:700; color:#333; text-align:right; }
        .cards { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:28px; }
        .card { border-radius:12px; padding:16px; text-align:center; }
        .card .label { font-size:11px; color:#666; margin-bottom:6px; }
        .card .valor { font-size:20px; font-weight:800; }
        .secao { margin-bottom:28px; }
        .secao h2 { font-size:15px; font-weight:700; color:#333; margin-bottom:14px; padding-bottom:6px; border-bottom:2px solid #f0f0f0; }
        .paragrafo { background:#f9f9f9; border-left:4px solid #279975; border-radius:6px; padding:14px 16px; font-size:13px; color:#444; line-height:1.7; margin-bottom:28px; }
        table { width:100%; border-collapse:collapse; font-size:13px; }
        th { background:#f5f5f5; padding:10px 12px; text-align:left; font-weight:600; color:#555; }
        th:last-child, td:last-child { text-align:right; }
        .rodape { margin-top:40px; text-align:center; font-size:11px; color:#aaa; border-top:1px solid #eee; padding-top:16px; }
      </style>
      </head><body>
        <div class="header">
          <div class="logo">FinWise<span>Finanças inteligentes</span></div>
          <div class="titulo">${titulo}<br><span style="font-size:13px;color:#999;font-weight:400;">Gerado em ${new Date().toLocaleDateString('pt-BR')}</span></div>
        </div>

        <div class="cards">
          <div class="card" style="background:#f0faf4;">
            <div class="label">Saúde Financeira</div>
            <div class="valor" style="color:${corSaude};">${data.saude}/100</div>
            <div style="font-size:11px;font-weight:700;color:${corSaude};">${textoSaude}</div>
          </div>
          <div class="card" style="background:#e8f5e9;">
            <div class="label">Receitas</div>
            <div class="valor" style="color:#2e7d32;">${fmtVal(data.totais.receitas)}</div>
          </div>
          <div class="card" style="background:#ffebee;">
            <div class="label">Despesas</div>
            <div class="valor" style="color:#c62828;">${fmtVal(data.totais.despesas)}</div>
          </div>
          <div class="card" style="background:#f3f4f6;">
            <div class="label">Saldo</div>
            <div class="valor" style="color:${data.totais.saldo >= 0 ? '#2e7d32' : '#c62828'};">${fmtVal(data.totais.saldo)}</div>
          </div>
        </div>

        <div class="paragrafo">${data.paragrafo}</div>

        <div class="secao">
          <h2>Análise por Categoria</h2>
          <table>
            <tr>
              <th>Categoria</th><th style="text-align:right;">Total</th>
              <th style="text-align:right;">Média Histórica</th><th style="text-align:right;">Desvio</th>
            </tr>
            ${catsHTML}
          </table>
        </div>

        <div class="secao">
          <h2>Eventos Relevantes</h2>
          <table>
            <tr><th>Descrição</th><th>Categoria</th><th>Data</th><th style="text-align:right;">Valor</th></tr>
            ${eventosHTML}
          </table>
        </div>

        <div class="rodape">FinWise — Relatório gerado automaticamente • ${data.nome_usuario}</div>
      </body></html>
    `;

    const janela = window.open('', '_blank');
    janela.document.write(htmlPDF);
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 800);
}

    // =========================================================
    // 8. CARREGAR NOTIFICAÇÕES (dentro do DOMContentLoaded
    //    para ter acesso ao token)
    // =========================================================
    async function carregarNotificacoes() {
        try {
            const res   = await fetch('http://localhost:5000/api/agenda/alertas',
                { headers: { 'Authorization': 'Bearer ' + token } });
            const data  = await res.json();
            const badge = document.getElementById('badge-alertas');
            const lista = document.getElementById('notif-lista');

            if (!badge || !lista) return;

            // Badge
            if (data.total > 0) {
                badge.textContent    = data.total;
                badge.style.display  = 'flex';
            } else {
                badge.style.display  = 'none';
            }

            // Lista de notificações
            lista.innerHTML = '';
            if (!data.alertas || data.alertas.length === 0) {
                lista.innerHTML = '<div class="notif-vazio">Nenhuma notificação</div>';
                return;
            }

            data.alertas.forEach(a => {
                const hoje       = new Date(); hoje.setHours(0,0,0,0);
                const venc       = new Date(a.data_vencimento + 'T00:00:00');
                const diff       = Math.round((venc - hoje) / (1000*60*60*24));
                const valorFmt   = 'R$ ' + parseFloat(a.valor).toFixed(2).replace('.', ',');
                const dataFmt    = a.data_vencimento.split('-').reverse().join('/');
                const isReceita  = a.tipo === 'receita';

                let textoTempo;
                if (isReceita) {
                    textoTempo = diff < 0 ? 'recebido' : diff === 0 ? 'receber hoje' : `receber em ${diff} dia(s)`;
                } else {
                    textoTempo = diff < 0 ? `venceu há ${Math.abs(diff)} dia(s)` : diff === 0 ? 'vence hoje' : `vence em ${diff} dia(s)`;
                }

                const bgColor   = isReceita ? '#e8f5e9' : (diff <= 0 ? '#fdecea' : '#fff8e1');
                const iconColor = isReceita ? '#279975'  : (diff <= 0 ? '#e74c3c' : '#f39c12');

                const div = document.createElement('div');
                div.className = 'notif-item';
                div.style.background = bgColor;
                div.innerHTML = `
                    <div class="notif-titulo">
                        <i class="fas fa-bell" style="font-size:13px; color:${iconColor};
                           background:white; padding:4px; border-radius:50%;"></i>
                        <span style="color:${iconColor}; font-weight:600;">
                            ${a.descricao} — ${textoTempo} — ${valorFmt}
                        </span>
                    </div>
                    <div class="notif-data">${a.categoria || 'Despesa'} • ${dataFmt}</div>
                `;
                lista.appendChild(div);
            });

        } catch (err) {
            console.error('Erro ao carregar notificações:', err);
        }
    }

    // =========================================================
    // 9. EXCLUIR TRANSAÇÃO
    // =========================================================
    async function excluirTransacao(id) {
        try {
            const res = await fetch(`http://localhost:5000/api/transacoes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.ok) {
                await carregarDashboard();
            } else {
                alert('Erro ao excluir transação.');
            }
        } catch (err) {
            console.error('Erro ao excluir transação:', err);
        }
    }

    async function carregarAlertas() {
    const grupos = document.getElementById('alertas-grupos');
    const vazio  = document.getElementById('alertas-vazio');
    if (!grupos) return;

    grupos.innerHTML = '<div style="color:#aaa;padding:20px;">Carregando...</div>';
    vazio.style.display = 'none';

    try {
        const [resAlertas, resDash, resGastos] = await Promise.all([
            fetch('http://localhost:5000/api/agenda/alertas',          { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('http://localhost:5000/api/dashboard',               { headers: { 'Authorization': 'Bearer ' + token } }),
            fetch('http://localhost:5000/api/alertas/gastos-excessivos', { headers: { 'Authorization': 'Bearer ' + token } })
        ]);

        const dataAlertas = await resAlertas.json();
        const dataDash    = await resDash.json();
        const dataGastos  = await resGastos.json();

        // Card de status financeiro
        const saude = dataDash.saude_financeira || 0;
        const saldo = dataDash.totais?.saldo ?? 0;
        const statusEl = document.getElementById('alerta-status-texto');
        const saldoEl  = document.getElementById('alerta-saldo-texto');
        const cardEl   = document.getElementById('alerta-status-card');

        let statusTexto, statusCor, cardBg, cardBorder;
        if (saude >= 70) {
            statusTexto = 'SAUDÁVEL'; statusCor = '#1b5e20';
            cardBg = 'linear-gradient(135deg,#e8f5e9,#f0faf4)'; cardBorder = '#a5d6a7';
        } else if (saude >= 40) {
            statusTexto = 'ATENÇÃO'; statusCor = '#e65100';
            cardBg = 'linear-gradient(135deg,#fff8e1,#fffde7)'; cardBorder = '#ffcc02';
        } else {
            statusTexto = 'CRÍTICO'; statusCor = '#b71c1c';
            cardBg = 'linear-gradient(135deg,#ffebee,#fff0f0)'; cardBorder = '#ef9a9a';
        }
        if (statusEl) { statusEl.textContent = statusTexto; statusEl.style.color = statusCor; }
        if (saldoEl)  { saldoEl.textContent  = 'R$ ' + saldo.toFixed(2).replace('.', ','); saldoEl.style.color = statusCor; }
        if (cardEl)   { cardEl.style.background = cardBg; cardEl.style.borderColor = cardBorder; }

        // Monta grupos
        const secoes = [];
        const todosAlertas = dataAlertas.alertas || [];

        // Vence hoje
        const venceHoje = todosAlertas.filter(a => {
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const venc = new Date(a.data_vencimento + 'T00:00:00');
            return venc.getTime() === hoje.getTime() && a.status !== 'pago';
        });
        if (venceHoje.length > 0) {
            secoes.push({
                titulo: 'Vence Hoje', cor: '#e65100', bg: '#fff8e1', borda: '#ffe082',
                items: venceHoje.map(a => ({
                    icone: 'fa-calendar-day',
                    texto: `${a.descricao} vence hoje — R$ ${parseFloat(a.valor).toFixed(2).replace('.', ',')}`,
                    data:  a.data_vencimento.split('-').reverse().join('/')
                }))
            });
        }

        // Vencimento próximo (1–3 dias)
        const proximos = todosAlertas.filter(a => {
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const venc = new Date(a.data_vencimento + 'T00:00:00');
            const diff = Math.round((venc - hoje) / (1000*60*60*24));
            return diff > 0 && diff <= 3 && a.status !== 'pago';
        });
        if (proximos.length > 0) {
            secoes.push({
                titulo: 'Vencimento Próximo', cor: '#f57f17', bg: '#fff8e1', borda: '#ffe082',
                items: proximos.map(a => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0);
                    const venc = new Date(a.data_vencimento + 'T00:00:00');
                    const diff = Math.round((venc - hoje) / (1000*60*60*24));
                    return {
                        icone: 'fa-clock',
                        texto: `${a.descricao} vence em ${diff} dia${diff > 1 ? 's' : ''} — R$ ${parseFloat(a.valor).toFixed(2).replace('.', ',')}`,
                        data:  a.data_vencimento.split('-').reverse().join('/')
                    };
                })
            });
        }

        // Vencidos
        const vencidos = todosAlertas.filter(a => {
            const hoje = new Date(); hoje.setHours(0,0,0,0);
            const venc = new Date(a.data_vencimento + 'T00:00:00');
            return venc < hoje && a.status !== 'pago';
        });
        if (vencidos.length > 0) {
            secoes.push({
                titulo: 'Vencido', cor: '#c62828', bg: '#ffebee', borda: '#ef9a9a',
                items: vencidos.map(a => {
                    const hoje = new Date(); hoje.setHours(0,0,0,0);
                    const venc = new Date(a.data_vencimento + 'T00:00:00');
                    const dias = Math.abs(Math.round((venc - hoje) / (1000*60*60*24)));
                    return {
                        icone: 'fa-exclamation-circle',
                        texto: `${a.descricao} venceu há ${dias} dia${dias > 1 ? 's' : ''} — R$ ${parseFloat(a.valor).toFixed(2).replace('.', ',')}`,
                        data:  a.data_vencimento.split('-').reverse().join('/')
                    };
                })
            });
        }

        // Gasto excessivo
        if (dataGastos.length > 0) {
            secoes.push({
                titulo: 'Gasto Excessivo', cor: '#4a148c', bg: '#f3e5f5', borda: '#ce93d8',
                items: dataGastos.map(g => ({
                    icone: 'fa-arrow-trend-up',
                    texto: `Gastos com ${g.categoria} acima da média (${g.percentual_acima}% a mais)`,
                    data:  new Date().toLocaleDateString('pt-BR')
                }))
            });
        }

        // Renderiza
        grupos.innerHTML = '';
        if (secoes.length === 0) {
            vazio.style.display = 'block';
            return;
        }

        secoes.forEach(s => {
            const secDiv = document.createElement('div');
            secDiv.style.marginBottom = '28px';

            const titulo = document.createElement('div');
            titulo.textContent = s.titulo;
            titulo.style.cssText = 'font-size:15px;font-weight:700;color:#333;margin-bottom:12px;';
            secDiv.appendChild(titulo);

            s.items.forEach(item => {
                const card = document.createElement('div');
                card.style.cssText = `
                    background:${s.bg};
                    border:1px solid ${s.borda};
                    border-radius:12px;
                    padding:16px 18px;
                    margin-bottom:10px;
                    display:flex;
                    align-items:flex-start;
                    gap:14px;
                `;
                card.innerHTML = `
                    <i class="fas ${item.icone}" style="color:${s.cor};font-size:18px;margin-top:2px;flex-shrink:0;"></i>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:#333;">${item.texto}</div>
                        <div style="font-size:12px;color:#888;margin-top:4px;">${item.data}</div>
                    </div>
                `;
                secDiv.appendChild(card);
            });

            grupos.appendChild(secDiv);
        });

    } catch (err) {
        console.error('Erro ao carregar alertas:', err);
        grupos.innerHTML = '<div style="color:#e74c3c;padding:20px;">Erro ao carregar alertas.</div>';
    }
}

    // =========================================================
    // 10. MODAL DE CONFIRMAÇÃO GENÉRICO
    // =========================================================
    function abrirModalConfirmacao(titulo, mensagem, onConfirmar) {
        console.log('FUNÇÃO ABRIR MODAL CHAMADA');
        const modal = document.getElementById('modal-confirmacao');
        if (!modal) return;
        document.getElementById('confirmacao-titulo').textContent   = titulo;
        document.getElementById('confirmacao-mensagem').textContent = mensagem;
        modal.style.display = 'flex';

        document.getElementById('btn-confirmar').onclick = async () => {
            modal.style.display = 'none';
            await onConfirmar();
        };
        document.getElementById('btn-cancelar-confirmacao').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // =========================================================
    // 11. MODAL DE EDIÇÃO DE TRANSAÇÃO
    // =========================================================
    async function abrirModalEdicao(id) {
        try {
            const res = await fetch(`http://localhost:5000/api/transacoes/${id}`,
                { headers: { 'Authorization': 'Bearer ' + token } });
            const t   = await res.json();

            const modal = document.getElementById('modal-edicao');
            if (!modal) return;

            document.getElementById('edit-descricao').value = t.descricao || '';
            document.getElementById('edit-valor').value     = parseFloat(t.valor).toFixed(2).replace('.', ',');
            document.getElementById('edit-data').value      = t.data || '';
            modal.style.display = 'flex';

            document.getElementById('btn-salvar-edicao').onclick = async () => {
                const body = {
                    descricao: document.getElementById('edit-descricao').value,
                    valor:     parseFloat(document.getElementById('edit-valor').value.replace(',', '.')),
                    data:      document.getElementById('edit-data').value
                };
                await fetch(`http://localhost:5000/api/transacoes/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                    body: JSON.stringify(body)
                });
                modal.style.display = 'none';
                await carregarDashboard();
            };

            document.getElementById('btn-fechar-edicao').onclick = () => {
                modal.style.display = 'none';
            };

        } catch (err) {
            console.error('Erro ao abrir modal de edição:', err);
        }
    }

    // =========================================================
    // 12. MODAL DE NOVA TRANSAÇÃO — REFERÊNCIAS
    // =========================================================
    const modal              = document.getElementById('modal-transacao');
    const fabBtn             = document.querySelector('.fab');
    const btnFechar          = document.getElementById('btn-fechar-modal');
    const btnReceita         = document.getElementById('btn-receita');
    const btnDespesa         = document.getElementById('btn-despesa');
    const toggleRecorrente   = document.getElementById('toggle-recorrente');
    const recorrenteDetalhes = document.getElementById('recorrente-detalhes');
    const toggleAgenda       = document.getElementById('toggle-agenda');
    const btnSalvar          = document.getElementById('btn-salvar');
    const inputValor         = document.getElementById('input-valor');
    const inputData          = document.getElementById('input-data');
    const inputVencimento    = document.getElementById('input-vencimento');
    const inputVencAgenda    = document.getElementById('input-vencimento-agenda');

    // =========================================================
    // 13. ABRIR MODAL (função reutilizada pelo FAB e histórico)
    // =========================================================
    function abrirModalTransacao() {
        modal.style.display = 'flex';
        tipoSelecionado = 'receita';
        btnReceita.classList.add('active');
        btnDespesa.classList.remove('active');
        renderizarCategorias('receita');
        inputValor.value = '';
        const hoje = new Date();

const dia = String(hoje.getDate()).padStart(2, '0');
const mes = String(hoje.getMonth() + 1).padStart(2, '0');
const ano = hoje.getFullYear();

inputData.value = `${dia}/${mes}/${ano}`;
        document.getElementById('input-descricao').value = '';
        if (toggleRecorrente)   { toggleRecorrente.checked = false;   recorrenteDetalhes.style.display = 'none'; }
        if (toggleAgenda)       { toggleAgenda.checked     = false;   document.getElementById('agenda-detalhes').style.display = 'none'; }
        if (inputVencimento)    inputVencimento.value = '';
        if (inputVencAgenda)    inputVencAgenda.value = '';
    }

    // FAB — único listener
    fabBtn.addEventListener('click', abrirModalTransacao);

    // Fechar modal
    btnFechar.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e)  => { if (e.target === modal) modal.style.display = 'none'; });

    // =========================================================
    // 14. TOGGLE RECEITA / DESPESA — único listener cada
    // =========================================================
    btnReceita.addEventListener('click', function () {
        tipoSelecionado = 'receita';
        btnReceita.classList.add('active');
        btnDespesa.classList.remove('active');
        renderizarCategorias('receita');
    });

    btnDespesa.addEventListener('click', function () {
        tipoSelecionado = 'despesa';
        btnDespesa.classList.add('active');
        btnReceita.classList.remove('active');
        renderizarCategorias('despesa');
    });

    // =========================================================
    // 15. FORMATAÇÃO DE CAMPOS
    // =========================================================
    inputValor.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, '');
        if (!v.length) { e.target.value = ''; return; }
        e.target.value = (parseInt(v) / 100).toFixed(2).replace('.', ',');
    });

    function formatarData(input) {
        if (!input) return;
        input.addEventListener('input', function (e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2);
            if (v.length > 5) v = v.slice(0,5) + '/' + v.slice(5,9);
            e.target.value = v;
        });
    }
    formatarData(inputData);
    formatarData(inputVencimento);
    formatarData(inputVencAgenda);

    // =========================================================
    // 16. TOGGLE RECORRENTE — único listener
    // =========================================================
    if (toggleRecorrente) {
        toggleRecorrente.addEventListener('change', function () {
            recorrenteDetalhes.style.display = this.checked ? 'block' : 'none';
            if (!this.checked) {
                const sel = document.getElementById('select-frequencia');
                if (sel) sel.value = 'Mensal';
                if (inputVencimento) inputVencimento.value = '';
            } else if (toggleAgenda && toggleAgenda.checked) {
                // Desativa lembrete único se marcar recorrente
                toggleAgenda.checked = false;
                document.getElementById('agenda-detalhes').style.display = 'none';
                if (inputVencAgenda) inputVencAgenda.value = '';
            }
        });
    }

    // Toggle adicionar à agenda
    if (toggleAgenda) {
        toggleAgenda.addEventListener('change', function () {
            const det = document.getElementById('agenda-detalhes');
            if (det) det.style.display = this.checked ? 'block' : 'none';
            if (!this.checked && inputVencAgenda) inputVencAgenda.value = '';
            else if (this.checked && toggleRecorrente && toggleRecorrente.checked) {
                // Desativa recorrente se marcar lembrete único
                toggleRecorrente.checked = false;
                recorrenteDetalhes.style.display = 'none';
                const sel = document.getElementById('select-frequencia');
                if (sel) sel.value = 'Mensal';
                if (inputVencimento) inputVencimento.value = '';
            }
        });
    }

    // =========================================================
    // 17. SALVAR TRANSAÇÃO
    // =========================================================
    btnSalvar.addEventListener('click', async function () {
        const valorRaw  = inputValor.value.replace(',', '.');
        const valor     = parseFloat(valorRaw);
        const dataRaw   = inputData.value;
        const descricao = document.getElementById('input-descricao').value.trim() || 'Sem descrição';

        // Validações
        if (!valor || valor <= 0)             { alert('Informe um valor válido.');           return; }
        if (!dataRaw || dataRaw.length < 10)  { alert('Informe uma data válida.');           return; }
        if (!categoriaSelecionada)            { alert('Selecione uma categoria.');           return; }
        if (toggleAgenda && toggleAgenda.checked && (!inputVencAgenda || inputVencAgenda.value.length < 10)) {
            alert('Informe a data de vencimento do lembrete.');
            return;
        }

        const subcatSelect = document.getElementById('select-subcategoria').value;
        const subcatCustom = (document.getElementById('input-subcategoria-personalizada')?.value || '').trim();
        const subcatFinal  = subcatCustom || subcatSelect;
const categoriasSemSubcategoria = [
    'Apostas',
    'Outros',
    'Vendas'
];

if (
    !subcatFinal &&
    !categoriasSemSubcategoria.includes(categoriaSelecionada)
) {
    alert('Selecione ou digite uma subcategoria.');
    return;
}

        const partes         = dataRaw.split('/');
        const dataFormatada  = `${partes[2]}-${partes[1]}-${partes[0]}`;

        const body = {
            descricao,
            valor,
            tipo:        tipoSelecionado,
            categoria:   categoriaSelecionada,
            subcategoria: subcatFinal,
            data:        dataFormatada
        };

        // Recorrente
if (toggleRecorrente && toggleRecorrente.checked) {
    body.recorrente = true;
    body.frequencia = document.getElementById('select-frequencia')?.value || 'Mensal';

    // usa a própria data da transação
    body.data_vencimento = dataFormatada;
}

        // Agenda (sem recorrência)
        if (toggleAgenda && toggleAgenda.checked && !(toggleRecorrente && toggleRecorrente.checked)) {
            if (inputVencAgenda && inputVencAgenda.value.length >= 10) {
                const vp = inputVencAgenda.value.split('/');
                body.data_vencimento = `${vp[2]}-${vp[1]}-${vp[0]}`;
                body.recorrente      = false;
            }
        }

        try {
            const res = await fetch('http://localhost:5000/api/transacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                modal.style.display = 'none';
                await carregarDashboard();
            } else {
                const err = await res.json();
                alert('Erro: ' + (err.erro || err.message || 'Erro desconhecido'));
            }
        } catch (err) {
            console.error('Erro ao salvar transação:', err);
            alert('Erro de conexão ao salvar transação.');
        }
    });

    // =========================================================
    // 18. SINO DE NOTIFICAÇÕES
    // =========================================================
    const sinoBtn = document.getElementById('sino-btn');
    if (sinoBtn) {
        sinoBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const dropdown = document.getElementById('notif-dropdown');
            if (dropdown) {
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            }
        });

        // Fechar ao clicar fora
        document.addEventListener('click', function () {
            const dropdown = document.getElementById('notif-dropdown');
            if (dropdown) dropdown.style.display = 'none';
        });
    }

    // =========================================================
    // 19. AVATAR — LOGOUT
    // =========================================================
    const avatarEl = document.querySelector('.avatar');
    if (avatarEl) {
        avatarEl.addEventListener('click', function () {
            localStorage.removeItem('token');
            window.location.href = '/frontend/login.html';
        });
    }

    // =========================================================
    // 20. NAVEGAÇÃO ENTRE VIEWS (sidebar)
    // =========================================================
    document.querySelectorAll('[data-view]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const view = this.dataset.view;
            if (view === 'agenda') {
    window.location.href = 'agenda.html';
    return;
}

if (view === 'relatorio') {
    document.querySelectorAll('[id^="view-"]').forEach(sec => sec.style.display = 'none');
    document.getElementById('view-relatorio').style.display = 'block';
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    this.closest('li').classList.add('active');
    carregarRelatorio();
    return;
}

if (view === 'alertas') {
    document.querySelectorAll('[id^="view-"]').forEach(sec => sec.style.display = 'none');
    document.getElementById('view-alertas').style.display = 'block';
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    this.closest('li').classList.add('active');
    carregarAlertas();
    return;
}

            // Esconde todas as seções
            document.querySelectorAll('[id^="view-"]').forEach(sec => {
                sec.style.display = 'none';
            });

            // Exibe a seção alvo
            const viewEl = document.getElementById(`view-${view}`);
            if (viewEl) viewEl.style.display = 'block';

            // Atualiza item ativo na sidebar
            document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
            this.closest('li').classList.add('active');

            // Carrega dados específicos da view
            if (view === 'perfil')    carregarPerfil();
            if (view === 'historico') carregarHistorico();
        });
    });

    // =========================================================
    // 21. BOTÕES DO PERFIL
    // =========================================================
    const btnSair = document.querySelector('.btn-sair');
    if (btnSair) {
        btnSair.addEventListener('click', function () {
            localStorage.removeItem('token');
            window.location.href = 'login.html';
        });
    }

    const btnEditarPerfil = document.querySelector('.btn-editar-perfil');
    if (btnEditarPerfil) {
        btnEditarPerfil.addEventListener('click', function () {
            alert('Edição de perfil será implementada em breve.');
        });
    }

    const btnAlterarSenha = document.querySelector('.btn-alterar-senha');
    if (btnAlterarSenha) {
        btnAlterarSenha.addEventListener('click', function () {
            alert('Alteração de senha será implementada em breve.');
        });
    }

    // =========================================================
    // 22. HISTÓRICO — BOTÃO NOVA TRANSAÇÃO
    // =========================================================
    const btnNovaTransacaoHistorico = document.querySelector('.btn-nova-transacao');
    if (btnNovaTransacaoHistorico) {
        btnNovaTransacaoHistorico.addEventListener('click', abrirModalTransacao);
    }

    // =========================================================
    // 23. HISTÓRICO — FILTRO POR CATEGORIA
    // =========================================================
    document.querySelectorAll('.historico-categoria-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.historico-categoria-btn')
                .forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtrarHistorico(this.dataset.categoria);
        });
    });

    // Única declaração da função filtrarHistorico
    function filtrarHistorico(categoria) {
        document.querySelectorAll('#historico-lista .historico-item').forEach(item => {
            const cat = item.dataset.categoria || '';
            item.style.display = (!categoria || categoria === 'todos' || cat === categoria)
                ? 'flex' : 'none';
        });
    }
    document
.getElementById("btn-fechar-edicao-x")
?.addEventListener("click", () => {

    document.getElementById("modal-edicao").style.display = "none";

});

    // =========================================================
    // 24. INICIAR — chamada única, sempre a última linha
    // =========================================================
    carregarDashboard();

    // Abre a view indicada pela URL (?view=perfil, ?view=historico, etc.)
    const params = new URLSearchParams(window.location.search);
    const viewInicial = params.get('view');
    if (viewInicial && viewInicial !== 'inicio') {
        const linkView = document.querySelector(`[data-view="${viewInicial}"]`);
        if (linkView) linkView.click();
    }


function obterIcone(categoria) {

    const icones = {

        'Despesas Fixas': 'fa-home',
        'Despesas Variáveis': 'fa-shopping-bag',
        'Transporte': 'fa-car',
        'Investimentos/Reserva': 'fa-dollar-sign',
        'Investimentos/Reservas': 'fa-dollar-sign',
        'Apostas': 'fa-dice',
        'Salário': 'fa-dollar-sign',
        'Freelance/Bico': 'fa-dollar-sign',
        'Freelancer / Extra': 'fa-dollar-sign',
        'Vendas': 'fa-dollar-sign',
        'Outros': 'fa-smile',
        'Outro': 'fa-smile'

    };

    return icones[categoria] || 'fa-dollar-sign';
}

document
.getElementById('filtro-data-inicio')
?.addEventListener('change', carregarHistorico);

document
.getElementById('filtro-data-fim')
?.addEventListener('change', carregarHistorico);

function calcularSaudeFinanceira(receitas, despesas) {

    if (!receitas || receitas <= 0) {
        return {
            percentual: 0,
            nivel: 'Insolvente',
            cor: '#ef4444'
        };
    }

    const percentualGasto =
        (despesas / receitas) * 100;

    const saude =
        Math.max(
            0,
            Math.min(
                100,
                100 - percentualGasto
            )
        );

    let nivel = '';
    let cor = '';

    if (saude <= 15) {
        nivel = 'Insolvente';
        cor = '#ef4444';
    }
    else if (saude <= 30) {
        nivel = 'Crítico';
        cor = '#f97316';
    }
    else if (saude <= 50) {
        nivel = 'Vulnerável';
        cor = '#facc15';
    }
    else if (saude <= 70) {
        nivel = 'Estável';
        cor = '#3b82f6';
    }
    else {
        nivel = 'Saudável';
        cor = '#22c55e';
    }

    return {
        percentual: Math.round(saude),
        nivel,
        cor,
        percentualGasto: Math.round(percentualGasto)
    };
}

function atualizarBarraSaude(receitas, despesas) {

    const saude =
        calcularSaudeFinanceira(
            receitas,
            despesas
        );

    const barra =
        document.getElementById('barra-saude');

    const badge =
        document.getElementById('badge-saude');

    const texto =
        document.getElementById('texto-saude');

    const explicacao =
        document.getElementById('explicacao-saude');

    if (!barra || !badge || !texto)
        return;

    barra.style.width =
        `${saude.percentual}%`;

    badge.textContent =
        saude.nivel;

    badge.style.background =
        `${saude.cor}20`;

    badge.style.color =
        saude.cor;

texto.textContent =
`${saude.percentual}% • ${saude.nivel}`;

    if (explicacao) {
        explicacao.textContent =
            `Você comprometeu ${saude.percentualGasto}% da sua renda este mês.`;
    }
}

}); // fim DOMContentLoaded