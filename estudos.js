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
            console.log("Miau! Estudos sincronizados com sucesso!");
        } catch (error) {
            console.error("Erro ao sincronizar com a nuvem:", error);
        }
    }

    // --- LÓGICA DO CALENDÁRIO ---
    let dataReferencia = new Date(); // Começa no dia de hoje
    const diasDaSemanaNome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    
    const btnAnt = document.getElementById('btnSemanaAnterior');
    const btnProx = document.getElementById('btnSemanaProxima');
    const mesAnoDisplay = document.getElementById('mesAnoDisplay');

    // Funções de navegação de data
    btnAnt.addEventListener('click', () => {
        dataReferencia.setDate(dataReferencia.getDate() - 7);
        atualizarCalendario();
    });

    btnProx.addEventListener('click', () => {
        dataReferencia.setDate(dataReferencia.getDate() + 7);
        atualizarCalendario();
    });

    function atualizarCalendario() {
        const diaSemana = dataReferencia.getDay();
        const diferencaParaSegunda = dataReferencia.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const segundaFeira = new Date(dataReferencia.setDate(diferencaParaSegunda));

        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        mesAnoDisplay.innerText = `${meses[segundaFeira.getMonth()]} ${segundaFeira.getFullYear()}`;

        for (let i = 0; i < 7; i++) {
            let dataAtual = new Date(segundaFeira);
            dataAtual.setDate(segundaFeira.getDate() + i);
            
            const diaStr = formatarData(dataAtual);
            const nomeDia = diasDaSemanaNome[dataAtual.getDay()];
            
            const cardDia = document.getElementById(`dia-${nomeDia}`);
            const headDia = document.getElementById(`head-${nomeDia}`);
            
            if(cardDia && headDia) {
                cardDia.setAttribute('data-data', diaStr);
                headDia.innerHTML = `${nomeDia}<br><span>${diaStr}</span>`;
            }
        }
        
        carregarTudo(); 
    }

    function formatarData(data) {
        return String(data.getDate()).padStart(2, '0') + '/' + 
               String(data.getMonth() + 1).padStart(2, '0') + '/' + 
               data.getFullYear();
    }


    // --- LÓGICA DE MATÉRIAS ---
    const btnAddMateria = document.getElementById('btnAdicionarMateria');
    const listaMaterias = document.getElementById('listaMaterias');

    btnAddMateria.addEventListener('click', () => {
        const nome = prompt("Nome da Matéria (Ex: MATEMÁTICA):");
        if (!nome) return;
        const professor = prompt("Nome do(a) Professor(a):");
        const dias = prompt("Dias da semana que tem essa aula (Ex: Segunda, Quarta):");

        const novaMateria = {
            id: Date.now(),
            nome: nome.trim().toUpperCase(),
            professor: professor,
            dias: dias
        };

        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        materias.push(novaMateria);
        localStorage.setItem('catPlanMaterias', JSON.stringify(materias));
        carregarTudo();
        sincronizarComNuvem(); // Sincroniza nova matéria
    });

    function desenharMaterias() {
        listaMaterias.innerHTML = "";
        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        
        materias.forEach(mat => {
            const matDiv = document.createElement('div');
            matDiv.className = 'materia-item';
            matDiv.setAttribute('data-nome', mat.nome);
            matDiv.innerHTML = `
                <div class="materia-info">
                    <strong>${mat.nome} - ${mat.professor || 'Sem Prof.'}</strong>
                    <br><span style="font-size: 12px;">Dias: ${mat.dias || 'Não definido'}</span>
                </div>
            `;
            // NOVA LÓGICA: Se a lixeira estiver ligada, seleciona para apagar. Se estiver desligada, permite editar!
            matDiv.addEventListener('click', (e) => {
                if (modoExclusao) {
                    selecionarMateriaParaExcluir(e, mat.nome);
                } else {
                    editarMateria(mat.nome);
                }
            });
            listaMaterias.appendChild(matDiv);
        });
    }

    // Função que permite editar os dias e o professor
    function editarMateria(nomeMateria) {
        let materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
        const index = materias.findIndex(m => m.nome === nomeMateria);
        
        if (index !== -1) {
            const novoProf = prompt(`Editar professor(a) de ${nomeMateria}:`, materias[index].professor || '');
            if (novoProf !== null) {
                const novoDias = prompt(`Editar dias da aula (Ex: Segunda, Quarta):`, materias[index].dias || '');
                if (novoDias !== null) {
                    materias[index].professor = novoProf;
                    materias[index].dias = novoDias;
                    localStorage.setItem('catPlanMaterias', JSON.stringify(materias));
                    carregarTudo();
                    sincronizarComNuvem();
                }
            }
        }
    }


    // --- LÓGICA DE TAREFAS E DRAG & DROP ---
    function carregarTudo() {
        desenharMaterias();
        
        document.querySelectorAll('.tasks-container').forEach(c => c.innerHTML = "");
        const areaEspera = document.getElementById('areaEspera');
        areaEspera.innerHTML = `<p style="color: #fff; opacity: 0.7; text-align: center; margin-top: 15px; width: 100%;">Solte tarefas aqui para levar para outra semana</p>`;

        const tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];

        tarefas.forEach(tarefa => {
            if (tarefa.concluida) return; 

            const divTarefa = document.createElement('div');
            divTarefa.className = 'tarefa-arrastavel';
            divTarefa.draggable = true;
            divTarefa.id = `tarefa-${tarefa.id}`;
            if(tarefa.prioridade === 'verde') divTarefa.style.backgroundColor = '#d4edda';
            if(tarefa.prioridade === 'laranja') divTarefa.style.backgroundColor = '#ffeeba';
            if(tarefa.prioridade === 'vermelha') divTarefa.style.backgroundColor = '#f8d7da';
            
            divTarefa.innerHTML = `<strong>${tarefa.materia}</strong><br>${tarefa.descricao}`;

            divTarefa.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tarefa.id);
                setTimeout(() => divTarefa.style.opacity = '0.5', 0);
            });
            divTarefa.addEventListener('dragend', () => divTarefa.style.opacity = '1');

            if (tarefa.data === "ESPERA") {
                areaEspera.appendChild(divTarefa);
            } 
            else if (tarefa.data === "00/00/0000") {
                const matVinculada = materias.find(m => m.nome === tarefa.materia);
                if (matVinculada && matVinculada.dias) {
                    const diasAula = matVinculada.dias.toLowerCase();
                    diasDaSemanaNome.forEach(diaSemana => {
                        if (diasAula.includes(diaSemana.toLowerCase())) {
                            const container = document.querySelector(`#dia-${diaSemana} .tasks-container`);
                            const clone = divTarefa.cloneNode(true);
                            clone.addEventListener('dragstart', (e) => {
                                e.dataTransfer.setData('text/plain', tarefa.id);
                                setTimeout(() => clone.style.opacity = '0.5', 0);
                            });
                            clone.addEventListener('dragend', () => clone.style.opacity = '1');
                            if(container) container.appendChild(clone);
                        }
                    });
                }
            } 
            else {
                const cardDoDia = document.querySelector(`.day-card[data-data="${tarefa.data}"] .tasks-container`);
                if (cardDoDia) {
                    cardDoDia.appendChild(divTarefa);
                }
            }
        });
    }

    const zonasDeSoltura = [document.getElementById('areaEspera'), ...document.querySelectorAll('.day-card')];
    
    zonasDeSoltura.forEach(zona => {
        zona.addEventListener('dragover', (e) => {
            e.preventDefault();
            zona.style.backgroundColor = 'rgba(0,0,0,0.05)';
        });

        zona.addEventListener('dragleave', () => {
            zona.style.backgroundColor = '';
        });

        zona.addEventListener('drop', (e) => {
            e.preventDefault();
            zona.style.backgroundColor = '';
            
            const idTarefa = e.dataTransfer.getData('text/plain');
            let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
            const index = tarefas.findIndex(t => t.id.toString() === idTarefa);
            
            if (index !== -1) {
                if (zona.id === 'areaEspera') {
                    tarefas[index].data = "ESPERA";
                } else {
                    const novaData = zona.getAttribute('data-data');
                    if (novaData) tarefas[index].data = novaData;
                }
                
                localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
                carregarTudo(); 
                sincronizarComNuvem(); // Sincroniza o movimento da tarefa
            }
        });
    });


    // --- LÓGICA DA LIXEIRA (APAGAR MATÉRIA) ---
    const btnLixeira = document.getElementById('btnLixeira');
    const btnConfirmar = document.getElementById('btnConfirmarExclusao');
    let modoExclusao = false;
    let materiaParaExcluir = null;

    btnLixeira.addEventListener('click', () => {
        modoExclusao = !modoExclusao;
        if (modoExclusao) {
            btnLixeira.style.transform = "scale(1.2)";
            btnLixeira.style.filter = "drop-shadow(0 0 5px red)";
        } else {
            desligarLixeira();
        }
    });

    function selecionarMateriaParaExcluir(e, nomeMateria) {
        if (!modoExclusao) return;
        
        document.querySelectorAll('.materia-item').forEach(m => m.classList.remove('selecionada-para-excluir'));
        e.currentTarget.classList.add('selecionada-para-excluir');
        materiaParaExcluir = nomeMateria;
    }

    btnConfirmar.addEventListener('click', () => {
        if (modoExclusao && materiaParaExcluir) {
            let materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
            materias = materias.filter(m => m.nome !== materiaParaExcluir);
            localStorage.setItem('catPlanMaterias', JSON.stringify(materias));

            let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
            tarefas.forEach(t => {
                if (t.materia === materiaParaExcluir) {
                    t.materia = "MATÉRIA APAGADA";
                }
            });
            localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));

            desligarLixeira();
            carregarTudo();
            sincronizarComNuvem(); // Sincroniza a exclusão
        }
    });

    function desligarLixeira() {
        modoExclusao = false;
        materiaParaExcluir = null;
        btnLixeira.style.transform = "scale(1)";
        btnLixeira.style.filter = "none";
        document.querySelectorAll('.materia-item').forEach(m => m.classList.remove('selecionada-para-excluir'));
    }

    // Inicializa a tela!
    atualizarCalendario();
});
