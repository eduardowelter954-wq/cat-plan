document.addEventListener("DOMContentLoaded", () => {
    verificarSessao();

    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        if (username.trim() !== "" && password.trim() !== "") {
            try {
                // A MÁGICA ACONTECE AQUI: Apontando para o seu servidor no Render!
                const resposta = await fetch('https://cat-plan.onrender.com/api/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const dados = await resposta.json();
                console.log('Resposta do servidor:', dados.mensagem);

                // Por enquanto, ativa a sessão de 45 dias localmente
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
    
    // REDIRECIONA APÓS LOGIN NOVO:
    window.location.href = "dashboard.html"; 
}

function verificarSessao() {
    const sessaoSalva = localStorage.getItem('catPlanSessao');
    
    if (sessaoSalva) {
        const sessao = JSON.parse(sessaoSalva);
        const dataAtual = new Date().getTime();
        
        if (dataAtual < sessao.expiraEm) {
            console.log("Usuário já está logado!");
            
            // REDIRECIONA SE JÁ TIVER SESSÃO ATIVA (dentro dos 45 dias):
            window.location.href = "dashboard.html"; 
            
        } else {
            console.log("Sessão expirou.");
            localStorage.removeItem('catPlanSessao'); 
        }
    }
}