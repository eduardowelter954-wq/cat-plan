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
            
            // Estilização robusta para o cartão não achatar
            divMeta.style.border = "3px solid #000";
            divMeta.style.borderRadius = "16px";
            divMeta.style.backgroundColor = "#c8e6c9"; // Verde claro padrão
            divMeta.style.padding = "20px";
            divMeta.style.width = "320px";
            divMeta.style.minHeight = "110px";
            divMeta.style.position = 'relative';
            divMeta.style.boxShadow = "3px 3px 0px rgba(0,0,0,0.15)";
            divMeta.style.display = "flex";
            divMeta.style.flexDirection = "column";
            divMeta.style.justifyContent = "center";
            divMeta.style.gap = "8px";

            // Soma todos os gastos que possuem o nome exato desta meta
            let valorAtual = 0;
            gastos.forEach(g => {
                if (g.meta && g.meta.trim().toLowerCase() === meta.titulo.trim().toLowerCase()) {
                    valorAtual += g.valor;
                }
            });

            const falta = meta.alvo - valorAtual;

            divMeta.innerHTML = `
                <img src="lixo.png" class="delete-meta-btn" data-id="${meta.id}" style="position: absolute; top: 15px; right: 15px; width: 20px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Apagar meta">
                
                <div style="font-weight: bold; font-size: 16px; color: #000; text-transform: uppercase; padding-right: 25px;">${meta.titulo}</div>
                <div style="font-size: 22px; font-weight: bold; color: #111;">R$ ${valorAtual.toFixed(2)} / R$ ${meta.alvo.toFixed(2)}</div>
                ${falta > 0 ? `<div style="font-size: 13px; font-weight: bold; color: #444;">FALTA: R$ ${falta.toFixed(2)}</div>` : `<div style="font-size: 13px; color: #2e7d32; font-weight: bold;">META ATINGIDA! 🎉</div>`}
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
