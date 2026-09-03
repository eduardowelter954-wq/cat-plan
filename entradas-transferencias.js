document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovaMovimentacao = document.getElementById('btnNovaMovimentacao');
    const containerMovimentacoes = document.getElementById('containerMovimentacoes');
    
    let movimentacoes = JSON.parse(localStorage.getItem('catPlanMovimentacoes')) || [];
    // Puxa as contas cadastradas na aba anterior
    let contasCadastradas = JSON.parse(localStorage.getItem('catPlanContasBancarias')) || [];

    if (btnNovaMovimentacao) {
        btnNovaMovimentacao.addEventListener('click', () => {
            
            const tipo = prompt("É uma 'Entrada' (ganho) ou 'Transferência' (entre contas)?");
            if (!tipo) return;
            const tipoFormatado = tipo.trim().toLowerCase();
            
            if (tipoFormatado !== 'entrada' && tipoFormatado !== 'transferência' && tipoFormatado !== 'transferencia') {
                alert("Digite exatamente 'Entrada' ou 'Transferência'.");
                return;
            }

            const descricao = prompt("Descrição (Ex: Salário, Mesada, Pix para Poupança):");
            if (!descricao) return;

            const quantidade = prompt("Qual é a quantidade/valor? (Ex: 150.00)");
            if (!quantidade) return;

            // Monta a lista de opções de contas cadastradas para o usuário escolher
            let listaOpcoesText = "Contas disponíveis:\n";
            contasCadastradas.forEach((c, index) => {
                listaOpcoesText += `${index + 1} - ${c.nome}\n`;
            });
            listaOpcoesText += `Digite o NOME da conta ou origem/destino:`;

            let contaOrigemDestino = prompt(listaOpcoesText);
            if (!contaOrigemDestino) return;

            // Data atual formatada (DD/MM/AAAA)
            const dataAtual = new Date();
            const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

            const novaMov = {
                id: Date.now(),
                tipo: tipoFormatado === 'entrada' ? 'Entrada (Ganho)' : 'Transferência',
                descricao: descricao.trim(),
                valor: parseFloat(quantidade.replace(',', '.')) || 0,
                conta: contaOrigemDestino.trim(),
                data: dataFormatada
            };

            movimentacoes.unshift(novaMov); // Joga para o topo
            salvarERenderizarMovimentacoes();
        });
    }

// --- LÓGICA DE RENDERIZAR E EXCLUIR ---
    function salvarERenderizarMovimentacoes() {
        localStorage.setItem('catPlanMovimentacoes', JSON.stringify(movimentacoes));
        containerMovimentacoes.innerHTML = '';

        movimentacoes.forEach(mov => {
            const divMov = document.createElement('div');
            divMov.className = 'card-movimentacao';
            
            divMov.innerHTML = `
                <!-- Cabeçalho flexível para alinhar o título no centro e o lixo na direita perfeitamente dentro do cartão -->
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;">
                    <div style="width: 20px;"></div> <!-- Espaçador invisível para manter o título perfeitamente centralizado -->
                    <div class="mov-titulo" style="margin-bottom: 0; flex-grow: 1; text-align: center;">${mov.tipo}</div>
                    <img src="lixo.png" class="delete-mov-btn" data-id="${mov.id}" title="Excluir" style="width: 20px; cursor: pointer;">
                </div>
                
                <div class="mov-linha">Descrição: <span>${mov.descricao}</span></div>
                <div class="mov-linha">Quantidade: <span>R$ ${mov.valor.toFixed(2)}</span></div>
                <div class="mov-linha">Conta / Movimento: <span>${mov.conta}</span></div>
                <div class="mov-linha" style="margin-top: 5px;">Data: <span>${mov.data}</span></div>
            `;
            containerMovimentacoes.appendChild(divMov);
        });

        // Evento para excluir registro
        document.querySelectorAll('.delete-mov-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Deseja apagar este registro de movimentação?")) {
                    movimentacoes = movimentacoes.filter(m => m.id !== id);
                    salvarERenderizarMovimentacoes();
                }
            });
        });
    }

    salvarERenderizarMovimentacoes();
});
