document.addEventListener("DOMContentLoaded", () => {
    
    // --- VARIÁVEIS DE TEMPO E ELEMENTOS ---
    let dataAtual = new Date(); 
    
    const displayData = document.getElementById('currentDate');
    const btnAnt = document.getElementById('btnDiaAnterior');
    const btnProx = document.getElementById('btnDiaSeguinte');
    const calendarioPicker = document.getElementById('calendarioPicker');

    // Elementos da Rotina e Filtros
    const listaRotina = document.getElementById('listaRotina');
    const inputRotina = document.getElementById('novaRotinaInput');
    const btnAddRotina = document.getElementById('btnAdicionarRotina');
    const btnEditarRotina = document.getElementById('btnEditarRotina');
    const filtroRotina = document.getElementById('filtroRotina');
    const filtroCompromisso = document.getElementById('filtroCompromisso');
    let modoEdicaoRotina = false;

    // Elementos de Tarefas
    const listaTarefas = document.getElementById('listaTarefasHoje');
    const inputTarefa = document.getElementById('novaTarefaInput');
    const btnAddTarefa = document.getElementById('btnAdicionarTarefa');


    // --- 1. NAVEGAÇÃO DE DATAS ---
    
    function formatarDataParaTela(data) {
        return String(data.getDate()).padStart(2, '0') + '/' + 
               String(data.getMonth() + 1).padStart(2, '0') + '/' + 
               data.getFullYear();
    }

    function atualizarTelaInteira() {
        const dataStr = formatarDataParaTela(dataAtual);
        displayData.innerText = dataStr;
        calendarioPicker.value = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dataAtual.getDate()).padStart(2, '0')}`;
        
        carregarRotinasECompromissos(dataStr);
        carregarTarefas(dataStr);
    }

    btnAnt.addEventListener('click', () => { dataAtual.setDate(dataAtual.getDate() - 1); atualizarTelaInteira(); });
    btnProx.addEventListener('click', () => { dataAtual.setDate(dataAtual.getDate() + 1); atualizarTelaInteira(); });
    calendarioPicker.addEventListener('change', (e) => {
        if(e.target.value) {
            const partes = e.target.value.split('-');
            dataAtual = new Date(partes[0], partes[1] - 1, partes[2]);
            atualizarTelaInteira();
        }
    });

    // Escuta os cliques nos filtros para redesenhar a tela na hora
    if(filtroRotina) filtroRotina.addEventListener('change', () => carregarRotinasECompromissos(displayData.innerText));
    if(filtroCompromisso) filtroCompromisso.addEventListener('change', () => carregarRotinasECompromissos(displayData.innerText));


    // --- 2. LÓGICA DA ROTINA E COMPROMISSOS (CARTÃO ESQUERDO) ---
    
    btnAddRotina.addEventListener('click', () => {
        const texto = inputRotina.value.trim();
        if (texto !== "") {
            let rotinas = JSON.parse(localStorage.getItem('catPlanRotinasGlobal')) || [];
            rotinas.push({ id: Date.now(), texto: texto });
            localStorage.setItem('catPlanRotinasGlobal', JSON.stringify(rotinas));
            inputRotina.value = "";
            carregarRotinasECompromissos(displayData.innerText);
        }
    });

    btnEditarRotina.addEventListener('click', () => {
        modoEdicaoRotina = !modoEdicaoRotina;
        btnEditarRotina.style.transform = modoEdicaoRotina ? "scale(1.2)" : "scale(1)";
        btnEditarRotina.style.filter = modoEdicaoRotina ? "drop-shadow(0 0 5px red)" : "none";
        carregarRotinasECompromissos(displayData.innerText);
    });

    function carregarRotinasECompromissos(dataStr) {
        listaRotina.innerHTML = "";
        
        // A. Carrega Rotinas se o filtro estiver marcado
        if (filtroRotina && filtroRotina.checked) {
            let rotinas = JSON.parse(localStorage.getItem('catPlanRotinasGlobal')) || [];
            let checksPorDia = JSON.parse(localStorage.getItem('catPlanRotinasChecks')) || {};
            let concluidasHoje = checksPorDia[dataStr] || [];

            rotinas.forEach(rotina => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.justifyContent = 'space-between';
                li.style.marginBottom = '8px';

                const isChecked = concluidasHoje.includes(rotina.id);

                li.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1; text-decoration: ${isChecked ? 'line-through' : 'none'}; opacity: ${isChecked ? '0.6' : '1'};">
                        <input type="checkbox" class="check-passo verde" ${isChecked ? 'checked' : ''} onchange="toggleRotina(${rotina.id}, '${dataStr}')">
                        <span>${rotina.texto}</span>
                    </label>
                    ${modoEdicaoRotina ? `<img src="icone-lixeira.png" style="width: 16px; cursor: pointer;" onclick="excluirRotina(${rotina.id})">` : ''}
                `;
                listaRotina.appendChild(li);
            });
        }

        // B. Carrega Compromissos se o filtro estiver marcado
        if (filtroCompromisso && filtroCompromisso.checked) {
            const partes = dataStr.split('/');
            const dataCompFormat = `${partes[2]}-${partes[1]}-${partes[0]}`; 
            
            let todosCompromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
            let compromissosHoje = todosCompromissos.filter(c => c.data === dataCompFormat);

            // Adiciona uma linha visual divisória se tiver rotina e compromisso juntos
            if (filtroRotina && filtroRotina.checked && listaRotina.children.length > 0 && compromissosHoje.length > 0) {
                const divisor = document.createElement('div');
                divisor.style.borderTop = "1px dashed #dcdcdc";
                divisor.style.margin = "10px 0";
                listaRotina.appendChild(divisor);
            }

            compromissosHoje.forEach(comp => {
                const li = document.createElement('li');
                li.style.display = 'flex';
                li.style.alignItems = 'center';
                li.style.marginBottom = '8px';

                li.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1; text-decoration: ${comp.concluido ? 'line-through' : 'none'}; opacity: ${comp.concluido ? '0.6' : '1'};">
                        <input type="checkbox" class="check-passo laranja" ${comp.concluido ? 'checked' : ''} onchange="toggleCompromissoDashboard(${comp.id}, '${dataStr}')">
                        <span><strong style="font-size: 11px; background: #ebd9fc; padding: 2px 6px; border-radius: 4px; margin-right: 5px;">COMPROMISSO</strong> ${comp.descricao}</span>
                    </label>
                `;
                listaRotina.appendChild(li);
            });
        }
    }

    window.toggleRotina = function(idRotina, dataStr) {
        let checksPorDia = JSON.parse(localStorage.getItem('catPlanRotinasChecks')) || {};
        if (!checksPorDia[dataStr]) checksPorDia[dataStr] = [];
        const index = checksPorDia[dataStr].indexOf(idRotina);
        if (index > -1) checksPorDia[dataStr].splice(index, 1);
        else checksPorDia[dataStr].push(idRotina);
        localStorage.setItem('catPlanRotinasChecks', JSON.stringify(checksPorDia));
        carregarRotinasECompromissos(dataStr); 
    }

    window.excluirRotina = function(idRotina) {
        if(confirm("Apagar este item da rotina permanentemente?")) {
            let rotinas = JSON.parse(localStorage.getItem('catPlanRotinasGlobal')) || [];
            rotinas = rotinas.filter(r => r.id !== idRotina);
            localStorage.setItem('catPlanRotinasGlobal', JSON.stringify(rotinas));
            carregarRotinasECompromissos(displayData.innerText);
        }
    }

    window.toggleCompromissoDashboard = function(idComp, dataStr) {
        let todosCompromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const index = todosCompromissos.findIndex(c => c.id === idComp);
        if (index !== -1) {
            todosCompromissos[index].concluido = !todosCompromissos[index].concluido;
            localStorage.setItem('catPlanCompromissos', JSON.stringify(todosCompromissos));
            carregarRotinasECompromissos(dataStr);
        }
    }


    // --- 3. LÓGICA DE TAREFAS PONTUAIS (CARTÃO DIREITO) ---

    btnAddTarefa.addEventListener('click', () => {
        const texto = inputTarefa.value.trim();
        const dataStr = displayData.innerText;
        if (texto !== "") {
            let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
            if (!todasTarefas[dataStr]) todasTarefas[dataStr] = [];
            todasTarefas[dataStr].push({ id: Date.now(), texto: texto, concluida: false });
            localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(todasTarefas));
            inputTarefa.value = "";
            carregarTarefas(dataStr);
        }
    });

    inputTarefa.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnAddTarefa.click(); } });
    inputRotina.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnAddRotina.click(); } });

    function carregarTarefas(dataStr) {
        listaTarefas.innerHTML = "";
        
        let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
        let tarefasHoje = todasTarefas[dataStr] || [];

        tarefasHoje.forEach(tarefa => {
            const li = document.createElement('li');
            li.style.display = 'flex';
            li.style.alignItems = 'center';
            li.style.marginBottom = '8px';

            li.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1; text-decoration: ${tarefa.concluida ? 'line-through' : 'none'}; opacity: ${tarefa.concluida ? '0.6' : '1'};">
                    <input type="checkbox" class="check-passo verde" ${tarefa.concluida ? 'checked' : ''} onchange="toggleTarefa(${tarefa.id}, '${dataStr}')">
                    <span>${tarefa.texto}</span>
                </label>
                <img src="icone-lixeira.png" style="width: 16px; cursor: pointer; margin-left: 10px; opacity: 0.5;" onclick="excluirTarefa(${tarefa.id}, '${dataStr}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">
            `;
            listaTarefas.appendChild(li);
        });
    }

    window.toggleTarefa = function(idTarefa, dataStr) {
        let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
        let tarefasHoje = todasTarefas[dataStr] || [];
        const index = tarefasHoje.findIndex(t => t.id === idTarefa);
        if (index !== -1) {
            tarefasHoje[index].concluida = !tarefasHoje[index].concluida;
            todasTarefas[dataStr] = tarefasHoje;
            localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(todasTarefas));
            carregarTarefas(dataStr);
        }
    }

    window.excluirTarefa = function(idTarefa, dataStr) {
        let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
        let tarefasHoje = todasTarefas[dataStr] || [];
        tarefasHoje = tarefasHoje.filter(t => t.id !== idTarefa);
        todasTarefas[dataStr] = tarefasHoje;
        localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(todasTarefas));
        carregarTarefas(dataStr);
    }

    // Inicia a tela desenhando o dia atual!
    atualizarTelaInteira();
});