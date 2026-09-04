document.addEventListener("DOMContentLoaded", () => {
    
    const btnNovoGasto = document.getElementById('btnNovoGasto');
    const containerGastos = document.getElementById('containerGastos');
    
    let gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];

    function resolverNome(input, lista) {
        if (!input) return "";
        input = input.trim();
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= lista.length) {
            return lista[num - 1].nome || lista[num - 1].titulo;
        }
        return input;
    }

    if (btnNovoGasto) {
        btnNovoGasto.addEventListener('click', () => {
            const titulo = prompt("O que você comprou? (Ex: Queijo, Lanche, Chocolate)");
            if (!titulo) return;

            const valor = prompt(`Qual foi o valor gasto com '${titulo}'? (Ex: 15.50)`);
            if (!valor) return;

            // Novo menu de seleção do tipo de gasto
            const tipoEscolha = prompt("Selecione o tipo de gasto:\n1 - Necessário\n2 - Extra\n3 - Alimentar\n4 - Outro (Digitar manualmente)");
            if (!tipoEscolha) return;

            let tipoFinal = "";
            if (tipoEscolha.trim() === "1") {
                tipoFinal = "necessário";
            } else if (tipoEscolha.trim() === "2") {
                tipoFinal = "extra";
            } else if (tipoEscolha.trim() === "3") {
                tipoFinal = "alimentar";
            } else if (tipoEscolha.trim() === "4") {
                const tipoCustom = prompt("Digite o tipo de gasto:");
                if (!tipoCustom || tipoCustom.trim() === "") return;
                tipoFinal = tipoCustom.trim().toLowerCase();
            } else {
                alert("Opção inválida. Operação cancelada.");
                return;
            }

            // Puxa as contas cadastradas
            const contasCadastradas = JSON.parse(localStorage.getItem('catPlanContasBancarias')) || [];
            let textoContas = "Suas contas cadastradas:\n";
            contasCadastradas.forEach((c, idx) => {
                textoContas += `${idx + 1} - ${c.nome}\n`;
            });

            const inputConta = prompt(textoContas + "\nDigite o NÚMERO ou o NOME da conta de origem (de onde sai o dinheiro):");
            if (!inputConta) return;
            const contaOrigemFinal = resolverNome(inputConta, contasCadastradas);

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

            const dataAtual = new Date();
            const dataFormatada = `${String(dataAtual.getDate()).padStart(2, '0')}/${String(dataAtual.getMonth() + 1).padStart(2, '0')}/${dataAtual.getFullYear()}`;

            const novoGasto = {
                id: Date.now(),
                titulo: titulo.trim(),
                valor: parseFloat(valor.replace(',', '.')) || 0,
                tipo: tipoFinal,
                conta: contaOrigemFinal,
                meta: metaFinal,
                data: dataFormatada
            };

            gastos.unshift(novoGasto);
            salvarERenderizarGastos();
        });
    }

    function salvarERenderizarGastos() {
        localStorage.setItem('catPlanGastos', JSON.stringify(gastos));
        containerGastos.innerHTML = '';

        gastos.forEach(gasto => {
            const divGasto = document.createElement('div');
            divGasto.className = 'card-gasto';
            divGasto.style.position = 'relative';
            
            const linhaMeta = (gasto.meta.toLowerCase() !== 'não' && gasto.meta !== '') 
                ? `<div class="gasto-linha">Foi para meta/poupança: <span>${gasto.meta}</span></div>` 
                : '';

            divGasto.innerHTML = `
                <img src="lixo.png" class="delete-gasto-btn" data-id="${gasto.id}" style="position: absolute; top: 15px; right: 15px; width: 20px; cursor: pointer; opacity: 0.7;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'" title="Apagar registro">
                
                <div class="gasto-titulo">${gasto.titulo} - R$ ${gasto.valor.toFixed(2)}</div>
                <div class="gasto-linha">Tipo de gasto: <span>${gasto.tipo}</span></div>
                <div class="gasto-linha">Conta de origem: <span>${gasto.conta || 'Não informada'}</span></div>
                ${linhaMeta}
                <div class="gasto-linha">Data: <span>${gasto.data}</span></div>
            `;
            containerGastos.appendChild(divGasto);
        });

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
