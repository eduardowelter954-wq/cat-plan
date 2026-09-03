document.addEventListener("DOMContentLoaded", () => {
    
    // --- 0. SINCRONIZAÇÃO COM A NUVEM ---
    async function sincronizarComNuvem() {
        const username = localStorage.getItem('usuarioLogado');
        if (!username) return; 

        const dadosAtuais = {};
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave !== 'usuarioLogado' && chave !== 'catPlanDados') {
                try {
                    dadosAtuais[chave] = JSON.parse(localStorage.getItem(chave));
                } catch(e) {
                    dadosAtuais[chave] = localStorage.getItem(chave);
                }
            }
        }

        try {
            await fetch('https://cat-plan.onrender.com/api/dados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    username: username, 
                    dados_do_site: dadosAtuais 
                })
            });
            console.log("Miau! Avaliações sincronizadas com sucesso!");
        } catch (error) {
            console.error("Erro ao sincronizar com a nuvem:", error);
        }
    }

    // --- SELETORES ---
    const inputDesc = document.getElementById('descAvaliacaoInput');
    const selectMateria = document.getElementById('selectMateriaAvaliacao');
    const inputNotaTirada = document.getElementById('notaTiradaInput');
    const inputNotaMaxima = document.getElementById('notaMaximaInput');
    const btnSalvar = document.getElementById('btnSalvarAvaliacao');
    const btnCancelar = document.getElementById('btnCancelarAvaliacao');
    
    const containerLista = document.getElementById('containerListaAvaliacoes');
    const mediaTotalDisplay = document.getElementById('mediaTotalDisplay');

    const selectPesquisaMateria = document.getElementById('selectPesquisaMateria');
    const resultadoMateriaNome = document.getElementById('resultadoMateriaNome');
    const resultadoMateriaMedia = document.getElementById('resultadoMateriaMedia');

    // --- CARREGAR MATÉRIAS CADASTRADAS NO SISTEMA ---
    function carregarMateriasNosSelects() {
        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        
        selectMateria.innerHTML = '<option value="">Selecione a Disciplina / Matéria</option>';
        selectPesquisaMateria.innerHTML = '<option value="">Selecione a matéria...</option>';

        materias.forEach(mat => {
            const textoFormatado = `${mat.professor ? mat.professor + ' - ' : ''}${mat.nome}`;
            
            const opt1 = document.createElement('option');
            opt1.value = textoFormatado;
            opt1.textContent = textoFormatado;
            selectMateria.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = textoFormatado;
            opt2.textContent = textoFormatado;
            selectPesquisaMateria.appendChild(opt2);
        });
    }

    // --- SALVAR AVALIAÇÃO ---
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const descricao = inputDesc.value.trim();
            const materiaProf = selectMateria.value;
            const notaTirada = parseFloat(inputNotaTirada.value);
            const notaMaxima = parseFloat(inputNotaMaxima.value) || 10;

            if (!descricao || !materiaProf || isNaN(notaTirada)) {
                alert("Por favor, preencha a descrição, selecione a matéria e informe a nota tirada!");
                return;
            }

            const mediaCalculada = (notaTirada / notaMaxima) * 10;

            const novaAvaliacao = {
                id: Date.now(),
                descricao: descricao,
                materiaProf: materiaProf,
                notaTirada: notaTirada,
                notaMaxima: notaMaxima,
                media: mediaCalculada
            };

            let avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];
            avaliacoes.unshift(novaAvaliacao);
            localStorage.setItem('catPlanAvaliacoes', JSON.stringify(avaliacoes));

            inputDesc.value = "";
            selectMateria.value = "";
            inputNotaTirada.value = "";
            inputNotaMaxima.value = "10";

            atualizarTela();
            sincronizarComNuvem();
        });
    }

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            inputDesc.value = "";
            selectMateria.value = "";
            inputNotaTirada.value = "";
            inputNotaMaxima.value = "10";
        });
    }

    // --- RENDERIZAR TUDO ---
    function atualizarTela() {
        carregarMateriasNosSelects();
        desenharAvaliacoes();
        calcularMediaTotal();
        atualizarPesquisaMateria();
    }

    function desenharAvaliacoes() {
        if (!containerLista) return;
        containerLista.innerHTML = "";
        let avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];

        if (avaliacoes.length === 0) {
            containerLista.innerHTML = `<p style="color: #666; font-style: italic; grid-column: 1 / -1;">Nenhuma avaliação cadastrada ainda.</p>`;
            return;
        }

        avaliacoes.forEach(av => {
            const card = document.createElement('div');
            card.style.background = "#fff";
            card.style.border = "2px solid #000";
            card.style.borderRadius = "12px";
            card.style.padding = "18px";
            card.style.boxShadow = "3px 3px 0px rgba(0,0,0,0.15)";
            card.style.position = "relative";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.justifyContent = "space-between";
            card.style.minHeight = "150px";

            card.innerHTML = `
                <div>
                    <img src="lixo.png" class="btn-excluir-av" data-id="${av.id}" title="Excluir" style="width: 16px; cursor: pointer; position: absolute; top: 15px; right: 15px; opacity: 0.6;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                    <h4 style="font-size: 15px; font-weight: bold; margin: 0 25px 10px 0; line-height: 1.3;">${av.descricao}</h4>
                    <div style="font-size: 13px; color: #444; margin-bottom: 15px;">${av.materiaProf}</div>
                </div>
                <div style="border-top: 1px solid #eee; padding-top: 10px; font-size: 13px; display: flex; flex-direction: column; gap: 4px;">
                    <div>Nota: ${av.notaTirada}/${av.notaMaxima}</div>
                    <div style="font-weight: bold;">Média: ${av.media.toFixed(1)}/10</div>
                </div>
            `;
            containerLista.appendChild(card);
        });

        document.querySelectorAll('.btn-excluir-av').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Deseja apagar esta avaliação?")) {
                    let avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];
                    avaliacoes = avaliacoes.filter(av => av.id !== id);
                    localStorage.setItem('catPlanAvaliacoes', JSON.stringify(avaliacoes));
                    atualizarTela();
                    sincronizarComNuvem();
                }
            });
        });
    }

    function calcularMediaTotal() {
        let avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];
        if (avaliacoes.length === 0) {
            mediaTotalDisplay.innerText = "0.0/10";
            return;
        }

        let soma = avaliacoes.reduce((acc, av) => acc + av.media, 0);
        let mediaGeral = soma / avaliacoes.length;
        mediaTotalDisplay.innerText = `${mediaGeral.toFixed(1)}/10`;
    }

    // --- PESQUISA DE MÉDIA POR MATÉRIA NA LATERAL ---
    if (selectPesquisaMateria) {
        selectPesquisaMateria.addEventListener('change', atualizarPesquisaMateria);
    }

    function atualizarPesquisaMateria() {
        const materiaSelecionada = selectPesquisaMateria.value;
        if (!materiaSelecionada) {
            resultadoMateriaNome.innerText = "Matéria: -";
            resultadoMateriaMedia.innerText = "Média: 00/10";
            return;
        }

        resultadoMateriaNome.innerText = `Matéria: ${materiaSelecionada}`;
        
        let avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];
        const avaliacoesDaMateria = avaliacoes.filter(av => av.materiaProf === materiaSelecionada);

        if (avaliacoesDaMateria.length === 0) {
            resultadoMateriaMedia.innerText = "Média: Sem notas";
            return;
        }

        let soma = avaliacoesDaMateria.reduce((acc, av) => acc + av.media, 0);
        let mediaMat = soma / avaliacoesDaMateria.length;
        resultadoMateriaMedia.innerText = `Média: ${mediaMat.toFixed(1)}/10`;
    }

    // Inicialização
    atualizarTela();
});
