document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovoGasto = document.getElementById('btnNovoGasto');
    const containerGastos = document.getElementById('containerGastos');
    
    // Puxa os gastos salvos no computador
    let gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];

    if (btnNovoGasto) {
        btnNovoGasto.addEventListener('click', () => {
            const titulo = prompt("O que você comprou? (Ex: Queijo, Lanche no suporte técnico, Mod de Euro Truck)");
            if (!titulo) return;

            const valor = prompt(`Qual foi o valor gasto com '${titulo}'? (Ex: 15.50)`);
            if (!valor) return;

            const tipo = prompt("Tipo de gasto: (Necessário, Extra ou Alimentar)");
            if (!tipo) return;

            const formaPagamento = prompt("Forma de pagamento: (Ex: Vale alimentação, Dinheiro físico, qual banco?)");
            if (!formaPagamento) return;

            const foiParaMeta = prompt("Foi para a poupança ou alguma meta? (Responda 'Não' ou o nome da meta)");

            // Captura e formata a data de hoje automaticamente (DD/MM/AAAA)
            const dataAtual = new Date();
            const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

            const novoGasto = {
                id: Date.now(),
                titulo: titulo.trim(),
                valor: parseFloat(valor.replace(',', '.')) || 0,
                tipo: tipo.trim().toLowerCase(),
                forma: formaPagamento.trim(),
                meta: foiParaMeta ? foiParaMeta.trim() : "Não",
                data: dataFormatada
            };

            gastos.push(novoGasto);
            salvarERenderizarGastos();
        });
    }

    function salvarERenderizarGastos() {
        localStorage.setItem('catPlanGastos', JSON.stringify(gastos));
        containerGastos.innerHTML = '';

        gastos.forEach(gasto => {
            const divGasto = document.createElement('div');
            divGasto.className = 'card-gasto';
            
            // Só exibe a linha de meta/poupança se você tiver digitado algo diferente de "Não"
            const linhaMeta = (gasto.meta.toLowerCase() !== 'não' && gasto.meta !== '') 
                ? `<div class="gasto-linha">Foi para meta/poupança: <span>${gasto.meta}</span></div>` 
                : '';

            divGasto.innerHTML = `
                <!-- Botão de check para excluir/concluir o registro -->
                <img src="icone-check.png" class="delete-gasto-btn" data-id="${gasto.id}" style="position: absolute; top: 15px; right: 15px; width: 24px; cursor: pointer;" title="Apagar registro">
                
                <div class="gasto-titulo">${gasto.titulo} - R$ ${gasto.valor.toFixed(2)}</div>
                <div class="gasto-linha">Tipo de gasto: <span>${gasto.tipo}</span></div>
                <div class="gasto-linha">Forma de pagamento: <span>${gasto.forma}</span></div>
                ${linhaMeta}
                <div class="gasto-linha">Data: <span>${gasto.data}</span></div>
            `;
            containerGastos.appendChild(divGasto);
        });

        // Funcionalidade para apagar o cartão ao clicar no check
        document.querySelectorAll('.delete-gasto-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Deseja apagar este registro de gasto?")) {
                    gastos = gastos.filter(g => g.id !== id);
                    salvarERenderizarGastos();
                }
            });
        });
    }

    salvarERenderizarGastos();
});
