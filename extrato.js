document.addEventListener("DOMContentLoaded", () => {
    
    const containerExtrato = document.getElementById('containerExtrato');

    // Função para converter DD/MM/AAAA para objeto Date e facilitar a ordenação
    function converterDataParaOrdem(dataStr) {
        if (!dataStr || dataStr === "00/00/0000") return new Date(0);
        const partes = dataStr.split('/');
        if (partes.length === 3) {
            return new Date(partes[2], partes[1] - 1, partes[0]);
        }
        return new Date(0);
    }

    function carregarExtrato() {
        containerExtrato.innerHTML = '';
        
        let movimentacoes = JSON.parse(localStorage.getItem('catPlanMovimentacoes')) || [];
        let gastos = JSON.parse(localStorage.getItem('catPlanGastos')) || [];

        let extratoGeral = [];

        // 1. Coleta as Entradas e Transferências
        movimentacoes.forEach(mov => {
            extratoGeral.push({
                id: mov.id,
                origem: 'movimentacoes',
                descricao: mov.descricao,
                tipo: mov.tipo, // "ENTRADA (GANHO)" ou "TRANSFERÊNCIA"
                valor: mov.valor,
                conta: mov.tipo === "TRANSFERÊNCIA" ? `${mov.contaOrigem} ➔ ${mov.contaDestino}` : (mov.contaDestino || mov.conta),
                data: mov.data,
                dataOrdenacao: converterDataParaOrdem(mov.data)
            });
        });

        // 2. Coleta os Gastos (incluindo baixas de Contas Fixas que viraram gastos)
        gastos.forEach(gasto => {
            let desc = gasto.titulo;
            if (gasto.meta && gasto.meta !== "Não") {
                desc += ` (Meta: ${gasto.meta})`;
            }
            
            extratoGeral.push({
                id: gasto.id,
                origem: 'gastos',
                descricao: desc,
                tipo: 'SAÍDA (GASTO)',
                valor: gasto.valor,
                conta: gasto.conta || 'Não informada',
                data: gasto.data,
                dataOrdenacao: converterDataParaOrdem(gasto.data)
            });
        });

        // 3. Ordena tudo misturado, colocando os mais recentes no topo
        extratoGeral.sort((a, b) => b.dataOrdenacao - a.dataOrdenacao);

        if (extratoGeral.length === 0) {
            containerExtrato.innerHTML = '<p style="color: #666; font-style: italic;">Nenhum registro encontrado no seu extrato.</p>';
            return;
        }

        // 4. Desenha os cartões no padrão visual solicitado
        extratoGeral.forEach(item => {
            const card = document.createElement('div');
            
            // Estilização do Cartão (Borda preta, fundo branco, arredondado)
            card.style.border = "4px solid #000";
            card.style.borderRadius = "20px";
            card.style.padding = "25px 25px 30px 25px";
            card.style.backgroundColor = "#fff";
            card.style.position = "relative";
            card.style.maxWidth = "600px";
            
            let corValor = item.tipo.includes('ENTRADA') ? '#2e7d32' : '#c62828';
            if (item.tipo.includes('TRANSFERÊNCIA')) corValor = '#1565c0';

            card.innerHTML = `
                <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 22px; color: #000;">${item.descricao}</h3>
                <p style="margin: 8px 0; font-size: 16px; color: #333;">${item.tipo}</p>
                <p style="margin: 8px 0; font-size: 16px; font-weight: bold; color: ${corValor};">R$ ${item.valor.toFixed(2)}</p>
                <p style="margin: 8px 0; font-size: 16px; color: #333;">Conta: ${item.conta}</p>
                <p style="margin: 8px 0; font-size: 14px; color: #666;">Data: ${item.data}</p>

                <!-- Botão de Lixeira Verde -->
                <div class="btn-excluir-extrato" data-id="${item.id}" data-origem="${item.origem}" 
                     style="background-color: #a5d6a7; border: 3px solid #000; border-radius: 50%; width: 45px; height: 45px; 
                            display: flex; justify-content: center; align-items: center; position: absolute; 
                            bottom: 15px; right: 15px; cursor: pointer;" title="Excluir Registro">
                    <img src="icone-lixeira.png" style="width: 20px; pointer-events: none;">
                </div>
            `;
            containerExtrato.appendChild(card);
        });

        // 5. Adiciona a função de deletar nos botões verdes
        document.querySelectorAll('.btn-excluir-extrato').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const origem = e.currentTarget.getAttribute('data-origem');
                
                if (confirm("Deseja apagar este registro permanentemente? (Isso afetará o saldo das suas contas)")) {
                    
                    if (origem === 'movimentacoes') {
                        let movs = JSON.parse(localStorage.getItem('catPlanMovimentacoes')) || [];
                        movs = movs.filter(m => m.id !== id);
                        localStorage.setItem('catPlanMovimentacoes', JSON.stringify(movs));
                    } 
                    else if (origem === 'gastos') {
                        let gsts = JSON.parse(localStorage.getItem('catPlanGastos')) || [];
                        gsts = gsts.filter(g => g.id !== id);
                        localStorage.setItem('catPlanGastos', JSON.stringify(gsts));
                    }
                    
                    carregarExtrato();
                    sincronizarComNuvemSilencioso();
                }
            });
        });
    }

    async function sincronizarComNuvemSilencioso() {
        const username = localStorage.getItem('usuarioLogado');
        if (!username) return; 
        const dadosAtuais = {};
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave !== 'usuarioLogado' && chave !== 'catPlanDados') {
                try { dadosAtuais[chave] = JSON.parse(localStorage.getItem(chave)); } 
                catch(e) { dadosAtuais[chave] = localStorage.getItem(chave); }
            }
        }
        try {
            await fetch('https://cat-plan.onrender.com/api/dados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: username, dados_do_site: dadosAtuais })
            });
        } catch (error) {}
    }

    carregarExtrato();
});
