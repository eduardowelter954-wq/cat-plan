document.addEventListener("DOMContentLoaded", () => {
    
    const bolasPrioridade = document.querySelectorAll('.bola-prioridade');
    let prioridadeSelecionada = 'verde'; 
    const containerLista = document.getElementById('containerListaTarefas');
    const inputMateria = document.getElementById('materiaInput');
    const inputTitulo = document.getElementById('tituloTarefaInput');
    const inputDesc = document.getElementById('descPassoInput');
    const inputData = document.getElementById('dataPassoInput');
    const btnSalvar = document.getElementById('btnSalvarPasso');

    carregarTarefasNaTela();

    bolasPrioridade.forEach(bola => {
        bola.addEventListener('click', (e) => {
            bolasPrioridade.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            prioridadeSelecionada = e.target.getAttribute('data-cor');
        });
    });

    // Salvar novo passo
    btnSalvar.addEventListener('click', () => {
        const materia = inputMateria.value.trim().toUpperCase(); 
        const tituloTarefa = inputTitulo.value.trim();
        const descricaoPasso = inputDesc.value.trim();
        let data = inputData.value;
        
        if (materia === "" || tituloTarefa === "" || descricaoPasso === "") {
            alert("Por favor, preencha a Matéria, o Título da Tarefa e o Passo a Passo!");
            return;
        }

        if (!data) {
            data = "00/00/0000";
        } else {
            const partes = data.split('-');
            data = `${partes[2]}/${partes[1]}/${partes[0]}`;
        }

        const novoPasso = {
            id: Date.now(),
            materia: materia,
            tituloTarefa: tituloTarefa,
            descricao: descricaoPasso,
            data: data,
            prioridade: prioridadeSelecionada,
            concluida: false
        };

        salvarNoLocalStorage(novoPasso);
        carregarTarefasNaTela();
        
        inputDesc.value = "";
        inputData.value = "";
    });

    function salvarNoLocalStorage(passo) {
        let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        tarefas.push(passo);
        localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
    }

    function carregarTarefasNaTela() {
        containerLista.innerHTML = ""; 
        let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];

        const tarefasPorGrupo = {};
        
        // Agrupa todas as tarefas
        tarefas.forEach(t => {
            const chaveGrupo = `${t.materia}___${t.tituloTarefa}`;
            if (!tarefasPorGrupo[chaveGrupo]) {
                tarefasPorGrupo[chaveGrupo] = {
                    materia: t.materia,
                    titulo: t.tituloTarefa,
                    passos: []
                };
            }
            tarefasPorGrupo[chaveGrupo].passos.push(t);
        });

        for (const [chave, grupo] of Object.entries(tarefasPorGrupo)) {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'tarefa-principal-card';
            
            const passosPendentes = grupo.passos.filter(p => !p.concluida).length;
            
            cardDiv.innerHTML = `
                <div class="tarefa-principal-header">
                    <div class="info-titulo" style="flex-grow: 1; cursor: pointer;">
                        <span style="font-size: 11px; font-weight: bold; background: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${grupo.materia}</span>
                        <h4 style="margin-top: 5px;" class="texto-titulo">${grupo.titulo}</h4>
                        <span style="font-size: 11px; color: #777;">${passosPendentes} etapa(s) restante(s) ▼</span>
                    </div>
                    <div class="tarefa-acoes">
                        <img src="icone-adicionar.png" alt="Adicionar passo" class="icone-acao btn-add-passo" title="Adicionar passo a passo">
                        <img src="icone-editar.png" alt="Editar" class="icone-acao btn-editar" title="Editar Título da Tarefa">
                        <img src="icone-check.png" alt="Concluir" class="icone-acao btn-concluir" title="Concluir o trabalho inteiro">
                    </div>
                </div>
                <div class="passos-container" style="display: none; padding-top: 15px;"></div>
            `;

            const passosContainer = cardDiv.querySelector('.passos-container');
            const infoTitulo = cardDiv.querySelector('.info-titulo');
            const btnConcluir = cardDiv.querySelector('.btn-concluir');
            const btnEditar = cardDiv.querySelector('.btn-editar');
            const btnAddPasso = cardDiv.querySelector('.btn-add-passo');

            // --- DESENHA OS PASSOS ---
            grupo.passos.forEach(passo => {
                if (passo.concluida) return; 

                const passoDiv = document.createElement('div');
                passoDiv.className = `passo-item prioridade-${passo.prioridade}`;
                passoDiv.style.marginBottom = "8px";
                
                passoDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1;">
                            <input type="checkbox" class="check-passo ${passo.prioridade}" onchange="marcarPassoFeito(${passo.id})"> 
                            <span>${passo.descricao}</span>
                        </label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="data-passo">${passo.data !== "00/00/0000" ? passo.data : ""}</span>
                            <!-- Lápis chama a nova função editarPasso -->
                            <img src="icone-editar.png" style="width: 15px; cursor: pointer; opacity: 0.6;" onclick="editarPasso(${passo.id})" title="Editar este passo e data" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">
                        </div>
                    </div>
                `;
                passosContainer.appendChild(passoDiv);
            });

            infoTitulo.addEventListener('click', () => {
                passosContainer.style.display = passosContainer.style.display === "none" ? "block" : "none";
            });

            btnConcluir.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Deseja finalizar o trabalho "${grupo.titulo}"? Ele será removido permanentemente.`)) {
                    let todas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
                    todas = todas.filter(t => `${t.materia}___${t.tituloTarefa}` !== chave);
                    localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(todas));
                    carregarTarefasNaTela();
                }
            });

            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation();
                const novoTexto = prompt("Edite o título do trabalho:", grupo.titulo);
                if (novoTexto && novoTexto.trim() !== "") {
                    let todas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
                    todas.forEach(t => {
                        if (`${t.materia}___${t.tituloTarefa}` === chave) {
                            t.tituloTarefa = novoTexto.trim().toUpperCase();
                        }
                    });
                    localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(todas));
                    carregarTarefasNaTela();
                }
            });

            btnAddPasso.addEventListener('click', (e) => {
                e.stopPropagation();
                inputMateria.value = grupo.materia;
                inputTitulo.value = grupo.titulo;
                inputDesc.focus();
            });

            containerLista.appendChild(cardDiv);
        }
    }

    // --- FUNÇÕES GLOBAIS DE PASSOS ---

    window.marcarPassoFeito = function(idPasso) {
        let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        const index = tarefas.findIndex(t => t.id === idPasso);
        if (index !== -1) {
            tarefas[index].concluida = true; 
            localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
            carregarTarefasNaTela(); 
        }
    }

    // NOVA FUNÇÃO: Edita a descrição E a data do passo
    window.editarPasso = function(idPasso) {
        let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        const index = tarefas.findIndex(t => t.id === idPasso);
        if (index !== -1) {
            // 1. Pergunta a descrição nova (ou mantém a atual)
            const novoTexto = prompt("Edite a descrição do passo:", tarefas[index].descricao);
            if (novoTexto === null) return; // Se clicar em "Cancelar", ele para por aqui

            // 2. Pergunta a data
            let dataAtual = tarefas[index].data === "00/00/0000" ? "" : tarefas[index].data;
            const novaData = prompt("Edite a data do passo (Formato: DD/MM/AAAA) ou deixe em branco:", dataAtual);
            if (novaData === null) return; // Se clicar em "Cancelar", ele para por aqui

            // Salva as alterações se o texto não for vazio
            if (novoTexto.trim() !== "") {
                tarefas[index].descricao = novoTexto.trim();
            }
            
            // Grava a data formatada
            tarefas[index].data = novaData.trim() === "" ? "00/00/0000" : novaData.trim();

            localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
            carregarTarefasNaTela(); 
        }
    }
});