document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovaMovimentacao = document.getElementById('btnNovaMovimentacao');
    const containerMovimentacoes = document.getElementById('containerMovimentacoes');
    
    let movimentacoes = JSON.parse(localStorage.getItem('catPlanMovimentacoes')) || [];
    let contasCadastradas = JSON.parse(localStorage.getItem('catPlanContasBancarias')) || [];

    // Função inteligente: aceita tanto o número da lista quanto o nome digitado
    function resolverNomeConta(input) {
        if (!input) return "";
        input = input.trim();
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= contasCadastradas.length) {
            return contasCadastradas[num - 1].nome;
        }
        return input;
    }

    if (btnNovaMovimentacao) {
        btnNovaMovimentacao.addEventListener('click', () => {
            if (contasCadastradas.length === 0) {
                alert("Cadastre pelo menos uma conta ou forma de pagamento antes de registrar movimentações!");
                window.location.href = 'contas-banco.html';
                return;
            }

            const tipoEscolha = prompt("Digite o tipo:\n1 - Entrada (Ganho)\n2 - Transferência (Entre contas)");
            if (!tipoEscolha) return;

            let tipoFinal = "";
            let contaOrigem = "-";
            let contaDestino = "-";

            let textoContas = "Suas contas cadastradas:\n";
            contasCadastradas.forEach((c, idx) => {
                textoContas += `${idx + 1} - ${c.nome}\n`;
            });

            if (tipoEscolha.trim() === "1") {
                tipoFinal = "ENTRADA (GANHO)";
                const inputConta = prompt(textoContas + "\nDigite o NÚMERO ou o NOME da conta onde o dinheiro vai entrar:");
                if (!inputConta) return;
                contaDestino = resolverNomeConta(inputConta);
            } 
            else if (tipoEscolha.trim() === "2") {
                tipoFinal = "TRANSFERÊNCIA";
                const inputOrigem = prompt(textoContas + "\nDigite o NÚMERO ou o NOME da conta de ORIGEM (de onde sai):");
                if (!inputOrigem) return;
                contaOrigem = resolverNomeConta(inputOrigem);

                const inputDestino = prompt(textoContas + "\nDigite o NÚMERO ou o NOME da conta de DESTINO (para onde vai):");
                if (!inputDestino) return;
                contaDestino = resolverNomeConta(inputDestino);
            } else {
                alert("Opção inválida.");
                return;
            }

            const descricao = prompt("Descrição (Ex: Salário, Pix para Poupança):");
            if (!descricao) return;

            const quantidade = prompt("Qual é a quantidade/valor? (Ex: 150.00)");
            if (!quantidade) return;

            const dataAtual = new Date();
            const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

            const novaMov = {
                id: Date.now(),
                tipo: tipoFinal,
                descricao: descricao.trim(),
                valor: parseFloat(quantidade.replace(',', '.')) || 0,
                contaOrigem: contaOrigem,
                contaDestino: contaDestino,
                data: dataFormatada
            };

            movimentacoes.unshift(novaMov);
            salvarERenderizarMovimentacoes();
        });
    }

    function salvarERenderizarMovimentacoes() {
        localStorage.setItem('catPlanMovimentacoes', JSON.stringify(movimentacoes));
        containerMovimentacoes.innerHTML = '';

        movimentacoes.forEach(mov => {
            const divMov = document.createElement('div');
            divMov.className = 'card-movimentacao';
            
            let infoContas = "";
            if (mov.tipo === "TRANSFERÊNCIA") {
                infoContas = `<div class="mov-linha">Origem ➔ Destino: <span>${mov.contaOrigem} ➔ ${mov.contaDestino}</span></div>`;
            } else {
                infoContas = `<div class="mov-linha">Conta: <span>${mov.contaDestino || mov.conta}</span></div>`;
            }

            divMov.innerHTML = `
                <div style="display: flex; align-items: center; width: 100%; margin-bottom: 12px; position: relative;">
                    <div class="mov-titulo" style="margin-bottom: 0; width: 100%; text-align: center;">${mov.tipo}</div>
                    <img src="lixo.png" class="end-delete-btn" data-id="${mov.id}" title="Excluir" style="width: 20px; cursor: pointer; position: absolute; right: 18px;">
                </div>
                
                <div class="mov-linha">Descrição: <span>${mov.descricao}</span></div>
                <div class="mov-linha">Quantidade: <span>R$ ${mov.valor.toFixed(2)}</span></div>
                ${infoContas}
                <div class="mov-linha" style="margin-top: 5px;">Data: <span>${mov.data}</span></div>
            `;
            containerMovimentacoes.appendChild(divMov);
        });

        document.querySelectorAll('.end-delete-btn').forEach(btn => {
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
