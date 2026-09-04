document.addEventListener("DOMContentLoaded", () => {
    const containerListasOrg = document.getElementById('containerListasOrg');
    let registros = JSON.parse(localStorage.getItem('catPlanOrganizacao')) || [];

    function renderizarRegistros() {
        containerListasOrg.innerHTML = '';

        if (registros.length === 0) {
            containerListasOrg.innerHTML = '<p style="color: #777; font-size: 15px;">Nenhum registro adicionado. Clique em "Cadastro" para criar sua lista ou texto.</p>';
            return;
        }

        registros.forEach((reg, index) => {
            const divItem = document.createElement('div');
            divItem.style.position = 'relative';
            divItem.style.paddingRight = '30px';
            divItem.style.marginBottom = '15px';

            let textoFinal = reg.descricao;
            let estiloFonte = `font-family: ${reg.fonte || 'inherit'}; font-size: ${reg.tamanho || '16px'};`;

            divItem.innerHTML = `<div style="${estiloFonte}">${textoFinal}</div>`;
            containerListasOrg.appendChild(divItem);
        });
    }

    // Botão de limpar tudo com a lixeira
    const btnExcluirTudoOrg = document.getElementById('btnExcluirTudoOrg');
    if (btnExcluirTudoOrg) {
        btnExcluirTudoOrg.addEventListener('click', () => {
            if (confirm("Deseja apagar todos os registros de organização?")) {
                registros = [];
                localStorage.setItem('catPlanOrganizacao', JSON.stringify(registros));
                renderizarRegistros();
            }
        });
    }

    renderizarRegistros();
});
