document.addEventListener("DOMContentLoaded", () => {
    const inputDesc = document.getElementById('descCompromisso');
    const inputData = document.getElementById('dataCompromisso');
    const btnSalvar = document.getElementById('btnSalvarCompromisso');
    const containerLista = document.getElementById('containerCompromissos');

    let idEditando = null; // Memória para saber se estamos editando um cartão existente

    // Inicia carregando o que já está salvo
    carregarCompromissos();

    // Evento de Salvar (Serve tanto para Criar quanto para Editar)
    btnSalvar.addEventListener('click', () => {
        const descricao = inputDesc.value.trim();
        let dataStr = inputData.value;
        
        if (descricao !== "") {
            if (idEditando) {
                // Se o idEditando estiver preenchido, nós vamos ATUALIZAR
                atualizarCompromissoExistente(idEditando, descricao, dataStr);
                idEditando = null; 
                btnSalvar.src = "icone-adicionar.png"; // Devolve o ícone de + normal
            } else {
                // Se não, vamos CRIAR um novo
                salvarNovoCompromisso(descricao, dataStr);
            }
            
            inputDesc.value = "";
            inputData.value = "";
            carregarCompromissos();
        }
    });

    function salvarNovoCompromisso(descricao, data) {
        const compromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const novoCompromisso = {
            id: Date.now(),
            descricao: descricao,
            data: data,
            concluido: false
        };
        compromissos.push(novoCompromisso);
        localStorage.setItem('catPlanCompromissos', JSON.stringify(compromissos));
    }

    function atualizarCompromissoExistente(id, descricao, data) {
        let compromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const index = compromissos.findIndex(c => c.id === id);
        if (index !== -1) {
            compromissos[index].descricao = descricao;
            compromissos[index].data = data;
            localStorage.setItem('catPlanCompromissos', JSON.stringify(compromissos));
        }
    }

    function carregarCompromissos() {
        containerLista.innerHTML = "";
        let compromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];

        // 1. O SEGREDO DO SUMIÇO: Filtra mostrando APENAS os que NÃO estão concluídos
        let compromissosPendentes = compromissos.filter(comp => comp.concluido === false);

        // 2. LÓGICA DE ORDENAÇÃO
        compromissosPendentes.sort((a, b) => {
            if (!a.data && !b.data) return 0;
            if (!a.data) return 1;
            if (!b.data) return -1;
            if (a.data < b.data) return -1;
            if (a.data > b.data) return 1;
            return 0;
        });

        // 3. DESENHA OS CARTÕES
        compromissosPendentes.forEach(comp => {
            let dataFormatada = "00/00/0000";
            if (comp.data) {
                const partes = comp.data.split('-');
                dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }

            const cartao = document.createElement('div');
            cartao.className = 'card compromisso-item';
            
            cartao.innerHTML = `
                <img src="icone-editar.png" class="icon-edit" style="position: absolute; top: 10px; right: 10px; width: 20px; cursor: pointer;" onclick="editarCompromisso(${comp.id})">
                
                <h4 style="font-size: 14px; text-transform: uppercase; margin-top: 15px; margin-bottom: 10px;">${comp.descricao}</h4>
                <p style="font-size: 14px; color: #555;">${dataFormatada}</p>
                
                <img src="icone-check.png" class="icon-check" style="position: absolute; bottom: 10px; left: 10px; width: 25px; cursor: pointer;" onclick="concluirCompromisso(${comp.id})">
            `;
            containerLista.appendChild(cartao);
        });
    }

    // Função para marcar como concluído a partir DESTA tela
    window.concluirCompromisso = function(id) {
        let compromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const index = compromissos.findIndex(c => c.id === id);
        
        if (index !== -1) {
            compromissos[index].concluido = true;
            localStorage.setItem('catPlanCompromissos', JSON.stringify(compromissos));
            
            // Ao carregar a tela de novo, ele some (porque o filtro pega só os não concluídos)
            carregarCompromissos(); 
        }
    }

    // Função para ativar o MODO EDIÇÃO
    window.editarCompromisso = function(id) {
        let compromissos = JSON.parse(localStorage.getItem('catPlanCompromissos')) || [];
        const comp = compromissos.find(c => c.id === id);
        
        if (comp) {
            // 1. Devolve os dados para as caixinhas na esquerda
            inputDesc.value = comp.descricao;
            inputData.value = comp.data || "";
            
            // 2. Avisa o sistema que estamos editando este ID
            idEditando = comp.id; 
            
            // 3. Muda o botão de "+" para um ícone de "check" para dar sensação de "salvar alteração"
            btnSalvar.src = "icone-check.png"; 
            
            // 4. Joga o cursor para a caixa de texto
            inputDesc.focus();
        }
    }
});