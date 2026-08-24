document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log("Formulário enviado! Disparando requisição...");

    try {
        const response = await fetch('https://cat-plan.onrender.com/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

if (response.ok) {
            // 1. Salva o nome do usuário logado
            localStorage.setItem('usuarioLogado', username);

            // 2. Se a conta possui dados salvos no servidor, desempacota e injeta no localStorage
            if (data.dados) {
                // Se os dados vierem em um objeto agrupado, desmembra chave por chave
                const dadosParaSalvar = typeof data.dados === 'string' ? JSON.parse(data.dados) : data.dados;
                
                for (const [chave, valor] of Object.entries(dadosParaSalvar)) {
                    localStorage.setItem(chave, typeof valor === 'string' ? valor : JSON.stringify(valor));
                }
            }

            alert("Miau! Bem-vindo ao Cat-Plan!");
            window.location.href = "dashboard.html"; // Redireciona para o painel
        } else {
            alert(data.mensagem || "Erro ao entrar.");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        alert("Erro de conexão com o servidor.");
    }
});
