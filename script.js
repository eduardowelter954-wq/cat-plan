document.addEventListener("DOMContentLoaded", () => {
    console.log("O script de login carregou com sucesso e o HTML está pronto!");
    verificarSessao();

    const loginForm = document.getElementById('loginForm');
    
    // Segurança para avisar se o ID estiver errado no HTML
    if (!loginForm) {
        console.error("ERRO: O elemento com o id 'loginForm' não foi encontrado no HTML!");
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        console.log("Formulário enviado! Disparando requisição...");
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username.trim() !== "" && password.trim() !== "") {
            try {
                const resposta = await fetch('https://cat-plan.onrender.com/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const dados = await resposta.json();
                console.log('Resposta do servidor:', dados.mensagem);

                iniciarSessao(username);

            } catch (erro) {
                console.error('Erro ao conectar com o servidor:', erro);
                alert('Não foi possível conectar ao servidor na nuvem. Verifique sua internet ou o status do Render.');
            }
        }
    });
});

function iniciarSessao(username) {
    const dataAtual = new Date();
    const dataExpiracao = dataAtual.getTime() + (45 * 24 * 60 * 60 * 1000); 

    const sessao = {
        usuario: username,
        expiraEm: dataExpiracao
    };

    localStorage.setItem('catPlanSessao', JSON.stringify(sessao));
    alert(`Miau! Bem-vindo, ${username}. Login realizado com sucesso!`);
    
    window.location.href = "dashboard.html"; 
}

function verificarSessao() {
    const sessaoSalva = localStorage.getItem('catPlanSessao');
    
    if (sessaoSalva) {
        const sessao = JSON.parse(sessaoSalva);
        const dataAtual = new Date().getTime();
        
        if (dataAtual < sessao.expiraEm) {
            console.log("Usuário já está logado!");
            window.location.href = "dashboard.html"; 
        } else {
            console.log("Sessão expirou.");
            localStorage.removeItem('catPlanSessao'); 
        }
    }
}