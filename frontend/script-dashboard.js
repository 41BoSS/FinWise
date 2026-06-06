<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Variáveis globais para os gráficos
    let donutChartInstance = null;
    let barChartInstance = null;

    // ===== DASHBOARD DATA =====
=======
document.addEventListener('DOMContentLoaded', function () {

    // ===== 1. VERIFICAÇÃO DE TOKEN =====
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/frontend/login.html';
        return;
    }

    // ===== 2. VARIÁVEIS GLOBAIS DOS GRÁFICOS =====
    let donutChartInstance = null;
    let barChartInstance = null;
    // Categorias por tipo
const CATEGORIAS_RECEITA = ['Salário', 'Freelancer / Extra', 'Investimentos / Reservas', 'Outros'];
const CATEGORIAS_DESPESA = ['Despesas Fixas', 'Despesas Variáveis', 'Transporte', 'Investimentos / Reservas', 'Apostas', 'Outros'];

function renderizarCategorias(tipo) {
    const grid = document.getElementById('grid-categoria');
    const lista = tipo === 'receita' ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
    grid.innerHTML = lista.map(c =>
        `<button class="categoria-btn" data-categoria="${c}">${c}</button>`
    ).join('');
    categoriaSelecionada = '';
    grid.querySelectorAll('.categoria-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            grid.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            categoriaSelecionada = this.dataset.categoria;
        });
    });
}

    // ===== 3. CARREGAR DASHBOARD =====
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
    async function carregarDashboard() {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.status === 401) {
                localStorage.removeItem('token');
<<<<<<< HEAD
                window.location.href = 'login.html';
=======
                window.location.href = '/frontend/login.html';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
                return;
            }
            const data = await res.json();

            document.getElementById('user-name').textContent = data.nome;
            document.getElementById('current-date').textContent = data.data_formatada;
            document.querySelector('.avatar').textContent = data.avatar;

<<<<<<< HEAD
            document.querySelector('.card.receitas .value').textContent = 'R$ ' + data.totais.receitas.toFixed(2).replace('.', ',');
            document.querySelector('.card.despesas .value').textContent = 'R$ ' + data.totais.despesas.toFixed(2).replace('.', ',');
            document.querySelector('.card.saldo .value').textContent = 'R$ ' + data.totais.saldo.toFixed(2).replace('.', ',');

            document.querySelector('.health-indicator').style.width = data.saude_financeira + '%';
=======
            document.querySelector('.card.receitas .value').textContent =
                'R$ ' + data.totais.receitas.toFixed(2).replace('.', ',');
            document.querySelector('.card.despesas .value').textContent =
                'R$ ' + data.totais.despesas.toFixed(2).replace('.', ',');
            document.querySelector('.card.saldo .value').textContent =
                'R$ ' + data.totais.saldo.toFixed(2).replace('.', ',');

            document.querySelector('.health-indicator').style.width =
                data.saude_financeira + '%';
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)

            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';
            if (data.ultimas_transacoes.length === 0) {
<<<<<<< HEAD
                tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Nenhuma transação encontrada</td></tr>';
            } else {
                data.ultimas_transacoes.forEach(t => {
                    const row = document.createElement('tr');
                    const valorFormatado = 'R$ ' + parseFloat(t.valor).toFixed(2).replace('.', ',');
                    const icone = t.tipo === 'receita' ? '⬆' : '⬇';
                    row.innerHTML = `<td>${t.descricao}</td><td>${valorFormatado}</td><td>${t.data}</td><td>${icone} ${t.tipo}</td>`;
=======
                tbody.innerHTML =
                    '<tr class="empty-row"><td colspan="4">Nenhuma transação encontrada</td></tr>';
            } else {
                data.ultimas_transacoes.forEach(t => {
                    const row = document.createElement('tr');
                    const valorFormatado =
                        'R$ ' + parseFloat(t.valor).toFixed(2).replace('.', ',');
                    const icone = t.tipo === 'receita' ? '⬆' : '⬇';
                    row.innerHTML = `
                        <td>${t.descricao}</td>
                        <td>${valorFormatado}</td>
                        <td>${t.data}</td>
                        <td>${icone} ${t.tipo}</td>
                    `;
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
                    tbody.appendChild(row);
                });
            }

<<<<<<< HEAD
            carregarGraficos();
=======
            await carregarGraficos();
            await carregarHistorico();
            // ===== CARREGAR PERFIL =====
async function carregarPerfil() {
    try {
        const res = await fetch('http://localhost:5000/api/usuario', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const usuario = await res.json();
        const avatarEl = document.querySelector('.perfil-avatar');
        const nomeEl   = document.querySelector('.perfil-nome');
        const campos   = document.querySelectorAll('.perfil-campo p');
        if (avatarEl) avatarEl.textContent = (usuario.nome || '?')[0].toUpperCase();
        if (nomeEl)   nomeEl.textContent   = usuario.nome || '';
        if (campos[0]) campos[0].textContent = usuario.email || '';
    } catch (err) {
        console.error('Erro ao carregar perfil:', err);
    }
}

>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        }
    }

<<<<<<< HEAD
    // ===== GRÁFICOS =====
    async function carregarGraficos() {
        try {
            // Destroi gráficos existentes antes de recriar
=======
    // ===== 4. CARREGAR GRÁFICOS =====
    async function carregarGraficos() {
        try {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
            if (donutChartInstance) {
                donutChartInstance.destroy();
                donutChartInstance = null;
            }
            if (barChartInstance) {
                barChartInstance.destroy();
                barChartInstance = null;
            }

<<<<<<< HEAD
            // Donut
=======
            // Gráfico donut
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
            const donutRes = await fetch('http://localhost:5000/api/graficos/donut', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const donutData = await donutRes.json();

            if (donutData.labels && donutData.labels.length > 0) {
<<<<<<< HEAD
                donutChartInstance = new Chart(document.getElementById('donutChart'), {
=======
                donutChartInstance = new Chart(
                    document.getElementById('donutChart'), {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
                    type: 'doughnut',
                    data: {
                        labels: donutData.labels,
                        datasets: [{
                            data: donutData.data,
<<<<<<< HEAD
                            backgroundColor: ['#279975', '#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#e67e22']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
                });
            }

            // Barras
=======
                            backgroundColor: [
                                '#279975', '#e74c3c', '#f1c40f',
                                '#3498db', '#9b59b6', '#e67e22'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { legend: { position: 'bottom' } }
                    }
                });
            }

            // Gráfico de barras
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
            const barRes = await fetch('http://localhost:5000/api/graficos/barras', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const barData = await barRes.json();

            if (barData.labels && barData.labels.length > 0) {
<<<<<<< HEAD
                barChartInstance = new Chart(document.getElementById('barChart'), {
=======
                barChartInstance = new Chart(
                    document.getElementById('barChart'), {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
                    type: 'bar',
                    data: {
                        labels: barData.labels,
                        datasets: [
<<<<<<< HEAD
                            { label: 'Receitas', data: barData.receitas, backgroundColor: '#279975' },
                            { label: 'Gastos', data: barData.gastos, backgroundColor: '#e74c3c' }
=======
                            {
                                label: 'Receitas',
                                data: barData.receitas,
                                backgroundColor: '#279975'
                            },
                            {
                                label: 'Gastos',
                                data: barData.gastos,
                                backgroundColor: '#e74c3c'
                            }
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
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

<<<<<<< HEAD
    // ===== MODAL =====
    const modal = document.getElementById('modal-transacao');
    const fabBtn = document.querySelector('.fab');
    const btnFechar = document.getElementById('btn-fechar-modal');
    const btnReceita = document.getElementById('btn-receita');
    const btnDespesa = document.getElementById('btn-despesa');
    const categorias = document.querySelectorAll('.categoria-btn');
    const toggleRecorrente = document.getElementById('toggle-recorrente');
    const recorrenteDetalhes = document.getElementById('recorrente-detalhes');
    const btnSalvar = document.getElementById('btn-salvar');
    const inputValor = document.getElementById('input-valor');
    const inputData = document.getElementById('input-data');
    const inputVencimento = document.getElementById('input-vencimento');

    let tipoSelecionado = 'receita';
    let categoriaSelecionada = '';

    // Abrir modal
    fabBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        tipoSelecionado = 'receita';
        btnReceita.classList.add('active');
        btnDespesa.classList.remove('active');
        categoriaSelecionada = '';
        categorias.forEach(c => c.classList.remove('selected'));
        inputValor.value = '';
        inputData.value = '';
        document.getElementById('input-descricao').value = '';
        toggleRecorrente.checked = false;
        recorrenteDetalhes.style.display = 'none';
    });

    // Fechar modal
    btnFechar.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    modal.addEventListener('click', function(e) {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Toggle Receita / Despesa
    btnReceita.addEventListener('click', function() {
        tipoSelecionado = 'receita';
        btnReceita.classList.add('active');
        btnDespesa.classList.remove('active');
    });
    btnDespesa.addEventListener('click', function() {
        tipoSelecionado = 'despesa';
        btnDespesa.classList.add('active');
        btnReceita.classList.remove('active');
    });

    // Formatação do valor (ex: 1234 -> 12,34)
    inputValor.addEventListener('input', function(e) {
=======
    // ===== 5. CARREGAR HISTÓRICO =====
    async function carregarHistorico() {
        try {
            const resposta = await fetch('http://localhost:5000/api/transacoes', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const transacoes = await resposta.json();
            const lista = document.getElementById('historico-lista');
            lista.innerHTML = '';

            if (!transacoes.length) {
                lista.innerHTML = '<p>Nenhuma transação encontrada.</p>';
                return;
            }

            transacoes.forEach(t => {
                const item = document.createElement('div');
                item.className = 'historico-item';
                item.innerHTML = `
                    <div class="historico-info">
                        <div class="historico-titulo">${t.descricao}</div>
                        <div class="historico-categoria">${t.categoria || 'Sem categoria'}</div>
                    </div>
                    <div class="historico-valor ${t.tipo === 'receita' ? 'receita' : 'despesa'}">
                        ${t.tipo === 'receita' ? '+' : '-'}
                        R$ ${Math.abs(t.valor).toFixed(2).replace('.', ',')}
                    </div>
                `;
                lista.appendChild(item);
            });

        } catch (erro) {
            console.error('Erro ao carregar histórico:', erro);
        }
    }

    // ===== 6. MODAL — REFERÊNCIAS =====
    const modal           = document.getElementById('modal-transacao');
    const fabBtn          = document.querySelector('.fab');
    const btnFechar       = document.getElementById('btn-fechar-modal');
    const btnReceita      = document.getElementById('btn-receita');
    const btnDespesa      = document.getElementById('btn-despesa');
    const categorias      = document.querySelectorAll('.categoria-btn');
    const toggleRecorrente = document.getElementById('toggle-recorrente');
    const recorrenteDetalhes = document.getElementById('recorrente-detalhes');
    const btnSalvar       = document.getElementById('btn-salvar');
    const inputValor      = document.getElementById('input-valor');
    const inputData       = document.getElementById('input-data');
    const inputVencimento = document.getElementById('input-vencimento');

    let tipoSelecionado   = 'receita';
    let categoriaSelecionada = '';

    // ===== 7. MODAL — ABRIR / FECHAR =====
   fabBtn.addEventListener('click', function () {
    modal.style.display = 'flex';
    tipoSelecionado = 'receita';

    btnReceita.classList.add('active');
    btnDespesa.classList.remove('active');

    categoriaSelecionada = '';

    renderizarCategorias('receita');

    inputValor.value = '';
    inputData.value = '';

    document.getElementById('input-descricao').value = '';

    toggleRecorrente.checked = false;
    recorrenteDetalhes.style.display = 'none';
});

    modal.addEventListener('click', function (e) {
        if (e.target === modal) modal.style.display = 'none';
    });

    // ===== 8. MODAL — RECEITA / DESPESA =====
btnReceita.addEventListener('click', function () {
    tipoSelecionado = 'receita';
    btnReceita.classList.add('active');
    btnDespesa.classList.remove('active');
    renderizarCategorias('receita'); // ← linha nova
});

btnDespesa.addEventListener('click', function () {
    tipoSelecionado = 'despesa';
    btnDespesa.classList.add('active');
    btnReceita.classList.remove('active');
    renderizarCategorias('despesa'); // ← linha nova
});

    // ===== 9. MODAL — FORMATAÇÕES =====
    inputValor.addEventListener('input', function (e) {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
        let v = e.target.value.replace(/\D/g, '');
        if (v.length === 0) { e.target.value = ''; return; }
        v = (parseInt(v) / 100).toFixed(2);
        e.target.value = v.replace('.', ',');
    });

<<<<<<< HEAD
    // Formatação da data DD/MM/AAAA
    function formatarData(input) {
        input.addEventListener('input', function(e) {
=======
    function formatarData(input) {
        input.addEventListener('input', function (e) {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
            if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
            e.target.value = v;
        });
    }
    formatarData(inputData);
    formatarData(inputVencimento);

<<<<<<< HEAD
    // Selecionar categoria
    categorias.forEach(btn => {
        btn.addEventListener('click', function() {
=======
    // ===== 10. MODAL — CATEGORIAS =====
    categorias.forEach(btn => {
        btn.addEventListener('click', function () {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
            categorias.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            categoriaSelecionada = this.dataset.categoria;
        });
    });

<<<<<<< HEAD
    // Toggle recorrente
    toggleRecorrente.addEventListener('change', function() {
=======
    // ===== 11. MODAL — RECORRENTE =====
    toggleRecorrente.addEventListener('change', function () {
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
        recorrenteDetalhes.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            document.getElementById('select-frequencia').value = 'Mensal';
            inputVencimento.value = '';
        }
    });

<<<<<<< HEAD
    // Salvar transação
    btnSalvar.addEventListener('click', async function() {
        const valorRaw = inputValor.value.replace(',', '.');
        const valor = parseFloat(valorRaw);
        const dataRaw = inputData.value;
=======
    // ===== 12. MODAL — SALVAR TRANSAÇÃO =====
    btnSalvar.addEventListener('click', async function () {
        const valorRaw = inputValor.value.replace(',', '.');
        const valor    = parseFloat(valorRaw);
        const dataRaw  = inputData.value;
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
        const descricao = document.getElementById('input-descricao').value || 'Sem descrição';

        if (!valor || valor <= 0) {
            alert('Informe um valor válido.');
            return;
        }
        if (!dataRaw || dataRaw.length < 10) {
            alert('Informe uma data válida.');
            return;
        }
        if (!categoriaSelecionada) {
            alert('Selecione uma categoria.');
            return;
        }

        const partes = dataRaw.split('/');
        const dataFormatada = partes[2] + '-' + partes[1] + '-' + partes[0];

        const body = {
<<<<<<< HEAD
            descricao: descricao,
            valor: valor,
            tipo: tipoSelecionado,
            categoria: categoriaSelecionada,
            data: dataFormatada
=======
            descricao:  descricao,
            valor:      valor,
            tipo:       tipoSelecionado,
            categoria:  categoriaSelecionada,
            data:       dataFormatada
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
        };

        if (toggleRecorrente.checked) {
            body.recorrente = true;
            body.frequencia = document.getElementById('select-frequencia').value;
            const vencRaw = inputVencimento.value;
            if (vencRaw && vencRaw.length >= 10) {
                const vPartes = vencRaw.split('/');
                body.data_vencimento = vPartes[2] + '-' + vPartes[1] + '-' + vPartes[0];
            }
        }

        try {
            const res = await fetch('http://localhost:5000/api/transacoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                modal.style.display = 'none';
<<<<<<< HEAD
                carregarDashboard();
=======
                await carregarDashboard();
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
            } else {
                const err = await res.json();
                alert('Erro: ' + (err.erro || err.message));
            }
        } catch (err) {
            alert('Erro ao salvar transação.');
            console.error(err);
        }
    });

<<<<<<< HEAD
    // Avatar / Logout
    document.querySelector('.avatar').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // Iniciar
    carregarDashboard();
});
=======
    // ===== 13. AVATAR — LOGOUT =====
    document.querySelector('.avatar').addEventListener('click', function () {
        localStorage.removeItem('token');
        window.location.href = '/frontend/login.html';
    });

    // ===== 14. NAVEGAÇÃO ENTRE VIEWS =====
    const menuLinks = document.querySelectorAll('[data-view]');

    menuLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const view = this.dataset.view;

            document.querySelectorAll('[id^="view-"]').forEach(sec => {
                sec.style.display = 'none';
            });

            const viewSelecionada = document.getElementById(`view-${view}`);
            if (viewSelecionada) {
                viewSelecionada.style.display = 'block';
            }

            document.querySelectorAll('.sidebar li')
                .forEach(li => li.classList.remove('active'));

            this.closest('li').classList.add('active');
            if (view === 'perfil') carregarPerfil();
            if (view === 'historico') carregarHistorico();
        });
    });

    // ===== 15. BOTÃO SAIR =====
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

    // ===== 16. HISTÓRICO — BOTÃO NOVA TRANSAÇÃO =====
    const btnNovaTransacaoHistorico = document.querySelector('.btn-nova-transacao');
    if (btnNovaTransacaoHistorico) {
        btnNovaTransacaoHistorico.addEventListener('click', function () {
            modal.style.display = 'flex';
        });
    }

    // ===== 17. HISTÓRICO — FILTRO POR CATEGORIA =====
    document.querySelectorAll('.historico-categoria-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.historico-categoria-btn')
                .forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtrarHistorico(this.dataset.categoria);
        });
    });

    function filtrarHistorico(categoria) {
        const items = document.querySelectorAll('#historico-lista .historico-item');
        items.forEach(item => {
            const cat = item.querySelector('.historico-categoria')
                ?.textContent?.trim();
            item.style.display =
                (categoria === 'todos' || cat === categoria) ? 'flex' : 'none';
        });
    }

    // ===== 18. INICIAR (sempre por último) =====
    carregarDashboard();

}); // fim DOMContentLoaded
>>>>>>> 39da51e (Correções e pequenas adições de melhorias na funcionalidade de perfil e histórico, além de ajustes no código para melhor organização e clareza.)
