document.addEventListener("DOMContentLoaded", () => {
    
    // --- 0. SUPER SINCRONIZAÇÃO COM A NUVEM ---
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
            console.log("Miau! Sincronizado com sucesso!");
        } catch (error) {
            console.error("Erro ao sincronizar com a nuvem:", error);
        }
    }

    // --- VARIÁVEIS DO FORMULÁRIO ---
    const bolasPrioridade = document.querySelectorAll('.bola-prioridade');
    let prioridadeSelecionada = 'verde'; 
    const containerLista = document.getElementById('containerListaTarefas');
    const inputMateria = document.getElementById('materiaInput');
    const inputTitulo = document.getElementById('tituloTarefaInput');
    const inputDesc = document.getElementById('descPassoInput');
    const inputData = document.getElementById('dataPassoInput');
    const btnSalvar = document.getElementById('btnSalvarPasso');

    // --- SELEÇÃO DE PRIORIDADE ---
    bolasPrioridade.forEach(bola => {
        bola.addEventListener('click', (e) => {
            bolasPrioridade.forEach(b => {
                b.classList.remove('active');
                b.style.border = "3px solid transparent";
            });
            const elemento = e.currentTarget;
            elemento.classList.add('active');
            elemento.style.border = "3px solid #000"; 
            prioridadeSelecionada = elemento.getAttribute('data-cor');
        });
    });

    // --- SALVAR NOVO PASSO ---
    if (btnSalvar) {
        btnSalvar.addEventListener('click', () => {
            const materia = inputMateria.value.trim().toUpperCase(); 
            const tituloTarefa = inputTitulo.value.trim();
            const descricaoPasso = inputDesc.value.trim();
            let data = inputData.value;
            
            if (materia === "" || tituloTarefa === "" || descricaoPasso === "") {
                alert("Por favor, preencha a Matéria, o Título da Tarefa e a Descrição!");
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

            let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
            tarefas.push(novoPasso);
            localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));

            carregarTarefasNaTela();
            sincronizarComNuvem(); 
            
            inputDesc.value = "";
            inputData.value = "";
        });
    }

    // --- RENDERIZAÇÃO DAS TAREFAS NA ESQUERDA ---
    function carregarTarefasNaTela() {
        if (!containerLista) return;
        
        // Salva quais chaves de cartões estavam abertas antes de atualizar
        const abertosAtuais = JSON.parse(sessionStorage.getItem('catPlanCardsAbertos')) || {};

        containerLista.innerHTML = ""; 
        let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];

        const tarefasPorGrupo = {};
        
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
            cardDiv.style.backgroundColor = "#fff";
            cardDiv.style.border = "2px solid #000";
            cardDiv.style.borderRadius = "12px";
            cardDiv.style.padding = "15px";
            cardDiv.style.boxShadow = "3px 3px 0px rgba(0,0,0,0.15)";
            
            const passosPendentes = grupo.passos.filter(p => !p.concluida).length;
            
            cardDiv.innerHTML = `
                <div class="tarefa-principal-header" style="display: flex; justify-content: space-between; align-items: center;">
                    <div class="info-titulo" style="flex-grow: 1; cursor: pointer;">
                        <span style="font-size: 11px; font-weight: bold; background: #e0e0e0; padding: 2px 6px; border-radius: 4px;">${grupo.materia}</span>
                        <h4 style="margin: 5px 0 0 0; font-size: 15px;" class="texto-titulo">${grupo.titulo}</h4>
                        <span style="font-size: 11px; color: #777;">${passosPendentes} etapa(s) restante(s) ▼</span>
                    </div>
                    <div class="tarefa-acoes" style="display: flex; gap: 8px;">
                        <img src="icone-adicionar.png" alt="Adicionar passo" class="icone-acao btn-add-passo" style="width: 20px; cursor: pointer;" title="Adicionar passo a passo">
                        <img src="icone-editar.png" alt="Editar" class="icone-acao btn-editar" style="width: 20px; cursor: pointer;" title="Editar Título da Tarefa">
                        <img src="icone-check.png" alt="Concluir" class="icone-acao btn-concluir" style="width: 20px; cursor: pointer;" title="Concluir o trabalho inteiro">
                    </div>
                </div>
                <div class="passos-container" style="display: none; padding-top: 12px; border-top: 1px solid #ddd; margin-top: 10px;"></div>
            `;

            const passosContainer = cardDiv.querySelector('.passos-container');
            const infoTitulo = cardDiv.querySelector('.info-titulo');
            const btnConcluir = cardDiv.querySelector('.btn-concluir');
            const btnEditar = cardDiv.querySelector('.btn-editar');
            const btnAddPasso = cardDiv.querySelector('.btn-add-passo');

            // Restaura o estado aberto/fechado baseado na sessão anterior
            if (abertosAtuais[chave]) {
                passosContainer.style.display = "block";
            }

            grupo.passos.forEach(passo => {
                if (passo.concluida) return; 

                const passoDiv = document.createElement('div');
                passoDiv.className = `passo-item prioridade-${passo.prioridade}`;
                passoDiv.style.marginBottom = "6px";
                passoDiv.style.fontSize = "14px";
                
                passoDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1;">
                            <input type="checkbox" class="check-passo" onchange="marcarPassoFeito(${passo.id}, this, '${chave}')"> 
                            <span>${passo.descricao}</span>
                        </label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="data-passo" style="font-size: 12px; color: #555;">${passo.data !== "00/00/0000" ? passo.data : ""}</span>
                            <img src="icone-editar.png" style="width: 14px; cursor: pointer; opacity: 0.6;" onclick="editarPasso(${passo.id})" title="Editar este passo">
                        </div>
                    </div>
                `;
                passosContainer.appendChild(passoDiv);
            });

            infoTitulo.addEventListener('click', () => {
                const isOpen = passosContainer.style.display === "block";
                passosContainer.style.display = isOpen ? "none" : "block";
                
                // Atualiza o estado na sessão
                let abertos = JSON.parse(sessionStorage.getItem('catPlanCardsAbertos')) || {};
                abertos[chave] = !isOpen;
                sessionStorage.setItem('catPlanCardsAbertos', JSON.stringify(abertos));
            });

            btnConcluir.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Deseja finalizar o trabalho "${grupo.titulo}"? Ele será removido permanentemente.`)) {
                    let todas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
                    todas = todas.filter(t => `${t.materia}___${t.tituloTarefa}` !== chave);
                    localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(todas));
                    carregarTarefasNaTela();
                    sincronizarComNuvem(); 
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
                    sincronizarComNuvem();
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

    // --- FUNÇÕES GLOBAIS DE EDIÇÃO COM ANIMAÇÃO ---
    window.marcarPassoFeito = function(idPasso, checkboxElement, chaveGrupo) {
        // Garante que o card atual permaneça marcado como aberto na sessão durante a transição
        let abertos = JSON.parse(sessionStorage.getItem('catPlanCardsAbertos')) || {};
        abertos[chaveGrupo] = true;
        sessionStorage.setItem('catPlanCardsAbertos', JSON.stringify(abertos));

        const passoDiv = checkboxElement.closest('.passo-item');
        
        if (passoDiv) {
            passoDiv.style.transition = "all 0.5s ease-out";
            passoDiv.style.opacity = "0";
            passoDiv.style.transform = "translateX(20px)";
        }

        setTimeout(() => {
            let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
            const index = tarefas.findIndex(t => t.id === idPasso);
            if (index !== -1) {
                tarefas[index].concluida = true; 
                localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
                carregarTarefasNaTela(); 
                sincronizarComNuvem(); 
            }
        }, 500);
    };

    window.editarPasso = function(idPasso) {
        let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        const index = tarefas.findIndex(t => t.id === idPasso);
        if (index !== -1) {
            const novoTexto = prompt("Edite a descrição do passo:", tarefas[index].descricao);
            if (novoTexto === null) return; 

            let dataAtual = tarefas[index].data === "00/00/0000" ? "" : tarefas[index].data;
            const novaData = prompt("Edite a data (DD/MM/AAAA) ou deixe em branco:", dataAtual);
            if (novaData === null) return; 

            const novaCor = prompt("Prioridade? (verde, laranja ou vermelha)", tarefas[index].prioridade || 'verde');
            if (novaCor === null) return;
            const corLimpa = novaCor.trim().toLowerCase();

            if (novoTexto.trim() !== "") tarefas[index].descricao = novoTexto.trim();
            tarefas[index].data = novaData.trim() === "" ? "00/00/0000" : novaData.trim();
            
            if (['verde', 'laranja', 'vermelha'].includes(corLimpa)) {
                tarefas[index].prioridade = corLimpa;
            }

            localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
            carregarTarefasNaTela(); 
            sincronizarComNuvem(); 
        }
    }; 

    // ==========================================
    // --- LÓGICA DAS MATÉRIAS E LIXEIRA ---
    // ==========================================

    window.abrirPromptAdicionarMateria = function() {
        const nome = prompt("Nome da Matéria (Ex: MATEMÁTICA):");
        if (!nome || nome.trim() === "") return;
        
        const professor = prompt("Nome do(a) Professor(a):") || "";
        const dias = prompt("Dias da aula (Ex: Segunda, Quarta, Sábado, Domingo):") || "Nenhum";

        const novaMateria = {
            id: Date.now(),
            nome: nome.trim().toUpperCase(),
            professor: professor.trim(),
            dias: dias.trim()
        };

        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        materias.push(novaMateria);
        localStorage.setItem('catPlanMaterias', JSON.stringify(materias));
        
        desenharMaterias();
        sincronizarComNuvem();
    };

    function desenharMaterias() {
        const listaMateriasGrid = document.getElementById('listaMateriasGrid');
        if (!listaMateriasGrid) return;
        listaMateriasGrid.innerHTML = "";
        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        
        materias.forEach(mat => {
            const matDiv = document.createElement('div');
            matDiv.style.border = "2px solid #000";
            matDiv.style.padding = "12px 15px";
            matDiv.style.backgroundColor = "#fff";
            matDiv.style.cursor = "pointer";
            matDiv.style.boxShadow = "2px 2px 0px rgba(0,0,0,0.1)";
            matDiv.className = 'materia-item-grid'; 
            
            matDiv.innerHTML = `
                <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; text-transform: uppercase;">${mat.nome} - ${mat.professor || 'Sem Prof.'}</div>
                <div style="font-size: 12px; color: #444;">Dias: ${mat.dias || 'Não definido'}</div>
            `;
            
            matDiv.addEventListener('click', (e) => {
                if (window.modoExclusaoGlobal) {
                    selecionarMateriaParaExcluir(e, mat.nome, matDiv);
                } else {
                    editarMateria(mat.nome);
                }
            });
            listaMateriasGrid.appendChild(matDiv);
        });
    }

    function editarMateria(nomeMateria) {
        let materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        const index = materias.findIndex(m => m.nome === nomeMateria);
        
        if (index !== -1) {
            const novoNome = prompt(`Editar nome da matéria:`, materias[index].nome);
            if (novoNome === null) return;
            
            const novoProf = prompt(`Editar professor(a):`, materias[index].professor || '');
            if (novoProf === null) return;

            const novoDias = prompt(`Editar dias:`, materias[index].dias || '');
            if (novoDias === null) return;

            materias[index].nome = novoNome.trim().toUpperCase() || materias[index].nome;
            materias[index].professor = novoProf.trim();
            materias[index].dias = novoDias.trim();

            localStorage.setItem('catPlanMaterias', JSON.stringify(materias));
            desenharMaterias();
            sincronizarComNuvem();
        }
    }

    // Chamadas iniciais
    carregarTarefasNaTela();
    desenharMaterias();

});
