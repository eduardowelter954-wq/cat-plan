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

    // --- LÓGICA DO CALENDÁRIO ---
    let dataReferencia = new Date();
    const diasDaSemanaNome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    
    const btnAnt = document.getElementById('btnSemanaAnterior');
    const btnProx = document.getElementById('btnSemanaProxima');
    const mesAnoDisplay = document.getElementById('mesAnoDisplay');

    if (btnAnt) {
        btnAnt.addEventListener('click', () => {
            dataReferencia.setDate(dataReferencia.getDate() - 7);
            atualizarCalendario();
        });
    }

    if (btnProx) {
        btnProx.addEventListener('click', () => {
            dataReferencia.setDate(dataReferencia.getDate() + 7);
            atualizarCalendario();
        });
    }

    function atualizarCalendario() {
        const diaSemana = dataReferencia.getDay();
        const diferencaParaSegunda = dataReferencia.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const segundaFeira = new Date(dataReferencia.setDate(diferencaParaSegunda));

        const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        if (mesAnoDisplay) {
            mesAnoDisplay.innerText = `${meses[segundaFeira.getMonth()]} ${segundaFeira.getFullYear()}`;
        }

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


    // --- LÓGICA DE TAREFAS, DRAG & DROP E PESQUISA ---
    function carregarTudo() {
        document.querySelectorAll('.tasks-container').forEach(c => c.innerHTML = "");
        const areaEspera = document.getElementById('areaEspera');
        
        if (areaEspera) {
            areaEspera.innerHTML = `<h3 style="color: #000; font-size: 18px; text-align: center; margin-bottom: 15px; margin-top: 0;">Tarefas Sem Data</h3>`;
        }

        const tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];

        tarefas.forEach(tarefa => {
            if (tarefa.concluida) return; 

            const divTarefa = document.createElement('div');
            divTarefa.className = 'tarefa-arrastavel';
            divTarefa.draggable = true;
            divTarefa.id = `tarefa-${tarefa.id}`;
            // Guarda a descrição para o filtro de pesquisa funcionar
            divTarefa.setAttribute('data-desc', tarefa.descricao.toLowerCase());
            
            if(tarefa.prioridade === 'verde') divTarefa.style.backgroundColor = '#d4edda';
            if(tarefa.prioridade === 'laranja') divTarefa.style.backgroundColor = '#ffeeba';
            if(tarefa.prioridade === 'vermelha') divTarefa.style.backgroundColor = '#f8d7da';
            
            divTarefa.innerHTML = `<strong>${tarefa.materia}</strong><br>${tarefa.descricao}`;

            divTarefa.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', tarefa.id);
                setTimeout(() => divTarefa.style.opacity = '0.5', 0);
            });
            divTarefa.addEventListener('dragend', () => divTarefa.style.opacity = '1');

            // Joga para o painel lateral as tarefas sem data ou em "ESPERA"
            if (tarefa.data === "ESPERA" || tarefa.data === "00/00/0000") {
                if (areaEspera) {
                    areaEspera.appendChild(divTarefa);
                }
            } 
            else {
                const cardDoDia = document.querySelector(`.day-card[data-data="${tarefa.data}"] .tasks-container`);
                if (cardDoDia) {
                    cardDoDia.appendChild(divTarefa);
                }
            }
        });
        
        filtrarTarefasSemData(); // Refaz o filtro caso algo já esteja digitado
    }

    const zonasDeSoltura = [document.getElementById('areaEspera'), ...document.querySelectorAll('.day-card')];
    
    zonasDeSoltura.forEach(zona => {
        if (!zona) return;
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
                    tarefas[index].data = "00/00/0000"; // Define sem data
                } else {
                    const novaData = zona.getAttribute('data-data');
                    if (novaData) tarefas[index].data = novaData;
                }
                
                localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
                carregarTudo(); 
                sincronizarComNuvem();
            }
        });
    });

    // --- BARRA DE PESQUISA ---
    const inputPesquisa = document.getElementById('inputPesquisaTarefas');
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', filtrarTarefasSemData);
    }

    function filtrarTarefasSemData() {
        if (!inputPesquisa) return;
        const termo = inputPesquisa.value.toLowerCase();
        const areaEspera = document.getElementById('areaEspera');
        
        if (areaEspera) {
            const tarefasListadas = areaEspera.querySelectorAll('.tarefa-arrastavel');
            tarefasListadas.forEach(el => {
                const desc = el.getAttribute('data-desc');
                if (desc.includes(termo)) {
                    el.style.display = 'block';
                } else {
                    el.style.display = 'none';
                }
            });
        }
    }


    // --- LIXEIRA ---
    const btnLixeira = document.getElementById('btnLixeira');
    const btnConfirmar = document.getElementById('btnConfirmarExclusao');
    window.modoExclusaoGlobal = false;
    let materiaParaExcluir = null;

    if (btnLixeira) {
        btnLixeira.addEventListener('click', () => {
            window.modoExclusaoGlobal = !window.modoExclusaoGlobal;
            if (window.modoExclusaoGlobal) {
                btnLixeira.style.transform = "scale(1.2)";
                btnLixeira.style.filter = "drop-shadow(0 0 5px red)";
            } else {
                desligarLixeira();
            }
        });
    }

    function desligarLixeira() {
        window.modoExclusaoGlobal = false;
        materiaParaExcluir = null;
        if (btnLixeira) {
            btnLixeira.style.transform = "scale(1)";
            btnLixeira.style.filter = "none";
        }
    }

    if (document.getElementById('mesAnoDisplay')) {
        atualizarCalendario();
    } else {
        carregarTudo();
    }
});
