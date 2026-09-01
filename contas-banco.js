document.addEventListener("DOMContentLoaded", () => {
    
    const chkBanco = document.getElementById('chkBanco');
    const chkFisico = document.getElementById('chkFisico');
    const inputBanco = document.getElementById('inputBanco');
    const btnSalvarConta = document.getElementById('btnSalvarConta');
    const listaCadastrados = document.getElementById('listaCadastrados');

    let contas = JSON.parse(localStorage.getItem('catPlanContasBancarias')) || [];

    // --- LÓGICA DOS CHECKBOXES ---
    chkBanco.addEventListener('change', () => {
        if (chkBanco.checked) {
            chkFisico.checked = false;
            inputBanco.disabled = false;
            inputBanco.focus();
        }
    });

    chkFisico.addEventListener('change', () => {
        if (chkFisico.checked) {
            chkBanco.checked = false;
            inputBanco.disabled = true;
            inputBanco.value = '';
        }
    });

    // --- LÓGICA DE SALVAR ---
    if (btnSalvarConta) {
        btnSalvarConta.addEventListener('click', () => {
            if (!chkBanco.checked && !chkFisico.checked) {
                alert("Por favor, marque se é Conta no banco ou Dinheiro físico.");
                return;
            }

            let nomeFinal = "";

            if (chkBanco.checked) {
                const nomeDigitado = inputBanco.value.trim();
                if (!nomeDigitado) {
                    alert("Digite o nome do banco!");
                    return;
                }
                nomeFinal = `Conta do banco ${nomeDigitado}`;
            } else if (chkFisico.checked) {
                nomeFinal = "Dinheiro físico";
            }

            const jaExiste = contas.some(c => c.nome.toLowerCase() === nomeFinal.toLowerCase());
            if (jaExiste) {
                alert("Essa conta/forma já está cadastrada!");
                return;
            }

            const novaConta = {
                id: Date.now(),
                nome: nomeFinal
            };

            contas.push(novaConta);
            
            inputBanco.value = '';
            chkBanco.checked = false;
            chkFisico.checked = false;
            inputBanco.disabled = false;

            salvarERenderizarContas();
        });
    }

    // --- LÓGICA DE RENDERIZAR E EXCLUIR ---
    function salvarERenderizarContas() {
        localStorage.setItem('catPlanContasBancarias', JSON.stringify(contas));
        listaCadastrados.innerHTML = '';

        contas.forEach(conta => {
            const li = document.createElement('li');
            li.style.display = "flex";
            li.style.alignItems = "center";
            li.style.justifyContent = "space-between";
            li.style.marginBottom = "10px";
            
            li.innerHTML = `
                <span>${conta.nome}</span>
                <img src="lixo.png" class="btn-excluir-conta" data-id="${conta.id}" title="Excluir" style="width: 20px; cursor: pointer;">
            `;
            listaCadastrados.appendChild(li);
        });

        document.querySelectorAll('.btn-excluir-conta').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                if (confirm("Deseja apagar esta conta do seu cadastro?")) {
                    contas = contas.filter(c => c.id !== id);
                    salvarERenderizarContas();
                }
            });
        });
    }

    salvarERenderizarContas();
});
