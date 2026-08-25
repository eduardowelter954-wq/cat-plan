document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. CONFIGURAÇÕES DE PORCENTAGEM (LEGENDA)
    // ==========================================
    
    // Puxa as configurações salvas ou cria o padrão do seu design
    let config = JSON.parse(localStorage.getItem('catPlanFinancasConfig')) || {
        verdeMax: 60,
        vermelhoMin: 80
    };

    const legendaVermelha = document.getElementById('legendaVermelha');
    const legendaLaranja = document.getElementById('legendaLaranja');
    const legendaVerde = document.getElementById('legendaVerde');

    function atualizarLegenda() {
        // Calcula o Laranja automaticamente (Ex: se verde for 50 e vermelho 80, laranja é de 51 a 79)
        const laranjaMin = parseInt(config.verdeMax) + 1;
        const laranjaMax = parseInt(config.vermelhoMin) - 1;

        if (legendaVermelha) legendaVermelha.innerText = `Acima de ${config.vermelhoMin}%`;
        if (legendaLaranja) legendaLaranja.innerText = `de ${laranjaMin}% a ${laranjaMax}%`;
        if (legendaVerde) legendaVerde.innerText = `de 0% a ${config.verdeMax}%`;
    }

    // Editar o limite Verde (Gastos na meta)
    const btnEditVerde = document.getElementById('btnEditVerde');
    if (btnEditVerde) {
        btnEditVerde.addEventListener('click', () => {
            let novoVerde = prompt("Até qual porcentagem os gastos estão ideais (VERDE)?", config.verdeMax);
            novoVerde = parseInt(novoVerde);
            
            // Verifica se é um número válido e se não atropela o vermelho
            if (!isNaN(novoVerde) && novoVerde >= 0 && novoVerde < parseInt(config.vermelhoMin) - 1) {
                config.verdeMax = novoVerde;
                localStorage.setItem('catPlanFinancasConfig', JSON.stringify(config));
                atualizarLegenda();
            } else if (novoVerde) {
                alert("Valor inválido! O verde precisa ser menor que o limite do vermelho.");
            }
        });
    }

    // Editar o limite Vermelho (Gastos extrapolados)
    const btnEditVermelho = document.getElementById('btnEditVermelho');
    if (btnEditVermelho) {
        btnEditVermelho.addEventListener('click', () => {
            let novoVermelho = prompt("A partir de qual porcentagem os gastos estão ruins (VERMELHO)?", config.vermelhoMin);
            novoVermelho = parseInt(novoVermelho);
            
            if (!isNaN(novoVermelho) && novoVermelho > parseInt(config.verdeMax) + 1 && novoVermelho <= 100) {
                config.vermelhoMin = novoVermelho;
                localStorage.setItem('catPlanFinancasConfig', JSON.stringify(config));
                atualizarLegenda();
            } else if (novoVermelho) {
                alert("Valor inválido! O vermelho precisa ser maior que o limite do verde.");
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE MESES AUTOMÁTICOS
    // ==========================================
    
    const listaMeses = document.getElementById('listaMesesFinancas');
    const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    // Pega a data atual do computador (agora mesmo, ex: Agosto 2026)
    const hoje = new Date();
    const mesAtualStr = `${mesesNomes[hoje.getMonth()]} ${hoje.getFullYear()}`;

    let mesesSalvos = JSON.parse(localStorage.getItem('catPlanFinancasMeses')) || [];

    // Se o mês atual ainda não existir na nossa lista, adicionamos ele no final!
    if (!mesesSalvos.includes(mesAtualStr)) {
        mesesSalvos.push(mesAtualStr);
        localStorage.setItem('catPlanFinancasMeses', JSON.stringify(mesesSalvos));
    }

    function desenharMeses() {
        if (!listaMeses) return;
        listaMeses.innerHTML = '';
        
        mesesSalvos.forEach(mes => {
            const divMes = document.createElement('div');
            // Por enquanto vamos criar todos os meses com a cor verde padrão. 
            // Mais para frente, a aba de Gastos vai calcular e mudar essa cor automaticamente!
            divMes.className = 'bubble-card bubble-verde'; 
            divMes.innerText = mes;
            listaMeses.appendChild(divMes);
        });
    }

    // Inicializa a tela
    atualizarLegenda();
    desenharMeses();
});
