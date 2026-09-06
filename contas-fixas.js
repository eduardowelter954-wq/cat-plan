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

            // NOVO: Pergunta a data de vencimento
            const vencimentoStr = prompt("Qual a data de vencimento? (Ex: 15/09/2026)\nDeixe em branco se não tiver data certa.");
            let vencimentoFinal = "";
            if (vencimentoStr && vencimentoStr.trim() !== "") {
                const p = vencimentoStr.split('/');
                if (p.length === 3) {
                    vencimentoFinal = `${p[2]}-${p[1]}-${p[0]}`; // Salva no padrão AAAA-MM-DD
                }
            }

            const contasCadastradas = JSON.parse(localStorage.getItem('catPlanContasBancarias')) || [];
            let textoContas = "Suas contas cadastradas:\n";
            contasCadastradas.forEach((c, idx) => {
                textoContas += `${idx + 1} - ${c.nome}\n`;
            });

            const inputPagamento = prompt(textoContas + "\nDigite o NÚMERO ou o NOME da conta de onde sai o dinheiro:");
            if (!inputPagamento) return;
            const formaPagamentoFinal = resolverNomeConta(inputPagamento, contasCadastradas);

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
                vencimento: vencimentoFinal, // Adicionado
                pagoNoMes: false,            // Controle da Agenda
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
            
            let valorTotalPago = 0;
            let historicoNomes = [];
            conta.mesesPagos.forEach(p => {
                if (typeof p === 'string') {
                    valorTotalPago += conta.valorMensal;
                    historicoNomes.push(p);
                } else {
                    valorTotalPago += p.valor;
                    historicoNomes.push(`${p.mes} (R$ ${p.valor.toFixed(2)})`);
                }
            });
            
            const historico = historicoNomes.length > 0 ? historicoNomes.join(', ') : "Nenhum";
            const corStatus = conta.ativa ? 'status-verde' : 'status-vermelho';

            // Montagem do Vencimento na tela
            let linhaVencimento = "";
            if (conta.vencimento) {
                const p = conta.vencimento.split('-');
                linhaVencimento = `<div class="conta-linha">Vencimento: <span>${p[2]}/${p[1]}/${p[0]}</span></div>`;
            }

            const linhaMeta = (conta.meta.toLowerCase() !== 'não' && conta.meta !== '') 
                ? `<div class="conta-linha">Para meta: <span>${conta.meta}</span></div>` 
                : '';
                
            let linhaFalta = '';
            if (conta.totalMeses > 0) {
                const falta = Math.max(0, (conta.totalMeses * conta.valorMensal) - valorTotalPago);
                linhaFalta = `<div class="conta-linha" style="color: #d32f2f; font-weight: bold;">Falta pagar: <span>R$ ${falta.toFixed(2)}</span></div>`;
            }

            // NOVO: Se a conta estiver paga no mês, exibe o botão para jogar pro próximo mês
            let botoesAcao = '';
            if (conta.ativa) {
                if (!conta.pagoNoMes) {
                    botoesAcao = `<button class="btn-pagar-mes" data-id="${conta.id}">+ Dar baixa no mês</button>`;
                } else {
                    botoesAcao = `<button class="btn-pagar-mes" style="background-color: #ffd54f;" data-restaurar-id="${conta.id}" title="Atualiza o vencimento e devolve para a agenda">Lançar p/ Próximo Mês</button>`;
                }
            }

            divConta.innerHTML = `
                <div class="status-circle ${corStatus}" data-id="${conta.id}" title="Clique para Ativar/Inativar"></div>
                <img src="icone-editar.png" class="edit-conta-btn" data-id="${conta.id}" title="Editar Conta">
                
                <div class="conta-titulo">${conta.titulo}</div>
                ${linhaVencimento}
                <div class="conta-linha">Mês: <span>${textoMes}</span></div>
                <div class="conta-linha">Valor base: <span>R$ ${conta.valorMensal.toFixed(2)} mensal</span></div>
                ${conta.totalMeses > 0 ? `<div class="conta-linha">Valor total esperado: <span>R$ ${valorTotal}</span></div>` : ''}
                ${linhaFalta}
                <div class="conta-linha">Saída: <span>${conta.formaPagamento}</span></div>
                ${linhaMeta}
                
                <div class="conta-linha" style="margin-top: 10px;">Meses pagos: <span>${historico}</span></div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    ${botoesAcao}
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

        // Dar baixa no mês (Remove da Agenda)
        document.querySelectorAll('.btn-pagar-mes[data-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const index = contas.findIndex(c => c.id === id);
                if (index > -1) {
                    
                    const dataAtualSistema = new Date();
                    const anoAtual = dataAtualSistema.getFullYear();
                    const mesAtualNum = dataAtualSistema.getMonth() + 1;
                    
                    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
                    
                    const menu = "Selecione o mês que está pagando (digite o número):\n\n" +
                                 "1-Jan  |  2-Fev  |  3-Mar  |  4-Abr\n" +
                                 "5-Mai  |  6-Jun  |  7-Jul  |  8-Ago\n" +
                                 "9-Set  | 10-Out  | 11-Nov  | 12-Dez";

                    const escolha = prompt(menu, mesAtualNum);

                    if (escolha) {
                        const numEscolhido = parseInt(escolha.trim());
                        
                        if (!isNaN(numEscolhido) && numEscolhido >= 1 && numEscolhido <= 12) {
                            const mesFormatado = `${nomesMeses[numEscolhido - 1]}/${anoAtual}`;
                            
                            const valorPagoStr = prompt(`Qual foi o valor pago referente a ${mesFormatado}?`, contas[index].valorMensal);
                            if (valorPagoStr === null) return;
                            const valorPago = parseFloat(valorPagoStr.replace(',', '.')) || contas[index].valorMensal;

                            contas[index].mesesPagos.push({ mes: mesFormatado, valor: valorPago });
                            
                            let gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];
                            const dataFormatada = `${String(dataAtualSistema.getDate()).padStart(2, '0')}/${String(mesAtualNum).padStart(2, '0')}/${anoAtual}`;
                            
                            gastos.unshift({
                                id: Date.now(),
                                titulo: `Conta Fixa: ${contas[index].titulo} (${mesFormatado})`,
                                valor: valorPago,
                                tipo: 'fixa',
                                conta: contas[index].formaPagamento,
                                meta: contas[index].meta,
                                data: dataFormatada
                            });
                            localStorage.setItem('catPlanGastos', JSON.stringify(gastos));

                            let totalPagoAgora = 0;
                            contas[index].mesesPagos.forEach(p => {
                                 totalPagoAgora += (typeof p === 'string') ? contas[index].valorMensal : p.valor;
                            });
                            
                            let msgAlerta = `Baixa de ${mesFormatado} registrada com sucesso no valor de R$ ${valorPago.toFixed(2)}!\nA conta foi removida do calendário deste mês.`;

                            if (contas[index].totalMeses > 0) {
                                 const totalEsperado = contas[index].totalMeses * contas[index].valorMensal;
                                 const falta = totalEsperado - totalPagoAgora;
                                 
                                 if (falta <= 0 || contas[index].mesesPagos.length >= contas[index].totalMeses) {
                                     msgAlerta += `\n\nParabéns! Você quitou essa conta. Ela será inativada e o seu controle fica em dia.`;
                                     contas[index].ativa = false;
                                 } else {
                                     msgAlerta += `\n\nAinda faltam R$ ${falta.toFixed(2)} para finalizar esta conta fixa.`;
                                 }
                            }

                            // NOVO: Define como paga no mês (Tira do Dashboard)
                            contas[index].pagoNoMes = true;

                            alert(msgAlerta);
                            salvarERenderizarContas();
                            
                        } else {
                            alert("Opção inválida! Por favor, digite um número de 1 a 12 correspondente ao mês.");
                        }
                    }
                }
            });
        });

        // Botão para jogar a conta para o próximo mês
        document.querySelectorAll('button[data-restaurar-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-restaurar-id'));
                const index = contas.findIndex(c => c.id === id);
                if (index > -1) {
                    
                    // Avança 1 mês no vencimento automaticamente
                    if (contas[index].vencimento) {
                        const p = contas[index].vencimento.split('-');
                        let dataObj = new Date(p[0], parseInt(p[1]) - 1, p[2]);
                        dataObj.setMonth(dataObj.getMonth() + 1);
                        
                        let novoAno = dataObj.getFullYear();
                        let novoMes = String(dataObj.getMonth() + 1).padStart(2, '0');
                        let novoDia = String(dataObj.getDate()).padStart(2, '0');
                        
                        contas[index].vencimento = `${novoAno}-${novoMes}-${novoDia}`;
                    }

                    // Traz de volta para a Agenda
                    contas[index].pagoNoMes = false; 
                    salvarERenderizarContas();
                    alert("A conta voltou para a agenda do próximo mês!");
                }
            });
        });

        // Clique no lápis (Editar)
        document.querySelectorAll('.edit-conta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const conta = contas.find(c => c.id === id);
                if (!conta) return;

                const acao = prompt(`O que deseja fazer com "${conta.titulo}"?\n1 - Editar dados da conta\n2 - Excluir conta`);
                if (acao === "1") {
                    const novoNome = prompt("Novo nome:", conta.titulo);
                    if (novoNome) conta.titulo = novoNome.trim();
                    
                    const novoValor = prompt("Novo valor mensal base:", conta.valorMensal);
                    if (novoValor) conta.valorMensal = parseFloat(novoValor.replace(',', '.')) || conta.valorMensal;

                    // Editar Vencimento
                    const dataAtualStr = conta.vencimento ? conta.vencimento.split('-').reverse().join('/') : '';
                    const novoVencimento = prompt("Nova data de vencimento (DD/MM/AAAA) ou deixe em branco:", dataAtualStr);
                    if (novoVencimento !== null) {
                        if (novoVencimento.trim() === '') {
                            conta.vencimento = "";
                        } else {
                            const p = novoVencimento.split('/');
                            if (p.length === 3) conta.vencimento = `${p[2]}-${p[1]}-${p[0]}`;
                        }
                    }

                    const novoMeses = prompt("Nova quantidade TOTAL de parcelas/meses (Digite 0 se for uma conta contínua):", conta.totalMeses);
                    if (novoMeses !== null) conta.totalMeses = parseInt(novoMeses) || 0;

                    salvarERenderizarContas();
                } else if (acao === "2") {
                    if (confirm("Deseja apagar esta conta fixa definitivamente? Isso não apagará os gastos passados já descontados do saldo.")) {
                        contas = contas.filter(c => c.id !== id);
                        salvarERenderizarContas();
                    }
                }
            });
        });
    }

    salvarERenderizarContas();
});
