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
    async function carregarDashboard() {
        try {
            const res = await fetch('http://localhost:5000/api/dashboard', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = 'login.html';
                return;
            }
            const data = await res.json();

            document.getElementById('user-name').textContent = data.nome;
            document.getElementById('current-date').textContent = data.data_formatada;
            document.querySelector('.avatar').textContent = data.avatar;

            document.querySelector('.card.receitas .value').textContent = 'R$ ' + data.totais.receitas.toFixed(2).replace('.', ',');
            document.querySelector('.card.despesas .value').textContent = 'R$ ' + data.totais.despesas.toFixed(2).replace('.', ',');
            document.querySelector('.card.saldo .value').textContent = 'R$ ' + data.totais.saldo.toFixed(2).replace('.', ',');

            document.querySelector('.health-indicator').style.width = data.saude_financeira + '%';

            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';
            if (data.ultimas_transacoes.length === 0) {
                tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Nenhuma transação encontrada</td></tr>';
            } else {
                data.ultimas_transacoes.forEach(t => {
                    const row = document.createElement('tr');
                    const valorFormatado = 'R$ ' + parseFloat(t.valor).toFixed(2).replace('.', ',');
                    const icone = t.tipo === 'receita' ? '⬆' : '⬇';
                    row.innerHTML = `<td>${t.descricao}</td><td>${valorFormatado}</td><td>${t.data}</td><td>${icone} ${t.tipo}</td>`;
                    tbody.appendChild(row);
                });
            }

            carregarGraficos();
        } catch (err) {
            console.error('Erro ao carregar dashboard:', err);
        }
    }

    // ===== GRÁFICOS =====
    async function carregarGraficos() {
        try {
            // Destroi gráficos existentes antes de recriar
            if (donutChartInstance) {
                donutChartInstance.destroy();
                donutChartInstance = null;
            }
            if (barChartInstance) {
                barChartInstance.destroy();
                barChartInstance = null;
            }

            // Donut
            const donutRes = await fetch('http://localhost:5000/api/graficos/donut', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const donutData = await donutRes.json();

            if (donutData.labels && donutData.labels.length > 0) {
                donutChartInstance = new Chart(document.getElementById('donutChart'), {
                    type: 'doughnut',
                    data: {
                        labels: donutData.labels,
                        datasets: [{
                            data: donutData.data,
                            backgroundColor: ['#279975', '#e74c3c', '#f1c40f', '#3498db', '#9b59b6', '#e67e22']
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
                });
            }

            // Barras
            const barRes = await fetch('http://localhost:5000/api/graficos/barras', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const barData = await barRes.json();

            if (barData.labels && barData.labels.length > 0) {
                barChartInstance = new Chart(document.getElementById('barChart'), {
                    type: 'bar',
                    data: {
                        labels: barData.labels,
                        datasets: [
                            { label: 'Receitas', data: barData.receitas, backgroundColor: '#279975' },
                            { label: 'Gastos', data: barData.gastos, backgroundColor: '#e74c3c' }
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
        let v = e.target.value.replace(/\D/g, '');
        if (v.length === 0) { e.target.value = ''; return; }
        v = (parseInt(v) / 100).toFixed(2);
        e.target.value = v.replace('.', ',');
    });

    // Formatação da data DD/MM/AAAA
    function formatarData(input) {
        input.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
            if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5, 9);
            e.target.value = v;
        });
    }
    formatarData(inputData);
    formatarData(inputVencimento);

    // Selecionar categoria
    categorias.forEach(btn => {
        btn.addEventListener('click', function() {
            categorias.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            categoriaSelecionada = this.dataset.categoria;
        });
    });

    // Toggle recorrente
    toggleRecorrente.addEventListener('change', function() {
        recorrenteDetalhes.style.display = this.checked ? 'block' : 'none';
        if (!this.checked) {
            document.getElementById('select-frequencia').value = 'Mensal';
            inputVencimento.value = '';
        }
    });

    // Salvar transação
    btnSalvar.addEventListener('click', async function() {
        const valorRaw = inputValor.value.replace(',', '.');
        const valor = parseFloat(valorRaw);
        const dataRaw = inputData.value;
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
            descricao: descricao,
            valor: valor,
            tipo: tipoSelecionado,
            categoria: categoriaSelecionada,
            data: dataFormatada
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
                carregarDashboard();
            } else {
                const err = await res.json();
                alert('Erro: ' + (err.erro || err.message));
            }
        } catch (err) {
            alert('Erro ao salvar transação.');
            console.error(err);
        }
    });

    // Avatar / Logout
    document.querySelector('.avatar').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // Iniciar
    carregarDashboard();
});