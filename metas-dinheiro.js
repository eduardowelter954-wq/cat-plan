document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovaMeta = document.getElementById('btnNovaMeta');
    const containerMetas = document.getElementById('containerMetas');
    
    let metas = JSON.parse(localStorage.getItem('catPlanMetasDinheiro')) || [];

    if (btnNovaMeta) {
        btnNovaMeta.addEventListener('click', () => {
            const titulo = prompt("Qual o nome da meta ou poupança? (Ex: PC, Viagem, Reserva)");
            if (!titulo) return;

            const valorAlvo = prompt(`Qual o valor alvo/total para '${titulo}'? (Ex: 5000)`);
            if (!valorAlvo) return;

            const novaMeta = {
                id: Date.now(),
                titulo: titulo.trim(),
                alvo: parseFloat(valorAlvo.replace(',', '.')) || 0,
                concluida: false
            };

            metas.push(novaMeta);
            salvarERenderizarMetas();
        });
    }

    function salvarERenderizarMetas() {
        localStorage.setItem('catPlanMetasDinheiro', JSON.stringify(metas));
        containerMetas.innerHTML = '';

        // Puxa os gastos para somar quanto já foi depositado/gasto em cada meta
        const gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];

        metas.forEach(meta => {
            const divMeta = document.createElement('div');
            divMeta.className = 'card-meta';
            divMeta.style.position = 'relative';

            // Soma todos os gastos que possuem o nome exato desta meta
            let valorAtual = 0;
            gastos.forEach(g => {
                if (g.meta && g.meta.trim().toLowerCase() === meta.titulo.trim().toLowerCase()) {
                    valorAtual += g.valor;
                }
            });

            const falta = meta.alvo - valorAtual;

            divMeta.innerHTML = `
                <img src="lixo.png" class="delete-meta-btn" data-id="${meta.id}" style="position: absolute; top: 12px; right: 12px; width: 18px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Apagar meta">
                
                <div class="meta-titulo">${meta.titulo}</div>
                <div style="font-size: 16px; font-weight: bold; margin: 6px 0;">${valorAtual.toFixed(0)} / ${meta.alvo.toFixed(0)}</div>
                <div style="font-size: 11px; color: #444;">FALTA: ${falta.toFixed(0)}</div>
            `;
            containerMetas.appendChild(divMeta);
        });

        // Evento para excluir meta
        document.querySelectorAll('.delete-meta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Deseja apagar esta meta permanentemente?")) {
                    metas = metas.filter(m => m.id !== id);
                    salvarERenderizarMetas();
                }
            });
        });
    }

    salvarERenderizarMetas();
});
