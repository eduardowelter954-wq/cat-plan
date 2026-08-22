document.addEventListener("DOMContentLoaded", () => {
    
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
        // Encontra a Segunda-feira da semana atual
        const diaSemana = dataReferencia.getDay();
        const diferencaParaSegunda = dataReferencia.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const segundaFeira = new Date(dataReferencia.setDate(diferencaParaSegunda));

        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        mesAnoDisplay.innerText = `${meses[segundaFeira.getMonth()]} ${segundaFeira.getFullYear()}`;

        // Preenche as datas da Segunda até Domingo na tela
        for (let i = 0; i < 7; i++) {
            let dataAtual = new Date(segundaFeira);
            dataAtual.setDate(segundaFeira.getDate() + i);
            
            const diaStr = formatarData(dataAtual);
            const nomeDia = diasDaSemanaNome[dataAtual.getDay()];
            
            // Atualiza o texto e guarda a data real no elemento HTML
            const cardDia = document.getElementById(`dia-${nomeDia}`);
            const headDia = document.getElementById(`head-${nomeDia}`);
            
            if(cardDia && headDia) {
                cardDia.setAttribute('data-data', diaStr);
                headDia.innerHTML = `${nomeDia}<br><span>${diaStr}</span>`;
            }
        }
        
        carregarTudo(); // Recarrega tarefas sempre que a semana muda
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
            // Se o modo lixeira estiver ativo, permite selecionar
            matDiv.addEventListener('click', (e) => selecionarMateriaParaExcluir(e, mat.nome));
            listaMaterias.appendChild(matDiv);
        });
    }


    // --- LÓGICA DE TAREFAS E DRAG & DROP ---
    function carregarTudo() {
        desenharMaterias();
        
        // Limpa todas as caixas de tarefas e a área azul
        document.querySelectorAll('.tasks-container').forEach(c => c.innerHTML = "");
        const areaEspera = document.getElementById('areaEspera');
        // Mantém apenas o parágrafo de texto da área de espera
        areaEspera.innerHTML = `<p style="color: #fff; opacity: 0.7; text-align: center; margin-top: 15px; width: 100%;">Solte tarefas aqui para levar para outra semana</p>`;

        const tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        const materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];

        tarefas.forEach(tarefa => {
            if (tarefa.concluida) return; // Se quiser esconder as concluídas

            const divTarefa = document.createElement('div');
            divTarefa.className = 'tarefa-arrastavel';
            divTarefa.draggable = true;
            divTarefa.id = `tarefa-${tarefa.id}`;
            // A cor acompanha a prioridade!
            if(tarefa.prioridade === 'verde') divTarefa.style.backgroundColor = '#d4edda';
            if(tarefa.prioridade === 'laranja') divTarefa.style.backgroundColor = '#ffeeba';
            if(tarefa.prioridade === 'vermelha') divTarefa.style.backgroundColor = '#f8d7da';
            
            divTarefa.innerHTML = `<strong>${tarefa.materia}</strong><br>${tarefa.descricao}`;

            // Drag Start
            divTarefa.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tarefa.id);
                setTimeout(() => divTarefa.style.opacity = '0.5', 0);
            });
            divTarefa.addEventListener('dragend', () => divTarefa.style.opacity = '1');

            // Onde essa tarefa deve aparecer?
            if (tarefa.data === "ESPERA") {
                areaEspera.appendChild(divTarefa);
            } 
            else if (tarefa.data === "00/00/0000") {
                // Tarefa sem data. Procura os dias da matéria.
                const matVinculada = materias.find(m => m.nome === tarefa.materia);
                if (matVinculada && matVinculada.dias) {
                    const diasAula = matVinculada.dias.toLowerCase();
                    // Coloca visualmente nos dias da semana que a aula ocorre
                    diasDaSemanaNome.forEach(diaSemana => {
                        if (diasAula.includes(diaSemana.toLowerCase())) {
                            const container = document.querySelector(`#dia-${diaSemana} .tasks-container`);
                            // Clonamos o node porque uma tarefa sem data pode aparecer em dois dias (ex: Terça e Quinta)
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
                // Tarefa com data fixa. Verifica se a data está visível nesta semana.
                const cardDoDia = document.querySelector(`.day-card[data-data="${tarefa.data}"] .tasks-container`);
                if (cardDoDia) {
                    cardDoDia.appendChild(divTarefa);
                }
            }
        });
    }

    // Configura as Zonas onde podemos soltar as tarefas
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
                // Se soltou na área azul
                if (zona.id === 'areaEspera') {
                    tarefas[index].data = "ESPERA";
                } 
                // Se soltou em um dia do calendário
                else {
                    const novaData = zona.getAttribute('data-data');
                    if (novaData) tarefas[index].data = novaData;
                }
                
                localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
                carregarTudo(); // Redesenha a tela inteira atualizada
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
            // 1. Remove a matéria
            let materias = JSON.parse(localStorage.getItem('catPlanMaterias')) || [];
            materias = materias.filter(m => m.nome !== materiaParaExcluir);
            localStorage.setItem('catPlanMaterias', JSON.stringify(materias));

            // 2. Renomeia as tarefas vinculadas
            let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
            tarefas.forEach(t => {
                if (t.materia === materiaParaExcluir) {
                    t.materia = "MATÉRIA APAGADA";
                }
            });
            localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));

            desligarLixeira();
            carregarTudo();
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