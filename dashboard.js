document.addEventListener("DOMContentLoaded", async () => {
    
    // --- 0. SINCRONIZAÇÃO COM A NUVEM ---
    async function baixarDadosDaNuvem() {
        const username = localStorage.getItem('usuarioLogado');
        if (!username) return;
        try {
            const resposta = await fetch(`https://cat-plan.onrender.com/api/dados?username=${username}`);
            if (resposta.ok) {
                const resultado = await resposta.json();
                if (resultado && resultado.dados_do_site) {
                    for (const [chave, valor] of Object.entries(resultado.dados_do_site)) {
                        localStorage.setItem(chave, typeof valor === 'string' ? valor : JSON.stringify(valor));
                    }
                }
            }
        } catch (error) { console.error("Erro ao baixar dados da nuvem:", error); }
    }

    async function sincronizarComNuvem() {
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

    await baixarDadosDaNuvem();

    // --- VARIÁVEIS E SELETORES ---
    let dataAtual = new Date(); 
    
    const displayData = document.getElementById('currentDate');
    const btnAnt = document.getElementById('btnDiaAnterior');
    const btnProx = document.getElementById('btnDiaSeguinte');
    const calendarioPicker = document.getElementById('calendarioPicker');

    const listaRotina = document.getElementById('listaRotina');
    const inputRotina = document.getElementById('novaRotinaInput');
    const btnAddRotina = document.getElementById('btnAdicionarRotina');
    const btnEditarRotina = document.getElementById('btnEditarRotina');
    let modoEdicaoRotina = false;

    const listaTarefas = document.getElementById('listaTarefasHoje');
    const inputTarefa = document.getElementById('novaTarefaInput');
    const btnAddTarefa = document.getElementById('btnAdicionarTarefa');
    const areaEspera = document.getElementById('areaEspera');
    const inputPesquisa = document.getElementById('inputPesquisaDashboard');

    const diasDaSemanaNome = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    // --- 1. NAVEGAÇÃO DE DATAS E CALENDÁRIO ---
    function formatarDataParaTela(data) {
        return String(data.getDate()).padStart(2, '0') + '/' + 
               String(data.getMonth() + 1).padStart(2, '0') + '/' + 
               data.getFullYear();
    }

    function converterDDMMparaYYYYMM(ddmm) {
        if(ddmm === '00/00/0000') return "";
        const p = ddmm.split('/');
        return `${p[2]}-${p[1]}-${p[0]}`;
    }

    function atualizarTelaInteira() {
        const dataStr = formatarDataParaTela(dataAtual);
        displayData.innerText = dataStr;
        calendarioPicker.value = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dataAtual.getDate()).padStart(2, '0')}`;
        
        const diaSemana = dataAtual.getDay();
        const diferencaParaSegunda = dataAtual.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        const segundaFeira = new Date(new Date(dataAtual).setDate(diferencaParaSegunda));

        for (let i = 0; i < 7; i++) {
            let tempDate = new Date(segundaFeira);
            tempDate.setDate(segundaFeira.getDate() + i);
            const diaStr = formatarDataParaTela(tempDate);
            const nomeDia = diasDaSemanaNome[tempDate.getDay()];
            
            const cardDia = document.getElementById(`dia-${nomeDia}`);
            const headDia = document.getElementById(`head-${nomeDia}`);
            
            if(cardDia && headDia) {
                cardDia.setAttribute('data-data', diaStr);
                headDia.innerHTML = `${nomeDia}<br><span>${diaStr}</span>`;
            }
        }
        
        carregarTudo(dataStr);
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

    // --- 2. ADIÇÃO DE DADOS ---
    btnAddRotina.addEventListener('click', () => {
        const texto = inputRotina.value.trim();
        if (texto !== "") {
            let rotinas = JSON.parse(localStorage.getItem('catPlanRotinasGlobal')) || [];
            rotinas.push({ id: Date.now(), texto: texto });
            localStorage.setItem('catPlanRotinasGlobal', JSON.stringify(rotinas));
            inputRotina.value = "";
            carregarTudo(displayData.innerText);
            sincronizarComNuvem();
        }
    });

    btnEditarRotina.addEventListener('click', () => {
        modoEdicaoRotina = !modoEdicaoRotina;
        btnEditarRotina.style.transform = modoEdicaoRotina ? "scale(1.2)" : "scale(1)";
        btnEditarRotina.style.filter = modoEdicaoRotina ? "drop-shadow(0 0 5px red)" : "none";
        carregarTudo(displayData.innerText);
    });

    btnAddTarefa.addEventListener('click', () => {
        const texto = inputTarefa.value.trim();
        const dataStr = displayData.innerText;
        if (texto !== "") {
            let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
            if (!todasTarefas[dataStr]) todasTarefas[dataStr] = [];
            todasTarefas[dataStr].push({ id: Date.now(), texto: texto, concluida: false });
            localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(todasTarefas));
            inputTarefa.value = "";
            carregarTudo(dataStr);
            sincronizarComNuvem();
        }
    });

    inputTarefa.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnAddTarefa.click(); } });
    inputRotina.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); btnAddRotina.click(); } });

    // --- 3. MOTOR DE RENDERIZAÇÃO ---
    function criarElementoArrastavel(id, tipo, texto, dataAntiga, corFundo = '#fff', tag = '', corTexto = '#000') {
        const div = document.createElement('div');
        div.className = 'tarefa-arrastavel';
        div.draggable = true;
        div.style.backgroundColor = corFundo;
        div.style.color = corTexto;
        div.style.border = "2px solid #000";
        div.style.borderRadius = "8px";
        div.style.padding = "10px";
        div.style.marginBottom = "8px";
        div.style.cursor = "grab";
        div.style.fontSize = "13px";
        div.style.fontWeight = "bold";
        div.style.width = "100%";
        div.setAttribute('data-desc', texto.toLowerCase());
        
        let tagBg = corTexto === '#fff' ? 'rgba(0,0,0,0.15)' : '#e0e0e0';
        let conteudo = tag ? `<div style="font-size:10px; background:${tagBg}; padding:2px 6px; border-radius:4px; display:inline-block; margin-bottom:4px;">${tag}</div><br>` : '';
        conteudo += `<span>${texto}</span>`;
        div.innerHTML = conteudo;

        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({ id: id, type: tipo, oldDate: dataAntiga }));
            setTimeout(() => div.style.opacity = '0.5', 0);
        });
        div.addEventListener('dragend', () => div.style.opacity = '1');
        
        return div;
    }

    function carregarTudo(dataStr) {
        listaRotina.innerHTML = "";
        listaTarefas.innerHTML = "";
        document.querySelectorAll('.tasks-container').forEach(c => c.innerHTML = "");
        if (areaEspera) areaEspera.innerHTML = `<h3 style="color: #4a148c; font-size: 16px; text-align: center; margin-bottom: 10px; margin-top: 0;">Tarefas e Compromissos Sem Data</h3>`;

        // 3.1. ROTINAS
        let rotinas = JSON.parse(localStorage.getItem('catPlanRotinasGlobal')) || [];
        let checksPorDia = JSON.parse(localStorage.getItem('catPlanRotinasChecks')) || {};
        let concluidasHoje = checksPorDia[dataStr] || [];

        rotinas.forEach(rotina => {
            const isChecked = concluidasHoje.includes(rotina.id);
            const li = document.createElement('li');
            li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.justifyContent = 'space-between'; li.style.marginBottom = '8px';
            li.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1; text-decoration: ${isChecked ? 'line-through' : 'none'}; opacity: ${isChecked ? '0.6' : '1'};">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleRotina(${rotina.id}, '${dataStr}')">
                    <span>${rotina.texto}</span>
                </label>
                ${modoEdicaoRotina ? `<img src="icone-lixeira.png" style="width: 16px; cursor: pointer;" onclick="excluirRotina(${rotina.id})">` : ''}
            `;
            listaRotina.appendChild(li);
        });

        // 3.2. INJETAR ROTINAS NOS DIAS
        const weekCards = document.querySelectorAll('.day-card');
        weekCards.forEach(card => {
            const dateAttr = card.getAttribute('data-data');
            const containerDia = card.querySelector('.tasks-container');
            if (!containerDia || !dateAttr) return;

            const concluidasNesteDia = checksPorDia[dateAttr] || [];

            rotinas.forEach(rotina => {
                const isChecked = concluidasNesteDia.includes(rotina.id);
                
                const divRotina = document.createElement('div');
                divRotina.style.backgroundColor = isChecked ? 'rgba(255,255,255,0.6)' : '#f3e5f5';
                divRotina.style.border = "2px dashed #ab47bc";
                divRotina.style.borderRadius = "8px";
                divRotina.style.padding = "8px";
                divRotina.style.marginBottom = "8px";
                divRotina.style.fontSize = "13px";
                divRotina.style.fontWeight = "bold";
                divRotina.style.width = "100%";
                divRotina.style.opacity = isChecked ? "0.6" : "1";

                divRotina.innerHTML = `
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0; width: 100%;">
                        <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleRotina(${rotina.id}, '${dateAttr}')" style="cursor: pointer;">
                        <div style="flex-grow: 1; text-decoration: ${isChecked ? 'line-through' : 'none'};">
                            <span style="font-size:10px; background:#ab47bc; color: #fff; padding:2px 5px; border-radius:4px; margin-right: 6px;">ROTINA</span>
                            ${rotina.texto}
                        </div>
                    </label>
                `;
                containerDia.appendChild(divRotina);
            });
        });

        // 3.3. TAREFAS DIÁRIAS
        let todasTarefasDiarias = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
        let tarefasDiariasHoje = todasTarefasDiarias[dataStr] || [];
        tarefasDiariasHoje = tarefasDiariasHoje.filter(t => !t.concluida); 

        tarefasDiariasHoje.forEach(tarefa => {
            const li = document.createElement('li');
            li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.marginBottom = '8px';
            li.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1;">
                    <input type="checkbox" onchange="toggleTarefaDiaria(${tarefa.id}, '${dataStr}')">
                    <span>${tarefa.texto}</span>
                </label>
                <img src="icone-lixeira.png" style="width: 16px; cursor: pointer; margin-left: 10px; opacity: 0.5;" onclick="excluirTarefa(${tarefa.id}, '${dataStr}')" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.5'">
            `;
            listaTarefas.appendChild(li);
        });

        for (const [dataChave, arrTarefas] of Object.entries(todasTarefasDiarias)) {
            arrTarefas.forEach(t => {
                if (t.concluida) return;
                const el = criarElementoArrastavel(t.id, 'diaria', t.texto, dataChave, '#f4f4f4', 'TAREFA GERAL');
                if (dataChave === "00/00/0000" || dataChave === "ESPERA") {
                    if (areaEspera) areaEspera.appendChild(el);
                } else {
                    const dayCard = document.querySelector(`.day-card[data-data="${dataChave}"] .tasks-container`);
                    if (dayCard) dayCard.appendChild(el);
                }
            });
        }

        // 3.4. TAREFAS DE ESTUDO
        let todasTarefasEstudos = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
        todasTarefasEstudos.forEach(t => {
            if (t.concluida) return;
            let cor = '#fff';
            if(t.prioridade === 'verde') cor = '#d4edda';
            if(t.prioridade === 'laranja') cor = '#ffeeba';
            if(t.prioridade === 'vermelha') cor = '#f8d7da';
            
            const el = criarElementoArrastavel(t.id, 'estudo', t.descricao, t.data, cor, t.materia);
            
            if (t.data === "00/00/0000" || t.data === "ESPERA") {
                if (areaEspera) areaEspera.appendChild(el);
            } else {
                const dayCard = document.querySelector(`.day-card[data-data="${t.data}"] .tasks-container`);
                if (dayCard) dayCard.appendChild(el);
            }
        });

        // 3.5. COMPROMISSOS COM O ROXO SUAVE E EQUILIBRADO (#b39ddb)
        let todosCompromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const dataCompFormat = converterDDMMparaYYYYMM(dataStr);
        let compromissosHoje = todosCompromissos.filter(c => c.data === dataCompFormat && !c.concluido);

        compromissosHoje.forEach(comp => {
            const li = document.createElement('li');
            li.style.display = 'flex'; li.style.alignItems = 'center'; li.style.marginBottom = '8px';
            li.innerHTML = `
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; flex-grow: 1;">
                    <input type="checkbox" onchange="toggleCompromissoDashboard(${comp.id}, '${dataStr}')">
                    <span><strong style="font-size: 11px; background: #673ab7; color: #fff; padding: 2px 6px; border-radius: 4px; margin-right: 5px;">COMPROMISSO</strong> ${comp.descricao}</span>
                </label>
            `;
            listaTarefas.appendChild(li);
        });

        todosCompromissos.forEach(c => {
            if (c.concluido) return;
            let dataPadrao = "00/00/0000";
            if (c.data && c.data !== "") {
                const p = c.data.split('-');
                dataPadrao = `${p[2]}/${p[1]}/${p[0]}`;
            }
            
            // Fundo roxo suave/pastel (#b39ddb) com texto escuro para leitura perfeita e limpa
            const el = criarElementoArrastavel(c.id, 'compromisso', c.descricao, c.data, '#b39ddb', 'COMPROMISSO', '#111');
            
            if (dataPadrao === "00/00/0000") {
                if (areaEspera) areaEspera.appendChild(el);
            } else {
                const dayCard = document.querySelector(`.day-card[data-data="${dataPadrao}"] .tasks-container`);
                if (dayCard) dayCard.appendChild(el);
            }
        });
        
        filtrarPainelRoxo();
    }

    // --- 4. FUNÇÕES DE STATUS ---
    window.toggleRotina = function(idRotina, dataStr) {
        let checksPorDia = JSON.parse(localStorage.getItem('catPlanRotinasChecks')) || {};
        if (!checksPorDia[dataStr]) checksPorDia[dataStr] = [];
        const index = checksPorDia[dataStr].indexOf(idRotina);
        if (index > -1) checksPorDia[dataStr].splice(index, 1);
        else checksPorDia[dataStr].push(idRotina);
        localStorage.setItem('catPlanRotinasChecks', JSON.stringify(checksPorDia));
        carregarTudo(dataStr); 
        sincronizarComNuvem();
    }

    window.excluirRotina = function(idRotina) {
        if(confirm("Apagar este item da rotina permanentemente?")) {
            let rotinas = JSON.parse(localStorage.getItem('catPlanRotinasGlobal')) || [];
            rotinas = rotinas.filter(r => r.id !== idRotina);
            localStorage.setItem('catPlanRotinasGlobal', JSON.stringify(rotinas));
            carregarTudo(displayData.innerText);
            sincronizarComNuvem();
        }
    }

    window.toggleTarefaDiaria = function(idTarefa, dataStr) {
        let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
        if (todasTarefas[dataStr]) {
            const index = todasTarefas[dataStr].findIndex(t => t.id === idTarefa);
            if (index !== -1) {
                todasTarefas[dataStr][index].concluida = true;
                localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(todasTarefas));
                carregarTudo(displayData.innerText);
                sincronizarComNuvem();
            }
        }
    }

    window.toggleCompromissoDashboard = function(idComp, dataStr) {
        let todosCompromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const index = todosCompromissos.findIndex(c => c.id === idComp);
        if (index !== -1) {
            todosCompromissos[index].concluido = true;
            localStorage.setItem('catPlanCompromissos', JSON.stringify(todosCompromissos));
            carregarTudo(displayData.innerText);
            sincronizarComNuvem();
        }
    }

    window.excluirTarefa = function(idTarefa, dataStr) {
        let todasTarefas = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
        if (todasTarefas[dataStr]) {
            todasTarefas[dataStr] = todasTarefas[dataStr].filter(t => t.id !== idTarefa);
            localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(todasTarefas));
            carregarTudo(displayData.innerText);
            sincronizarComNuvem();
        }
    }

    // --- 5. ARRASTAR E SOLTAR ---
    const zonasDeSoltura = [document.getElementById('areaEspera'), ...document.querySelectorAll('.day-card')];
    
    zonasDeSoltura.forEach(zona => {
        if (!zona) return;
        
        zona.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (zona.id === 'areaEspera') zona.style.backgroundColor = '#d1b3ff'; 
            else zona.style.backgroundColor = 'rgba(0,0,0,0.05)';
        });

        zona.addEventListener('dragleave', () => {
            if (zona.id === 'areaEspera') zona.style.backgroundColor = '#e1bee7'; 
            else zona.style.backgroundColor = '';
        });

        zona.addEventListener('drop', (e) => {
            e.preventDefault();
            if (zona.id === 'areaEspera') zona.style.backgroundColor = '#e1bee7';
            else zona.style.backgroundColor = '';
            
            const payloadData = e.dataTransfer.getData('text/plain');
            if (!payloadData) return;
            
            const payload = JSON.parse(payloadData);
            const newDate = zona.id === 'areaEspera' ? '00/00/0000' : zona.getAttribute('data-data');
            
            if (payload.type === 'estudo') {
                let tarefas = JSON.parse(localStorage.getItem('catPlanTarefasEstudos')) || [];
                const idx = tarefas.findIndex(t => t.id === payload.id);
                if (idx !== -1) {
                    tarefas[idx].data = newDate;
                    localStorage.setItem('catPlanTarefasEstudos', JSON.stringify(tarefas));
                }
            } 
            else if (payload.type === 'diaria') {
                let tarefasD = JSON.parse(localStorage.getItem('catPlanTarefasDiarias')) || {};
                let arrOld = tarefasD[payload.oldDate] || [];
                const idx = arrOld.findIndex(t => t.id === payload.id);
                if (idx !== -1) {
                    const task = arrOld.splice(idx, 1)[0];
                    if (!tarefasD[newDate]) tarefasD[newDate] = [];
                    tarefasD[newDate].push(task);
                    localStorage.setItem('catPlanTarefasDiarias', JSON.stringify(tarefasD));
                }
            } 
            else if (payload.type === 'compromisso') {
                let compromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
                const idx = compromissos.findIndex(c => c.id === payload.id);
                if (idx !== -1) {
                    compromissos[idx].data = newDate === '00/00/0000' ? "" : converterDDMMparaYYYYMM(newDate);
                    localStorage.setItem('catPlanCompromissos', JSON.stringify(compromissos));
                }
            }
            
            carregarTudo(displayData.innerText);
            sincronizarComNuvem();
        });
    });

    // --- 6. PESQUISA ---
    if (inputPesquisa) {
        inputPesquisa.addEventListener('input', filtrarPainelRoxo);
    }

    function filtrarPainelRoxo() {
        if (!inputPesquisa || !areaEspera) return;
        const termo = inputPesquisa.value.toLowerCase();
        const tarefasListadas = areaEspera.querySelectorAll('.tarefa-arrastavel');
        
        tarefasListadas.forEach(el => {
            const desc = el.getAttribute('data-desc');
            if (desc.includes(termo)) el.style.display = 'block';
            else el.style.display = 'none';
        });
    }

    // --- INITIALIZE ---
    atualizarTelaInteira();
});
