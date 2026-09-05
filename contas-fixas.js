document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovaConta = document.getElementById('btnNovaConta');
    const containerContas = document.getElementById('containerContas');
    
    let contas = JSON.parse(localStorage.getItem('catPlanContasFixas')) || [];

    // Função inteligente: aceita número da lista ou nome digitado
    function resolverNomeConta(input, contasCadastradas) {
        if (!input) return "";
        input = input.trim();
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= contasCadastradas.length) {
            return contasCadastradas[num - 1].nome;
        }
        return input;
    }

    if (btnNovaConta) {
        btnNovaConta.addEventListener('click', () => {
            const titulo = prompt("Qual o nome da conta? (Ex: Móvel pagar, Internet)");
            if (!titulo) return;

            const meses = prompt("Quantos meses para acabar? (Digite 0 se for uma conta contínua sem fim)");
            if (meses === null) return;
            const totalMeses = parseInt(meses) || 0;

            const valor = prompt("Qual o valor mensal?");
            if (!valor) return;

            // Puxa as contas cadastradas no banco
            const contasCadastradas = JSON.parse(localStorage.getItem('catPlanContasBancarias')) || [];
            let textoContas = "Suas contas cadastradas:\n";
            contasCadastradas.forEach((c, idx) => {
                textoContas += `${idx + 1} - ${c.nome}\n`;
            });

            const inputPagamento = prompt(textoContas + "\nDigite o NÚMERO ou o NOME da conta de onde sai o dinheiro:");
            if (!inputPagamento) return;
            const formaPagamentoFinal = resolverNomeConta(inputPagamento, contasCadastradas);

            // Puxa as metas cadastradas
            const metasCadastradas = JSON.parse(localStorage.getItem('catPlanMetasDinheiro')) || [];
            let textoMetas = "Suas metas cadastradas:\n0 - Nenhuma / Não\n";
            metasCadastradas.forEach((m, idx) => {
                textoMetas += `${idx + 1} - ${m.titulo}\n`;
            });

            const inputMeta = prompt(textoMetas + "\nDigite o número da meta correspondente ou 'Não':");
            let metaFinal = "Não";
            if (inputMeta && inputMeta.trim().toLowerCase() !== 'não' && inputMeta.trim() !== '0') {
                const numMeta = parseInt(inputMeta);
                if (!isNaN(numMeta) && numMeta >= 1 && numMeta <= metasCadastradas.length) {
                    metaFinal = metasCadastradas[numMeta - 1].titulo;
                } else {
                    metaFinal = inputMeta.trim();
                }
            }

            const novaConta = {
                id: Date.now(),
                titulo: titulo.trim(),
                totalMeses: totalMeses,
                valorMensal: parseFloat(valor.replace(',', '.')) || 0,
                formaPagamento: formaPagamentoFinal,
                meta: metaFinal,
                mesesPagos: [],
                ativa: true
            };

            contas.push(novaConta);
            salvarERenderizarContas();
        });
    }

    function salvarERenderizarContas() {
        contas.sort((a, b) => (a.ativa === b.ativa) ? 0 : a.ativa ? -1 : 1);
        
        localStorage.setItem('catPlanContasFixas', JSON.stringify(contas));
        containerContas.innerHTML = '';

        contas.forEach(conta => {
            const divConta = document.createElement('div');
            divConta.className = 'card-conta';
            if (!conta.ativa) divConta.style.opacity = '0.6';

            const qtdPagos = conta.mesesPagos.length;
            const textoMes = conta.totalMeses > 0 ? `${qtdPagos}/${conta.totalMeses}` : `Contínuo (${qtdPagos} pagos)`;
            const valorTotal = conta.totalMeses > 0 ? (conta.totalMeses * conta.valorMensal).toFixed(2) : "Indefinido";
            const historico = conta.mesesPagos.length > 0 ? conta.mesesPagos.join(', ') : "Nenhum";
            const corStatus = conta.ativa ? 'status-verde' : 'status-vermelho';

            const linhaMeta = (conta.meta.toLowerCase() !== 'não' && conta.meta !== '') 
                ? `<div class="conta-linha">Para meta: <span>${conta.meta}</span></div>` 
                : '';

            divConta.innerHTML = `
                <div class="status-circle ${corStatus}" data-id="${conta.id}" title="Clique para Ativar/Inativar"></div>
                <img src="icone-editar.png" class="edit-conta-btn" data-id="${conta.id}" title="Editar Conta">
                
                <div class="conta-titulo">${conta.titulo}</div>
                <div class="conta-linha">Mês: <span>${textoMes}</span></div>
                <div class="conta-linha">Valor: <span>R$ ${conta.valorMensal.toFixed(2)} mensal</span></div>
                ${conta.totalMeses > 0 ? `<div class="conta-linha">Valor total: <span>R$ ${valorTotal}</span></div>` : ''}
                <div class="conta-linha">Saída: <span>${conta.formaPagamento}</span></div>
                ${linhaMeta}
                
                <div class="conta-linha" style="margin-top: 10px;">Meses pagos: <span>${historico}</span></div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    ${conta.ativa ? `<button class="btn-pagar-mes" data-id="${conta.id}">+ Dar baixa no mês</button>` : ''}
                </div>
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

        // Dar baixa no mês (Menu de seleção com mês e ano automáticos)
        document.querySelectorAll('.btn-pagar-mes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const index = contas.findIndex(c => c.id === id);
                if (index > -1) {
                    
                    const dataAtualSistema = new Date();
                    const anoAtual = dataAtualSistema.getFullYear();
                    const mesAtualNum = dataAtualSistema.getMonth() + 1; // Mês atual de 1 a 12
                    
                    const nomesMeses = [
                        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
                    ];
                    
                    const menu = "Selecione o mês que está pagando (digite o número):\n\n" +
                                 "1-Jan  |  2-Fev  |  3-Mar  |  4-Abr\n" +
                                 "5-Mai  |  6-Jun  |  7-Jul  |  8-Ago\n" +
                                 "9-Set  | 10-Out  | 11-Nov  | 12-Dez";

                    // Abre o prompt já sugerindo o número do mês que estamos agora!
                    const escolha = prompt(menu, mesAtualNum);

                    if (escolha) {
                        const numEscolhido = parseInt(escolha.trim());
                        
                        // Valida se a pessoa digitou um número correto (de 1 a 12)
                        if (!isNaN(numEscolhido) && numEscolhido >= 1 && numEscolhido <= 12) {
                            
                            // Puxa o nome da lista e adiciona o ano automaticamente
                            const mesFormatado = `${nomesMeses[numEscolhido - 1]}/${anoAtual}`;
                            
                            contas[index].mesesPagos.push(mesFormatado);
                            
                            // Registra o valor como gasto para atualizar o saldo da conta bancária escolhida
                            let gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];
                            const dataFormatada = `${String(dataAtualSistema.getDate()).padStart(2, '0')}/${String(mesAtualNum).padStart(2, '0')}/${anoAtual}`;
                            
                            gastos.unshift({
                                id: Date.now(),
                                titulo: `Conta Fixa: ${contas[index].titulo} (${mesFormatado})`,
                                valor: contas[index].valorMensal,
                                tipo: 'fixa',
                                conta: contas[index].formaPagamento,
                                meta: contas[index].meta,
                                data: dataFormatada
                            });
                            localStorage.setItem('catPlanGastos', JSON.stringify(gastos));

                            if (contas[index].totalMeses > 0 && contas[index].mesesPagos.length >= contas[index].totalMeses) {
                                alert("Parabéns! Você quitou essa conta. Ela será inativada.");
                                contas[index].ativa = false;
                            }
                            salvarERenderizarContas();
                            
                        } else {
                            alert("Opção inválida! Por favor, digite um número de 1 a 12 correspondente ao mês.");
                        }
                    }
                }
            });
        });

        // Clique no lápis (Editar ou Excluir)
        document.querySelectorAll('.edit-conta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const conta = contas.find(c => c.id === id);
                if (!conta) return;

                const acao = prompt(`O que deseja fazer com "${conta.titulo}"?\n1 - Editar dados\n2 - Excluir conta`);
                if (acao === "1") {
                    const novoNome = prompt("Novo nome:", conta.titulo);
                    if (novoNome) conta.titulo = novoNome.trim();
                    const novoValor = prompt("Novo valor mensal:", conta.valorMensal);
                    if (novoValor) conta.valorMensal = parseFloat(novoValor.replace(',', '.')) || conta.valorMensal;
                    salvarERenderizarContas();
                } else if (acao === "2") {
                    if (confirm("Deseja apagar esta conta fixa definitivamente?")) {
                        contas = contas.filter(c => c.id !== id);
                        salvarERenderizarContas();
                    }
                }
            });
        });
    }

    salvarERenderizarContas();
});
