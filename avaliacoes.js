document.addEventListener("DOMContentLoaded", () => {

    const btnNova = document.getElementById('btnNovaAvaliacao');
    const formAvaliacao = document.getElementById('formAvaliacao');
    const btnCancelar = document.getElementById('btnCancelarAv');
    const btnSalvar = document.getElementById('btnSalvarAv');
    const container = document.getElementById('containerAvaliacoes');
    const displayMediaTotal = document.getElementById('displayMediaTotal');

    // Abre e fecha o formulário
    btnNova.addEventListener('click', () => {
        formAvaliacao.style.display = 'block';
        document.getElementById('avDescricao').focus();
    });

    btnCancelar.addEventListener('click', () => {
        formAvaliacao.style.display = 'none';
        limparFormulario();
    });

    // Ao salvar a avaliação
    btnSalvar.addEventListener('click', () => {
        const descricao = document.getElementById('avDescricao').value.trim();
        const materia = document.getElementById('avMateria').value.trim();
        const notaTirada = parseFloat(document.getElementById('avTirada').value);
        const notaMaxima = parseFloat(document.getElementById('avMaxima').value);

        if (!descricao || !materia || isNaN(notaTirada) || isNaN(notaMaxima)) {
            alert("Por favor, preencha todos os campos corretamente.");
            return;
        }

        if (notaMaxima === 0) {
            alert("A nota máxima não pode ser zero!");
            return;
        }

        // Calcula a média na base 10
        const mediaBase10 = (notaTirada / notaMaxima) * 10;

        const novaAv = {
            id: Date.now(),
            descricao: descricao,
            materia: materia,
            tirada: notaTirada,
            maxima: notaMaxima,
            media: mediaBase10
        };

        salvarAvaliacao(novaAv);
        formAvaliacao.style.display = 'none';
        limparFormulario();
        carregarAvaliacoes();
    });

    function limparFormulario() {
        document.getElementById('avDescricao').value = "";
        document.getElementById('avMateria').value = "";
        document.getElementById('avTirada').value = "";
        document.getElementById('avMaxima').value = "";
    }

    function salvarAvaliacao(av) {
        const avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];
        avaliacoes.push(av);
        localStorage.setItem('catPlanAvaliacoes', JSON.stringify(avaliacoes));
    }

    // Desenha os cartões e calcula a Média Total
    function carregarAvaliacoes() {
        container.innerHTML = "";
        const avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];

        let somaMedias = 0;

        avaliacoes.forEach(av => {
            somaMedias += av.media;

            const cardDiv = document.createElement('div');
            cardDiv.className = 'card-avaliacao';
            cardDiv.style.position = 'relative';

            // Arredonda para 1 casa decimal (Ex: 8.5)
            const mediaFormatada = av.media.toFixed(1);

            cardDiv.innerHTML = `
                <h4>${av.descricao}</h4>
                <p>${av.materia}</p>
                <p style="margin-top: 10px;">Nota: ${av.tirada}/${av.maxima}</p>
                <p>Média: ${mediaFormatada}/10</p>
                <img src="icone-lixeira.png" class="btn-lixeira-card" onclick="excluirAvaliacao(${av.id})">
            `;

            container.appendChild(cardDiv);
        });

        // Atualiza a Média Total Geral
        if (avaliacoes.length > 0) {
            const mediaGeral = somaMedias / avaliacoes.length;
            displayMediaTotal.innerText = `${mediaGeral.toFixed(1)}/10`;
        } else {
            displayMediaTotal.innerText = `0.0/10`;
        }
    }

    // Função global para o botão de lixeira no cartão
    window.excluirAvaliacao = function(id) {
        if (confirm("Deseja apagar esta avaliação?")) {
            let avaliacoes = JSON.parse(localStorage.getItem('catPlanAvaliacoes')) || [];
            avaliacoes = avaliacoes.filter(av => av.id !== id);
            localStorage.setItem('catPlanAvaliacoes', JSON.stringify(avaliacoes));
            carregarAvaliacoes();
        }
    };

    carregarAvaliacoes();
});