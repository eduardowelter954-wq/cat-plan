document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovaConta = document.getElementById('btnNovaConta');
    const containerContas = document.getElementById('containerContas');
    
    let contas = JSON.parse(localStorage.getItem('catPlanContasFixas')) || [];

    if (btnNovaConta) {
        btnNovaConta.addEventListener('click', () => {
            const titulo = prompt("Qual o nome da conta? (Ex: Móvel pagar, Internet)");
            if (!titulo) return;

            const meses = prompt("Quantos meses para acabar? (Digite 0 se for uma conta contínua sem fim)");
            if (meses === null) return;
            const totalMeses = parseInt(meses) || 0;

            const valor = prompt("Qual o valor mensal?");
            if (!valor) return;

            const formaPagamento = prompt("De onde sai o dinheiro? (Ex: Conta Nubank, Dinheiro físico)");
            if (!formaPagamento) return;

            const meta = prompt("Para meta/poupança? (Responda 'Não' ou o nome da meta)");

            const novaConta = {
                id: Date.now(),
                titulo: titulo.trim(),
                totalMeses: totalMeses,
                valorMensal: parseFloat(valor.replace(',', '.')) || 0,
                formaPagamento: formaPagamento.trim(),
                meta: meta ? meta.trim() : "Não",
                mesesPagos: [], // Histórico de meses
                ativa: true // Começa verde por padrão
            };

            contas.push(novaConta);
            salvarERenderizarContas();
        });
    }

    function salvarERenderizarContas() {
        // Ordena: Contas ativas (true) ficam no topo, inativas (false) vão pro final
        contas.sort((a, b) => (a.ativa === b.ativa) ? 0 : a.ativa ? -1 : 1);
        
        localStorage.setItem('catPlanContasFixas', JSON.stringify(contas));
        containerContas.innerHTML = '';

        contas.forEach(conta => {
            const divConta = document.createElement('div');
            // Se inativa, deixa a caixa um pouco transparente para dar visual de "desativada"
            divConta.className = 'card-conta';
            if (!conta.ativa) divConta.style.opacity = '0.6';

            // Cálculos
            const qtdPagos = conta.mesesPagos.length;
            const textoMes = conta.totalMeses > 0 ? `${qtdPagos}/${conta.totalMeses}` : `Contínuo (${qtdPagos} pagos)`;
            const valorTotal = conta.totalMeses > 0 ? (conta.totalMeses * conta.valorMensal).toFixed(2) : "Indefinido";
            const historico = conta.mesesPagos.length > 0 ? conta.mesesPagos.join(', ') : "Nenhum";
            const corStatus = conta.ativa ? 'status-verde' : 'status-vermelho';

            // Só exibe a meta se for diferente de "Não"
            const linhaMeta = (conta.meta.toLowerCase() !== 'não' && conta.meta !== '') 
                ? `<div class="conta-linha">Para meta: <span>${conta.meta}</span></div>` 
                : '';

            divConta.innerHTML = `
                <div class="status-circle ${corStatus}" data-id="${conta.id}" title="Clique para Ativar/Inativar"></div>
                <img src="icone-editar.png" class="edit-conta-btn" data-id="${conta.id}" title="Editar / Excluir">
                
                <div class="conta-titulo">${conta.titulo}</div>
                <div class="conta-linha">Mês: <span>${textoMes}</span></div>
                <div class="conta-linha">Valor: <span>R$ ${conta.valorMensal.toFixed(2)} mensal</span></div>
                ${conta.totalMeses > 0 ? `<div class="conta-linha">Valor total: <span>R$ ${valorTotal}</span></div>` : ''}
                <div class="conta-linha">Saída: <span>${conta.formaPagamento}</span></div>
                ${linhaMeta}
                
                <div class="conta-linha" style="margin-top: 10px;">Meses pagos: <span>${historico}</span></div>
                
                ${conta.ativa ? `<button class="btn-pagar-mes" data-id="${conta.id}">+ Dar baixa no mês</button>` : ''}
            `;
            containerContas.appendChild(divConta);
        });

        // Clique na bolinha para Ativar/Inativar
        document.querySelectorAll('.status-circle').forEach(circle => {
            circle.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const index = contas.findIndex(c => c.id === id);
                if (index > -1) {
                    contas[index].ativa = !contas[index].ativa;
                    salvarERenderizarContas();
                }
            });
        });

        // Clique para dar baixa no mês
        document.querySelectorAll('.btn-pagar-mes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const index = contas.findIndex(c => c.id === id);
                if (index > -1) {
                    const mes = prompt("Qual mês você está pagando? (Ex: Agosto, Setembro/2026)");
                    if (mes) {
                        contas[index].mesesPagos.push(mes.trim());
                        
                        // Se atingiu o limite de meses, sugere inativar a conta
                        if (contas[index].totalMeses > 0 && contas[index].mesesPagos.length >= contas[index].totalMeses) {
                            alert("Parabéns! Você quitou essa conta. Ela será inativada e movida para o final da lista.");
                            contas[index].ativa = false;
                        }
                        salvarERenderizarContas();
                    }
                }
            });
        });

        // Clique no lápis (Editar ou Excluir)
        document.querySelectorAll('.edit-conta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Deseja apagar esta conta fixa definitivamente?")) {
                    contas = contas.filter(c => c.id !== id);
                    salvarERenderizarContas();
                }
            });
        });
    }

    salvarERenderizarContas();
});
