document.addEventListener("DOMContentLoaded", () => {
    
    // --- LÓGICA DA POUPANÇA ---
    const btnEditarPoupanca = document.getElementById('btnEditarPoupanca');
    const textoPoupanca = document.getElementById('textoPoupanca');

    let poupanca = JSON.parse(localStorage.getItem('catPlanPoupanca')) || { atual: 0, objetivo: 0 };

    function atualizarTelaPoupanca() {
        if (textoPoupanca) {
            textoPoupanca.innerText = `${poupanca.atual} / ${poupanca.objetivo}`;
        }
    }

    if (btnEditarPoupanca) {
        btnEditarPoupanca.addEventListener('click', () => {
            let novoAtual = prompt("Quanto você tem na poupança agora?", poupanca.atual);
            if (novoAtual === null) return;
            
            let novoObjetivo = prompt("Qual é a sua meta total da poupança?", poupanca.objetivo);
            if (novoObjetivo === null) return;

            poupanca.atual = parseFloat(novoAtual) || 0;
            poupanca.objetivo = parseFloat(novoObjetivo) || 0;
            
            localStorage.setItem('catPlanPoupanca', JSON.stringify(poupanca));
            atualizarTelaPoupanca();
        });
    }

    // --- LÓGICA DAS METAS ---
    const btnNovaMeta = document.getElementById('btnNovaMeta');
    const containerMetas = document.getElementById('containerMetas');
    
    let metas = JSON.parse(localStorage.getItem('catPlanMetasDinheiro')) || [];

    if (btnNovaMeta) {
        btnNovaMeta.addEventListener('click', () => {
            const titulo = prompt("Qual é o nome da nova meta? (Ex: PC Gamer, Viagem)");
            if (!titulo) return;

            const valorMeta = prompt(`Qual é o valor total que você precisa para '${titulo}'?`);
            if (!valorMeta) return;

            const novaMeta = {
                id: Date.now(),
                titulo: titulo.trim().toUpperCase(),
                meta: parseFloat(valorMeta) || 0
            };

            metas.push(novaMeta);
            salvarERenderizarMetas();
        });
    }

    function salvarERenderizarMetas() {
        localStorage.setItem('catPlanMetasDinheiro', JSON.stringify(metas));
        containerMetas.innerHTML = '';

        // Puxa os gastos salvos para somar automaticamente o progresso da meta
        const gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];

        metas.forEach(meta => {
            // Soma todos os gastos vinculados a esta meta
            let valorAtual = 0;
            gastos.forEach(g => {
                if (g.meta && g.meta.trim().toLowerCase() === meta.titulo.trim().toLowerCase()) {
                    valorAtual += g.valor;
                }
            });

            // A matemática para descobrir quanto falta:
            let falta = meta.meta - valorAtual;
            if (falta < 0) falta = 0; // Se passou da meta, falta 0!

            const divMeta = document.createElement('div');
            divMeta.className = 'card-dinheiro card-meta';
            
            divMeta.innerHTML = `
                <!-- TOPO: Título da meta -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span style="font-size: 18px; font-weight: bold; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${meta.titulo}</span>
                </div>
                
                <!-- MEIO: Valores (Atual / Meta) -->
                <div style="font-size: 20px; font-weight: normal; width: 100%; text-align: left; margin: 10px 0;">
                    ${valorAtual.toFixed(2)} / ${meta.meta.toFixed(2)}
                </div>
                
                <!-- RODAPÉ: Falta e Botão de Concluir -->
                <div style="display: flex; justify-content: space-between; align-items: center; text-transform: uppercase; width: 100%;">
                    <span style="font-size: 16px; white-space: nowrap;">FALTA: ${falta.toFixed(2)}</span>
                    <img src="icone-check.png" class="check-meta-btn" data-id="${meta.id}" style="width: 24px; cursor: pointer;" title="Concluir">
                </div>
            `;
            containerMetas.appendChild(divMeta);
        });

        // Adiciona funcionalidade ao botão de concluir / apagar
        document.querySelectorAll('.check-meta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Você atingiu essa meta ou deseja apagá-la?")) {
                    metas = metas.filter(m => m.id !== id);
                    salvarERenderizarMetas();
                }
            });
        });
    }

    // Inicializa a tela
    atualizarTelaPoupanca();
    salvarERenderizarMetas();
});
