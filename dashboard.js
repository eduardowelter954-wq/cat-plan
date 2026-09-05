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
            const partes = e.target.value.split
