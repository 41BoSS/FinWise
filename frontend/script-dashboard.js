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
            'Salário':             ['Salário Mensal', '13º Salário', 'Bônus'],
            'Freelancer / Extra':  ['Freelance', 'Consultoria', 'Projeto'],
            'Investimentos':       ['Dividendos', 'Juros', 'Rendimentos'],
            'Outros':              []
        },
        despesa: {
            'Alimentação':  ['Mercado', 'Restaurante', 'Delivery'],
            'Transporte':   ['Combustível', 'Uber', 'Ônibus', 'Manutenção'],
            'Moradia':      ['Aluguel', 'Água', 'Energia', 'Internet'],
            'Saúde':        ['Plano de Saúde', 'Medicamentos', 'Consultas'],
            'Lazer':        ['Cinema', 'Viagem', 'Shows'],
            'Educação':     ['Faculdade', 'Cursos', 'Livros'],
            'Investimentos/Reservas': ['CDB', 'Tesouro Direto', 'Ações', 'Previdência'],
            'Apostas':      [],
            'Outros':       []
        }
    };

    function renderizarCategorias(tipo) {
        const grid              = document.getElementById('grid-categoria');
        const selectSubcat      = document.getElementById('select-subcategoria');
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

            // Saúde financeira
            document.querySelector('.health-indicator').style.width =
                data.saude_financeira + '%';

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
                        <td>${t.categoria || '-'}</td>
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
                            backgroundColor: ['#279975','#e74c3c','#f1c40f','#3498db','#9b59b6','#e67e22']
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
    async function carregarHistorico() {
        try {
            const res        = await fetch('http://localhost:5000/api/transacoes',
                { headers: { 'Authorization': 'Bearer ' + token } });
            const transacoes = await res.json();
            const lista      = document.getElementById('historico-lista');
            lista.innerHTML  = '';

            if (!transacoes || !transacoes.length) {
                lista.innerHTML = '<p style="color:#888; padding:20px;">Nenhuma transação encontrada.</p>';
                return;
            }

            // Agrupa por data (mais recente primeiro)
            const agrupado = {};
            transacoes.forEach(t => {
                const d = t.data || 'Sem data';
                if (!agrupado[d]) agrupado[d] = [];
                agrupado[d].push(t);
            });

            const datasOrdenadas = Object.keys(agrupado).sort((a, b) => b.localeCompare(a));

            datasOrdenadas.forEach(data => {
                const dataFmt = data.split('-').reverse().join('/');
                const grupo   = document.createElement('div');
                grupo.className = 'historico-grupo';
                grupo.innerHTML = `<div class="historico-dia">${dataFmt}</div>`;

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
                        <div class="historico-info">
        <div class="historico-titulo">${titulo}</div>
                            <div class="historico-categoria">${t.categoria || 'Sem categoria'}${t.subcategoria ? ' › ' + t.subcategoria : ''}</div>
                        </div>
                        <div class="historico-acoes">
                            <span class="historico-valor ${isReceita ? 'receita' : 'despesa'}">
                                ${sinal} ${valorFmt}
                            </span>
                            <button class="btn-editar-tx" data-id="${t.id}" title="Editar">✎</button>
                            <button class="btn-excluir-tx" data-id="${t.id}" title="Excluir">🗑</button>
                        </div>
                    `;
                    grupo.appendChild(item);
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
            }
        });
    }

    // Toggle adicionar à agenda
    if (toggleAgenda) {
        toggleAgenda.addEventListener('change', function () {
            const det = document.getElementById('agenda-detalhes');
            if (det) det.style.display = this.checked ? 'block' : 'none';
            if (!this.checked && inputVencAgenda) inputVencAgenda.value = '';
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

        const subcatSelect = document.getElementById('select-subcategoria').value;
        const subcatCustom = (document.getElementById('input-subcategoria-personalizada')?.value || '').trim();
        const subcatFinal  = subcatCustom || subcatSelect;
        if (!subcatFinal) {
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

if (view === 'alertas') {
    window.location.href = 'agenda.html';
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

}); // fim DOMContentLoaded