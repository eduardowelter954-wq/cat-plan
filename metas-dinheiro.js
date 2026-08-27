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

            const valorAtual = prompt(`Quanto você já tem guardado para '${titulo}'?`, "0");

            const novaMeta = {
                id: Date.now(),
                titulo: titulo.trim().toUpperCase(),
                meta: parseFloat(valorMeta) || 0,
                atual: parseFloat(valorAtual) || 0
            };

            metas.push(novaMeta);
            salvarERenderizarMetas();
        });
    }

    function salvarERenderizarMetas() {
        localStorage.setItem('catPlanMetasDinheiro', JSON.stringify(metas));
        containerMetas.innerHTML = '';

        metas.forEach(meta => {
            // A matemática para descobrir quanto falta:
            let falta = meta.meta - meta.atual;
            if (falta < 0) falta = 0; // Se passou da meta, falta 0!

            const divMeta = document.createElement('div');
            divMeta.className = 'card-dinheiro card-meta';
            
            divMeta.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; text-transform: uppercase;">
                    <span style="font-size: 16px; margin-bottom: 5px;">FALTA: ${falta}</span>
                    <img src="icone-check.png" class="check-meta-btn" data-id="${meta.id}" style="width: 22px; cursor: pointer; margin-bottom: 5px;" title="Concluir">
                </div>
                <div class="meta-valores">
                    ${meta.atual} / ${meta.meta}
                </div>
                <div class="meta-footer">
                    <span>FALTA: ${falta}</span>
                    <img src="icone-check.png" class="check-meta-btn" data-id="${meta.id}" style="width: 30px; cursor: pointer;" title="Concluir/Excluir">
                </div>
            `;
            containerMetas.appendChild(divMeta);
        });

        // Adiciona funcionalidade aos botões que acabaram de ser criados
        document.querySelectorAll('.edit-meta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                editarMeta(id);
            });
        });

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

    function editarMeta(id) {
        const index = metas.findIndex(m => m.id === id);
        if (index === -1) return;

        let novoTitulo = prompt("Editar nome da meta:", metas[index].titulo);
        if (novoTitulo === null) return;

        let novoAtual = prompt(`Quanto você tem guardado agora para '${novoTitulo}'?`, metas[index].atual);
        if (novoAtual === null) return;

        let novaMeta = prompt(`Qual é o objetivo total para '${novoTitulo}'?`, metas[index].meta);
        if (novaMeta === null) return;

        metas[index].titulo = novoTitulo.trim().toUpperCase();
        metas[index].atual = parseFloat(novoAtual) || 0;
        metas[index].meta = parseFloat(novaMeta) || 0;

        salvarERenderizarMetas();
    }

    // Inicializa a tela
    atualizarTelaPoupanca();
    salvarERenderizarMetas();
});
